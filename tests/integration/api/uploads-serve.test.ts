import { describe, it, expect, vi } from "vitest";
import path from "path";
import { readFile } from "fs/promises";
import { GET } from "@/app/uploads/[file]/route";

vi.mock("fs/promises", () => ({ readFile: vi.fn() }));

const uploadDir = path.join(process.cwd(), "data", "uploads");
const get = (file: string) =>
  GET(new Request(`http://localhost/uploads/${file}`), {
    params: Promise.resolve({ file }),
  } as RouteContext<"/uploads/[file]">);

describe("GET /uploads/[file]", () => {
  it("sert une photo envoyée avec le bon type et un cache long", async () => {
    vi.mocked(readFile).mockResolvedValue(Buffer.from("image-bytes"));

    const res = await get("abc123-1700000000000.jpg");

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/jpeg");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("cache-control")).toContain("immutable");
    expect(await res.text()).toBe("image-bytes");
    expect(readFile).toHaveBeenCalledWith(path.join(uploadDir, "abc123-1700000000000.jpg"));
  });

  it("renvoie 404 pour une photo absente", async () => {
    vi.mocked(readFile).mockRejectedValue(Object.assign(new Error("ENOENT"), { code: "ENOENT" }));
    expect((await get("abc123-1.png")).status).toBe(404);
  });

  it.each(["..%2F..%2Fcv-maker.db", "../cv-maker.db", "abc123-1.svg", "abc123-1.html", "cv-maker.db"])(
    "refuse le nom de fichier %s sans lire le disque",
    async (file) => {
      expect((await get(file)).status).toBe(404);
      expect(readFile).not.toHaveBeenCalled();
    }
  );
});
