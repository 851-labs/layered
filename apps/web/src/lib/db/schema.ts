import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

const contentTypeEnum = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const
const statusEnum = ["processing", "completed", "failed"] as const

const predictions = sqliteTable("predictions", {
  id: text("id").primaryKey(),
  endpointId: text("endpoint_id").notNull(),
  input: text("input").notNull(),
  output: text("output").notNull(),
  status: text("status", { enum: statusEnum })
    .notNull()
    .$default(() => "processing"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

const blobs = sqliteTable("blobs", {
  id: text("id").primaryKey(),
  predictionId: text("prediction_id").notNull(),
  contentType: text("content_type", { enum: contentTypeEnum }).notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size"),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
})

type Prediction = typeof predictions.$inferSelect
type NewPrediction = typeof predictions.$inferInsert
type Blob = typeof blobs.$inferSelect
type NewBlob = typeof blobs.$inferInsert

export { predictions, blobs, contentTypeEnum, statusEnum }
export type { Prediction, NewPrediction, Blob, NewBlob }
