// Export all workflow classes
export { UploadGenerationLayersWorkflow } from "./upload-generation-layers"

// Default export for module worker format
export default {
  async fetch(): Promise<Response> {
    return new Response("Workflows worker - not meant to be called directly", { status: 200 })
  },
}

