import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers"
import { eq } from "drizzle-orm"
import { predictions, blobs } from "../lib/db/schema"
import { db } from "../lib/db"
import { generateId } from "../lib/uuid"
import { endpointSchemas } from "../lib/fal/schema"

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

    const output = endpointSchemas[prediction.endpointId].parse(JSON.parse(prediction.output))
    const images = output.images

    // Upload each image and create blob rows
    for (const [index, image] of images.entries()) {
      await step.do(`upload-image-${index}`, async () => {
        const blobId = generateId()

        // Fetch image from fal URL
        const response = await fetch(image.url)
        const imageBlob = await response.blob()

        // Upload to R2 using blob ID as key
        await this.env.BUCKET.put(blobId, imageBlob, {
          httpMetadata: { contentType: image.content_type },
        })

        await db.insert(blobs).values({
          id: blobId,
          predictionId,
          contentType: image.content_type,
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
