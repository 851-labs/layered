import { z } from "zod"

// -----------------------------------------------------------------------------
// Entity Schemas (for normalized store)
// -----------------------------------------------------------------------------

const blobSchema = z.object({
  id: z.string(),
  url: z.url(),
  contentType: z.string(),
  width: z.number(),
  height: z.number(),
})

const predictionSchema = z.object({
  id: z.string(),
  inputBlob: blobSchema,
  outputBlobs: z.array(blobSchema),
  createdAt: z.date(),
})

// -----------------------------------------------------------------------------
// Inferred Types
// -----------------------------------------------------------------------------

type Blob = z.infer<typeof blobSchema>
type Prediction = z.infer<typeof predictionSchema>

export { blobSchema, predictionSchema }
export type { Blob, Prediction }
