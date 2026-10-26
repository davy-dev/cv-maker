import { describe, it, expect, vi } from "vitest";
import { hash } from "bcryptjs";
import NextAuth, { type NextAuthConfig } from "next-auth";
import { setupTestDb, createUser } from "../../helpers/db";

// Capture the config passed to NextAuth to call the Credentials `authorize` directly.
vi.mock("next-auth", () => ({
  default: vi.fn(() => ({ handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() })),
}));
vi.mock("next-auth/providers/credentials", () => ({
  default: (options: object) => ({ id: "credentials", type: "credentials", options }),
}));

await import("@/lib/auth/auth");
const config = vi.mocked(NextAuth).mock.calls[0][0] as NextAuthConfig;
const credentials = config.providers.find(
  (p) => (p as { id?: string }).id === "credentials"
) as unknown as {
  options: { authorize: (c: Record<string, unknown>) => Promise<unknown> };
};
const authorize = (c: Record<string, unknown>) => credentials.options.authorize(c);

setupTestDb();

describe("NextAuth — connexion par email / mot de passe", () => {
  it("déclare les providers GitHub, Google et Credentials avec l'adaptateur Drizzle", () => {
    const ids = config.providers.map((p) => (typeof p === "function" ? p().id : p.id));
    expect(ids).toEqual(["github", "google", "credentials"]);
    expect(config.adapter).toBeDefined();
    expect(config.session?.strategy).toBe("jwt");
  });

  it("renvoie l'utilisateur quand le mot de passe est correct", async () => {
    const user = await createUser({
      email: "jean@exemple.com",
      hashedPassword: await hash("motdepasse", 4),
    });

    expect(await authorize({ email: "jean@exemple.com", password: "motdepasse" })).toEqual({
      id: user.id,
      name: user.name,
      email: "jean@exemple.com",
      image: null,
    });
  });

  it("refuse un mauvais mot de passe", async () => {
    await createUser({ email: "jean@exemple.com", hashedPassword: await hash("motdepasse", 4) });
    expect(await authorize({ email: "jean@exemple.com", password: "mauvais!" })).toBeNull();
  });

  it("refuse un email inconnu", async () => {
    expect(await authorize({ email: "personne@exemple.com", password: "motdepasse" })).toBeNull();
  });

  it("refuse un compte OAuth sans mot de passe", async () => {
    await createUser({ email: "oauth@exemple.com", hashedPassword: null });
    expect(await authorize({ email: "oauth@exemple.com", password: "motdepasse" })).toBeNull();
  });

  it("refuse des identifiants mal formés sans interroger la base", async () => {
    expect(await authorize({ email: "pas-un-email", password: "x" })).toBeNull();
  });
});
