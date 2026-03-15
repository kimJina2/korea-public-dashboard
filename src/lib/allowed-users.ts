import { db } from "./db";
import { allowedUsers } from "./schema";
import { eq, and } from "drizzle-orm";

export async function isEmailAllowed(email: string): Promise<boolean> {
  const result = await db
    .select()
    .from(allowedUsers)
    .where(and(eq(allowedUsers.email, email), eq(allowedUsers.isActive, true)))
    .limit(1);
  return result.length > 0;
}

export async function getAllowedUsers() {
  return db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.isActive, true));
}

export async function registerUser(email: string, name?: string): Promise<void> {
  const existing = await db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.email, email))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(allowedUsers).values({
      email,
      name: name || null,
      addedBy: "google-oauth",
      isActive: true,
    });
  } else if (!existing[0].isActive) {
    await db
      .update(allowedUsers)
      .set({ isActive: true })
      .where(eq(allowedUsers.email, email));
  }
}
