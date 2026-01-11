import { betterAuth } from "better-auth"
import { db } from "../db"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { env, waitUntil } from "cloudflare:workers"
import { generateId } from "../../utils/uuid"

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
  }),
  plugins: [tanstackStartCookies()],
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  advanced: {
    database: {
      generateId: () => generateId(),
    },
    backgroundTasks: {
      handler: waitUntil,
    },
  },
})
