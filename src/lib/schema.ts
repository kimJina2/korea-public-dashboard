import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const allowedUsers = sqliteTable("allowed_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  addedBy: text("added_by"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const accessLog = sqliteTable("access_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  action: text("action").notNull(),
  timestamp: text("timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  ipAddress: text("ip_address"),
});
