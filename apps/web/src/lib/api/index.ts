import { accountRouter } from "./procedures/account";
import { projectRouter } from "./procedures/projects";
import { uploadRouter } from "./procedures/upload";

const api = {
  account: accountRouter,
  upload: uploadRouter,
  project: projectRouter,
};

export { api };
