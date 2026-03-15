import { auth } from "@/auth";
import { db } from "@/lib/db";
import { accessLog, errorLogs, allowedUsers } from "@/lib/schema";
import { desc } from "drizzle-orm";

const ADMIN_EMAILS = ["kts123@kookmin.ac.kr", "fastkjn1@gmail.com"];

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") ?? "logins";

  if (tab === "logins") {
    const logs = await db
      .select()
      .from(accessLog)
      .orderBy(desc(accessLog.timestamp))
      .limit(200);
    return Response.json(logs);
  }

  if (tab === "errors") {
    const logs = await db
      .select()
      .from(errorLogs)
      .orderBy(desc(errorLogs.timestamp))
      .limit(200);
    return Response.json(logs);
  }

  if (tab === "users") {
    const users = await db
      .select()
      .from(allowedUsers)
      .orderBy(desc(allowedUsers.createdAt));
    return Response.json(users);
  }

  return Response.json({ error: "Invalid tab" }, { status: 400 });
}
