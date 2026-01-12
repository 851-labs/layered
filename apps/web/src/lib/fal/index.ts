import { createFalClient } from "@fal-ai/client";
import { env } from "cloudflare:workers";

function getFalClient() {
  return createFalClient({
    credentials: env.FAL_KEY,
  });
}

export { getFalClient };
