import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { toImageSrc } from "@/components/pdf/image-utils";

describe("cn", () => {
  it("fusionne les classes et ignore les valeurs falsy", () => {
    expect(cn("p-2", false && "hidden", undefined, "text-sm")).toBe("p-2 text-sm");
  });

  it("laisse la dernière classe Tailwind gagner en cas de conflit", () => {
    expect(cn("px-2 bg-red-500", "px-4")).toBe("bg-red-500 px-4");
  });
});

describe("toImageSrc", () => {
  it("renvoie telles quelles les URLs classiques", () => {
    expect(toImageSrc("/uploads/photo.png")).toBe("/uploads/photo.png");
  });

  it("convertit une data URL base64 en Buffer pour react-pdf", () => {
    const base64 = Buffer.from("image-bytes").toString("base64");
    const result = toImageSrc(`data:image/png;base64,${base64}`);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.toString()).toBe("image-bytes");
  });

  it("renvoie telle quelle une data URL non reconnue", () => {
    const dataUrl = "data:text/plain;base64,aGVsbG8=";
    expect(toImageSrc(dataUrl)).toBe(dataUrl);
  });
});
