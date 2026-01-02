import { defineNitroConfig } from "nitro/config"

export default defineNitroConfig({
  compatibilityDate: "2026-01-01",
  preset: "cloudflare_module",
  cloudflare: {
    deployConfig: true,
    nodeCompat: true,
    wrangler: {
      observability: {
        enabled: true,
        head_sampling_rate: 1.0,
      },
      d1_databases: [{ binding: "DB", database_name: "layered", database_id: "56e7df3a-df01-4881-b00d-05ad0a9012ff" }],
    },
  },
})
