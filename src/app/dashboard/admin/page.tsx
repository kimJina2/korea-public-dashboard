import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminClient } from "./admin-client";

const ADMIN_EMAILS = ["kts123@kookmin.ac.kr", "fastkjn1@gmail.com"];

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    redirect("/dashboard");
  }
  return <AdminClient />;
}
