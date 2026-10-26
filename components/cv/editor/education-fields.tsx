"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CvDispatch } from "@/lib/cv/reducer";
import type { CvEducation } from "@/types/cv";
import { str } from "./utils";

/** Fields of one education entry. */
export function EducationFields({
  education,
  index,
  dispatch,
}: {
  education: CvEducation;
  index: number;
  dispatch: CvDispatch;
}) {
  const setField = (field: keyof CvEducation, value: string) =>
    dispatch({ type: "SET_EDUCATION_FIELD", index, field, value });

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input label="Diplôme" value={education.degree} onChange={(e) => setField("degree", e.target.value)} />
        <Input label="Domaine" value={education.field} onChange={(e) => setField("field", e.target.value)} />
      </div>
      <Input
        label="Établissement"
        value={education.institution}
        onChange={(e) => setField("institution", e.target.value)}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input label="Début" value={str(education.startDate)} onChange={(e) => setField("startDate", e.target.value)} />
        <Input label="Fin" value={str(education.endDate)} onChange={(e) => setField("endDate", e.target.value)} />
      </div>
      <Textarea
        label="Description"
        value={str(education.description)}
        rows={2}
        placeholder="Description optionnelle..."
        onChange={(e) => setField("description", e.target.value)}
      />
    </>
  );
}
