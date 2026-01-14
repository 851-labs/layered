import { createFalClient } from "@fal-ai/client";
import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import { db } from "../lib/db";
import { blobs, predictionBlobs, predictions, projects } from "../lib/db/schema";
import { endpointSchemas } from "../lib/fal/schema";

type Params = {
  projectId: string;
  predictionId: string;
  imageUrl: string;
  layerCount: number;
};

const IMAGE_ENDPOINT_ID = "fal-ai/qwen-image-layered";
const AI_GATEWAY_URL =
  "https://gateway.ai.cloudflare.com/v1/630f294bcb2c1e9b751d9fe0655a453a/layered/openai";

type OpenAIChatResponse = {
  choices: Array<{ message: { content: string } }>;
};

/**
 * Generate a deterministic blob ID based on prediction ID and index.
 * This ensures idempotency - retries will use the same ID.
 */
function generateDeterministicBlobId(predictionId: string, index: number): string {
  return `${predictionId}-${index}`;
}

class GenerateProjectWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { projectId, predictionId, imageUrl, layerCount } = event.payload;

    try {
      // Step 1: Call fal.ai to generate layers (separate from name generation for granularity)
      const imageOutput = await step.do("generate-layers", async () => {
        const fal = createFalClient({ credentials: this.env.FAL_KEY });
        const imageResult = await fal.subscribe(IMAGE_ENDPOINT_ID, {
          input: { image_url: imageUrl, num_layers: layerCount },
        });
        return endpointSchemas[IMAGE_ENDPOINT_ID].parse(imageResult.data);
      });

      if (!imageOutput.images || imageOutput.images.length === 0) {
        throw new Error("No images returned from the model");
      }

      // Step 2: Generate project name (separate step - different service)
      const generatedName = await step.do("generate-name", async () => {
        return await this.generateProjectName(imageUrl);
      });

      // Step 3: Update prediction with output
      await step.do("update-prediction-output", async () => {
        await db
          .update(predictions)
          .set({ output: JSON.stringify(imageOutput) })
          .where(eq(predictions.id, predictionId));
      });

      // Step 4: Update project name if generated
      if (generatedName) {
        await step.do("update-project-name", async () => {
          await db.update(projects).set({ name: generatedName }).where(eq(projects.id, projectId));
        });
      }

      // Step 5: Upload each image to R2 and create blob records
      // Using deterministic blob IDs for idempotency
      for (const [index, image] of imageOutput.images.entries()) {
        await step.do(`upload-image-${index}`, async () => {
          // Deterministic ID ensures idempotency on retry
          const blobId = generateDeterministicBlobId(predictionId, index);

          // Check if blob already exists (idempotency check)
          const existingBlob = await db
            .select({ id: blobs.id })
            .from(blobs)
            .where(eq(blobs.id, blobId))
            .get();

          if (existingBlob) {
            // Already processed, skip
            return;
          }

          // Fetch image from fal URL
          const response = await fetch(image.url);
          const imageBlob = await response.blob();

          // Upload to R2 using deterministic blob ID as key
          await this.env.BUCKET.put(blobId, imageBlob, {
            httpMetadata: { contentType: image.content_type },
          });

          // Create blob record and link to prediction (single transaction)
          await db.batch([
            db.insert(blobs).values({
              id: blobId,
              contentType: image.content_type,
              fileName: image.file_name,
              fileSize: imageBlob.size,
              width: image.width,
              height: image.height,
            }),
            db.insert(predictionBlobs).values({
              predictionId,
              blobId,
              role: "output",
              position: index,
            }),
          ]);
        });
      }

      // Step 6: Mark prediction and project as completed (single transaction)
      await step.do("mark-completed", async () => {
        await db.batch([
          db
            .update(predictions)
            .set({ status: "completed" })
            .where(eq(predictions.id, predictionId)),
          db.update(projects).set({ status: "completed" }).where(eq(projects.id, projectId)),
        ]);
      });
    } catch (error) {
      // Mark project and prediction as failed (single transaction)
      await step.do("mark-failed", async () => {
        await db.batch([
          db.update(predictions).set({ status: "failed" }).where(eq(predictions.id, predictionId)),
          db.update(projects).set({ status: "failed" }).where(eq(projects.id, projectId)),
        ]);
      });
      throw error;
    }
  }

  private async generateProjectName(imageUrl: string): Promise<string | null> {
    const response = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "cf-aig-authorization": `Bearer ${this.env.CF_AIG_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } },
              {
                type: "text",
                text: "Generate a 2-4 word title for this image. Reply with just the title, nothing else.",
              },
            ],
          },
        ],
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate project name:", await response.text());
      return null;
    }

    const data = (await response.json()) as OpenAIChatResponse;
    return data.choices[0]?.message?.content?.trim() ?? null;
  }
}

export { GenerateProjectWorkflow };
