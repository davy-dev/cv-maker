"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveCvData } from "@/lib/actions/cv";
import type { CvData } from "@/types/cv";

export type AutosaveStatus = "saved" | "pending" | "saving" | "error";

/**
 * Saves the CV a moment after the last edit. `flush` saves right away
 * (before leaving for a page that reads the CV from the database), and an
 * edit still waiting when the editor unmounts is saved rather than lost.
 */
export function useCvAutosave(cvId: string, data: CvData, delayMs = 1000) {
  // Edits are new objects from the reducer: comparing references is enough
  const [savedData, setSavedData] = useState(data);
  const [request, setRequest] = useState<"idle" | "saving" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(data);
  const lastSave = useRef(0);

  const save = useCallback(
    async (snapshot: CvData) => {
      const saveId = ++lastSave.current;
      setRequest("saving");
      let ok = false;
      try {
        const result = await saveCvData(cvId, snapshot);
        ok = !("error" in result);
      } catch (error) {
        console.error("CV save failed:", error);
      }
      if (saveId !== lastSave.current) return; // a newer save owns the status
      if (ok) setSavedData(snapshot);
      setRequest(ok ? "idle" : "error");
    },
    [cvId]
  );

  useEffect(() => {
    latest.current = data;
    if (data === savedData) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      save(data);
    }, delayMs);
  }, [data, savedData, delayMs, save]);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        saveCvData(cvId, latest.current);
      }
    },
    [cvId]
  );

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    await save(latest.current);
  }, [save]);

  const status: AutosaveStatus =
    request === "saving" ? "saving" : request === "error" ? "error" : data === savedData ? "saved" : "pending";
  return { status, flush };
}
