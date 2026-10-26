import { NextResponse, type NextRequest } from "next/server";
import { decode } from "next-auth/jwt";
import type { Session } from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Secure prefix is used by Auth.js over HTTPS
const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"];

/**
 * Optimistic redirects only: reads the session cookie and never writes it.
 * The NextAuth wrapper re-issued the cookie on every response, including prefetches,
 * which could land after sign-out and log the user back in.
 * Real authorization happens in lib/auth/session.ts (pages, actions, routes).
 */
export async function proxy(request: NextRequest) {
  const session = await readSession(request);
  const result = await authConfig.callbacks!.authorized!({
    auth: session,
    request,
  });

  if (result instanceof Response) return result;
  if (result === false) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.href);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

async function readSession(request: NextRequest): Promise<Session | null> {
  const cookieName = SESSION_COOKIES.find((name) => request.cookies.has(name));
  if (!cookieName) return null;

  try {
    const token = await decode({
      token: request.cookies.get(cookieName)!.value,
      secret: process.env.AUTH_SECRET!,
      salt: cookieName,
    });
    if (!token?.sub) return null;
    return { user: { id: token.sub }, expires: "" };
  } catch {
    return null; // expired, tampered with, or signed with another secret
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/skills/:path*",
    "/cv/:path*",
    "/login",
    "/register",
  ],
};
