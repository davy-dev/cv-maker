"use client";

import { useReducer, useCallback, useRef, useEffect, useState } from "react";
import { saveCoverLetterData } from "@/lib/actions/cover-letter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoverLetterPreview } from "@/components/cover-letter/cover-letter-preview";
import { CoverLetterPdfDownloadButton } from "@/components/pdf/cover-letter-pdf-download-button";
import { coverLetterReducer, emptyCoverLetterData, type LetterAction as CoverLetterAction } from "@/lib/cv/letter";
import type { CoverLetterData, TemplateId } from "@/types/cv";

// --- Helpers ---

function str(value: string | null | undefined): string {
  return value ?? "";
}

// --- Main Editor ---

interface CoverLetterEditorProps {
  cvId: string;
  initialData: CoverLetterData | null;
  templateId: TemplateId;
}

export function CoverLetterEditor({
  cvId,
  initialData,
  templateId,
}: CoverLetterEditorProps) {
  const [data, dispatch] = useReducer(
    coverLetterReducer,
    initialData ?? emptyCoverLetterData
  );
  const [hasData, setHasData] = useState(initialData !== null);
  const [isGenerating, setIsGenerating] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced auto-save
  const scheduleAutoSave = useCallback(
    (coverLetterData: CoverLetterData) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveCoverLetterData(cvId, coverLetterData);
      }, 1000);
    },
    [cvId]
  );

  // Dispatch wrapper
  const update = useCallback((action: CoverLetterAction) => {
    dispatch(action);
  }, []);

  // Auto-save whenever data changes (only when editor is active)
  useEffect(() => {
    if (hasData) {
      scheduleAutoSave(data);
    }
  }, [data, hasData, scheduleAutoSave]);

  // --- Generate handler ---

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-cover-letter", {
        method: "POST",
        body: JSON.stringify({ cvId }),
      });
      const result = await response.json();
      if (result.error) {
        alert(result.error);
        return;
      }
      dispatch({ type: "REPLACE_ALL", data: result.coverLetterData });
      setHasData(true);
    } finally {
      setIsGenerating(false);
    }
  }

  // --- Empty state ---

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-xl font-semibold text-gray-800">
            Lettre de motivation
          </h2>
          <p className="text-gray-500">
            Générez automatiquement une lettre de motivation personnalisée à
            partir des informations de votre CV. Vous pourrez ensuite la modifier
            librement.
          </p>
        </div>
        <Button size="lg" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating
            ? "Génération en cours..."
            : "Générer la lettre de motivation"}
        </Button>
      </div>
    );
  }

  // --- Split-screen editor ---

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <span className="text-xs text-gray-400">Auto-save activé</span>
        <CoverLetterPdfDownloadButton
          data={data}
          templateId={templateId}
          fileName="lettre_de_motivation"
        />
      </div>

      {/* Split view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Form */}
        <div className="w-1/2 overflow-auto p-4 space-y-4 border-r border-gray-200">
          {/* Destinataire */}
          <Card>
            <CardHeader>
              <CardTitle>Destinataire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                label="Entreprise"
                value={str(data.recipient.companyName)}
                onChange={(e) =>
                  update({
                    type: "SET_RECIPIENT_FIELD",
                    field: "companyName",
                    value: e.target.value,
                  })
                }
              />
              <Input
                label="Nom du contact"
                value={str(data.recipient.contactName)}
                onChange={(e) =>
                  update({
                    type: "SET_RECIPIENT_FIELD",
                    field: "contactName",
                    value: e.target.value || null,
                  })
                }
              />
              <Input
                label="Titre du contact"
                value={str(data.recipient.contactTitle)}
                onChange={(e) =>
                  update({
                    type: "SET_RECIPIENT_FIELD",
                    field: "contactTitle",
                    value: e.target.value || null,
                  })
                }
              />
              <Input
                label="Adresse"
                value={str(data.recipient.address)}
                onChange={(e) =>
                  update({
                    type: "SET_RECIPIENT_FIELD",
                    field: "address",
                    value: e.target.value || null,
                  })
                }
              />
              <Input
                label="Ville"
                value={str(data.recipient.city)}
                onChange={(e) =>
                  update({
                    type: "SET_RECIPIENT_FIELD",
                    field: "city",
                    value: e.target.value || null,
                  })
                }
              />
            </CardContent>
          </Card>

          {/* En-tête de la lettre */}
          <Card>
            <CardHeader>
              <CardTitle>En-tête de la lettre</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                label="Ville de l'expéditeur"
                value={str(data.senderCity)}
                onChange={(e) =>
                  update({
                    type: "SET_FIELD",
                    field: "senderCity",
                    value: e.target.value,
                  })
                }
              />
              <Input
                label="Date"
                value={str(data.date)}
                onChange={(e) =>
                  update({
                    type: "SET_FIELD",
                    field: "date",
                    value: e.target.value,
                  })
                }
              />
              <Input
                label="Objet"
                value={str(data.subject)}
                onChange={(e) =>
                  update({
                    type: "SET_FIELD",
                    field: "subject",
                    value: e.target.value,
                  })
                }
              />
              <Input
                label="Formule d'ouverture"
                value={str(data.opening)}
                onChange={(e) =>
                  update({
                    type: "SET_FIELD",
                    field: "opening",
                    value: e.target.value,
                  })
                }
              />
            </CardContent>
          </Card>

          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={str(data.introduction)}
                rows={4}
                onChange={(e) =>
                  update({
                    type: "SET_FIELD",
                    field: "introduction",
                    value: e.target.value,
                  })
                }
              />
            </CardContent>
          </Card>

          {/* Motivation */}
          <Card>
            <CardHeader>
              <CardTitle>Motivation</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={str(data.motivation)}
                rows={4}
                onChange={(e) =>
                  update({
                    type: "SET_FIELD",
                    field: "motivation",
                    value: e.target.value,
                  })
                }
              />
            </CardContent>
          </Card>

          {/* Compétences */}
          <Card>
            <CardHeader>
              <CardTitle>Compétences</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={str(data.skillsMatch)}
                rows={4}
                onChange={(e) =>
                  update({
                    type: "SET_FIELD",
                    field: "skillsMatch",
                    value: e.target.value,
                  })
                }
              />
            </CardContent>
          </Card>

          {/* Conclusion */}
          <Card>
            <CardHeader>
              <CardTitle>Conclusion</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={str(data.conclusion)}
                rows={4}
                onChange={(e) =>
                  update({
                    type: "SET_FIELD",
                    field: "conclusion",
                    value: e.target.value,
                  })
                }
              />
            </CardContent>
          </Card>

          {/* Signature */}
          <Card>
            <CardHeader>
              <CardTitle>Signature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                label="Formule de politesse"
                value={str(data.closing)}
                rows={2}
                onChange={(e) =>
                  update({
                    type: "SET_FIELD",
                    field: "closing",
                    value: e.target.value,
                  })
                }
              />
              <Input
                label="Nom de l'expéditeur"
                value={str(data.senderName)}
                onChange={(e) =>
                  update({
                    type: "SET_FIELD",
                    field: "senderName",
                    value: e.target.value,
                  })
                }
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="w-1/2 overflow-auto bg-gray-100 p-4">
          <CoverLetterPreview data={data} templateId={templateId} />
        </div>
      </div>
    </div>
  );
}
