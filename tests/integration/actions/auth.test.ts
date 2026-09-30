import { describe, it, expect } from "vitest";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { registerUser } from "@/lib/actions/auth";
import { users } from "@/lib/db/schema";
import { setupTestDb, createUser } from "../../helpers/db";

const db = setupTestDb();

describe("registerUser", () => {
  it("crée l'utilisateur avec un mot de passe haché", async () => {
    const result = await registerUser({
      name: "Jean Dupont",
      email: "jean@exemple.com",
      password: "motdepasse",
    });

    expect(result).toEqual({ success: true });
    const user = await db.query.users.findFirst({ where: eq(users.email, "jean@exemple.com") });
    expect(user?.name).toBe("Jean Dupont");
    expect(user?.hashedPassword).not.toBe("motdepasse");
    expect(await compare("motdepasse", user!.hashedPassword!)).toBe(true);
  });

  it("refuse un email déjà utilisé", async () => {
    await createUser({ email: "jean@exemple.com" });

    const result = await registerUser({
      name: "Autre Jean",
      email: "jean@exemple.com",
      password: "motdepasse",
    });

    expect(result).toEqual({ error: "Un compte existe déjà avec cet email" });
    expect(await db.select().from(users)).toHaveLength(1);
  });

  it("renvoie le premier message de validation sans rien créer", async () => {
    const result = await registerUser({ name: "Jean", email: "invalide", password: "motdepasse" });

    expect(result).toEqual({ error: "Email invalide" });
    expect(await db.select().from(users)).toHaveLength(0);
  });
});
