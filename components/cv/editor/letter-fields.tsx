"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LetterAction, LetterTextField } from "@/lib/cv/letter";
import type { CoverLetterData, CoverLetterRecipient } from "@/types/cv";

const RECIPIENT_FIELDS: { field: keyof CoverLetterRecipient; label: string }[] = [
  { field: "companyName", label: "Entreprise" },
  { field: "contactName", label: "Nom du contact" },
  { field: "contactTitle", label: "Titre du contact" },
  { field: "address", label: "Adresse" },
  { field: "city", label: "Ville" },
];

const TEXT_FIELDS: { field: LetterTextField; label: string; rows?: number }[] = [
  { field: "senderCity", label: "Ville de l'expéditeur" },
  { field: "date", label: "Date" },
  { field: "subject", label: "Objet" },
  { field: "opening", label: "Formule d'ouverture" },
  { field: "introduction", label: "Introduction", rows: 4 },
  { field: "motivation", label: "Motivation", rows: 4 },
  { field: "skillsMatch", label: "Compétences", rows: 4 },
  { field: "conclusion", label: "Conclusion", rows: 4 },
  { field: "closing", label: "Formule de politesse", rows: 2 },
  { field: "senderName", label: "Nom de l'expéditeur" },
];

/** Every field of the cover letter, for the studio's inspector. */
export function LetterFields({
  letter,
  dispatch,
}: {
  letter: CoverLetterData;
  dispatch: (action: LetterAction) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Destinataire</h3>
      {RECIPIENT_FIELDS.map(({ field, label }) => (
        <Input
          key={field}
          label={label}
          value={letter.recipient[field] ?? ""}
          onChange={(e) =>
            dispatch({
              type: "SET_RECIPIENT_FIELD",
              field,
              value: field === "companyName" ? e.target.value : e.target.value || null,
            })
          }
        />
      ))}
      <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Lettre</h3>
      {TEXT_FIELDS.map(({ field, label, rows }) =>
        rows ? (
          <Textarea
            key={field}
            label={label}
            rows={rows}
            value={letter[field]}
            onChange={(e) => dispatch({ type: "SET_FIELD", field, value: e.target.value })}
          />
        ) : (
          <Input
            key={field}
            label={label}
            value={letter[field]}
            onChange={(e) => dispatch({ type: "SET_FIELD", field, value: e.target.value })}
          />
        )
      )}
    </div>
  );
}
