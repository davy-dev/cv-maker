"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useDragReposition } from "@/hooks/use-drag-reposition";
import type { CvDispatch } from "@/lib/cv/reducer";
import type { CvData, ImagePosition } from "@/types/cv";

const TEMPLATE_DEFAULTS: Record<string, { bg: string; text: string }> = {
  modern: { bg: "#0f172a", text: "#ffffff" },
  classic: { bg: "#ffffff", text: "#1a1a1a" },
  minimalist: { bg: "#ffffff", text: "#222222" },
  elegant: { bg: "#0f172a", text: "#ffffff" },
  executive: { bg: "#000829", text: "#ffffff" },
};

/** Colors and background image of the CV header. */
export function BannerAppearanceFields({
  data,
  templateId,
  dispatch,
}: {
  data: CvData;
  /** Also the HTML templates' ids, not yet TemplateIds */
  templateId: string;
  dispatch: CvDispatch;
}) {
  const { headerBgColor: bgColor, headerTextColor: textColor, headerBgImage: bgImage } = data;
  const bgImagePosition = data.headerBgImagePosition ?? null;
  const onBgColorChange = (value: string | null) => dispatch({ type: "SET_HEADER_BG_COLOR", value });
  const onTextColorChange = (value: string | null) => dispatch({ type: "SET_HEADER_TEXT_COLOR", value });
  const onBgImageChange = (value: string | null) => dispatch({ type: "SET_HEADER_BG_IMAGE", value });
  const onBgImagePositionChange = (value: ImagePosition | null) =>
    dispatch({ type: "SET_HEADER_BG_IMAGE_POSITION", value });

  const defaults = TEMPLATE_DEFAULTS[templateId] || TEMPLATE_DEFAULTS.modern;
  const currentBg = bgColor || defaults.bg;
  const currentText = textColor || defaults.text;
  const fileRef = useRef<HTMLInputElement>(null);

  const effectivePosition = bgImagePosition ?? { x: 50, y: 50 };
  const { isDragging, position, handlers: dragHandlers } = useDragReposition({
    position: effectivePosition,
    onPositionChange: (pos) => onBgImagePositionChange(pos),
    enabled: !!bgImage,
  });

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      alert("Format non supporté. Utilisez une image JPEG ou PNG.");
      return;
    }
    if (file.size > 1 * 1024 * 1024) {
      alert("Image trop volumineuse (max 1 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => onBgImageChange(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div
        className="rounded-md px-4 py-3 text-sm relative overflow-hidden select-none"
        style={{
          backgroundColor: currentBg,
          color: currentText,
          backgroundImage: bgImage ? `url(${bgImage})` : undefined,
          backgroundSize: bgImage ? "cover" : undefined,
          backgroundPosition: bgImage ? `${position.x}% ${position.y}%` : undefined,
          backgroundRepeat: "no-repeat",
          cursor: bgImage ? (isDragging ? "grabbing" : "grab") : undefined,
          touchAction: bgImage ? "none" : undefined,
          minHeight: "80px",
        }}
        {...(bgImage ? dragHandlers : {})}
      >
        <p className="font-bold relative z-10">Aperçu du bandeau</p>
        <p className="text-xs opacity-80 relative z-10">email@exemple.com · 06 00 00 00 00 · Paris</p>
        {bgImage && !isDragging && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">
              Glissez pour repositionner
            </span>
          </div>
        )}
      </div>

      {/* Color pickers */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Couleur de fond
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentBg}
              onChange={(e) => onBgColorChange(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-xs text-gray-500 font-mono">{currentBg}</span>
            {bgColor && (
              <button
                onClick={() => onBgColorChange(null)}
                className="text-xs text-blue-600 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Couleur du texte
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentText}
              onChange={(e) => onTextColorChange(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <span className="text-xs text-gray-500 font-mono">{currentText}</span>
            {textColor && (
              <button
                onClick={() => onTextColorChange(null)}
                className="text-xs text-blue-600 hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Background image upload */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Image de fond du bandeau
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleImageUpload}
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            {bgImage ? "Changer l'image" : "Ajouter une image"}
          </Button>
          {bgImage && (
            <button
              onClick={() => onBgImageChange(null)}
              className="text-xs text-red-500 hover:underline"
            >
              Supprimer l&apos;image
            </button>
          )}
          {bgImage && bgImagePosition && (
            <button
              onClick={() => onBgImagePositionChange(null)}
              className="text-xs text-blue-600 hover:underline"
            >
              Recentrer l&apos;image
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG. Max 1 Mo.</p>
      </div>
    </div>
  );
}
