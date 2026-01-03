import { env } from "cloudflare:workers"
import { drizzle } from "drizzle-orm/d1"
import * as schema from "@layered/db/schema"

const db = drizzle(env.DB, { schema })

export { db }
