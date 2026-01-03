import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers"
import { eq } from "drizzle-orm"
import { predictions, blobs, contentTypeEnum } from "../lib/db/schema"
import { db } from "../lib/db"
import { generateId } from "../lib/uuid"
import { endpointSchemas } from "../lib/fal/schemas"

type Params = {
  predictionId: string
}

class UploadPredictionBlobsWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { predictionId } = event.payload

    const prediction = await step.do("fetch-prediction", async () =>
      db.select().from(predictions).where(eq(predictions.id, predictionId)).get()
    )

    if (!prediction) throw new Error(`Prediction ${predictionId} not found`)

    // TODO: Make dynamic based on prediction.endpointId when we support multiple endpoints
    const output = endpointSchemas["fal-ai/qwen-image-layered"].parse(JSON.parse(prediction.output))
    const images = output.images

    // Upload each image and create blob rows
    for (let i = 0; i < images.length; i++) {
      await step.do(`upload-image-${i}`, async () => {
        const image = images[i]
        const blobId = generateId()

        // Fetch image from fal URL
        const response = await fetch(image.url)
        const imageBlob = await response.blob()

        // Upload to R2 using blob ID as key
        await this.env.BUCKET.put(blobId, imageBlob, {
          httpMetadata: { contentType: image.content_type },
        })

        // Map content type to enum value
        const contentType = contentTypeEnum.includes(image.content_type as (typeof contentTypeEnum)[number])
          ? (image.content_type as (typeof contentTypeEnum)[number])
          : "image/png" // fallback

        await db.insert(blobs).values({
          id: blobId,
          predictionId,
          contentType,
          fileName: image.file_name,
          fileSize: image.file_size,
          width: image.width,
          height: image.height,
        })
      })
    }

    // Mark prediction as completed
    await step.do("update-prediction", async () => {
      await db.update(predictions).set({ status: "completed" }).where(eq(predictions.id, predictionId))
    })
  }
}

export { UploadPredictionBlobsWorkflow }
