import { projectRouter } from "./procedures/projects";
import { uploadRouter } from "./procedures/upload";

const api = {
  upload: uploadRouter,
  project: projectRouter,
};

export { api };
