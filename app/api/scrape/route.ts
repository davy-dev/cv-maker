import { auth } from "@/lib/auth/auth";
import { scrapeCompany } from "@/lib/scraper";
import { z } from "zod";
import { NextResponse } from "next/server";

const scrapeSchema = z.object({
  url: z.string().url(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = scrapeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  const companyInfo = await scrapeCompany(parsed.data.url);
  if (!companyInfo) {
    return NextResponse.json(
      { error: "Impossible de scraper le site" },
      { status: 422 }
    );
  }

  return NextResponse.json({ companyInfo });
}
