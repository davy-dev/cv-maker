"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";
import type { ProfileInput } from "@/lib/validators";

interface ProfileFormProps {
  defaultValues: ProfileInput & { email: string };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const fd = new FormData(e.currentTarget);
    const data: ProfileInput = {
      name: fd.get("name") as string,
      title: fd.get("title") as string,
      phone: fd.get("phone") as string,
      location: fd.get("location") as string,
      website: fd.get("website") as string,
      linkedin: fd.get("linkedin") as string,
      github: fd.get("github") as string,
      summary: fd.get("summary") as string,
    };

    const result = await updateProfile(data);
    setSaving(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Profil mis à jour");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          className={`rounded-lg p-3 text-sm ${
            message.includes("mis à jour")
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="name"
          name="name"
          label="Nom complet"
          defaultValue={defaultValues.name}
          required
        />
        <Input
          id="email"
          name="email_display"
          label="Email"
          defaultValue={defaultValues.email}
          disabled
        />
      </div>

      <Input
        id="title"
        name="title"
        label="Titre professionnel"
        placeholder="ex: Développeur Full-Stack Senior"
        defaultValue={defaultValues.title ?? ""}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="phone"
          name="phone"
          label="Téléphone"
          placeholder="+33 6 12 34 56 78"
          defaultValue={defaultValues.phone ?? ""}
        />
        <Input
          id="location"
          name="location"
          label="Localisation"
          placeholder="Paris, France"
          defaultValue={defaultValues.location ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          id="website"
          name="website"
          label="Site web"
          placeholder="https://monsite.com"
          defaultValue={defaultValues.website ?? ""}
        />
        <Input
          id="linkedin"
          name="linkedin"
          label="LinkedIn"
          placeholder="https://linkedin.com/in/..."
          defaultValue={defaultValues.linkedin ?? ""}
        />
        <Input
          id="github"
          name="github"
          label="GitHub"
          placeholder="https://github.com/..."
          defaultValue={defaultValues.github ?? ""}
        />
      </div>

      <Textarea
        id="summary"
        name="summary"
        label="Résumé professionnel"
        placeholder="Décrivez votre parcours et vos objectifs en quelques lignes..."
        rows={4}
        defaultValue={defaultValues.summary ?? ""}
      />

      <Button type="submit" disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer le profil"}
      </Button>
    </form>
  );
}
