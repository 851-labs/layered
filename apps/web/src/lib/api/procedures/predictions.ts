import { createServerFn } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import { and, asc, desc, eq } from "drizzle-orm"
import { z } from "zod"

import { throwIfUnauthenticatedMiddleware } from "../../auth/middleware"
import { db } from "../../db"
import { endpointIdEnum, predictionBlobs, predictions } from "../../db/schema"
import { getFalClient } from "../../fal"
import { endpointSchemas } from "../../fal/schema"
import { type Prediction } from "../schemas"

const ENDPOINT_ID = "fal-ai/qwen-image-layered"

/** Helper to get layer URLs, falling back to fal URLs if no blobs yet */
function getPredictionLayers(prediction: {
  outputBlobs: Array<{ blobId: string }>
  output: string
  endpointId: (typeof endpointIdEnum)[number]
}): string[] {
  if (prediction.outputBlobs.length > 0) {
    return prediction.outputBlobs.map((b) => `${env.R2_PUBLIC_URL}/${b.blobId}`)
  }
  // Fall back to fal URLs from raw output
  const output = endpointSchemas[prediction.endpointId].parse(JSON.parse(prediction.output))
  return output.images.map((img) => img.url)
}

const predictionRouter = {
  /** Create a new prediction through the qwen-image-layered model */
  create: createServerFn({ method: "POST" })
    .middleware([throwIfUnauthenticatedMiddleware])
    .inputValidator(z.object({ imageUrl: z.url(), inputBlobId: z.string() }))
    .handler(async ({ data, context }): Promise<Prediction & { requestId: string }> => {
      const { imageUrl, inputBlobId } = data

      const fal = getFalClient()
      const input = { image_url: imageUrl }
      const result = await fal.subscribe(ENDPOINT_ID, { input })
      const output = endpointSchemas[ENDPOINT_ID].parse(result.data)

      if (!output.images || output.images.length === 0) {
        throw new Error("No images returned from the model")
      }

      const [prediction] = await db
        .insert(predictions)
        .values({
          userId: context.session.user.id,
          endpointId: ENDPOINT_ID,
          input: JSON.stringify(input),
          output: JSON.stringify(output),
        })
        .returning({ id: predictions.id, createdAt: predictions.createdAt })

      // Link input blob to prediction
      await db.insert(predictionBlobs).values({
        predictionId: prediction.id,
        blobId: inputBlobId,
        role: "input",
        position: 0,
      })

      // Trigger background workflow to upload output blobs to R2
      await env.UPLOAD_PREDICTION_BLOBS_WORKFLOW.create({
        params: { predictionId: prediction.id },
      })

      return {
        id: prediction.id,
        layers: output.images.map((img) => img.url),
        createdAt: prediction.createdAt,
        requestId: result.requestId,
      }
    }),

  /** Get a single prediction by ID */
  get: createServerFn({ method: "GET" })
    .inputValidator(z.object({ id: z.string() }))
    .handler(async ({ data }): Promise<Prediction> => {
      const result = await db.select().from(predictions).where(eq(predictions.id, data.id)).get()

      if (!result) throw new Error("Prediction not found")

      // Get output blobs via join table
      const outputBlobs = await db
        .select({ blobId: predictionBlobs.blobId })
        .from(predictionBlobs)
        .where(and(eq(predictionBlobs.predictionId, result.id), eq(predictionBlobs.role, "output")))
        .orderBy(asc(predictionBlobs.position))

      return {
        id: result.id,
        layers: getPredictionLayers({ outputBlobs, output: result.output, endpointId: result.endpointId }),
        createdAt: result.createdAt,
      }
    }),

  /** Get recent predictions from the database */
  list: createServerFn({ method: "GET" }).handler(async (): Promise<{ predictions: Prediction[] }> => {
    try {
      const results = await db.select().from(predictions).orderBy(desc(predictions.createdAt)).limit(6)

      // Get output blobs for each prediction via join table
      const predictionsWithBlobs = await Promise.all(
        results.map(async (p) => {
          const outputBlobs = await db
            .select({ blobId: predictionBlobs.blobId })
            .from(predictionBlobs)
            .where(and(eq(predictionBlobs.predictionId, p.id), eq(predictionBlobs.role, "output")))
            .orderBy(asc(predictionBlobs.position))

          return {
            id: p.id,
            layers: getPredictionLayers({ outputBlobs, output: p.output, endpointId: p.endpointId }),
            createdAt: p.createdAt,
          }
        })
      )

      return { predictions: predictionsWithBlobs }
    } catch (err) {
      console.error("Failed to fetch predictions:", err)
      return { predictions: [] }
    }
  }),
}

export { predictionRouter }
