import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generatedCvs, users } from "@/lib/db/schema";
import { normalizeCvData } from "@/lib/cv/normalize";
import { applyVisibility } from "@/lib/cv/visibility";
import { ExecutiveTemplate } from "@/components/cv/templates-html/executive-template";

// Self-hosted by next/font: nothing is fetched from Google when Chromium prints
const sans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-cv-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-cv-serif" });

// First page starts at the top edge (full-bleed header); later pages get a margin
const PRINT_CSS = `
  @page { size: A4; margin: 12mm 0; }
  @page :first { margin-top: 0; }
  html, body { margin: 0; background: #ffffff; }
`;

/**
 * The CV alone, as printed. Opened by Chromium in app/api/cv/[id]/pdf/route.ts
 * with the user's session cookie; can also be opened directly to check the layout.
 */
export default async function CvPrintPage({ params }: PageProps<"/cv/[id]/print">) {
  const { id } = await params;
  const userId = await verifySession();

  const cv = await db.query.generatedCvs.findFirst({
    where: eq(generatedCvs.id, id),
  });
  if (!cv || cv.userId !== userId) {
    notFound();
  }

  const cvData = normalizeCvData(cv.cvData);

  // The CV always shows the current profile photo, not the one known when it was generated
  const profile = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { image: true },
  });
  cvData.header.image = profile?.image ?? null;

  return (
    <div className={`${sans.variable} ${serif.variable}`}>
      <style>{PRINT_CSS}</style>
      <ExecutiveTemplate data={applyVisibility(cvData)} />
    </div>
  );
}
