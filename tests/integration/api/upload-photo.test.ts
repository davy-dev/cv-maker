import { describe, it, expect, vi, beforeEach } from "vitest";
import path from "path";
import { writeFile } from "fs/promises";
import { eq } from "drizzle-orm";
import { POST } from "@/app/api/upload/photo/route";
import { users } from "@/lib/db/schema";
import { setupTestDb, createUser } from "../../helpers/db";
import { loginAs, logout } from "../../helpers/session";

vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));
vi.mock("fs/promises", () => ({ writeFile: vi.fn(), mkdir: vi.fn() }));

const db = setupTestDb();
const uploadDir = path.join(process.cwd(), "data", "uploads");
let userId: string;

beforeEach(async () => {
  userId = (await createUser()).id;
  loginAs(userId);
});

function upload(file?: File) {
  const form = new FormData();
  if (file) form.append("file", file);
  return POST(new Request("http://localhost/api/upload/photo", { method: "POST", body: form }));
}

const SIGNATURES = {
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  jpg: [0xff, 0xd8, 0xff, 0xe0],
  gif: [...Buffer.from("GIF89a")],
  webp: [...Buffer.from("RIFF"), 0, 0, 0, 0, ...Buffer.from("WEBP")],
};

function image(format: keyof typeof SIGNATURES, name = `photo.${format}`, size = 64) {
  const bytes = new Uint8Array(size);
  bytes.set(SIGNATURES[format]);
  return new File([bytes], name, { type: `image/${format}` });
}

const png = (name?: string, size?: number) => image("png", name, size);

describe("POST /api/upload/photo", () => {
  it("renvoie 401 sans session", async () => {
    logout();
    expect((await upload(png())).status).toBe(401);
  });

  it("renvoie 400 sans fichier", async () => {
    const res = await upload();
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Aucun fichier" });
  });

  it("refuse un fichier de plus de 2 Mo", async () => {
    const res = await upload(png("big.png", 2 * 1024 * 1024 + 1));
    expect(res.status).toBe(400);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("refuse un fichier qui n'est pas une image", async () => {
    const res = await upload(new File(["hello"], "notes.txt", { type: "text/plain" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Format non supporté : utilisez une image JPG, PNG, GIF ou WebP",
    });
  });

  const uploadedUrl = (ext: string) => new RegExp(`^/uploads/${userId}-\\d+\\.${ext}$`);

  it("enregistre la photo et met à jour le profil", async () => {
    const res = await upload(png("ma photo.png"));

    expect(res.status).toBe(200);
    const { url } = await res.json();
    expect(url).toMatch(uploadedUrl("png"));
    expect(writeFile).toHaveBeenCalledWith(
      path.join(uploadDir, path.basename(url)),
      expect.any(Buffer)
    );

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    expect(user?.image).toBe(url);
  });

  it("donne un nouveau nom à chaque upload pour éviter l'ancienne image en cache", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1000);
    const first = (await (await upload(png())).json()).url;
    vi.setSystemTime(2000);
    const second = (await (await upload(png())).json()).url;
    vi.useRealTimers();

    expect(first).not.toBe(second);
  });

  it.each(["jpg", "gif", "webp"] as const)("accepte une image %s", async (format) => {
    const res = await upload(image(format));
    expect((await res.json()).url).toMatch(uploadedUrl(format));
  });

  // Files are served from our own origin: HTML or SVG would allow stored XSS.
  it.each([
    ["evil.html", "image/png"],
    ["evil.svg", "image/svg+xml"],
  ])("refuse %s (annoncé %s)", async (name, type) => {
    const res = await upload(new File(["<script>alert(1)</script>"], name, { type }));
    expect(res.status).toBe(400);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("déduit l'extension du contenu, pas du nom de fichier", async () => {
    const res = await upload(png("photo.html"));
    expect((await res.json()).url).toMatch(uploadedUrl("png"));
  });
});
