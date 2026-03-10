"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser } from "@/lib/actions/auth";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await registerUser({ name, email, password });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Auto-login after registration
    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (signInResult?.error) {
      setError("Compte créé mais erreur de connexion. Essayez de vous connecter.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
          <span className="text-white font-bold text-lg">CV</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
        <p className="mt-1 text-sm text-gray-500">
          Inscrivez-vous pour commencer à créer vos CV
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Input
          id="name"
          name="name"
          type="text"
          label="Nom complet"
          placeholder="Jean Dupont"
          required
        />

        <Input
          id="email"
          name="email"
          type="email"
          label="Email"
          placeholder="vous@exemple.com"
          required
        />

        <Input
          id="password"
          name="password"
          type="password"
          label="Mot de passe"
          placeholder="Au moins 6 caractères"
          required
          minLength={6}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Inscription..." : "S'inscrire"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-blue-600 hover:underline font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
