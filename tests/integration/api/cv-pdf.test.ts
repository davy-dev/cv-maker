import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/cv/[id]/pdf/route";
import { printPageToPdf } from "@/lib/cv/print-pdf";
import { setupTestDb, createUser, createCv } from "../../helpers/db";
import { buildCvData } from "../../helpers/fixtures";
import { loginAs, logout } from "../../helpers/session";

vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/cv/print-pdf", () => ({ printPageToPdf: vi.fn() }));

setupTestDb();
let userId: string;

beforeEach(async () => {
  userId = (await createUser()).id;
  loginAs(userId);
});

const get = (id: string) =>
  GET(
    new Request(`http://localhost:3000/api/cv/${id}/pdf`, { headers: { cookie: "authjs.session-token=abc" } }),
    { params: Promise.resolve({ id }) } as RouteContext<"/api/cv/[id]/pdf">
  );

describe("GET /api/cv/[id]/pdf", () => {
  it("renvoie 401 sans session", async () => {
    logout();
    expect((await get("cv1")).status).toBe(401);
    expect(printPageToPdf).not.toHaveBeenCalled();
  });

  it("renvoie 404 pour le CV d'un autre compte", async () => {
    const other = await createUser({ email: "autre@exemple.com" });
    const cv = await createCv(other.id);

    expect((await get(cv.id)).status).toBe(404);
    expect(printPageToPdf).not.toHaveBeenCalled();
  });

  it("imprime la page du CV avec le cookie de session et la renvoie en pièce jointe", async () => {
    const cv = await createCv(userId, { cvData: JSON.stringify(buildCvData()) });
    vi.mocked(printPageToPdf).mockResolvedValue(Buffer.from("%PDF-1.7"));

    const res = await get(cv.id);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="CV_Jean_Dupont.pdf"');
    expect(await res.text()).toBe("%PDF-1.7");
    expect(printPageToPdf).toHaveBeenCalledWith(
      `http://localhost:3000/cv/${cv.id}/print`,
      "authjs.session-token=abc"
    );
  });

  it("renvoie 500 si l'impression échoue", async () => {
    const cv = await createCv(userId);
    vi.mocked(printPageToPdf).mockRejectedValue(new Error("Chrome introuvable"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect((await get(cv.id)).status).toBe(500);
  });
});
