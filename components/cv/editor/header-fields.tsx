"use client";

import { useId } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { CvDispatch } from "@/lib/cv/reducer";
import type { CvData } from "@/types/cv";
import { str } from "./utils";

export function HeaderFields({ data, dispatch }: { data: CvData; dispatch: CvDispatch }) {
  const { header } = data;
  const photoRadius = data.photoRadius ?? 50;
  const radiusId = useId();
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
      {data.showPhoto && (
        <div className="space-y-1">
          <label htmlFor={radiusId} className="flex justify-between text-sm font-medium text-gray-700">
            Arrondi de la photo
            <span className="font-normal text-gray-500">{radiusLabel(photoRadius)}</span>
          </label>
          <input
            id={radiusId}
            type="range"
            min={0}
            max={50}
            step={1}
            value={photoRadius}
            aria-valuetext={radiusLabel(photoRadius)}
            onChange={(e) => dispatch({ type: "SET_PHOTO_RADIUS", value: Number(e.target.value) })}
            className="w-full accent-blue-600"
          />
        </div>
      )}
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

function radiusLabel(radius: number): string {
  if (radius === 0) return "Carrée";
  if (radius === 50) return "Ronde";
  return `${radius} %`;
}
