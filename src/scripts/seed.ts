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
