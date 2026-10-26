import { describe, it, expect, vi } from "vitest";
import { redirect } from "next/navigation";
import { getCurrentUserId, verifySession, requireUserId } from "@/lib/auth/session";
import { loginAs, logout } from "../helpers/session";

vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

describe("DAL de session", () => {
  it("renvoie l'id de l'utilisateur connecté", async () => {
    loginAs("user-1");
    expect(await getCurrentUserId()).toBe("user-1");
    expect(await verifySession()).toBe("user-1");
    expect(await requireUserId()).toBe("user-1");
  });

  it("renvoie null sans session", async () => {
    logout();
    expect(await getCurrentUserId()).toBeNull();
  });

  it("redirige un visiteur vers /login dans les pages", async () => {
    logout();
    await expect(verifySession()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("lève une erreur dans les server actions", async () => {
    logout();
    await expect(requireUserId()).rejects.toThrow("Non authentifié");
    expect(redirect).not.toHaveBeenCalled();
  });
});
