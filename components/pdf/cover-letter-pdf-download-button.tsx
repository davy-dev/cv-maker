"use client";

import { useState, useCallback } from "react";
import { pdf, Font } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";

Font.registerHyphenationCallback((word) => [word]);
import type { CoverLetterData, TemplateId } from "@/types/cv";

interface CoverLetterPdfDownloadButtonProps {
  data: CoverLetterData;
  templateId: TemplateId;
  fileName: string;
}

const templateImporters: Record<
  TemplateId,
  () => Promise<{ default?: React.ComponentType<{ data: CoverLetterData }>; [key: string]: unknown }>
> = {
  modern: () => import("./templates/modern-cover-letter-template"),
  classic: () => import("./templates/classic-cover-letter-template"),
  minimalist: () => import("./templates/minimalist-cover-letter-template"),
  elegant: () => import("./templates/elegant-cover-letter-template"),
};

const templateExportNames: Record<TemplateId, string> = {
  modern: "ModernCoverLetterPdfTemplate",
  classic: "ClassicCoverLetterPdfTemplate",
  minimalist: "MinimalistCoverLetterPdfTemplate",
  elegant: "ElegantCoverLetterPdfTemplate",
};

export function CoverLetterPdfDownloadButton({
  data,
  templateId,
  fileName,
}: CoverLetterPdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const mod = await templateImporters[templateId]();
      const exportName = templateExportNames[templateId];
      const Template = (mod as Record<string, React.ComponentType<{ data: CoverLetterData }>>)[exportName];

      const blob = await pdf(<Template data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Cover letter PDF generation failed:", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  }, [data, templateId, fileName]);

  return (
    <Button onClick={handleDownload} disabled={isGenerating}>
      {isGenerating ? "Génération du PDF..." : "Télécharger la lettre en PDF"}
    </Button>
  );
}
