import { describe, it, expect } from "vitest";
import type { AdapterAccount } from "next-auth/adapters";
import { DrizzleAdapter } from "@/lib/auth/adapter";
import { skills } from "@/lib/db/schema";
import { setupTestDb, createSkill } from "../../helpers/db";

const db = setupTestDb();
const adapter = DrizzleAdapter as Required<typeof DrizzleAdapter>;

const inOneHour = () => new Date(Math.floor(Date.now() / 1000 + 3600) * 1000);

async function newUser(email = "jean@exemple.com") {
  return adapter.createUser({ id: "", email, name: "Jean", emailVerified: null, image: null });
}

describe("DrizzleAdapter", () => {
  it("crée un utilisateur et le retrouve par id et par email", async () => {
    const user = await newUser();

    expect(user.id).toBeTruthy();
    expect(await adapter.getUser(user.id)).toMatchObject({ email: "jean@exemple.com" });
    expect(await adapter.getUserByEmail("jean@exemple.com")).toMatchObject({ id: user.id });
    expect(await adapter.getUserByEmail("inconnu@exemple.com")).toBeNull();
  });

  it("met à jour un utilisateur", async () => {
    const user = await newUser();
    const updated = await adapter.updateUser({ id: user.id, name: "Jean-Michel" });
    expect(updated.name).toBe("Jean-Michel");
  });

  it("lie un compte OAuth et retrouve l'utilisateur, puis le délie", async () => {
    const user = await newUser();
    const account: AdapterAccount = {
      userId: user.id,
      type: "oauth",
      provider: "github",
      providerAccountId: "gh-123",
      access_token: "token",
    };

    await adapter.linkAccount(account);
    expect(
      await adapter.getUserByAccount({ provider: "github", providerAccountId: "gh-123" })
    ).toMatchObject({ id: user.id });

    await adapter.unlinkAccount({ provider: "github", providerAccountId: "gh-123" });
    expect(
      await adapter.getUserByAccount({ provider: "github", providerAccountId: "gh-123" })
    ).toBeNull();
  });

  it("gère le cycle de vie d'une session", async () => {
    const user = await newUser();
    const expires = inOneHour();

    await adapter.createSession({ sessionToken: "tok", userId: user.id, expires });
    const found = await adapter.getSessionAndUser("tok");
    expect(found?.user.id).toBe(user.id);
    expect(found?.session.expires).toEqual(expires);

    const later = new Date(expires.getTime() + 3600_000);
    expect((await adapter.updateSession({ sessionToken: "tok", expires: later }))?.expires).toEqual(later);

    await adapter.deleteSession("tok");
    expect(await adapter.getSessionAndUser("tok")).toBeNull();
  });

  it("n'accepte un jeton de vérification qu'une seule fois", async () => {
    const token = { identifier: "jean@exemple.com", token: "abc", expires: inOneHour() };
    await adapter.createVerificationToken(token);

    expect(await adapter.useVerificationToken({ identifier: token.identifier, token: "abc" })).toMatchObject({
      token: "abc",
    });
    expect(await adapter.useVerificationToken({ identifier: token.identifier, token: "abc" })).toBeNull();
  });

  it("supprime les données liées avec l'utilisateur", async () => {
    const user = await newUser();
    await createSkill(user.id);

    await adapter.deleteUser(user.id);

    expect(await adapter.getUser(user.id)).toBeNull();
    expect(await db.select().from(skills)).toHaveLength(0);
  });
});
