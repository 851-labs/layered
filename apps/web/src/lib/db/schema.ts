import { relations, sql } from "drizzle-orm"
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core"

import { generateId } from "@/utils/uuid"

// ============================================================================
// Auth tables (based on better-auth schema)
// ============================================================================

const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull(),
})

const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_userId_idx").on(table.userId)],
)

const accounts = sqliteTable(
  "accounts",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("accounts_userId_idx").on(table.userId)],
)

const verifications = sqliteTable(
  "verifications",
  {
    id: text("id").primaryKey().$defaultFn(generateId),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
)

const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
}))

const sessionsRelations = relations(sessions, ({ one }) => ({
  users: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

const accountsRelations = relations(accounts, ({ one }) => ({
  users: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}))

// ============================================================================
// App-specific tables
// ============================================================================

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

// Type exports
type UserRow = typeof users.$inferSelect
type NewUserRow = typeof users.$inferInsert
type SessionRow = typeof sessions.$inferSelect
type AccountRow = typeof accounts.$inferSelect
type ProjectRow = typeof projects.$inferSelect
type NewProjectRow = typeof projects.$inferInsert
type PredictionRow = typeof predictions.$inferSelect
type NewPredictionRow = typeof predictions.$inferInsert
type BlobRow = typeof blobs.$inferSelect
type NewBlobRow = typeof blobs.$inferInsert
type PredictionBlobRow = typeof predictionBlobs.$inferSelect
type NewPredictionBlobRow = typeof predictionBlobs.$inferInsert

export {
  users,
  sessions,
  accounts,
  verifications,
  usersRelations,
  sessionsRelations,
  accountsRelations,
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
  UserRow,
  NewUserRow,
  SessionRow,
  AccountRow,
  ProjectRow,
  NewProjectRow,
  PredictionRow,
  NewPredictionRow,
  BlobRow,
  NewBlobRow,
  PredictionBlobRow,
  NewPredictionBlobRow,
}
