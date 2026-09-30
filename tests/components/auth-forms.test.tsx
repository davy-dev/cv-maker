import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { registerUser } from "@/lib/actions/auth";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));
vi.mock("@/lib/actions/auth", () => ({ registerUser: vi.fn() }));

const signInMock = vi.mocked(signIn as unknown as (...args: unknown[]) => Promise<unknown>);

async function fillLogin(email = "jean@exemple.com", password = "motdepasse") {
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.type(screen.getByLabelText("Mot de passe"), password);
  await userEvent.click(screen.getByRole("button", { name: "Se connecter" }));
}

describe("LoginForm", () => {
  it("connecte l'utilisateur puis redirige vers le tableau de bord", async () => {
    signInMock.mockResolvedValue({ error: undefined });
    render(<LoginForm />);

    await fillLogin();

    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "jean@exemple.com",
      password: "motdepasse",
      redirect: false,
    });
    expect(router.push).toHaveBeenCalledWith("/dashboard");
  });

  it("affiche une erreur et réactive le bouton si les identifiants sont faux", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin" });
    render(<LoginForm />);

    await fillLogin();

    expect(await screen.findByText("Email ou mot de passe incorrect")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Se connecter" })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it.each([
    ["GitHub", "github"],
    ["Google", "google"],
  ])("lance la connexion %s", async (label, provider) => {
    render(<LoginForm />);

    await userEvent.click(screen.getByRole("button", { name: `Continuer avec ${label}` }));

    expect(signInMock).toHaveBeenCalledWith(provider, { callbackUrl: "/dashboard" });
  });

  it("propose un lien vers l'inscription", () => {
    render(<LoginForm />);
    expect(screen.getByRole("link", { name: "S'inscrire" })).toHaveAttribute("href", "/register");
  });
});

describe("RegisterForm", () => {
  async function fillRegister() {
    await userEvent.type(screen.getByLabelText("Nom complet"), "Jean Dupont");
    await userEvent.type(screen.getByLabelText("Email"), "jean@exemple.com");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "motdepasse");
    await userEvent.click(screen.getByRole("button", { name: "S'inscrire" }));
  }

  it("crée le compte, connecte automatiquement et redirige", async () => {
    vi.mocked(registerUser).mockResolvedValue({ success: true });
    signInMock.mockResolvedValue({ error: undefined });
    render(<RegisterForm />);

    await fillRegister();

    expect(registerUser).toHaveBeenCalledWith({
      name: "Jean Dupont",
      email: "jean@exemple.com",
      password: "motdepasse",
    });
    expect(signInMock).toHaveBeenCalledWith("credentials", expect.objectContaining({ redirect: false }));
    expect(router.push).toHaveBeenCalledWith("/dashboard");
  });

  it("affiche l'erreur du serveur sans tenter de connexion", async () => {
    vi.mocked(registerUser).mockResolvedValue({ error: "Un compte existe déjà avec cet email" });
    render(<RegisterForm />);

    await fillRegister();

    expect(await screen.findByText("Un compte existe déjà avec cet email")).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it("prévient si le compte est créé mais la connexion échoue", async () => {
    vi.mocked(registerUser).mockResolvedValue({ success: true });
    signInMock.mockResolvedValue({ error: "CredentialsSignin" });
    render(<RegisterForm />);

    await fillRegister();

    expect(await screen.findByText(/Compte créé mais erreur de connexion/)).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("impose 6 caractères minimum côté navigateur", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("Mot de passe")).toHaveAttribute("minLength", "6");
  });
});
