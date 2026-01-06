import { createServerFn } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import { desc, eq } from "drizzle-orm"
import { z } from "zod"

import { throwIfUnauthenticatedMiddleware } from "../../auth/middleware"
import { db } from "../../db"
import { blobs, endpointIdEnum, predictions } from "../../db/schema"
import { getFalClient } from "../../fal"
import { endpointSchemas } from "../../fal/schema"
import { type Prediction } from "../schemas"

const ENDPOINT_ID = "fal-ai/qwen-image-layered"

/** Helper to get layer URLs from a prediction (blobs if available, otherwise fall back to output) */
function getPredictionLayers(prediction: {
  blobs: Array<{ id: string }>
  output: string
  endpointId: (typeof endpointIdEnum)[number]
}): string[] {
  if (prediction.blobs.length > 0) {
    return prediction.blobs.map((b) => `${env.R2_PUBLIC_URL}/${b.id}`)
  }
  // Fall back to fal URLs from raw output
  const output = endpointSchemas[prediction.endpointId].parse(JSON.parse(prediction.output))
  return output.images.map((img) => img.url)
}

const predictionRouter = {
  /** Create a new prediction through the qwen-image-layered model */
  create: createServerFn({ method: "POST" })
    .middleware([throwIfUnauthenticatedMiddleware])
    .inputValidator(z.object({ imageUrl: z.url() }))
    .handler(async ({ data, context }): Promise<Prediction & { requestId: string }> => {
      const { imageUrl } = data

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

      // Trigger background workflow to upload blobs to R2
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

      const predictionBlobs = await db
        .select()
        .from(blobs)
        .where(eq(blobs.predictionId, result.id))
        .orderBy(blobs.createdAt)

      return {
        id: result.id,
        layers: getPredictionLayers({ blobs: predictionBlobs, output: result.output, endpointId: result.endpointId }),
        createdAt: result.createdAt,
      }
    }),

  /** Get recent predictions from the database */
  list: createServerFn({ method: "GET" }).handler(async (): Promise<{ predictions: Prediction[] }> => {
    try {
      const results = await db.select().from(predictions).orderBy(desc(predictions.createdAt)).limit(6)

      // Get blobs for each prediction
      const predictionsWithBlobs = await Promise.all(
        results.map(async (p) => {
          const predictionBlobs = await db
            .select()
            .from(blobs)
            .where(eq(blobs.predictionId, p.id))
            .orderBy(blobs.createdAt)

          return {
            id: p.id,
            layers: getPredictionLayers({ blobs: predictionBlobs, output: p.output, endpointId: p.endpointId }),
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
