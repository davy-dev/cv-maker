"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { fieldKey, type CvField } from "@/lib/cv/fields";
import { RichText } from "./rich-text";

export type FinishReason = "commit" | "cancel" | "enter" | "delete-empty";

/** Given by the studio; absent when printing, where text is just text. */
export interface EditingApi {
  /** The field being typed into, if any */
  editing: CvField | null;
  /** Where the double-click was, to put the caret there */
  caretPoint: { x: number; y: number } | null;
  onInput: (field: CvField, value: string) => void;
  onFinish: (field: CvField, reason: FinishReason, value: string) => void;
}

export const EditingContext = createContext<EditingApi | null>(null);

interface EditableProps {
  field: CvField;
  /** The stored text, **bold** markers included */
  value: string;
  /** What to show when not editing; defaults to the value */
  display?: React.ReactNode;
  /** Renders **bold** markers */
  rich?: boolean;
  /** Shown in the studio when the value is empty; without it, nothing is shown */
  placeholder?: string;
}

/**
 * A piece of CV text. In the studio a double-click on it (handled by the canvas,
 * through data-field) turns it into an editable span in place.
 */
export function Editable({ field, value, display, rich = false, placeholder }: EditableProps) {
  const api = useContext(EditingContext);
  const shown = display ?? (rich ? <RichText text={value} /> : value);
  if (!api) return value ? <>{shown}</> : null;

  const key = fieldKey(field);
  if (api.editing && fieldKey(api.editing) === key) {
    return <EditingSpan field={field} initialValue={value} api={api} fieldKeyValue={key} />;
  }
  if (!value && !placeholder) return null;
  return (
    <span data-field={key} data-placeholder={value ? undefined : "true"}>
      {value ? shown : placeholder}
    </span>
  );
}

/**
 * Shows its children when the value is filled, or while that field is being
 * edited: a contact emptied while typing keeps its place until done.
 */
export function WhenFilled({
  field,
  value,
  children,
}: {
  field: CvField;
  value: string | null | undefined;
  children: React.ReactNode;
}) {
  const api = useContext(EditingContext);
  const editing = api?.editing ? fieldKey(api.editing) === fieldKey(field) : false;
  return value || editing ? <>{children}</> : null;
}

/**
 * The text being typed. React never renders its content: it is filled once when
 * editing starts, so updating the CV on each keystroke never moves the caret.
 */
function EditingSpan({
  field,
  initialValue,
  api,
  fieldKeyValue,
}: {
  field: CvField;
  initialValue: string;
  api: EditingApi;
  fieldKeyValue: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const span = ref.current!;
    span.textContent = initialValue;
    span.focus();
    placeCaret(span, api.caretPoint);
    // Only when editing starts: later values come from this very span
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const text = () => (ref.current?.textContent ?? "").replace(/\s*\n\s*/g, " ");

  return (
    <span
      ref={ref}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label="Texte du CV"
      data-field={fieldKeyValue}
      data-editing="true"
      style={{ userSelect: "text", cursor: "text", minWidth: "1ch", display: "inline-block" }}
      onInput={() => api.onInput(field, text())}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          api.onFinish(field, "enter", text());
        } else if (e.key === "Escape") {
          e.preventDefault();
          api.onFinish(field, "cancel", text());
        } else if (e.key === "Backspace" && text() === "") {
          e.preventDefault();
          api.onFinish(field, "delete-empty", "");
        }
      }}
      onBlur={() => api.onFinish(field, "commit", text())}
    />
  );
}

/** Puts the caret where the user double-clicked, or at the end. */
function placeCaret(element: HTMLElement, point: { x: number; y: number } | null) {
  const selection = window.getSelection();
  if (!selection) return;
  let range: Range | null = null;
  if (point && document.caretRangeFromPoint) {
    const hit = document.caretRangeFromPoint(point.x, point.y);
    if (hit && element.contains(hit.startContainer)) range = hit;
  }
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
  }
  selection.removeAllRanges();
  selection.addRange(range);
}
