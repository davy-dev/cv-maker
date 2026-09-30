"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { renderCvPdf } from "./render-cv";
import type { CvData, TemplateId } from "@/types/cv";

interface PdfDownloadButtonProps {
  data: CvData;
  templateId: TemplateId;
  fileName: string;
  size?: "default" | "lg";
}

export function PdfDownloadButton({
  data,
  templateId,
  fileName,
  size = "lg",
}: PdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await renderCvPdf(data, templateId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  }, [data, templateId, fileName]);

  return (
    <Button onClick={handleDownload} disabled={isGenerating} size={size}>
      {isGenerating ? "Génération du PDF..." : "Télécharger en PDF"}
    </Button>
  );
}
