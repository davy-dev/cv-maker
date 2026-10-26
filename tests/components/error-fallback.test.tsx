import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorFallback } from "@/components/ui/error-fallback";

describe("ErrorFallback", () => {
  it("affiche la référence de l'erreur et relance le rendu au clic", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const retry = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "abc123" });

    render(<ErrorFallback error={error} retry={retry} homeHref="/dashboard" homeLabel="Tableau de bord" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Une erreur est survenue");
    expect(screen.getByText("Référence : abc123")).toBeInTheDocument();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Tableau de bord" })).toHaveAttribute("href", "/dashboard");

    await userEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
