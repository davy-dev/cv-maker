import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/scrape/route";
import { scrapeCompany } from "@/lib/scraper";
import { loginAs, logout } from "../../helpers/session";
import { jsonRequest } from "../../helpers/http";

vi.mock("@/lib/auth/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/scraper", () => ({ scrapeCompany: vi.fn() }));

beforeEach(() => loginAs("user-1"));

describe("POST /api/scrape", () => {
  it("renvoie 401 sans session", async () => {
    logout();
    const res = await POST(jsonRequest("/api/scrape", { url: "https://acme.io" }));
    expect(res.status).toBe(401);
  });

  it("renvoie 400 pour une URL invalide", async () => {
    const res = await POST(jsonRequest("/api/scrape", { url: "acme" }));
    expect(res.status).toBe(400);
    expect(scrapeCompany).not.toHaveBeenCalled();
  });

  it("renvoie 422 quand le site ne peut pas être lu", async () => {
    vi.mocked(scrapeCompany).mockResolvedValue(null);
    const res = await POST(jsonRequest("/api/scrape", { url: "https://acme.io" }));
    expect(res.status).toBe(422);
  });

  it("renvoie les informations de l'entreprise", async () => {
    const companyInfo = {
      name: "Acme",
      description: "",
      url: "https://acme.io/",
      values: "",
      techStack: "",
      rawExcerpt: "",
    };
    vi.mocked(scrapeCompany).mockResolvedValue(companyInfo);

    const res = await POST(jsonRequest("/api/scrape", { url: "https://acme.io" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ companyInfo });
  });
});
