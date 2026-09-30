"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PhotoUploadProps {
  currentImage: string | null;
}

const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export function PhotoUpload({ currentImage }: PhotoUploadProps) {
  const [saved, setSaved] = useState<string | null>(currentImage);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again after an error
    if (!file) return;
    setError("");

    // Checked again on the server; this only gives immediate feedback
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Format non supporté : utilisez une image JPG, PNG, GIF ou WebP");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(`Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} Mo, max 2 Mo)`);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload/photo", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'upload");
        return;
      }
      setSaved(data.url);
      // Re-renders the server components, header avatar included
      router.refresh();
    } catch {
      setError("Erreur réseau : la photo n'a pas été enregistrée");
    } finally {
      setPreview(null);
      URL.revokeObjectURL(localPreview);
      setUploading(false);
    }
  }

  const displayed = preview ?? saved;

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
        {displayed ? (
          <img
            src={displayed}
            alt="Photo de profil"
            className={`w-full h-full object-cover ${uploading ? "opacity-50" : ""}`}
          />
        ) : (
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )}
      </div>
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Upload..." : "Changer la photo"}
        </Button>
        <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF ou WebP. Max 2 Mo.</p>
        {error && (
          <p role="alert" className="text-xs text-red-600 mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
