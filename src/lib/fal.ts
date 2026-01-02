import { createFalClient } from "@fal-ai/client"
import { createServerFn } from "@tanstack/react-start"
import { env } from "cloudflare:workers"

import { desc, eq } from "drizzle-orm"
import { db } from "./db"
import { generations } from "./db/schema"
import { generateId } from "./uuid"

function getFalClient() {
  return createFalClient({
    credentials: env.FAL_KEY,
  })
}

type LayerResult = {
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
const uploadImage = createServerFn({ method: "POST" })
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
const decomposeImage = createServerFn({ method: "POST" })
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

    const id = generateId()
    await db.insert(generations).values({
      id,
      inputUrl: imageUrl,
      layers: JSON.stringify(layers.map((l) => l.url)),
      createdAt: new Date(),
    })
    console.log("Saved generation to database:", id)

    return {
      id,
      layers,
      requestId: result.requestId,
    }
  })

/**
 * Get recent generations from the database
 */
const getGenerations = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const results = await db.select().from(generations).orderBy(desc(generations.createdAt)).limit(6)

    return {
      generations: results.map((g) => ({
        id: g.id,
        inputUrl: g.inputUrl,
        layers: JSON.parse(g.layers) as string[],
        createdAt: g.createdAt,
      })),
    }
  } catch (err) {
    console.error("Failed to fetch generations:", err)
    return { generations: [] }
  }
})

type GetGenerationInput = {
  id: string
}

/**
 * Get a single generation by ID
 */
const getGeneration = createServerFn({ method: "GET" })
  .inputValidator((input: GetGenerationInput) => input)
  .handler(async ({ data }) => {
    const result = await db.select().from(generations).where(eq(generations.id, data.id)).get()

    if (!result) {
      throw new Error("Generation not found")
    }

    return {
      id: result.id,
      inputUrl: result.inputUrl,
      layers: JSON.parse(result.layers) as string[],
      createdAt: result.createdAt,
    }
  })

export { decomposeImage, getGeneration, getGenerations, LayerResult, uploadImage }
