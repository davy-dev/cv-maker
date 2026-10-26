import { verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generatedCvs, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CvPageTabs } from "@/components/cv/cv-page-tabs";
import { normalizeCvData } from "@/lib/cv/normalize";
import type { CoverLetterData, GenerationReport, TemplateId } from "@/types/cv";

export default async function CvEditorPage({ params }: PageProps<"/cv/[id]">) {
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

  let generationReport: GenerationReport | null = null;
  if (cv.generationReport) {
    try {
      generationReport = JSON.parse(cv.generationReport);
    } catch {
      generationReport = null;
    }
  }

  let coverLetterData: CoverLetterData | null = null;
  if (cv.coverLetterData) {
    try {
      coverLetterData = JSON.parse(cv.coverLetterData);
    } catch {
      coverLetterData = null;
    }
  }

  return (
    <div className="-m-6 h-[calc(100vh-4rem)]">
      <CvPageTabs
        cvId={cv.id}
        initialCvData={cvData}
        initialTemplateId={cv.templateId as TemplateId}
        initialCoverLetterData={coverLetterData}
        generationReport={generationReport}
      />
    </div>
  );
}
