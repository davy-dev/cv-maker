import { verifySession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generatedCvs, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CvPdfPreview } from "@/components/cv/cv-pdf-preview";
import { PdfDownloadButton } from "@/components/pdf/pdf-download-button";
import { CoverLetterPdfDownloadButton } from "@/components/pdf/cover-letter-pdf-download-button";
import { CoverLetterPreview } from "@/components/cover-letter/cover-letter-preview";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CvData, CoverLetterData, TemplateId } from "@/types/cv";

export default async function PdfPage({ params }: PageProps<"/cv/[id]/pdf">) {
  const { id } = await params;
  const userId = await verifySession();

  const cv = await db.query.generatedCvs.findFirst({
    where: eq(generatedCvs.id, id),
  });

  if (!cv || cv.userId !== userId) {
    notFound();
  }

  let cvData: CvData;
  try {
    const parsed = JSON.parse(cv.cvData);
    if (!parsed.header) notFound();
    cvData = parsed;
  } catch {
    notFound();
  }

  // The CV always shows the current profile photo, not the one known when it was generated
  const profile = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { image: true },
  });
  cvData.header.image = profile?.image ?? null;

  const templateId = cv.templateId as TemplateId;
  const fileSlug = cv.title.replace(/[^a-zA-Z0-9]/g, "_");

  let coverLetterData: CoverLetterData | null = null;
  if (cv.coverLetterData) {
    try {
      coverLetterData = JSON.parse(cv.coverLetterData);
    } catch {
      coverLetterData = null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Aperçu et téléchargement
          </h1>
          <p className="text-sm text-gray-500 mt-1">{cv.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/cv/${id}`}>
            <Button variant="outline">Retour à l&apos;éditeur</Button>
          </Link>
          <PdfDownloadButton
            data={cvData}
            templateId={templateId}
            fileName={fileSlug}
          />
          {coverLetterData && (
            <CoverLetterPdfDownloadButton
              data={coverLetterData}
              templateId={templateId}
              fileName={`${fileSlug}_lettre`}
            />
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 flex justify-center">
          <div style={{ maxWidth: "595px", width: "100%" }}>
            <CvPdfPreview data={cvData} templateId={templateId} />
          </div>
        </CardContent>
      </Card>

      {coverLetterData && (
        <Card>
          <CardContent className="p-6 flex justify-center">
            <div style={{ maxWidth: "595px", width: "100%" }}>
              <CoverLetterPreview data={coverLetterData} templateId={templateId} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
