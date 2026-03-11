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
