import { db } from "@/lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { Adapter } from "next-auth/adapters";

export const DrizzleAdapter: Adapter = {
  async createUser(data) {
    const id = createId();
    await db.insert(users).values({
      id,
      name: data.name,
      email: data.email,
      emailVerified: data.emailVerified,
      image: data.image,
    });
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return user!;
  },

  async getUser(id) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });
    return user ?? null;
  },

  async getUserByEmail(email) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    return user ?? null;
  },

  async getUserByAccount({ providerAccountId, provider }) {
    const account = await db.query.accounts.findFirst({
      where: and(
        eq(accounts.provider, provider),
        eq(accounts.providerAccountId, providerAccountId)
      ),
    });
    if (!account) return null;
    const user = await db.query.users.findFirst({
      where: eq(users.id, account.userId),
    });
    return user ?? null;
  },

  async updateUser(data) {
    if (!data.id) throw new Error("User id is required");
    await db
      .update(users)
      .set({
        name: data.name,
        email: data.email,
        emailVerified: data.emailVerified,
        image: data.image,
        updatedAt: new Date(),
      })
      .where(eq(users.id, data.id));
    const user = await db.query.users.findFirst({
      where: eq(users.id, data.id),
    });
    return user!;
  },

  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
  },

  async linkAccount(data) {
    await db.insert(accounts).values({
      id: createId(),
      userId: data.userId,
      type: data.type,
      provider: data.provider,
      providerAccountId: data.providerAccountId,
      refresh_token: data.refresh_token,
      access_token: data.access_token,
      expires_at: data.expires_at,
      token_type: data.token_type,
      scope: data.scope,
      id_token: data.id_token,
      session_state: data.session_state as string | undefined,
    });
  },

  async unlinkAccount({ providerAccountId, provider }) {
    await db
      .delete(accounts)
      .where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.providerAccountId, providerAccountId)
        )
      );
  },

  async createSession(data) {
    const id = createId();
    await db.insert(sessions).values({
      id,
      sessionToken: data.sessionToken,
      userId: data.userId,
      expires: data.expires,
    });
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
    });
    return session!;
  },

  async getSessionAndUser(sessionToken) {
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.sessionToken, sessionToken),
    });
    if (!session) return null;
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });
    if (!user) return null;
    return { session, user };
  },

  async updateSession(data) {
    await db
      .update(sessions)
      .set({
        expires: data.expires,
      })
      .where(eq(sessions.sessionToken, data.sessionToken));
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.sessionToken, data.sessionToken),
    });
    return session ?? null;
  },

  async deleteSession(sessionToken) {
    await db
      .delete(sessions)
      .where(eq(sessions.sessionToken, sessionToken));
  },

  async createVerificationToken(data) {
    await db.insert(verificationTokens).values({
      identifier: data.identifier,
      token: data.token,
      expires: data.expires,
    });
    return data;
  },

  async useVerificationToken({ identifier, token }) {
    const vt = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.identifier, identifier),
        eq(verificationTokens.token, token)
      ),
    });
    if (!vt) return null;
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token)
        )
      );
    return vt;
  },
};
