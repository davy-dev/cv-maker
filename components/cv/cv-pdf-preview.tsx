"use client";

import { useEffect, useRef, useState } from "react";
import { renderCvPdf } from "@/components/pdf/render-cv";
import type { CvData, TemplateId } from "@/types/cv";

interface CvPdfPreviewProps {
  data: CvData;
  templateId: TemplateId;
}

// Waits for a pause in typing before regenerating the PDF
const DEBOUNCE_MS = 500;
// Pixels per PDF point: sharp on high-density screens at the preview's width
const RENDER_SCALE = 2;

/**
 * Shows the real PDF (the one downloaded), page by page.
 * Pages are swapped in only once fully rendered, so the preview never flickers
 * and keeps its scroll position while the CV is being edited.
 */
export function CvPdfPreview({ data, templateId }: CvPdfPreviewProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState(false);
  const latestRender = useRef(0);

  useEffect(() => {
    const renderId = ++latestRender.current;
    const timer = setTimeout(async () => {
      setRendering(true);
      try {
        const blob = await renderCvPdf(data, templateId);
        const images = await rasterize(blob);
        if (renderId !== latestRender.current) {
          images.forEach(URL.revokeObjectURL);
          return; // a newer edit already started another render
        }
        setPages((previous) => {
          previous.forEach(URL.revokeObjectURL);
          return images;
        });
        setError(false);
      } catch (e) {
        console.error("PDF preview failed:", e);
        if (renderId === latestRender.current) setError(true);
      } finally {
        if (renderId === latestRender.current) setRendering(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [data, templateId]);

  // Free the page images when leaving the editor
  const pagesRef = useRef(pages);
  pagesRef.current = pages;
  useEffect(() => () => pagesRef.current.forEach(URL.revokeObjectURL), []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span
          className={
            pages.length > 1
              ? "rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-800"
              : "rounded-full bg-gray-200 px-2.5 py-1 font-medium text-gray-700"
          }
        >
          {pages.length === 0
            ? "Préparation de l'aperçu…"
            : pages.length > 1
              ? `${pages.length} pages — masquez des éléments pour tenir sur une page`
              : "1 page"}
        </span>
        {rendering && pages.length > 0 && <span className="text-gray-500">Mise à jour…</span>}
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          L&apos;aperçu n&apos;a pas pu être généré. Vos modifications sont bien enregistrées.
        </p>
      )}

      {pages.map((src, index) => (
        // eslint-disable-next-line @next/next/no-img-element -- local blob URLs, nothing to optimize
        <img
          key={src}
          src={src}
          alt={`Page ${index + 1} sur ${pages.length}`}
          className="w-full bg-white shadow-lg"
        />
      ))}
    </div>
  );
}

/** Renders each PDF page to a PNG blob URL with pdf.js. */
async function rasterize(blob: Blob): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const loadingTask = pdfjs.getDocument({ data: await blob.arrayBuffer() });
  try {
    const document = await loadingTask.promise;
    const images: string[] = [];
    for (let number = 1; number <= document.numPages; number++) {
      const page = await document.getPage(number);
      const viewport = page.getViewport({ scale: RENDER_SCALE });
      const canvas = window.document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      const png = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas.toBlob failed"))), "image/png")
      );
      images.push(URL.createObjectURL(png));
    }
    return images;
  } finally {
    await loadingTask.destroy();
  }
}
