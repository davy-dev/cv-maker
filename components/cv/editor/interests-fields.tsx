"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CvDispatch } from "@/lib/cv/reducer";

export function InterestsFields({ interests, dispatch }: { interests: string[]; dispatch: CvDispatch }) {
  const [newInterest, setNewInterest] = useState("");
  const add = () => {
    if (!newInterest.trim()) return;
    dispatch({ type: "ADD_INTEREST", value: newInterest.trim() });
    setNewInterest("");
  };

  return (
    <>
      {interests.map((interest, index) => (
        <div key={index} className="flex gap-1">
          <Input
            value={interest}
            onChange={(e) => dispatch({ type: "SET_INTEREST", index, value: e.target.value })}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch({ type: "REMOVE_INTEREST", index })}
            className="shrink-0 text-red-400"
          >
            x
          </Button>
        </div>
      ))}
      <div className="flex gap-1">
        <Input
          placeholder="Nouvel intérêt"
          value={newInterest}
          onChange={(e) => setNewInterest(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
          className="flex-1"
        />
        <Button variant="ghost" size="sm" onClick={add}>
          + Ajouter
        </Button>
      </div>
    </>
  );
}
