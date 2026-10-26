import { notFound } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/auth/session";
import { loadUserCv } from "@/lib/cv/load";
import { applyVisibility } from "@/lib/cv/visibility";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PdfDownloadButton } from "@/components/cv/pdf-download-button";
import { ExecutiveLetter } from "@/components/cv/templates-html/executive-letter";
import { ExecutiveTemplate } from "@/components/cv/templates-html/executive-template";
import { ScaledPage } from "@/components/cv/templates-html/scaled-page";

export default async function PdfPage({ params }: PageProps<"/cv/[id]/pdf">) {
  const { id } = await params;
  const userId = await verifySession();

  const cv = await loadUserCv(id, userId);
  if (!cv) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aperçu et téléchargement</h1>
          <p className="text-sm text-gray-500 mt-1">{cv.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/cv/${id}`}>
            <Button variant="outline">Retour à l&apos;éditeur</Button>
          </Link>
          <PdfDownloadButton cvId={id} name={cv.cvData.header.name} />
          {cv.coverLetterData && (
            <PdfDownloadButton cvId={id} doc="letter" name={cv.cvData.header.name}>
              Télécharger la lettre
            </PdfDownloadButton>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 flex justify-center">
          <div style={{ maxWidth: "595px", width: "100%" }}>
            <ScaledPage>
              <ExecutiveTemplate data={applyVisibility(cv.cvData)} variant={cv.templateId} />
            </ScaledPage>
          </div>
        </CardContent>
      </Card>

      {cv.coverLetterData && (
        <Card>
          <CardContent className="p-6 flex justify-center">
            <div style={{ maxWidth: "595px", width: "100%" }}>
              <ScaledPage>
                <ExecutiveLetter cv={cv.cvData} letter={cv.coverLetterData} variant={cv.templateId} />
              </ScaledPage>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
