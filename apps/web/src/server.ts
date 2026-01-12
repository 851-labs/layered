import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

// Export workflow classes for Cloudflare
export { UploadPredictionBlobsWorkflow } from "./workflows/upload-prediction-blobs";

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request);
  },
});
