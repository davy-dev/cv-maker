import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoUpload } from "@/components/profile/photo-upload";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

const photo = (size = 1024, type = "image/png", name = "photo.png") =>
  new File([new Uint8Array(size)], name, { type });

async function pick(file: File) {
  // applyAccept: false lets us check the component's own validation
  const user = userEvent.setup({ applyAccept: false });
  await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, file);
}

describe("PhotoUpload", () => {
  it("affiche la photo enregistrée et rafraîchit la page après un upload réussi", async () => {
    fetchMock.mockResolvedValue(Response.json({ url: "/uploads/u1-123.png" }));
    render(<PhotoUpload currentImage={null} />);

    await pick(photo());

    await waitFor(() =>
      expect(screen.getByAltText("Photo de profil")).toHaveAttribute("src", "/uploads/u1-123.png")
    );
    expect(router.refresh).toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("affiche l'erreur du serveur et revient à l'ancienne photo", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: "Format non supporté : utilisez une image JPG, PNG, GIF ou WebP" }, { status: 400 })
    );
    render(<PhotoUpload currentImage="/uploads/ancienne.png" />);

    await pick(photo());

    expect(await screen.findByRole("alert")).toHaveTextContent("Format non supporté");
    expect(screen.getByAltText("Photo de profil")).toHaveAttribute("src", "/uploads/ancienne.png");
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("refuse un fichier de plus de 2 Mo sans l'envoyer", async () => {
    render(<PhotoUpload currentImage={null} />);

    await pick(photo(3 * 1024 * 1024, "image/jpeg", "photo.jpg"));

    expect(screen.getByRole("alert")).toHaveTextContent("Fichier trop volumineux (3.0 Mo, max 2 Mo)");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuse une photo HEIC d'iPhone sans l'envoyer", async () => {
    render(<PhotoUpload currentImage={null} />);

    await pick(photo(1024, "image/heic", "IMG_0001.HEIC"));

    expect(screen.getByRole("alert")).toHaveTextContent("Format non supporté");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
