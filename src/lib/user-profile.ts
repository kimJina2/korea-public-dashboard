import { db } from "./db";
import { userProfiles, allowedUsers } from "./schema";
import { eq } from "drizzle-orm";

export type UserProfile = {
  id: number;
  email: string;
  nickname: string | null;
  bio: string | null;
  profileImage: string | null;
  language: string;
  createdAt: string;
  updatedAt: string | null;
};

export async function getProfile(email: string): Promise<UserProfile | null> {
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.email, email))
    .limit(1);
  return profile ?? null;
}

export async function upsertProfile(
  email: string,
  data: {
    nickname?: string | null;
    bio?: string | null;
    profileImage?: string | null;
    language?: string;
  }
): Promise<UserProfile> {
  const existing = await getProfile(email);

  if (existing) {
    const [updated] = await db
      .update(userProfiles)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(userProfiles.email, email))
      .returning();
    return updated;
  } else {
    const [created] = await db
      .insert(userProfiles)
      .values({ email, ...data })
      .returning();
    return created;
  }
}

export async function isNicknameTaken(
  nickname: string,
  excludeEmail?: string
): Promise<boolean> {
  const [row] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.nickname, nickname))
    .limit(1);

  if (!row) return false;
  if (excludeEmail && row.email === excludeEmail) return false;
  return true;
}

export async function deleteUserAccount(email: string): Promise<void> {
  await db.update(allowedUsers).set({ isActive: false }).where(eq(allowedUsers.email, email));
  await db.delete(userProfiles).where(eq(userProfiles.email, email));
}
