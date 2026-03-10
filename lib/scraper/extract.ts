import type { CheerioAPI } from "cheerio";
import type { CompanyInfo } from "@/types/job";

export function extractCompanyInfo($: CheerioAPI, url: URL): CompanyInfo {
  const name =
    $('meta[property="og:site_name"]').attr("content") ||
    $("title")
      .text()
      .split(/[|\-–]/)
      .at(0)
      ?.trim() ||
    url.hostname.replace("www.", "");

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  const values = extractNearKeywords($, [
    "values",
    "valeurs",
    "culture",
    "mission",
    "vision",
  ]);
  const techStack = extractNearKeywords($, [
    "tech stack",
    "technologies",
    "built with",
    "engineering",
    "stack technique",
  ]);

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  return {
    name,
    description,
    url: url.href,
    values: values.slice(0, 500),
    techStack: techStack.slice(0, 300),
    rawExcerpt: bodyText.slice(0, 1000),
  };
}

function extractNearKeywords($: CheerioAPI, keywords: string[]): string {
  const results: string[] = [];

  $("h1, h2, h3, h4, strong, b").each((_, el) => {
    const text = $(el).text().toLowerCase();
    if (keywords.some((kw) => text.includes(kw))) {
      let sibling = $(el).next();
      for (let i = 0; i < 3 && sibling.length; i++) {
        const sibText = sibling.text().trim();
        if (sibText.length > 20) results.push(sibText);
        sibling = sibling.next();
      }
    }
  });

  return results.join(" ").slice(0, 500);
}
