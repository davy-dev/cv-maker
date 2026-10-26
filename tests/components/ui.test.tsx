import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

describe("Button", () => {
  it("déclenche onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Valider</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Valider" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("ne déclenche rien quand il est désactivé", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Valider
      </Button>
    );

    await userEvent.click(screen.getByRole("button"));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applique les classes de la variante et accepte des classes supplémentaires", () => {
    render(
      <Button variant="destructive" className="w-full">
        Supprimer
      </Button>
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-red-600", "w-full");
  });
});

describe("Input", () => {
  it("associe le label au champ même sans id fourni", () => {
    render(
      <>
        <Input label="Poste" />
        <Textarea label="Description" />
        <Select label="Type" options={[{ value: "a", label: "A" }]} />
      </>
    );
    expect(screen.getByLabelText("Poste")).toBeInstanceOf(HTMLInputElement);
    expect(screen.getByLabelText("Description")).toBeInstanceOf(HTMLTextAreaElement);
    expect(screen.getByLabelText("Type")).toBeInstanceOf(HTMLSelectElement);
  });

  it("associe le label au champ via l'id", () => {
    render(<Input id="email" label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInstanceOf(HTMLInputElement);
  });

  it("affiche le message d'erreur", () => {
    render(<Input id="email" label="Email" error="Email invalide" />);
    expect(screen.getByText("Email invalide")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveClass("border-red-500");
  });
});
