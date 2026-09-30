import { vi } from "vitest";
import { auth } from "@/lib/auth/auth";

/**
 * Requires the test file to declare:
 *   vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));
 */
const mockedAuth = vi.mocked(auth as unknown as () => Promise<unknown>);

export function loginAs(userId: string) {
  mockedAuth.mockResolvedValue({
    user: { id: userId },
    expires: new Date(Date.now() + 3600_000).toISOString(),
  });
}

export function logout() {
  mockedAuth.mockResolvedValue(null);
}
