import { cvReducer, type CvAction } from "@/lib/cv/reducer";
import type { CvData } from "@/types/cv";

/** Undo history around a reducer: the CV's, or the studio's (CV and letter). */
export interface History<T> {
  past: T[];
  present: T;
  future: T[];
  /** What the last step wrote and when, to merge keystrokes into one step */
  last: { key: string; at: number } | null;
}

export type CvHistory = History<CvData>;

export type HistoryAction<A = CvAction> =
  | { type: "DO"; action: A; at: number }
  | { type: "UNDO" }
  | { type: "REDO" };

const MAX_STEPS = 100;
/** Edits of the same field closer than this make one undo step: a word, not a letter */
const MERGE_WINDOW_MS = 1000;

export function initialHistory<T>(data: T): History<T> {
  return { past: [], present: data, future: [], last: null };
}

/**
 * Edits that set a value can merge with the previous one on the same target:
 * the action without its value. Other actions (add, move, delete…) never merge.
 */
export function mergeKey<A extends { type: string }>(action: A): string | null {
  if (!action.type.startsWith("SET_") || !("value" in action)) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { value, ...target } = action;
  return JSON.stringify(target);
}

/** A reducer with undo: `mergeKeyOf` says which actions merge with the previous step. */
export function createHistoryReducer<T, A>(reduce: (state: T, action: A) => T, mergeKeyOf: (action: A) => string | null) {
  return function historyReducer(state: History<T>, action: HistoryAction<A>): History<T> {
    switch (action.type) {
      case "DO": {
        const next = reduce(state.present, action.action);
        if (next === state.present) return state;
        const key = mergeKeyOf(action.action);
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
  };
}

export const historyReducer = createHistoryReducer(cvReducer, mergeKey);
