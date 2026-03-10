import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Middleware uses Edge-compatible config (no DB imports)
export default NextAuth(authConfig).auth;

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
