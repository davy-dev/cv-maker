import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { GenerationReportPanel } from "@/components/cv/generation-report";
import type { GenerationReport } from "@/types/cv";

const report: GenerationReport = {
  method: "model",
  checkedCount: 10,
  rejected: [
    { section: "experience", text: "A encadré 5 développeurs", reason: "Chiffre absent de vos données : 5" },
    { section: "summary", text: "Experte Kubernetes.", reason: "Kubernetes n'apparaît pas" },
  ],
  skillsToAcquire: [{ skill: "Kubernetes", reason: "Demandé par l'offre", howToAcquire: "Certification CKA" }],
};

describe("GenerationReportPanel", () => {
  it("résume la vérification et détaille ce qui a été retiré", () => {
    render(<GenerationReportPanel report={report} />);

    expect(screen.getByText(/8 phrases rédigées par l'IA ont été vérifiées/)).toBeInTheDocument();
    expect(screen.getByText("2 éléments retirés car absents de votre profil")).toBeInTheDocument();
    expect(screen.getByText("A encadré 5 développeurs")).toBeInTheDocument();
    expect(screen.getByText("Chiffre absent de vos données : 5")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("présente les compétences à acquérir à part, hors du CV", () => {
    render(<GenerationReportPanel report={report} />);

    const card = screen.getByText("Compétences à acquérir pour ce poste").closest("div")!.parentElement!;
    expect(within(card).getByText(/Elles ne figurent pas sur votre CV/)).toBeInTheDocument();
    expect(within(card).getByText("Kubernetes")).toBeInTheDocument();
    expect(within(card).getByText("Certification CKA")).toBeInTheDocument();
  });

  it("prévient quand seule la vérification automatique a pu tourner", () => {
    render(<GenerationReportPanel report={{ ...report, method: "rules-only", rejected: [], skillsToAcquire: [] }} />);

    expect(screen.getByRole("status")).toHaveTextContent("seuls les contrôles automatiques");
    expect(screen.queryByText(/retiré/)).not.toBeInTheDocument();
    expect(screen.queryByText("Compétences à acquérir pour ce poste")).not.toBeInTheDocument();
  });
});
