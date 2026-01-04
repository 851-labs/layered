import { betterAuth } from "better-auth"
import { db } from "../db"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { env } from "cloudflare:workers"
import { generateId } from "../uuid"

export const auth = betterAuth({
  baseURL: "http://localhost:3000",
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
  },
})
