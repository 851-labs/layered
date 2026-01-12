import { z } from "zod";

// -----------------------------------------------------------------------------
// Entity Schemas (for normalized store)
// -----------------------------------------------------------------------------

const blobSchema = z.object({
  id: z.string(),
  url: z.url(),
  contentType: z.string(),
  width: z.number(),
  height: z.number(),
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  inputBlob: blobSchema,
  outputBlobs: z.array(blobSchema),
  createdAt: z.date(),
});

// -----------------------------------------------------------------------------
// Inferred Types
// -----------------------------------------------------------------------------

type Blob = z.infer<typeof blobSchema>;
type Project = z.infer<typeof projectSchema>;

export { blobSchema, projectSchema };
export type { Blob, Project };
