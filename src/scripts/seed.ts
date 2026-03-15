/**
 * DB 초기화 및 허용 사용자 시드 스크립트
 * 실행: npx tsx src/scripts/seed.ts
 *
 * 필수 환경변수:
 *   TURSO_DATABASE_URL
 *   TURSO_AUTH_TOKEN
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { allowedUsers } from "../lib/schema";
import { eq } from "drizzle-orm";

async function seed() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });

  const db = drizzle(client);

  // 테이블 생성
  await client.execute(`
    CREATE TABLE IF NOT EXISTS allowed_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      added_by TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS email_otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS access_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      ip_address TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_email TEXT NOT NULL,
      author_name TEXT,
      author_image TEXT,
      title TEXT,
      content TEXT NOT NULL,
      board_type TEXT NOT NULL DEFAULT 'normal',
      visibility TEXT NOT NULL DEFAULT 'public',
      answer_status TEXT NOT NULL DEFAULT 'none',
      process_status TEXT NOT NULL DEFAULT 'received',
      has_admin_reply INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    )
  `);

  // 기존 posts 테이블에 새 컬럼 추가 (ALTER TABLE - 이미 존재하는 경우)
  const alterPostsColumns = [
    `ALTER TABLE posts ADD COLUMN title TEXT`,
    `ALTER TABLE posts ADD COLUMN board_type TEXT NOT NULL DEFAULT 'normal'`,
    `ALTER TABLE posts ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'`,
    `ALTER TABLE posts ADD COLUMN answer_status TEXT NOT NULL DEFAULT 'none'`,
    `ALTER TABLE posts ADD COLUMN process_status TEXT NOT NULL DEFAULT 'received'`,
    `ALTER TABLE posts ADD COLUMN has_admin_reply INTEGER NOT NULL DEFAULT 0`,
  ];
  for (const sql of alterPostsColumns) {
    try { await client.execute(sql); } catch { /* 컬럼이 이미 존재하면 무시 */ }
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(post_id, user_email)
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      parent_id INTEGER,
      author_email TEXT NOT NULL,
      author_name TEXT,
      author_image TEXT,
      content TEXT NOT NULL,
      is_admin_feedback INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      nickname TEXT UNIQUE,
      bio TEXT,
      profile_image TEXT,
      language TEXT NOT NULL DEFAULT 'ko',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    )
  `);

  // 기존 user_profiles 테이블에 새 컬럼 추가
  const alterUserProfilesColumns = [
    `ALTER TABLE user_profiles ADD COLUMN language TEXT NOT NULL DEFAULT 'ko'`,
    `ALTER TABLE user_profiles ADD COLUMN profile_image TEXT`,
  ];
  for (const sql of alterUserProfilesColumns) {
    try { await client.execute(sql); } catch { /* 컬럼이 이미 존재하면 무시 */ }
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS board_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      admin_email TEXT NOT NULL,
      admin_name TEXT,
      content TEXT NOT NULL,
      is_internal INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS board_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      changed_by TEXT NOT NULL,
      field TEXT NOT NULL,
      from_value TEXT,
      to_value TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS comment_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(comment_id, user_email)
    )
  `);

  // 허용 사용자 추가
  const usersToSeed = [
    { email: "kts123@kookmin.ac.kr", name: "관리자", addedBy: "system" },
    { email: "fastkjn1@gmail.com", name: "관리자2", addedBy: "system" },
  ];

  for (const user of usersToSeed) {
    const existing = await db
      .select()
      .from(allowedUsers)
      .where(eq(allowedUsers.email, user.email))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(allowedUsers).values({
        email: user.email,
        name: user.name,
        addedBy: user.addedBy,
        isActive: true,
      });
      console.log(`✅ 추가됨: ${user.email}`);
    } else {
      console.log(`⏭️  이미 존재: ${user.email}`);
    }
  }

  console.log("시드 완료");
  client.close();
}

seed().catch((err) => {
  console.error("시드 실패:", err);
  process.exit(1);
});
