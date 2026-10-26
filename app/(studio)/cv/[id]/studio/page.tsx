import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { verifySession } from "@/lib/auth/session";
import { loadUserCv } from "@/lib/cv/load";
import { Studio } from "@/components/cv/studio/studio";
import { cvFontVariables } from "@/components/cv/templates-html/fonts";

export const metadata: Metadata = {
  title: "Studio — CV Maker",
};

/** The Figma-like editor, full screen: no dashboard sidebar or header. */
export default async function CvStudioPage({ params }: PageProps<"/cv/[id]/studio">) {
  const { id } = await params;
  const userId = await verifySession();

  const cv = await loadUserCv(id, userId);
  if (!cv) {
    notFound();
  }

  return (
    <div className={`${cvFontVariables} h-screen overflow-hidden`}>
      <Studio
        cvId={cv.id}
        title={cv.title}
        initialData={cv.cvData}
        initialLetter={cv.coverLetterData}
        generationReport={cv.generationReport}
      />
    </div>
  );
}
