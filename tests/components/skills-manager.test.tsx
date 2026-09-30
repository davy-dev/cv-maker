import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addSkill, deleteSkill } from "@/lib/actions/skills";
import { SkillsManager } from "@/components/skills/skills-manager";

vi.mock("@/lib/actions/skills", () => ({ addSkill: vi.fn(), deleteSkill: vi.fn() }));

const skills = [
  { id: "1", name: "TypeScript", category: "language", level: 5, yearsOfExperience: 4 },
  { id: "2", name: "Python", category: "language", level: 3, yearsOfExperience: null },
  { id: "3", name: "React", category: "framework", level: 4, yearsOfExperience: 1 },
];

describe("SkillsManager", () => {
  it("affiche un message quand il n'y a aucune compétence", () => {
    render(<SkillsManager initialData={[]} />);
    expect(screen.getByText("Aucune compétence ajoutée.")).toBeInTheDocument();
    expect(screen.getByText("0 compétence")).toBeInTheDocument();
  });

  it("regroupe les compétences par catégorie", () => {
    render(<SkillsManager initialData={skills} />);

    expect(screen.getByText("3 compétences")).toBeInTheDocument();
    const languages = screen.getByRole("heading", { name: "Langages" }).parentElement!;
    expect(within(languages).getByText("TypeScript")).toBeInTheDocument();
    expect(within(languages).getByText("Python")).toBeInTheDocument();
    expect(within(languages).queryByText("React")).not.toBeInTheDocument();
    expect(screen.getByText("4 ans")).toBeInTheDocument();
    expect(screen.getByText("1 an")).toBeInTheDocument();
  });

  it("affiche les catégories Librairie et Runtime", async () => {
    render(
      <SkillsManager
        initialData={[
          { id: "4", name: "Zod", category: "library", level: 4, yearsOfExperience: null },
          { id: "5", name: "Node.js", category: "runtime", level: 5, yearsOfExperience: null },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Librairies" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Runtimes" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ajouter une compétence" }));
    const [category] = screen.getAllByRole("combobox");
    expect(within(category).getByRole("option", { name: "Librairie" })).toHaveValue("library");
    expect(within(category).getByRole("option", { name: "Runtime" })).toHaveValue("runtime");
  });

  it("envoie le formulaire d'ajout avec des valeurs typées puis le referme", async () => {
    vi.mocked(addSkill).mockResolvedValue({ success: true });
    render(<SkillsManager initialData={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "Ajouter une compétence" }));
    await userEvent.type(screen.getByPlaceholderText("ex: React"), "Docker");
    const [category, level] = screen.getAllByRole("combobox");
    await userEvent.selectOptions(category, "devops");
    await userEvent.selectOptions(level, "4");
    await userEvent.type(screen.getByPlaceholderText("3.5"), "2.5");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(addSkill).toHaveBeenCalledWith({
      name: "Docker",
      category: "devops",
      level: 4,
      yearsOfExperience: 2.5,
    });
    expect(screen.queryByPlaceholderText("ex: React")).not.toBeInTheDocument();
  });

  it("garde le formulaire ouvert si l'ajout échoue", async () => {
    vi.mocked(addSkill).mockResolvedValue({ error: "Le nom est requis" });
    render(<SkillsManager initialData={[]} />);

    await userEvent.click(screen.getByRole("button", { name: "Ajouter une compétence" }));
    await userEvent.type(screen.getByPlaceholderText("ex: React"), "X");
    await userEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(screen.getByPlaceholderText("ex: React")).toBeInTheDocument();
  });

  it("ne supprime qu'après confirmation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    render(<SkillsManager initialData={skills} />);
    const [firstDelete] = screen.getAllByTitle("Supprimer");

    confirmSpy.mockReturnValueOnce(false);
    await userEvent.click(firstDelete);
    expect(deleteSkill).not.toHaveBeenCalled();

    confirmSpy.mockReturnValueOnce(true);
    await userEvent.click(firstDelete);
    expect(deleteSkill).toHaveBeenCalledWith("1");
  });
});
