import { cvReducer, type CvAction } from "@/lib/cv/reducer";
import type { CvData } from "@/types/cv";

/** Undo history around the CV reducer. */
export interface CvHistory {
  past: CvData[];
  present: CvData;
  future: CvData[];
  /** What the last step wrote and when, to merge keystrokes into one step */
  last: { key: string; at: number } | null;
}

export type HistoryAction =
  | { type: "DO"; action: CvAction; at: number }
  | { type: "UNDO" }
  | { type: "REDO" };

const MAX_STEPS = 100;
/** Edits of the same field closer than this make one undo step: a word, not a letter */
const MERGE_WINDOW_MS = 1000;

export function initialHistory(data: CvData): CvHistory {
  return { past: [], present: data, future: [], last: null };
}

/**
 * Edits that set a value can merge with the previous one on the same target:
 * the action without its value. Other actions (add, move, delete…) never merge.
 */
export function mergeKey(action: CvAction): string | null {
  if (!action.type.startsWith("SET_") || !("value" in action)) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { value, ...target } = action;
  return JSON.stringify(target);
}

export function historyReducer(state: CvHistory, action: HistoryAction): CvHistory {
  switch (action.type) {
    case "DO": {
      const next = cvReducer(state.present, action.action);
      if (next === state.present) return state;
      const key = mergeKey(action.action);
      const merge = key !== null && state.last?.key === key && action.at - state.last.at < MERGE_WINDOW_MS;
      return {
        past: merge ? state.past : [...state.past, state.present].slice(-MAX_STEPS),
        present: next,
        future: [],
        last: key === null ? null : { key, at: action.at },
      };
    }
    case "UNDO": {
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
        last: null,
      };
    }
    case "REDO": {
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
        last: null,
      };
    }
  }
}
