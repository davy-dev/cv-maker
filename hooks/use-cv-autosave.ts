"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveCvData } from "@/lib/actions/cv";
import type { CvData } from "@/types/cv";

export type AutosaveStatus = "saved" | "pending" | "saving" | "error";

/** What the server actions return: an error message when the save failed */
type SaveResult = { error?: string };

/**
 * Saves `data` a moment after the last edit. `flush` saves right away
 * (before leaving for a page that reads it from the database), and an edit
 * still waiting when the component unmounts is saved rather than lost.
 * Null data (a letter not generated yet) has nothing to save.
 */
export function useAutosave<T>(data: T | null, save: (data: T) => Promise<SaveResult>, delayMs = 1000) {
  // Edits are new objects from the reducer: comparing references is enough
  const [savedData, setSavedData] = useState(data);
  const [request, setRequest] = useState<"idle" | "saving" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(data);
  const lastSave = useRef(0);
  // The caller may pass a new function each render
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  const run = useCallback(async (snapshot: T) => {
    const saveId = ++lastSave.current;
    setRequest("saving");
    let ok = false;
    try {
      const result = await saveRef.current(snapshot);
      ok = !result.error;
    } catch (error) {
      console.error("Save failed:", error);
    }
    if (saveId !== lastSave.current) return; // a newer save owns the status
    if (ok) setSavedData(snapshot);
    setRequest(ok ? "idle" : "error");
  }, []);

  useEffect(() => {
    latest.current = data;
    if (data === savedData || data === null) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      run(data);
    }, delayMs);
  }, [data, savedData, delayMs, run]);

  useEffect(
    () => () => {
      if (timer.current && latest.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
        saveRef.current(latest.current);
      }
    },
    []
  );

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (latest.current !== null) await run(latest.current);
  }, [run]);

  const status: AutosaveStatus =
    request === "saving"
      ? "saving"
      : request === "error"
        ? "error"
        : data === savedData || data === null
          ? "saved"
          : "pending";
  return { status, flush };
}

/** The CV's autosave. */
export function useCvAutosave(cvId: string, data: CvData, delayMs = 1000) {
  return useAutosave(data, (snapshot) => saveCvData(cvId, snapshot), delayMs);
}
