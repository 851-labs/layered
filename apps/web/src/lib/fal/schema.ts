import { z } from "zod";

import { contentTypeEnum, falEndpointIdEnum } from "../db/schema";

const contentTypeSchema = z.enum(contentTypeEnum);

const falImage = z.object({
  url: z.url(),
  content_type: contentTypeSchema,
  file_name: z.string(),
  file_size: z.number().nullable(),
  width: z.number(),
  height: z.number(),
});

const qwenImageLayeredOutput = z.object({
  images: z.array(falImage),
  timings: z.object({ inference: z.number() }).optional(),
  seed: z.number().optional(),
  has_nsfw_concepts: z.array(z.boolean()).optional(),
  prompt: z.string().nullable().optional(),
});

type FalImage = z.infer<typeof falImage>;
type QwenImageLayeredOutput = z.infer<typeof qwenImageLayeredOutput>;

const endpointSchemas = {
  "fal-ai/qwen-image-layered": qwenImageLayeredOutput,
} as const satisfies Record<(typeof falEndpointIdEnum)[number], z.ZodType>;

export { falImage, endpointSchemas };
export type { FalImage, QwenImageLayeredOutput };
