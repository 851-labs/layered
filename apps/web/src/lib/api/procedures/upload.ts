import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

import { throwIfUnauthenticatedMiddleware } from "../../auth/middleware"
import { getFalClient } from "../../fal"

const uploadRouter = {
  /** Upload an image to fal.ai storage and get a URL back */
  image: createServerFn({ method: "POST" })
    .middleware([throwIfUnauthenticatedMiddleware])
    .inputValidator(z.object({ base64: z.string(), contentType: z.string() }))
    .handler(async ({ data }) => {
      const { base64, contentType } = data

      // Convert base64 to blob
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      const blob = new Blob([bytes], { type: contentType })

      // Upload to fal storage
      const fal = getFalClient()
      const url = await fal.storage.upload(blob)

      return { url }
    }),
}

export { uploadRouter }
