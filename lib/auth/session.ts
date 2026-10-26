import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Data Access Layer for authentication.
 * The proxy only redirects early; every page, action and route must still
 * check the session itself, through these helpers.
 */

// Deduplicated within a request: layouts, pages and actions share one lookup
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const session = await auth();
  return session?.user?.id ?? null;
});

/** For Server Components: sends visitors to the login page. */
export async function verifySession(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");
  return userId;
}

/** For Server Actions: fails loudly instead of redirecting. */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Non authentifié");
  return userId;
}
