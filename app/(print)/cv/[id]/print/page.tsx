import { notFound } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { loadUserCv } from "@/lib/cv/load";
import { applyVisibility } from "@/lib/cv/visibility";
import { ExecutiveLetter } from "@/components/cv/templates-html/executive-letter";
import { ExecutiveTemplate } from "@/components/cv/templates-html/executive-template";
import { cvFontVariables } from "@/components/cv/templates-html/fonts";

// First page starts at the top edge (full-bleed header); later pages get a margin
const PRINT_CSS = `
  @page { size: A4; margin: 12mm 0; }
  @page :first { margin-top: 0; }
  html, body { margin: 0; background: #ffffff; }
`;

/**
 * The CV alone, or its cover letter with ?doc=letter, as printed. Opened by
 * Chromium in app/api/cv/[id]/pdf/route.ts with the user's session cookie;
 * can also be opened directly to check the layout.
 */
export default async function CvPrintPage({ params, searchParams }: PageProps<"/cv/[id]/print">) {
  const { id } = await params;
  const { doc } = await searchParams;
  const userId = await verifySession();

  const cv = await loadUserCv(id, userId);
  if (!cv || (doc === "letter" && !cv.coverLetterData)) {
    notFound();
  }

  return (
    <div className={cvFontVariables}>
      <style>{PRINT_CSS}</style>
      {doc === "letter" ? (
        <ExecutiveLetter cv={cv.cvData} letter={cv.coverLetterData!} variant={cv.templateId} />
      ) : (
        <ExecutiveTemplate data={applyVisibility(cv.cvData)} variant={cv.templateId} />
      )}
    </div>
  );
}
