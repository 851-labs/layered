import { env } from "cloudflare:workers"
import { createFileRoute } from "@tanstack/react-router"

const Route = createFileRoute("/api/blobs/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = params._splat
        if (!key) {
          return new Response("Not Found", { status: 404 })
        }

        const object = await env.BUCKET.get(key)
        if (!object) {
          return new Response("Not Found", { status: 404 })
        }

        return new Response(object.body, {
          headers: {
            "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
            ETag: object.httpEtag,
          },
        })
      },
    },
  },
})

export { Route }
