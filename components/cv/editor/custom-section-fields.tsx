"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CvDispatch } from "@/lib/cv/reducer";
import type { CvCustomSection } from "@/types/cv";

/** Title and free text of one custom section. */
export function CustomSectionFields({ section, dispatch }: { section: CvCustomSection; dispatch: CvDispatch }) {
  const setField = (field: "title" | "content", value: string) =>
    dispatch({ type: "SET_CUSTOM_SECTION_FIELD", id: section.id, field, value });

  return (
    <>
      <Input label="Titre" value={section.title} onChange={(e) => setField("title", e.target.value)} />
      <Textarea
        label="Contenu"
        value={section.content}
        rows={3}
        placeholder={"Français : langue maternelle\nAnglais : professionnel"}
        onChange={(e) => setField("content", e.target.value)}
      />
      <p className="text-xs text-gray-500">Une ligne par élément. Entourez un mot de **astérisques** pour le mettre en gras.</p>
    </>
  );
}
