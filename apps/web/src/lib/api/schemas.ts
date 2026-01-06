import { z } from "zod"

// ============================================================================
// Entity Schemas (for normalized store)
// ============================================================================

const predictionSchema = z.object({
  id: z.string(),
  layers: z.array(z.url()),
  createdAt: z.date(),
})

// ============================================================================
// Inferred Types
// ============================================================================

type Prediction = z.infer<typeof predictionSchema>

export type { Prediction }
