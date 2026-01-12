import { defineConfig } from "drizzle-kit";

const config = defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1-http",
});

export { config as default };
