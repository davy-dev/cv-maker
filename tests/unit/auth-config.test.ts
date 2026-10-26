import { describe, it, expect } from "vitest";
import { authConfig } from "@/lib/auth/auth.config";
import { config as proxyConfig } from "@/proxy";

type AuthorizedArgs = Parameters<NonNullable<NonNullable<typeof authConfig.callbacks>["authorized"]>>[0];

function authorized(pathname: string, loggedIn: boolean) {
  return authConfig.callbacks!.authorized!({
    auth: loggedIn ? { user: { id: "u1" }, expires: "" } : null,
    request: { nextUrl: new URL(`http://localhost:3000${pathname}`) },
  } as unknown as AuthorizedArgs);
}

describe("authConfig.callbacks.authorized", () => {
  it.each(["/dashboard", "/profile", "/skills", "/cv", "/cv/abc123/pdf"])(
    "bloque %s pour un visiteur non connecté",
    async (path) => {
      expect(await authorized(path, false)).toBe(false);
    }
  );

  it.each(["/dashboard", "/cv/abc123"])("autorise %s pour un utilisateur connecté", async (path) => {
    expect(await authorized(path, true)).toBe(true);
  });

  it.each(["/login", "/register"])(
    "redirige un utilisateur connecté de %s vers /dashboard",
    async (path) => {
      const result = await authorized(path, true);
      expect(result).toBeInstanceOf(Response);
      expect((result as Response).headers.get("location")).toBe("http://localhost:3000/dashboard");
    }
  );

  it.each(["/", "/login", "/register"])("laisse %s public", async (path) => {
    expect(await authorized(path, false)).toBe(true);
  });
});

describe("authConfig callbacks jwt / session", () => {
  it("copie l'id utilisateur dans le token puis dans la session", async () => {
    const token = await authConfig.callbacks!.jwt!({
      token: {},
      user: { id: "user-42" },
    } as never);
    expect(token).toMatchObject({ sub: "user-42" });

    const session = await authConfig.callbacks!.session!({
      session: { user: {}, expires: "" },
      token,
    } as never);
    expect((session as { user: { id: string } }).user.id).toBe("user-42");
  });
});

describe("proxy matcher", () => {
  it("protège toutes les routes privées vérifiées par authorized()", () => {
    expect(proxyConfig.matcher).toEqual(
      expect.arrayContaining([
        "/dashboard/:path*",
        "/profile/:path*",
        "/skills/:path*",
        "/cv/:path*",
      ])
    );
  });
});
