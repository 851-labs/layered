import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

const generations = sqliteTable("generations", {
  id: text("id").primaryKey(),
  inputUrl: text("input_url").notNull(),
  layers: text("layers").notNull(), // JSON array of layer URLs
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

type Generation = typeof generations.$inferSelect
type NewGeneration = typeof generations.$inferInsert

export { generations }
export type { Generation, NewGeneration }

