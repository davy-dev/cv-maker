import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { encode } from "next-auth/jwt";
import { proxy } from "@/proxy";

const SECRET = "test-secret-for-proxy";
const COOKIE = "authjs.session-token";
let validToken: string;

beforeAll(async () => {
  process.env.AUTH_SECRET = SECRET;
  validToken = await encode({ token: { sub: "user-1" }, secret: SECRET, salt: COOKIE });
});

function request(path: string, token?: string) {
  const req = new NextRequest(`http://localhost:3000${path}`);
  if (token) req.cookies.set(COOKIE, token);
  return req;
}

describe("proxy", () => {
  it("redirige un visiteur vers /login en gardant la page demandée", async () => {
    const res = await proxy(request("/cv/abc"));

    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("callbackUrl")).toBe("http://localhost:3000/cv/abc");
  });

  it("laisse passer un utilisateur connecté", async () => {
    const res = await proxy(request("/dashboard", validToken));
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("renvoie un utilisateur connecté de /login vers /dashboard", async () => {
    const res = await proxy(request("/login", validToken));
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it.each([
    ["falsifié", "pas-un-jwt"],
    ["signé avec un autre secret", "other"],
  ])("traite un cookie %s comme un visiteur", async (_label, kind) => {
    const token =
      kind === "other"
        ? await encode({ token: { sub: "user-1" }, secret: "autre-secret", salt: COOKIE })
        : kind;
    const res = await proxy(request("/dashboard", token));
    expect(new URL(res.headers.get("location")!).pathname).toBe("/login");
  });

  // Regression: re-issued cookies on prefetch responses could land after sign-out
  // and log the user back in.
  it.each([
    ["/dashboard", true],
    ["/login", true],
    ["/dashboard", false],
  ])("ne pose jamais de cookie (%s, connecté: %s)", async (path, loggedIn) => {
    const res = await proxy(request(path, loggedIn ? validToken : undefined));
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
