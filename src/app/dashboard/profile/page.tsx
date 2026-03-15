import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/user-profile";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const profile = await getProfile(session.user.email!);

  return (
    <ProfileClient
      currentUser={{
        email: session.user.email!,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }}
      initialProfile={profile}
    />
  );
}
