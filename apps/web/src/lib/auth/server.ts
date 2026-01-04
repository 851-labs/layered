import { betterAuth } from "better-auth"
import { db } from "../db"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { tanstackStartCookies } from "better-auth/tanstack-start"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    usePlural: true,
  }),
  plugins: [tanstackStartCookies()],
  emailAndPassword: {
    enabled: true,
  },
})
