"use server";

import { signIn, signOut } from "@/auth";

export async function handleSignIn() {
  await signIn("google", { redirectTo: "/dashboard" }, { prompt: "select_account" });
}

export async function handleSignOut() {
  await signOut({ redirectTo: "/" });
}
