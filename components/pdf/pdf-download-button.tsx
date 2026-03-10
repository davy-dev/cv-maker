"use client";

import { useState, useCallback } from "react";
import { pdf, Font } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";

Font.registerHyphenationCallback((word) => [word]);
import type { CvData, TemplateId } from "@/types/cv";

interface PdfDownloadButtonProps {
  data: CvData;
  templateId: TemplateId;
  fileName: string;
}

export function PdfDownloadButton({
  data,
  templateId,
  fileName,
}: PdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    try {
      let Template: React.ComponentType<{ data: CvData }>;

      if (templateId === "classic") {
        const mod = await import("./templates/classic-template");
        Template = mod.ClassicPdfTemplate;
      } else if (templateId === "minimalist") {
        const mod = await import("./templates/minimalist-template");
        Template = mod.MinimalistPdfTemplate;
      } else if (templateId === "elegant") {
        const mod = await import("./templates/elegant-template");
        Template = mod.ElegantPdfTemplate;
      } else {
        const mod = await import("./templates/modern-template");
        Template = mod.ModernPdfTemplate;
      }

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
      console.error("PDF generation failed:", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  }, [data, templateId, fileName]);

  return (
    <Button onClick={handleDownload} disabled={isGenerating} size="lg">
      {isGenerating ? "Génération du PDF..." : "Télécharger en PDF"}
    </Button>
  );
}
