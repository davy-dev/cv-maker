import { pdf, Font } from "@react-pdf/renderer";
import { applyVisibility } from "@/lib/cv/visibility";
import type { CvData, TemplateId } from "@/types/cv";

Font.registerHyphenationCallback((word) => [word]);

type CvTemplate = React.ComponentType<{ data: CvData }>;

// Templates are heavy: each one is only loaded when used
const templateLoaders: Record<TemplateId, () => Promise<CvTemplate>> = {
  modern: async () => (await import("./templates/modern-template")).ModernPdfTemplate,
  classic: async () => (await import("./templates/classic-template")).ClassicPdfTemplate,
  elegant: async () => (await import("./templates/elegant-template")).ElegantPdfTemplate,
  minimalist: async () => (await import("./templates/minimalist-template")).MinimalistPdfTemplate,
};

/**
 * The single place where a CV becomes a PDF: the live preview and the
 * download both call it, so what is previewed is exactly what is downloaded.
 */
export async function renderCvPdf(data: CvData, templateId: TemplateId): Promise<Blob> {
  const Template = await (templateLoaders[templateId] ?? templateLoaders.modern)();
  return pdf(<Template data={applyVisibility(data)} />).toBlob();
}
