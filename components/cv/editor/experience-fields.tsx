"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CvDispatch } from "@/lib/cv/reducer";
import type { CvExperience } from "@/types/cv";
import { str } from "./utils";

/** Fields of one experience. */
export function ExperienceFields({
  experience,
  index,
  dispatch,
}: {
  experience: CvExperience;
  index: number;
  dispatch: CvDispatch;
}) {
  const setField = (field: keyof CvExperience, value: string) =>
    dispatch({ type: "SET_EXPERIENCE_FIELD", index, field, value });

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input label="Poste" value={experience.position} onChange={(e) => setField("position", e.target.value)} />
        <Input label="Entreprise" value={experience.company} onChange={(e) => setField("company", e.target.value)} />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input label="Lieu" value={str(experience.location)} onChange={(e) => setField("location", e.target.value)} />
        <Input label="Début" value={str(experience.startDate)} onChange={(e) => setField("startDate", e.target.value)} />
        <Input label="Fin" value={str(experience.endDate)} onChange={(e) => setField("endDate", e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Réalisations</label>
        {experience.bullets.map((bullet, bulletIndex) => (
          <div key={bulletIndex} className="flex gap-1">
            <Input
              value={bullet}
              onChange={(e) =>
                dispatch({ type: "SET_EXPERIENCE_BULLET", expIndex: index, bulletIndex, value: e.target.value })
              }
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch({ type: "REMOVE_EXPERIENCE_BULLET", expIndex: index, bulletIndex })}
              className="shrink-0 text-red-400"
            >
              x
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={() => dispatch({ type: "ADD_EXPERIENCE_BULLET", expIndex: index })}>
          + Ajouter un point
        </Button>
      </div>
    </>
  );
}
