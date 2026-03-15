import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteUserAccount } from "@/lib/user-profile";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  await deleteUserAccount(session.user.email);
  return NextResponse.json({ success: true });
}
