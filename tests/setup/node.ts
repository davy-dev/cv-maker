import { vi } from "vitest";

// Server actions call revalidatePath, which needs a Next.js request context.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
