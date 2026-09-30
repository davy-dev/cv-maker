import "server-only";
import * as cheerio from "cheerio";
import { extractCompanyInfo } from "./extract";
import { isSafePublicUrl } from "./safe-url";
import type { CompanyInfo } from "@/types/job";

const MAX_REDIRECTS = 3;

export async function scrapeCompany(
  url: string
): Promise<CompanyInfo | null> {
  try {
    let currentUrl = new URL(url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Redirects are followed manually so each hop is checked against internal addresses
    let response: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isSafePublicUrl(currentUrl))) break;

      const res = await fetch(currentUrl.href, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "CVMaker-Bot/1.0 (job-application-helper)",
          Accept: "text/html",
        },
      });

      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        currentUrl = new URL(location, currentUrl);
        continue;
      }
      response = res;
      break;
    }
    clearTimeout(timeoutId);

    if (!response?.ok) return null;

    const html = await response.text();
    const truncatedHtml = html.slice(0, 500_000);

    const $ = cheerio.load(truncatedHtml);
    return extractCompanyInfo($, currentUrl);
  } catch (error) {
    console.error("Scraping failed:", error);
    return null;
  }
}
