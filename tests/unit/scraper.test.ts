import { describe, it, expect, vi, beforeEach } from "vitest";
import * as cheerio from "cheerio";
import { extractCompanyInfo } from "@/lib/scraper/extract";
import { lookup } from "dns/promises";
import { scrapeCompany } from "@/lib/scraper";
import { isPublicAddress } from "@/lib/scraper/safe-url";

vi.mock("dns/promises", () => ({ lookup: vi.fn() }));

// Fake DNS: no real network access during tests
const DNS: Record<string, string> = {
  "acme.io": "93.184.216.34",
  "careers.acme.io": "93.184.216.35",
  localhost: "127.0.0.1",
  "intranet.acme.io": "10.0.0.5",
};

const url = new URL("https://www.acme.io/careers");

describe("extractCompanyInfo", () => {
  it("privilégie les balises Open Graph", () => {
    const $ = cheerio.load(`
      <html><head>
        <title>Ignoré | Acme</title>
        <meta property="og:site_name" content="Acme Corp">
        <meta property="og:description" content="On construit des fusées">
      </head><body></body></html>`);

    const info = extractCompanyInfo($, url);

    expect(info.name).toBe("Acme Corp");
    expect(info.description).toBe("On construit des fusées");
    expect(info.url).toBe("https://www.acme.io/careers");
  });

  it("déduit le nom depuis le <title> puis le domaine", () => {
    const withTitle = extractCompanyInfo(cheerio.load("<title>Acme – Carrières</title>"), url);
    expect(withTitle.name).toBe("Acme");

    const withNothing = extractCompanyInfo(cheerio.load("<html></html>"), url);
    expect(withNothing.name).toBe("acme.io");
  });

  it("se rabat sur la meta description", () => {
    const $ = cheerio.load('<meta name="description" content="Description classique">');
    expect(extractCompanyInfo($, url).description).toBe("Description classique");
  });

  it("extrait le texte qui suit les titres « valeurs » et « stack technique »", () => {
    const $ = cheerio.load(`
      <body>
        <h2>Nos valeurs</h2>
        <p>Bienveillance, exigence et transparence au quotidien.</p>
        <h3>Stack technique</h3>
        <p>TypeScript, React, PostgreSQL et Kubernetes en production.</p>
        <p>court</p>
      </body>`);

    const info = extractCompanyInfo($, url);

    expect(info.values).toContain("Bienveillance, exigence");
    expect(info.techStack).toContain("TypeScript, React");
    expect(info.techStack).not.toContain("court");
  });

  it("borne la taille des champs envoyés à l'IA", () => {
    const long = "mot ".repeat(2000);
    const $ = cheerio.load(`<body><h2>Mission</h2><p>${long}</p><p>${long}</p></body>`);

    const info = extractCompanyInfo($, url);

    expect(info.values.length).toBeLessThanOrEqual(500);
    expect(info.techStack.length).toBeLessThanOrEqual(300);
    expect(info.rawExcerpt.length).toBeLessThanOrEqual(1000);
  });
});

describe("isPublicAddress", () => {
  it.each(["93.184.216.34", "8.8.8.8", "2606:4700::1111"])("%s est publique", (ip) => {
    expect(isPublicAddress(ip)).toBe(true);
  });

  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "fd00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "pas-une-ip",
  ])("%s est bloquée", (ip) => {
    expect(isPublicAddress(ip)).toBe(false);
  });
});

describe("scrapeCompany", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(lookup).mockImplementation((async (host: string) => {
      if (!DNS[host]) throw new Error(`ENOTFOUND ${host}`);
      return [{ address: DNS[host], family: 4 }];
    }) as unknown as typeof lookup);
  });

  const html = (body: string, status = 200) => new Response(body, { status });
  const redirect = (location: string) =>
    new Response(null, { status: 302, headers: { location } });

  it("télécharge la page et extrait les informations", async () => {
    fetchMock.mockResolvedValue(html('<meta property="og:site_name" content="Acme">'));

    const info = await scrapeCompany("https://acme.io");

    expect(info?.name).toBe("Acme");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://acme.io/",
      expect.objectContaining({
        redirect: "manual",
        headers: expect.objectContaining({ Accept: "text/html" }),
      })
    );
  });

  it.each(["ftp://acme.io", "file:///etc/passwd", "javascript:alert(1)"])(
    "refuse le protocole non HTTP : %s",
    async (target) => {
      expect(await scrapeCompany(target)).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it("renvoie null si l'URL est invalide", async () => {
    expect(await scrapeCompany("pas une url")).toBeNull();
  });

  it("renvoie null si le domaine n'existe pas", async () => {
    expect(await scrapeCompany("https://inconnu.example")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("renvoie null si le site répond une erreur HTTP", async () => {
    fetchMock.mockResolvedValue(html("Not found", 404));
    expect(await scrapeCompany("https://acme.io")).toBeNull();
  });

  it("renvoie null si la requête échoue (timeout, réseau…)", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    expect(await scrapeCompany("https://acme.io")).toBeNull();
  });

  it.each([
    "http://localhost:3000/api/auth/session",
    "http://127.0.0.1/",
    "http://169.254.169.254/latest/meta-data/",
    "http://192.168.1.1/",
    "http://[::1]/",
    "http://intranet.acme.io/",
  ])("refuse les adresses internes : %s", async (target) => {
    fetchMock.mockResolvedValue(html("<title>interne</title>"));

    expect(await scrapeCompany(target)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("suit une redirection vers un autre site public", async () => {
    fetchMock
      .mockResolvedValueOnce(redirect("https://careers.acme.io/jobs"))
      .mockResolvedValueOnce(html("<title>Acme Careers</title>"));

    const info = await scrapeCompany("https://acme.io");

    expect(info?.name).toBe("Acme Careers");
    expect(info?.url).toBe("https://careers.acme.io/jobs");
  });

  it("refuse une redirection vers une adresse interne", async () => {
    fetchMock.mockResolvedValueOnce(redirect("http://169.254.169.254/latest/meta-data/"));

    expect(await scrapeCompany("https://acme.io")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("abandonne après trop de redirections", async () => {
    fetchMock.mockImplementation(async () => redirect("https://acme.io/boucle"));

    expect(await scrapeCompany("https://acme.io")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
