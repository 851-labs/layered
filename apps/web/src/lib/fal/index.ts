import { env } from "cloudflare:workers"
import { createFalClient } from "@fal-ai/client"

function getFalClient() {
  return createFalClient({
    credentials: env.FAL_KEY,
  })
}

export { getFalClient }
