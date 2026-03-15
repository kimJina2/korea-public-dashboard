import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BoardClient } from "./board-client";

export default async function BoardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <BoardClient
      currentUser={{
        email: session.user.email!,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }}
    />
  );
}
