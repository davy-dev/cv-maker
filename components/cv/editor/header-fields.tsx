"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { CvDispatch } from "@/lib/cv/reducer";
import type { CvData } from "@/types/cv";
import { str } from "./utils";

export function HeaderFields({ data, dispatch }: { data: CvData; dispatch: CvDispatch }) {
  const { header } = data;
  const setField = (field: keyof CvData["header"], value: string | null) =>
    dispatch({ type: "SET_HEADER_FIELD", field, value });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Nom" value={str(header.name)} onChange={(e) => setField("name", e.target.value)} />
        <Input label="Titre" value={str(header.title)} onChange={(e) => setField("title", e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Email" value={str(header.email)} onChange={(e) => setField("email", e.target.value)} />
        <Input label="Téléphone" value={str(header.phone)} onChange={(e) => setField("phone", e.target.value)} />
      </div>
      <Input
        label="Localisation"
        value={str(header.location)}
        onChange={(e) => setField("location", e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="LinkedIn"
          value={str(header.linkedin)}
          onChange={(e) => setField("linkedin", e.target.value || null)}
        />
        <Input
          label="GitHub"
          value={str(header.github)}
          onChange={(e) => setField("github", e.target.value || null)}
        />
      </div>
      <Input
        label="Années d'expérience"
        placeholder="ex: 5 ans d'expérience"
        value={data.yearsExperience}
        onChange={(e) => dispatch({ type: "SET_YEARS_EXPERIENCE", value: e.target.value })}
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={data.showPhoto}
          onChange={() => dispatch({ type: "TOGGLE_SHOW_PHOTO" })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Afficher ma photo de profil</span>
      </label>
      {data.showPhoto && !header.image && (
        <p className="text-xs text-gray-500">
          Aucune photo de profil pour l&apos;instant.{" "}
          <Link href="/profile" className="text-blue-600 hover:underline">
            Ajoutez-en une
          </Link>{" "}
          pour l&apos;afficher sur le CV.
        </p>
      )}
    </div>
  );
}
