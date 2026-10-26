"use client";

/** Checkbox deciding whether a section or an item appears in the PDF. */
export function ShowOnCvToggle({
  checked,
  onChange,
  label = "Afficher sur le CV",
  disabled = false,
  disabledReason,
}: {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <label
      className={`flex items-center gap-2 text-sm text-gray-700 shrink-0 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
      title={disabled ? disabledReason : undefined}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  );
}
