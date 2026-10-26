import { cn } from "@/lib/utils";
import { type TextareaHTMLAttributes, forwardRef, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    // Without an id from the caller, the label would not name the field
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            "flex min-h-[80px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-y",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
