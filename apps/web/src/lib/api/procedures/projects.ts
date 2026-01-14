import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";

import { auth } from "../../auth/server";
import { db } from "../../db";
import { blobs, predictionBlobs, predictions, projects } from "../../db/schema";
import { getFalClient } from "../../fal";
import { endpointSchemas } from "../../fal/schema";
import {
  createMutationProcedureWithInput,
  createQueryProcedure,
  createQueryProcedureWithInput,
} from "../create-procedure";
import { errorHandlingMiddleware, throwIfUnauthenticatedMiddleware } from "../middleware";
import { type Blob, type Project } from "../schema";

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const IMAGE_ENDPOINT_ID = "fal-ai/qwen-image-layered";
const NAME_ENDPOINT_ID = "openai/gpt-4o-mini";
const AI_GATEWAY_URL =
  "https://gateway.ai.cloudflare.com/v1/630f294bcb2c1e9b751d9fe0655a453a/layered/openai";

type OpenAIChatResponse = {
  choices: Array<{ message: { content: string } }>;
};

async function generateProjectName(imageUrl: string): Promise<string | null> {
  const response = await fetch(`${AI_GATEWAY_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "cf-aig-authorization": `Bearer ${env.CF_AIG_TOKEN}`,
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

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

type BlobWithRole = {
  id: string;
  contentType: string;
  width: number;
  height: number;
  role: "input" | "output";
};

function toPublicBlob(blob: Omit<BlobWithRole, "role">): Blob {
  return {
    id: blob.id,
    url: `${env.R2_PUBLIC_URL}/${blob.id}`,
    contentType: blob.contentType,
    width: blob.width,
    height: blob.height,
  };
}

function getOutputBlobs(prediction: {
  outputBlobRows: Array<Omit<BlobWithRole, "role">>;
  output: string;
  status: "processing" | "completed" | "failed";
}): Blob[] {
  if (prediction.status === "completed") {
    return prediction.outputBlobRows.map(toPublicBlob);
  }
  const output = endpointSchemas[IMAGE_ENDPOINT_ID].parse(JSON.parse(prediction.output));
  return output.images.map((img, idx) => ({
    id: `fal-${idx}`,
    url: img.url,
    contentType: "image/png",
    width: img.width,
    height: img.height,
  }));
}

// -----------------------------------------------------------------------------
// Server Functions
// -----------------------------------------------------------------------------

/**
 * Create a new project with parallel image layering and name generation.
 */
const createProject = createServerFn({ method: "POST" })
  .middleware([errorHandlingMiddleware, throwIfUnauthenticatedMiddleware])
  .inputValidator(
    z.object({
      imageUrl: z.url(),
      inputBlobId: z.string(),
      layerCount: z.number().int().min(2).max(10).default(4),
    }),
  )
  .handler(async ({ data, context }): Promise<Project> => {
    const { imageUrl, inputBlobId, layerCount } = data;

    // Create project first
    const [project] = await db
      .insert(projects)
      .values({ userId: context.session.user.id })
      .returning({ id: projects.id, createdAt: projects.createdAt });

    const fal = getFalClient();

    // Run image layering and name generation in parallel
    const [imageResult, generatedName] = await Promise.all([
      fal.subscribe(IMAGE_ENDPOINT_ID, { input: { image_url: imageUrl, num_layers: layerCount } }),
      generateProjectName(imageUrl),
    ]);

    const imageOutput = endpointSchemas[IMAGE_ENDPOINT_ID].parse(imageResult.data);
    if (!imageOutput.images || imageOutput.images.length === 0) {
      throw new Error("No images returned from the model");
    }

    // Update project with the generated name (if we got one)
    if (generatedName) {
      await db.update(projects).set({ name: generatedName }).where(eq(projects.id, project.id));
    }

    // Store image prediction
    const [imagePrediction] = await db
      .insert(predictions)
      .values({
        projectId: project.id,
        userId: context.session.user.id,
        endpointId: IMAGE_ENDPOINT_ID,
        input: JSON.stringify({ image_url: imageUrl, num_layers: layerCount }),
        output: JSON.stringify(imageOutput),
      })
      .returning({ id: predictions.id });

    // Store name prediction for audit
    await db.insert(predictions).values({
      projectId: project.id,
      userId: context.session.user.id,
      endpointId: NAME_ENDPOINT_ID,
      input: JSON.stringify({ imageUrl, model: "gpt-4o-mini" }),
      output: JSON.stringify({ name: generatedName }),
      status: "completed",
    });

    // Link input blob to image prediction
    await db.insert(predictionBlobs).values({
      predictionId: imagePrediction.id,
      blobId: inputBlobId,
      role: "input",
      position: 0,
    });

    // Fetch the input blob data
    const inputBlobRow = await db
      .select({
        id: blobs.id,
        contentType: blobs.contentType,
        width: blobs.width,
        height: blobs.height,
      })
      .from(blobs)
      .where(eq(blobs.id, inputBlobId))
      .get();

    if (!inputBlobRow) throw new Error("Input blob not found");

    // Trigger background workflow to upload output blobs to R2
    await env.UPLOAD_PREDICTION_BLOBS_WORKFLOW.create({
      params: { predictionId: imagePrediction.id },
    });

    return {
      id: project.id,
      name: generatedName,
      inputBlob: toPublicBlob(inputBlobRow),
      outputBlobs: imageOutput.images.map((img, idx) => ({
        id: `fal-${idx}`,
        url: img.url,
        contentType: "image/png",
        width: img.width,
        height: img.height,
      })),
      createdAt: project.createdAt,
    };
  });

/**
 * Get a single project by ID.
 */
const getProject = createServerFn({ method: "GET" })
  .middleware([errorHandlingMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<Project> => {
    const project = await db.select().from(projects).where(eq(projects.id, data.id)).get();
    if (!project) throw new Error("Project not found");

    // Get the image prediction for this project
    const imagePrediction = await db
      .select()
      .from(predictions)
      .where(eq(predictions.projectId, project.id))
      .orderBy(asc(predictions.createdAt))
      .get();

    if (!imagePrediction) throw new Error("Image prediction not found");

    // Get blobs with full data via join
    const blobRows = await db
      .select({
        id: blobs.id,
        contentType: blobs.contentType,
        width: blobs.width,
        height: blobs.height,
        role: predictionBlobs.role,
      })
      .from(predictionBlobs)
      .innerJoin(blobs, eq(predictionBlobs.blobId, blobs.id))
      .where(eq(predictionBlobs.predictionId, imagePrediction.id))
      .orderBy(asc(predictionBlobs.position));

    const outputBlobRows = blobRows.filter((b) => b.role === "output");
    const inputBlobRow = blobRows.find((b) => b.role === "input");

    if (!inputBlobRow) throw new Error("Input blob not found");

    return {
      id: project.id,
      name: project.name,
      inputBlob: toPublicBlob(inputBlobRow),
      outputBlobs: getOutputBlobs({
        outputBlobRows,
        output: imagePrediction.output,
        status: imagePrediction.status,
      }),
      createdAt: project.createdAt,
    };
  });

/**
 * Get recent projects for the current user.
 */
const listProjects = createServerFn({ method: "GET" })
  .middleware([errorHandlingMiddleware])
  .handler(async (): Promise<{ projects: Project[] }> => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      return { projects: [] };
    }

    const projectRows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, session.user.id), isNotNull(projects.userId)))
      .orderBy(desc(projects.createdAt))
      .limit(6);

    const projectsWithData = await Promise.all(
      projectRows.map(async (project) => {
        const imagePrediction = await db
          .select()
          .from(predictions)
          .where(eq(predictions.projectId, project.id))
          .orderBy(asc(predictions.createdAt))
          .get();

        if (!imagePrediction) throw new Error(`Prediction not found for project ${project.id}`);

        const blobRows = await db
          .select({
            id: blobs.id,
            contentType: blobs.contentType,
            width: blobs.width,
            height: blobs.height,
            role: predictionBlobs.role,
          })
          .from(predictionBlobs)
          .innerJoin(blobs, eq(predictionBlobs.blobId, blobs.id))
          .where(eq(predictionBlobs.predictionId, imagePrediction.id))
          .orderBy(asc(predictionBlobs.position));

        const outputBlobRows = blobRows.filter((b) => b.role === "output");
        const inputBlobRow = blobRows.find((b) => b.role === "input");

        if (!inputBlobRow) throw new Error(`Input blob not found for project ${project.id}`);

        return {
          id: project.id,
          name: project.name,
          inputBlob: toPublicBlob(inputBlobRow),
          outputBlobs: getOutputBlobs({
            outputBlobRows,
            output: imagePrediction.output,
            status: imagePrediction.status,
          }),
          createdAt: project.createdAt,
        };
      }),
    );

    return { projects: projectsWithData };
  });

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

const projectRouter = {
  create: createMutationProcedureWithInput(["project", "create"], createProject),
  get: createQueryProcedureWithInput(["project"], getProject),
  list: createQueryProcedure(["projects"], listProjects),
};

export { projectRouter };
