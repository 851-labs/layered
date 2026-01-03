import handler, { createServerEntry } from "@tanstack/react-start/server-entry"

// Export workflow classes for Cloudflare
export { UploadGenerationLayersWorkflow } from "./workflows/upload-generation-layers"

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request)
  },
})
