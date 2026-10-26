/** Which printed document: the CV or its cover letter. */
export type PrintedDocument = "cv" | "letter";

/**
 * Downloads a PDF printed by the server from the saved document
 * (app/api/cv/[id]/pdf/route.ts): save pending edits before calling it.
 */
export async function downloadPdf(cvId: string, doc: PrintedDocument, name: string): Promise<void> {
  const response = await fetch(`/api/cv/${cvId}/pdf${doc === "letter" ? "?doc=letter" : ""}`);
  if (!response.ok) throw new Error(`PDF: ${response.status}`);
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = `${doc === "letter" ? "Lettre" : "CV"}_${name || "sans_nom"}`.replace(/[^a-zA-Z0-9]/g, "_") + ".pdf";
  link.click();
  URL.revokeObjectURL(url);
}
