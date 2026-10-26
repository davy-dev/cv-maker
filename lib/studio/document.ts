import { createHistoryReducer, mergeKey } from "@/lib/cv/history";
import { coverLetterReducer, type LetterAction } from "@/lib/cv/letter";
import { cvReducer, type CvAction } from "@/lib/cv/reducer";
import type { CoverLetterData, CvData } from "@/types/cv";

/** Everything the studio edits: one undo history covers both. */
export interface StudioDocument {
  cv: CvData;
  /** Null until the letter is generated */
  letter: CoverLetterData | null;
}

export type StudioAction = { target: "cv"; action: CvAction } | { target: "letter"; action: LetterAction };

export function studioReducer(document: StudioDocument, { target, action }: StudioAction): StudioDocument {
  if (target === "cv") {
    const cv = cvReducer(document.cv, action);
    return cv === document.cv ? document : { ...document, cv };
  }
  // Editing a letter that does not exist yet only makes sense once it is generated
  if (!document.letter && action.type !== "REPLACE_ALL") return document;
  const letter = coverLetterReducer(document.letter!, action);
  return { ...document, letter };
}

function studioMergeKey({ target, action }: StudioAction): string | null {
  const key = mergeKey(action);
  return key === null ? null : `${target}:${key}`;
}

export const studioHistoryReducer = createHistoryReducer(studioReducer, studioMergeKey);
