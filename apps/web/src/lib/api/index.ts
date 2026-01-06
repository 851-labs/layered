import { predictionRouter } from "./procedures/predictions"
import { uploadRouter } from "./procedures/upload"

const api = {
  upload: uploadRouter,
  prediction: predictionRouter,
}

export { api }
