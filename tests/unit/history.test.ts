import { describe, it, expect } from "vitest";
import { historyReducer, initialHistory, mergeKey, type CvHistory } from "@/lib/cv/history";
import type { CvAction } from "@/lib/cv/reducer";
import { buildCvData } from "../helpers/fixtures";

const summary = (value: string): CvAction => ({ type: "SET_SUMMARY", value });

function run(steps: (CvAction | "UNDO" | "REDO" | [CvAction, number])[]): CvHistory {
  return steps.reduce<CvHistory>((state, step) => {
    if (step === "UNDO" || step === "REDO") return historyReducer(state, { type: step });
    const [action, at] = Array.isArray(step) ? step : [step, 0];
    return historyReducer(state, { type: "DO", action, at });
  }, initialHistory(buildCvData()));
}

describe("historique du CV", () => {
  it("annule puis rétablit une modification", () => {
    const edited = run([summary("Nouveau")]);
    expect(edited.present.summary).toBe("Nouveau");

    const undone = historyReducer(edited, { type: "UNDO" });
    expect(undone.present.summary).toBe("Développeur passionné.");
    expect(historyReducer(undone, { type: "REDO" }).present.summary).toBe("Nouveau");
  });

  it("regroupe la frappe dans un même champ en une seule étape", () => {
    const typed = run([[summary("N"), 0], [summary("No"), 300], [summary("Nou"), 900]]);
    expect(typed.past).toHaveLength(1);
    expect(historyReducer(typed, { type: "UNDO" }).present.summary).toBe("Développeur passionné.");
  });

  it("ouvre une nouvelle étape après une pause ou dans un autre champ", () => {
    expect(run([[summary("A"), 0], [summary("AB"), 1500]]).past).toHaveLength(2);
    expect(run([[summary("A"), 0], [{ type: "SET_YEARS_EXPERIENCE", value: "3 ans" }, 100]]).past).toHaveLength(2);
  });

  it("ne regroupe jamais les ajouts, suppressions ou déplacements", () => {
    expect(run([[{ type: "ADD_EXPERIENCE" }, 0], [{ type: "ADD_EXPERIENCE" }, 10]]).past).toHaveLength(2);
    expect(mergeKey({ type: "ADD_EXPERIENCE" })).toBeNull();
    expect(mergeKey({ type: "SET_EXPERIENCE_BULLET", expIndex: 0, bulletIndex: 1, value: "x" })).toBe(
      mergeKey({ type: "SET_EXPERIENCE_BULLET", expIndex: 0, bulletIndex: 1, value: "y" })
    );
  });

  it("oublie ce qui avait été annulé après une nouvelle modification", () => {
    const state = run([summary("A"), "UNDO", summary("B")]);
    expect(state.future).toEqual([]);
    expect(historyReducer(state, { type: "REDO" })).toBe(state);
  });

  it("ignore annuler et rétablir sans historique, et les actions sans effet", () => {
    const initial = initialHistory(buildCvData());
    expect(historyReducer(initial, { type: "UNDO" })).toBe(initial);
    expect(historyReducer(initial, { type: "REDO" })).toBe(initial);
    expect(historyReducer(initial, { type: "DO", action: { type: "MOVE_SECTION", section: "summary", column: "main", before: "summary" }, at: 0 })).toBe(initial);
  });

  it("garde au plus 100 étapes", () => {
    const steps = Array.from({ length: 120 }, (_, i): [CvAction, number] => [summary(`v${i}`), i * 2000]);
    expect(run(steps).past).toHaveLength(100);
  });
});
