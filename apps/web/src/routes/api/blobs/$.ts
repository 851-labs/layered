import { createFileRoute } from "@tanstack/react-router";
import { env, waitUntil } from "cloudflare:workers";

declare global {
  interface CacheStorage {
    default: Cache;
  }
}

const Route = createFileRoute("/api/blobs/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const key = params._splat;
        if (!key) return new Response("Not Found", { status: 404 });

        // Check cache first (automatically handles range headers etc.)
        const cacheKey = new Request(request.url, { headers: request.headers });
        const cachedResponse = await caches.default.match(cacheKey);
        if (cachedResponse) return cachedResponse;

        // Fetch from R2 with conditional request support
        const object = await env.BUCKET.get(key, {
          onlyIf: request.headers,
        });

        if (!object) return new Response("Not Found", { status: 404 });

        // Build response headers using R2's built-in method
        const headers = new Headers();
        object.writeHttpMetadata(headers);

        // Assets are immutable, cache forever
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("ETag", object.httpEtag);

        // Set CORS headers before caching (cached responses can't be modified)
        headers.set("Access-Control-Allow-Origin", "*");

        // Determine body and status (304 if conditional request matched)
        const body = "body" in object && object.body ? object.body : null;
        const status = body ? 200 : 304;

        // Only cache complete (200) responses
        if (status === 200 && body) {
          const [cacheBody, responseBody] = body.tee();
          waitUntil(caches.default.put(cacheKey, new Response(cacheBody, { headers, status })));
          return new Response(responseBody, { headers, status });
        }

        return new Response(body, { headers, status });
      },
    },
  },
});

export { Route };
