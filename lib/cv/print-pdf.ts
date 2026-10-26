import "server-only";
import { chromium } from "playwright-core";

/**
 * Browser used to print. Playwright no longer ships Chromium for macOS 13, so the
 * installed Google Chrome is the default; set PDF_BROWSER_CHANNEL="" to use the
 * Chromium downloaded by `npx playwright install chromium` instead.
 */
const CHANNEL = process.env.PDF_BROWSER_CHANNEL ?? "chrome";

export class PrintError extends Error {}

/**
 * Opens a print page as the current user (their cookies are forwarded)
 * and prints it to an A4 PDF, page size and margins coming from its @page rules.
 */
export async function printPageToPdf(url: string, cookie: string): Promise<Buffer> {
  const browser = await chromium.launch({ channel: CHANNEL || undefined });
  try {
    const context = await browser.newContext({ extraHTTPHeaders: { cookie } });
    const page = await context.newPage();

    const response = await page.goto(url, { waitUntil: "networkidle" });
    // An expired session ends on the login page instead of the CV
    if (!response?.ok() || new URL(page.url()).pathname !== new URL(url).pathname) {
      throw new PrintError(`Print page unavailable: ${response?.status()} ${page.url()}`);
    }

    // `next dev` overlays its indicator on every page
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    await page.evaluate(() => document.fonts.ready);

    return await page.pdf({ printBackground: true, preferCSSPageSize: true });
  } finally {
    await browser.close();
  }
}
