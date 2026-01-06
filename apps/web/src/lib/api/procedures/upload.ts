import { createServerFn } from "@tanstack/react-start"
import { env } from "cloudflare:workers"
import { z } from "zod"

import { errorHandlingMiddleware, throwIfUnauthenticatedMiddleware } from "../middleware"
import { db } from "../../db"
import { blobs, contentTypeEnum } from "../../db/schema"
import { generateId } from "../../uuid"

// -----------------------------------------------------------------------------
// Server Functions
// -----------------------------------------------------------------------------

/**
 * Upload an image to R2 storage and create a blob record.
 */
const uploadImage = createServerFn({ method: "POST" })
  .middleware([errorHandlingMiddleware, throwIfUnauthenticatedMiddleware])
  .inputValidator(
    z.object({
      base64: z.string(),
      contentType: z.enum(contentTypeEnum),
      fileName: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const { base64, contentType, fileName } = data

    // Convert base64 to blob
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const imageBlob = new Blob([bytes], { type: contentType })

    // Generate blob ID
    const blobId = generateId()

    // Upload to R2
    await env.BUCKET.put(blobId, imageBlob, {
      httpMetadata: { contentType },
    })

    // Create blob record in database
    await db.insert(blobs).values({
      id: blobId,
      contentType,
      fileName,
      fileSize: imageBlob.size,
    })

    // Return blob ID and public URL
    const url = `${env.R2_PUBLIC_URL}/${blobId}`
    return { blobId, url }
  })

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

const uploadRouter = {
  image: uploadImage,
}

export { uploadRouter }
