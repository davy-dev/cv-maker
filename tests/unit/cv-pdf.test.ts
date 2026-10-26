import { describe, it, expect } from "vitest";
import { createElement, type ComponentType } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ModernPdfTemplate } from "@/components/pdf/templates/modern-template";
import { ClassicPdfTemplate } from "@/components/pdf/templates/classic-template";
import { ElegantPdfTemplate } from "@/components/pdf/templates/elegant-template";
import { MinimalistPdfTemplate } from "@/components/pdf/templates/minimalist-template";
import { applyVisibility } from "@/lib/cv/visibility";
import { buildCvData } from "../helpers/fixtures";
import type { CvData, CvProject } from "@/types/cv";

const TEMPLATES: Record<string, ComponentType<{ data: CvData }>> = {
  modern: ModernPdfTemplate,
  classic: ClassicPdfTemplate,
  elegant: ElegantPdfTemplate,
  minimalist: MinimalistPdfTemplate,
};

// 1×1 PNG as a data URL, like a profile photo converted by toImageSrc()
const PHOTO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

async function pageCount(Template: ComponentType<{ data: CvData }>, data: CvData) {
  const pdf = (await renderToBuffer(createElement(Template, { data }) as never)).toString("latin1");
  expect(pdf.startsWith("%PDF")).toBe(true);
  return Number(pdf.match(/\/Count (\d+)/)![1]);
}

function longCv(): CvData {
  const projects: CvProject[] = Array.from({ length: 20 }, (_, i) => ({
    id: `p${i}`,
    name: `Projet ${i}`,
    description: "Une description de projet assez longue pour occuper de la place. ".repeat(3),
    technologies: ["TypeScript", "React", "Node.js"],
    url: null,
    type: "side-project",
    role: "Auteur",
    impact: "Des résultats mesurables",
    highlights: ["Premier défi technique résolu", "Second défi technique résolu"],
    motivation: "",
    links: [],
    linkedExperienceId: null,
    displayMode: "projects-section",
  }));
  return buildCvData({ projects });
}

describe("PDF du CV", () => {
  it.each(Object.keys(TEMPLATES))("génère le modèle %s avec la photo", async (name) => {
    const data = buildCvData({ showPhoto: true });
    data.header.image = PHOTO;
    expect(await pageCount(TEMPLATES[name], data)).toBe(1);
  });

  it.each(Object.keys(TEMPLATES))(
    "tient sur une page avec beaucoup de projets, limités à 2 côte à côte (%s)",
    async (name) => {
      const data = applyVisibility(longCv());
      expect(data.projects).toHaveLength(2);
      expect(await pageCount(TEMPLATES[name], data)).toBe(1);
    },
    30_000
  );
});
