import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  typedRoutes: true,
  images: {
    // OAuth profile pictures, shown in the header and on the CV
    remotePatterns: [
      // Google: https://lh3.googleusercontent.com/a/<id>=s96-c
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/a/**", search: "" },
      // GitHub: https://avatars.githubusercontent.com/u/<id>?v=4
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/u/**", search: "?v=4" },
    ],
  },
};

export default nextConfig;
