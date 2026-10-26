"use client";

import { Button } from "@/components/ui/button";
import { ShowOnCvToggle } from "./show-on-cv-toggle";

/** Title row of one experience, education or project: show on the CV, or delete it. */
export function ItemHeader({
  title,
  hidden,
  onToggleHidden,
  onRemove,
  confirmRemove,
  toggleDisabled,
  toggleDisabledReason,
}: {
  title: string;
  hidden: boolean;
  onToggleHidden: () => void;
  onRemove: () => void;
  /** Question asked before deleting */
  confirmRemove: string;
  toggleDisabled?: boolean;
  toggleDisabledReason?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{title}</span>
      <div className="flex items-center gap-2">
        <ShowOnCvToggle
          label="Afficher"
          checked={!hidden}
          onChange={onToggleHidden}
          disabled={toggleDisabled}
          disabledReason={toggleDisabledReason}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm(confirmRemove)) onRemove();
          }}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
}
