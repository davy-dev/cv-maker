import { verifySession } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import { CvPageTabs } from "@/components/cv/cv-page-tabs";
import { loadUserCv } from "@/lib/cv/load";

export default async function CvEditorPage({ params }: PageProps<"/cv/[id]">) {
  const { id } = await params;
  const userId = await verifySession();

  const cv = await loadUserCv(id, userId);
  if (!cv) {
    notFound();
  }

  return (
    <div className="-m-6 h-[calc(100vh-4rem)]">
      <CvPageTabs
        cvId={cv.id}
        initialCvData={cv.cvData}
        initialTemplateId={cv.templateId}
        initialCoverLetterData={cv.coverLetterData}
        generationReport={cv.generationReport}
      />
    </div>
  );
}
