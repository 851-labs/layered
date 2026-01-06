import { createServerFn } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import { asc, desc, eq } from "drizzle-orm"
import { z } from "zod"

import { db } from "../../db"
import { blobs, endpointIdEnum, predictionBlobs, predictions } from "../../db/schema"
import { getFalClient } from "../../fal"
import { endpointSchemas } from "../../fal/schema"
import { errorHandlingMiddleware, throwIfUnauthenticatedMiddleware } from "../middleware"
import { type Blob, type Prediction } from "../schemas"

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const ENDPOINT_ID = "fal-ai/qwen-image-layered"

type BlobWithRole = {
  id: string
  contentType: string
  width: number
  height: number
  role: "input" | "output"
}

/**
 * Convert a DB blob row to a public Blob schema.
 */
function toPublicBlob(blob: Omit<BlobWithRole, "role">): Blob {
  return {
    id: blob.id,
    url: `${env.R2_PUBLIC_URL}/${blob.id}`,
    contentType: blob.contentType,
    width: blob.width,
    height: blob.height,
  }
}

/**
 * Helper to get output blobs, falling back to fal URLs if no blobs yet.
 */
function getOutputBlobs(prediction: {
  outputBlobRows: Array<Omit<BlobWithRole, "role">>
  output: string
  endpointId: (typeof endpointIdEnum)[number]
}): Blob[] {
  if (prediction.outputBlobRows.length > 0) {
    return prediction.outputBlobRows.map(toPublicBlob)
  }
  // Fall back to fal URLs from raw output (blobs not uploaded yet)
  const output = endpointSchemas[prediction.endpointId].parse(JSON.parse(prediction.output))
  return output.images.map((img, idx) => ({
    id: `fal-${idx}`,
    url: img.url,
    contentType: "image/png",
    width: img.width ?? null,
    height: img.height ?? null,
  }))
}

// -----------------------------------------------------------------------------
// Server Functions
// -----------------------------------------------------------------------------

/**
 * Create a new prediction through the qwen-image-layered model.
 */
const createPrediction = createServerFn({ method: "POST" })
  .middleware([errorHandlingMiddleware, throwIfUnauthenticatedMiddleware])
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
      .get()

    if (!inputBlobRow) throw new Error("Input blob not found")

    // Trigger background workflow to upload output blobs to R2
    await env.UPLOAD_PREDICTION_BLOBS_WORKFLOW.create({
      params: { predictionId: prediction.id },
    })

    return {
      id: prediction.id,
      inputBlob: toPublicBlob(inputBlobRow),
      outputBlobs: output.images.map((img, idx) => ({
        id: `fal-${idx}`,
        url: img.url,
        contentType: "image/png",
        width: img.width,
        height: img.height,
      })),
      createdAt: prediction.createdAt,
      requestId: result.requestId,
    }
  })

/**
 * Get a single prediction by ID.
 */
const getPrediction = createServerFn({ method: "GET" })
  .middleware([errorHandlingMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }): Promise<Prediction> => {
    const result = await db.select().from(predictions).where(eq(predictions.id, data.id)).get()

    if (!result) throw new Error("Prediction not found")

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
      .where(eq(predictionBlobs.predictionId, result.id))
      .orderBy(asc(predictionBlobs.position))

    const outputBlobRows = blobRows.filter((b) => b.role === "output")
    const inputBlobRow = blobRows.find((b) => b.role === "input")

    if (!inputBlobRow) throw new Error("Input blob not found")

    return {
      id: result.id,
      inputBlob: toPublicBlob(inputBlobRow),
      outputBlobs: getOutputBlobs({ outputBlobRows, output: result.output, endpointId: result.endpointId }),
      createdAt: result.createdAt,
    }
  })

/**
 * Get recent predictions from the database.
 */
const listPredictions = createServerFn({ method: "GET" })
  .middleware([errorHandlingMiddleware])
  .handler(async (): Promise<{ predictions: Prediction[] }> => {
    const results = await db.select().from(predictions).orderBy(desc(predictions.createdAt)).limit(6)

    // Get blobs for each prediction via join
    const predictionsWithBlobs = await Promise.all(
      results.map(async (p) => {
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
          .where(eq(predictionBlobs.predictionId, p.id))
          .orderBy(asc(predictionBlobs.position))

        const outputBlobRows = blobRows.filter((b) => b.role === "output")
        const inputBlobRow = blobRows.find((b) => b.role === "input")

        if (!inputBlobRow) throw new Error(`Input blob not found for prediction ${p.id}`)

        return {
          id: p.id,
          inputBlob: toPublicBlob(inputBlobRow),
          outputBlobs: getOutputBlobs({ outputBlobRows, output: p.output, endpointId: p.endpointId }),
          createdAt: p.createdAt,
        }
      })
    )

    return { predictions: predictionsWithBlobs }
  })

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

const predictionRouter = {
  create: createPrediction,
  get: getPrediction,
  list: listPredictions,
}

export { predictionRouter }
