import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("fusionne les classes et ignore les valeurs falsy", () => {
    expect(cn("p-2", false && "hidden", undefined, "text-sm")).toBe("p-2 text-sm");
  });

  it("laisse la dernière classe Tailwind gagner en cas de conflit", () => {
    expect(cn("px-2 bg-red-500", "px-4")).toBe("bg-red-500 px-4");
  });
});
