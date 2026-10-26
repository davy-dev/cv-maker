import { describe, it, expect } from "vitest";
import { coverLetterReducer, emptyCoverLetterData, isLetterField, readLetterField, writeLetterField } from "@/lib/cv/letter";
import { studioHistoryReducer, studioReducer, type StudioDocument } from "@/lib/studio/document";
import { initialHistory } from "@/lib/cv/history";
import { buildCvData } from "../helpers/fixtures";

const letter = { ...emptyCoverLetterData, introduction: "Bonjour", recipient: { ...emptyCoverLetterData.recipient, companyName: "Acme" } };

describe("champs de la lettre", () => {
  it("lit et écrit un paragraphe ou une ligne du destinataire", () => {
    expect(readLetterField(letter, { kind: "letter", field: "introduction" })).toBe("Bonjour");
    expect(readLetterField(letter, { kind: "letterRecipient", field: "city" })).toBe("");

    const edited = coverLetterReducer(letter, writeLetterField({ kind: "letterRecipient", field: "city" }, "Lyon"));
    expect(edited.recipient.city).toBe("Lyon");
  });

  it("vide une ligne facultative du destinataire en null, jamais l'entreprise", () => {
    expect(writeLetterField({ kind: "letterRecipient", field: "city" }, "")).toMatchObject({ value: null });
    expect(writeLetterField({ kind: "letterRecipient", field: "companyName" }, "")).toMatchObject({ value: "" });
  });

  it("distingue les champs de la lettre de ceux du CV", () => {
    expect(isLetterField({ kind: "letter" })).toBe(true);
    expect(isLetterField({ kind: "summary" })).toBe(false);
  });
});

describe("document du studio", () => {
  const document: StudioDocument = { cv: buildCvData(), letter: null };

  it("n'écrit dans la lettre qu'une fois générée", () => {
    const set = { type: "SET_FIELD", field: "subject", value: "Objet" } as const;
    expect(studioReducer(document, { target: "letter", action: set })).toBe(document);

    const generated = studioReducer(document, { target: "letter", action: { type: "REPLACE_ALL", data: letter } });
    expect(studioReducer(generated, { target: "letter", action: set }).letter!.subject).toBe("Objet");
  });

  it("partage un seul historique entre le CV et la lettre", () => {
    let history = initialHistory<StudioDocument>({ cv: buildCvData(), letter });
    history = studioHistoryReducer(history, { type: "DO", action: { target: "cv", action: { type: "SET_SUMMARY", value: "A" } }, at: 0 });
    history = studioHistoryReducer(history, {
      type: "DO",
      action: { target: "letter", action: { type: "SET_FIELD", field: "introduction", value: "B" } },
      at: 100,
    });
    expect(history.past).toHaveLength(2);

    history = studioHistoryReducer(history, { type: "UNDO" });
    expect(history.present.letter!.introduction).toBe("Bonjour");
    expect(history.present.cv.summary).toBe("A");
  });
});
