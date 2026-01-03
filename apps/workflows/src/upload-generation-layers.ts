import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers"
import { eq } from "drizzle-orm"
import { generations } from "@layered/db/schema"
import { db } from "./lib/db"

type Params = {
  generationId: string
}

class UploadGenerationLayersWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const { generationId } = event.payload

    // Fetch generation from DB to get layer URLs
    const generation = await step.do("fetch-generation", async () => {
      return db.select().from(generations).where(eq(generations.id, generationId)).get()
    })

    if (!generation) {
      throw new Error(`Generation ${generationId} not found`)
    }

    const layers = JSON.parse(generation.layers) as string[]

    // Upload each layer sequentially as separate steps (automatic retries)
    const r2Urls: string[] = []
    for (let i = 0; i < layers.length; i++) {
      const url = await step.do(`upload-layer-${i}`, async () => {
        const response = await fetch(layers[i])
        const blob = await response.blob()
        const key = `${generationId}/layer-${i}.webp`
        await this.env.BUCKET.put(key, blob, {
          httpMetadata: { contentType: blob.type },
        })
        // return `${this.env.R2_PUBLIC_URL}/${key}`
        return key
      })
      r2Urls.push(url)
    }

    // Update database with R2 URLs
    await step.do("update-database", async () => {
      await db
        .update(generations)
        .set({ layers: JSON.stringify(r2Urls) })
        .where(eq(generations.id, generationId))
    })
  }
}

export { UploadGenerationLayersWorkflow }
