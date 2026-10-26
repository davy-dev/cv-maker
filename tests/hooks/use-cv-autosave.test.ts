import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { saveCvData } from "@/lib/actions/cv";
import { useCvAutosave } from "@/hooks/use-cv-autosave";
import { buildCvData } from "../helpers/fixtures";
import type { CvData } from "@/types/cv";

vi.mock("@/lib/actions/cv", () => ({ saveCvData: vi.fn() }));

const initial = buildCvData();
const edited = { ...initial, summary: "Nouveau résumé" };

function setup() {
  return renderHook(({ data }: { data: CvData }) => useCvAutosave("cv1", data), {
    initialProps: { data: initial },
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(saveCvData).mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useCvAutosave", () => {
  it("n'enregistre rien tant que le CV n'est pas modifié", () => {
    const { result } = setup();
    act(() => vi.advanceTimersByTime(5000));

    expect(result.current.status).toBe("saved");
    expect(saveCvData).not.toHaveBeenCalled();
  });

  it("enregistre une seconde après la dernière modification", async () => {
    const { result, rerender } = setup();

    rerender({ data: edited });
    expect(result.current.status).toBe("pending");
    act(() => vi.advanceTimersByTime(500));
    const again = { ...edited, summary: "Encore" };
    rerender({ data: again });
    act(() => vi.advanceTimersByTime(999));
    expect(saveCvData).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(saveCvData).toHaveBeenCalledTimes(1);
    expect(saveCvData).toHaveBeenCalledWith("cv1", again);
    expect(result.current.status).toBe("saved");
  });

  it("signale un échec d'enregistrement", async () => {
    vi.mocked(saveCvData).mockResolvedValue({ error: "CV non trouvé" });
    const { result, rerender } = setup();

    rerender({ data: edited });
    await act(() => vi.advanceTimersByTimeAsync(1000));

    expect(result.current.status).toBe("error");
  });

  it("flush enregistre tout de suite, sans second enregistrement ensuite", async () => {
    const { result, rerender } = setup();

    rerender({ data: edited });
    await act(() => result.current.flush());
    expect(saveCvData).toHaveBeenCalledWith("cv1", edited);
    expect(result.current.status).toBe("saved");

    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(saveCvData).toHaveBeenCalledTimes(1);
  });

  it("enregistre une modification en attente quand l'éditeur se ferme", () => {
    const { rerender, unmount } = setup();

    rerender({ data: edited });
    unmount();

    expect(saveCvData).toHaveBeenCalledWith("cv1", edited);
  });
});
