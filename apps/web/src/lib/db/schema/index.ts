import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"
import { generateId } from "../../../utils/uuid"
import { users } from "./auth.gen"

const contentTypeEnum = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const
const statusEnum = ["processing", "completed", "failed"] as const
const falEndpointIdEnum = ["fal-ai/qwen-image-layered"] as const
const openaiEndpointIdEnum = ["openai/gpt-4o-mini"] as const
const endpointIdEnum = [...falEndpointIdEnum, ...openaiEndpointIdEnum] as const
const blobRoleEnum = ["input", "output"] as const

const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name"),
  userId: text("user_id").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

const predictions = sqliteTable("predictions", {
  id: text("id").primaryKey().$defaultFn(generateId),
  projectId: text("project_id").references(() => projects.id),
  userId: text("user_id").references(() => users.id),
  endpointId: text("endpoint_id", { enum: endpointIdEnum }).notNull(),
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
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

const blobs = sqliteTable("blobs", {
  id: text("id").primaryKey().$defaultFn(generateId),
  contentType: text("content_type", { enum: contentTypeEnum }).notNull(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

const predictionBlobs = sqliteTable("prediction_blobs", {
  id: text("id").primaryKey().$defaultFn(generateId),
  predictionId: text("prediction_id")
    .notNull()
    .references(() => predictions.id),
  blobId: text("blob_id")
    .notNull()
    .references(() => blobs.id),
  role: text("role", { enum: blobRoleEnum }).notNull(),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
})

type ProjectRow = typeof projects.$inferSelect
type NewProjectRow = typeof projects.$inferInsert
type PredictionRow = typeof predictions.$inferSelect
type NewPredictionRow = typeof predictions.$inferInsert
type BlobRow = typeof blobs.$inferSelect
type NewBlobRow = typeof blobs.$inferInsert
type PredictionBlobRow = typeof predictionBlobs.$inferSelect
type NewPredictionBlobRow = typeof predictionBlobs.$inferInsert

export * from "./auth.gen"
export {
  projects,
  predictions,
  blobs,
  predictionBlobs,
  contentTypeEnum,
  statusEnum,
  falEndpointIdEnum,
  openaiEndpointIdEnum,
  endpointIdEnum,
  blobRoleEnum,
}
export type {
  ProjectRow,
  NewProjectRow,
  PredictionRow,
  NewPredictionRow,
  BlobRow,
  NewBlobRow,
  PredictionBlobRow,
  NewPredictionBlobRow,
}
