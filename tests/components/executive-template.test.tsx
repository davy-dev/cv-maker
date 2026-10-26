import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExecutiveTemplate } from "@/components/cv/templates-html/executive-template";
import { parseRichText } from "@/components/cv/templates-html/rich-text";
import { buildCvData } from "../helpers/fixtures";
import type { CvProject } from "@/types/cv";

function project(overrides: Partial<CvProject> = {}): CvProject {
  return {
    id: "p1",
    name: "CV Maker",
    description: "Adapte un CV à une offre",
    technologies: ["TypeScript"],
    url: null,
    type: "personal",
    role: "",
    impact: "",
    highlights: ["**Anti-hallucination** : chaque phrase cite ses sources"],
    motivation: "",
    links: [],
    linkedExperienceId: null,
    displayMode: "projects-section",
    ...overrides,
  };
}

describe("parseRichText", () => {
  it("découpe le texte en passages normaux et en gras", () => {
    expect(parseRichText("**Qualité** : tests et **revues**.")).toEqual([
      { text: "Qualité", bold: true },
      { text: " : tests et ", bold: false },
      { text: "revues", bold: true },
      { text: ".", bold: false },
    ]);
  });

  it("laisse tel quel un texte sans gras ou un astérisque isolé", () => {
    expect(parseRichText("5 * 3")).toEqual([{ text: "5 * 3", bold: false }]);
  });
});

describe("ExecutiveTemplate", () => {
  it("affiche l'en-tête, les sections et les contacts cliquables", () => {
    render(
      <ExecutiveTemplate
        data={buildCvData({
          header: { ...buildCvData().header, linkedin: "https://www.linkedin.com/in/jean/" },
          education: [
            { id: "e1", institution: "Cloud Campus", degree: "Mastère", field: "", startDate: "2020", endDate: "2023", description: "" },
          ],
          interests: ["Piano"],
        })}
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Jean Dupont" })).toBeInTheDocument();
    expect(screen.getByText("5 ans d'expérience · Lyon")).toBeInTheDocument();
    expect(screen.getByText("Développeur — Acme")).toBeInTheDocument();
    expect(screen.getByText("2020-01 – Présent · Lyon")).toBeInTheDocument();
    expect(screen.getByText("Cloud Campus · 2020 – 2023")).toBeInTheDocument();
    expect(screen.getByText("Piano")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "jean@exemple.com" })).toHaveAttribute("href", "mailto:jean@exemple.com");
    expect(screen.getByRole("link", { name: "linkedin.com/in/jean" })).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/jean/"
    );
  });

  it("omet les sections vides", () => {
    render(<ExecutiveTemplate data={buildCvData({ summary: "", education: [], interests: [] })} />);

    expect(screen.queryByRole("heading", { name: "Profil" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Formation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Projets" })).not.toBeInTheDocument();
  });

  it("met les débuts de puce en gras et place les projets liés sous leur expérience", () => {
    render(
      <ExecutiveTemplate
        data={buildCvData({
          projects: [
            project(),
            project({ id: "p2", name: "Back-office", displayMode: "under-experience", linkedExperienceId: "exp1" }),
          ],
        })}
      />
    );

    expect(screen.getByRole("heading", { name: "Projets" })).toBeInTheDocument();
    expect(screen.getAllByText("Anti-hallucination")[0].tagName).toBe("B");
    expect(screen.getByText("CV Maker")).toBeInTheDocument();
    expect(screen.getByText("Back-office")).toBeInTheDocument();
  });

  it("affiche la photo seulement si demandé, avec l'initiale à défaut d'image", () => {
    const { rerender } = render(<ExecutiveTemplate data={buildCvData({ showPhoto: false })} />);
    expect(screen.queryByText("J")).not.toBeInTheDocument();

    rerender(<ExecutiveTemplate data={buildCvData({ showPhoto: true })} />);
    expect(screen.getByText("J")).toBeInTheDocument();

    const header = { ...buildCvData().header, image: "/uploads/abc-1.png" };
    rerender(<ExecutiveTemplate data={buildCvData({ showPhoto: true, header })} />);
    expect(screen.getByRole("img", { name: "Jean Dupont" })).toHaveAttribute("src", "/uploads/abc-1.png");
  });
});
