import { db } from "./db";
import { accessLog, errorLogs } from "./schema";

export async function logLogin(email: string, provider: string, req?: Request) {
  try {
    const ip = req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? req?.headers.get("x-real-ip")
      ?? null;
    const userAgent = req?.headers.get("user-agent") ?? null;
    await db.insert(accessLog).values({
      email,
      action: `login:${provider}`,
      provider,
      userAgent,
      ipAddress: ip,
    });
  } catch (e) {
    console.error("[logLogin] failed:", e);
  }
}

export async function logError(
  path: string,
  error: unknown,
  options?: { method?: string; userEmail?: string; statusCode?: number }
) {
  try {
    await db.insert(errorLogs).values({
      path,
      method: options?.method ?? "GET",
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.slice(0, 2000) : undefined,
      userEmail: options?.userEmail,
      statusCode: options?.statusCode,
    });
  } catch (e) {
    console.error("[logError] failed:", e);
  }
}
