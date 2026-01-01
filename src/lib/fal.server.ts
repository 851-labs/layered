import { createServerFn } from "@tanstack/react-start"
import { createFalClient } from "@fal-ai/client"

// Lazy initialization - only create client when needed (during request lifecycle)
let falClient: ReturnType<typeof createFalClient> | null = null

function getFalClient() {
  if (!falClient) {
    const key = process.env.FAL_KEY
    if (!key) {
      throw new Error("FAL_KEY environment variable is not set")
    }
    falClient = createFalClient({ credentials: key })
  }
  return falClient
}

export type LayerResult = {
  layers: Array<{
    url: string
    content_type: string
  }>
}

type UploadInput = {
  base64: string
  contentType: string
}

type DecomposeInput = {
  imageUrl: string
}

/**
 * Upload an image to fal.ai storage and get a URL back
 */
export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator((input: UploadInput) => input)
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
  })

/**
 * Process an image through qwen-image-layered model
 */
export const decomposeImage = createServerFn({ method: "POST" })
  .inputValidator((input: DecomposeInput) => input)
  .handler(async ({ data }) => {
    const { imageUrl } = data

    const fal = getFalClient()
    const result = await fal.subscribe("fal-ai/qwen-image-layered", {
      input: {
        image_url: imageUrl,
      },
      logs: true,
    })

    console.log("fal.ai response:", JSON.stringify(result, null, 2))

    // The response structure may vary - handle both possible formats
    const responseData = result.data as Record<string, unknown>
    const layers = (responseData.layers || responseData.images || []) as Array<{
      url: string
      content_type?: string
    }>

    if (!layers || layers.length === 0) {
      throw new Error("No layers returned from the model")
    }

    return {
      layers,
      requestId: result.requestId,
    }
  })
