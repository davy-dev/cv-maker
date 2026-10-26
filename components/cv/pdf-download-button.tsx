"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadPdf, type PrintedDocument } from "@/lib/cv/download";

interface PdfDownloadButtonProps {
  cvId: string;
  doc?: PrintedDocument;
  /** The candidate's name, for the file name */
  name: string;
  /** Saves pending edits: the PDF is printed from the saved document */
  beforeDownload?: () => Promise<void>;
  size?: "default" | "lg";
  children?: React.ReactNode;
}

export function PdfDownloadButton({
  cvId,
  doc = "cv",
  name,
  beforeDownload,
  size = "lg",
  children = "Télécharger en PDF",
}: PdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await beforeDownload?.();
      await downloadPdf(cvId, doc, name);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isGenerating} size={size}>
      {isGenerating ? "Génération du PDF..." : children}
    </Button>
  );
}
