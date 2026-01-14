import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { z } from "zod";

import { generateId } from "../../../utils/uuid";
import { db } from "../../db";
import { blobs, contentTypeEnum } from "../../db/schema";
import { createMutationProcedureWithInput } from "../create-procedure";
import { throwIfUnauthenticatedMiddleware } from "../middleware";

// -----------------------------------------------------------------------------
// Server Functions
// -----------------------------------------------------------------------------

/**
 * Upload an image to R2 storage and create a blob record.
 */
const uploadImage = createServerFn({ method: "POST" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .inputValidator(
    z.object({
      base64: z.string(),
      contentType: z.enum(contentTypeEnum),
      fileName: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { base64, contentType, fileName } = data;

    // Convert base64 to blob
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const imageBlob = new Blob([bytes], { type: contentType });

    // Generate blob ID
    const blobId = generateId();

    // Get image dimensions using Cloudflare Images binding
    // SVG returns { format: 'image/svg+xml' }, raster images include width/height
    const info = await env.IMAGES.info(imageBlob.stream());
    if (!("width" in info)) throw new Error("SVG images are not supported");

    // Upload to R2
    await env.BUCKET.put(blobId, imageBlob, {
      httpMetadata: { contentType },
    });

    // Create blob record in database
    await db.insert(blobs).values({
      id: blobId,
      contentType,
      fileName,
      fileSize: imageBlob.size,
      width: info.width,
      height: info.height,
    });

    // Return blob ID and public R2 URL
    const url = `${env.R2_PUBLIC_URL}/${blobId}`;
    return { blobId, url };
  });

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

const uploadRouter = {
  image: createMutationProcedureWithInput(["upload", "image"], uploadImage),
};

export { uploadRouter };
