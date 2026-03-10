import * as cheerio from "cheerio";
import { extractCompanyInfo } from "./extract";
import type { CompanyInfo } from "@/types/job";

export async function scrapeCompany(
  url: string
): Promise<CompanyInfo | null> {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CVMaker-Bot/1.0 (job-application-helper)",
        Accept: "text/html",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();
    const truncatedHtml = html.slice(0, 500_000);

    const $ = cheerio.load(truncatedHtml);
    return extractCompanyInfo($, parsedUrl);
  } catch (error) {
    console.error("Scraping failed:", error);
    return null;
  }
}
