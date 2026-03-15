import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

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

export const emailOtps = sqliteTable("email_otps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: text("expires_at").notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const accessLog = sqliteTable("access_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  action: text("action").notNull(),
  timestamp: text("timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  ipAddress: text("ip_address"),
  provider: text("provider"), // 'google' | 'otp'
  userAgent: text("user_agent"),
});

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorEmail: text("author_email").notNull(),
  authorName: text("author_name"),
  authorImage: text("author_image"),
  title: text("title"),
  content: text("content").notNull(),
  boardType: text("board_type").notNull().default("normal"), // normal | inquiry | report
  visibility: text("visibility").notNull().default("public"), // public | private | admin_only
  answerStatus: text("answer_status").notNull().default("none"), // none | pending | answered
  processStatus: text("process_status").notNull().default("received"), // received | in_review | resolved | closed
  hasAdminReply: integer("has_admin_reply", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at"),
});

export const postLikes = sqliteTable(
  "post_likes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    postId: integer("post_id").notNull(),
    userEmail: text("user_email").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("post_likes_unique").on(t.postId, t.userEmail)]
);

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  parentId: integer("parent_id"),
  authorEmail: text("author_email").notNull(),
  authorName: text("author_name"),
  authorImage: text("author_image"),
  content: text("content").notNull(),
  isAdminFeedback: integer("is_admin_feedback", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const boardReplies = sqliteTable("board_replies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  adminEmail: text("admin_email").notNull(),
  adminName: text("admin_name"),
  content: text("content").notNull(),
  isInternal: integer("is_internal", { mode: "boolean" }).notNull().default(false), // admin-only note
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at"),
});

export const boardStatusHistory = sqliteTable("board_status_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id").notNull(),
  changedBy: text("changed_by").notNull(),
  field: text("field").notNull(), // 'process_status' | 'answer_status' | 'visibility'
  fromValue: text("from_value"),
  toValue: text("to_value").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const commentReactions = sqliteTable(
  "comment_reactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    commentId: integer("comment_id").notNull(),
    userEmail: text("user_email").notNull(),
    type: text("type").notNull(), // 'like' | 'dislike'
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (t) => [uniqueIndex("comment_reactions_unique").on(t.commentId, t.userEmail)]
);

export const userProfiles = sqliteTable("user_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  nickname: text("nickname").unique(),
  bio: text("bio"),
  profileImage: text("profile_image"),
  language: text("language").notNull().default("ko"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at"),
});

export const errorLogs = sqliteTable("error_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  path: text("path").notNull(),
  method: text("method").notNull().default("GET"),
  errorMessage: text("error_message").notNull(),
  stack: text("stack"),
  userEmail: text("user_email"),
  statusCode: integer("status_code"),
  timestamp: text("timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});
