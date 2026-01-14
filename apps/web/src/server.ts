import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

// Export workflow classes for Cloudflare
export { GenerateProjectWorkflow } from "./workflows/generate-project";

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request);
  },
});
