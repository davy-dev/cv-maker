import type { CoverLetterData, CoverLetterRecipient } from "@/types/cv";

export const emptyCoverLetterData: CoverLetterData = {
  recipient: {
    companyName: "",
    contactName: null,
    contactTitle: null,
    address: null,
    city: null,
  },
  senderCity: "",
  date: "",
  subject: "",
  opening: "Madame, Monsieur,",
  introduction: "",
  motivation: "",
  skillsMatch: "",
  conclusion: "",
  closing: "Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
  senderName: "",
};

export type LetterTextField = keyof Omit<CoverLetterData, "recipient">;

export type LetterAction =
  | { type: "SET_RECIPIENT_FIELD"; field: keyof CoverLetterRecipient; value: string | null }
  | { type: "SET_FIELD"; field: LetterTextField; value: string }
  | { type: "REPLACE_ALL"; data: CoverLetterData };

export function coverLetterReducer(state: CoverLetterData, action: LetterAction): CoverLetterData {
  switch (action.type) {
    case "SET_RECIPIENT_FIELD":
      return { ...state, recipient: { ...state.recipient, [action.field]: action.value } };
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "REPLACE_ALL":
      return action.data;
  }
}

/** A piece of the letter's text, editable on the page like the CV's (see lib/cv/fields.ts). */
export type LetterField =
  | { kind: "letter"; field: LetterTextField }
  | { kind: "letterRecipient"; field: keyof CoverLetterRecipient };

export function isLetterField(field: { kind: string }): field is LetterField {
  return field.kind === "letter" || field.kind === "letterRecipient";
}

export function readLetterField(letter: CoverLetterData, field: LetterField): string {
  return field.kind === "letter" ? letter[field.field] : (letter.recipient[field.field] ?? "");
}

export function writeLetterField(field: LetterField, value: string): LetterAction {
  if (field.kind === "letter") return { type: "SET_FIELD", field: field.field, value };
  // Only the company is required; an emptied optional line goes away
  return { type: "SET_RECIPIENT_FIELD", field: field.field, value: field.field === "companyName" ? value : value || null };
}
