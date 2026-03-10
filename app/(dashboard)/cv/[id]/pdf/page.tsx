import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { generatedCvs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CvPreview } from "@/components/cv/cv-preview";
import { PdfDownloadButton } from "@/components/pdf/pdf-download-button";
import { CoverLetterPdfDownloadButton } from "@/components/pdf/cover-letter-pdf-download-button";
import { CoverLetterPreview } from "@/components/cover-letter/cover-letter-preview";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { CvData, CoverLetterData, TemplateId } from "@/types/cv";

interface PdfPageProps {
  params: Promise<{ id: string }>;
}

export default async function PdfPage({ params }: PdfPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const cv = await db.query.generatedCvs.findFirst({
    where: eq(generatedCvs.id, id),
  });

  if (!cv || cv.userId !== session.user.id) {
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
            <CvPreview data={cvData} templateId={templateId} />
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
