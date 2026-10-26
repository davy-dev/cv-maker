"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_VARIANT, VARIANTS } from "@/lib/cv/variants";
import type { JobAnalysis } from "@/types/job";

const TEMPLATES = VARIANTS.map((v) => ({ value: v.id, label: v.label }));

export function JobOfferForm() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "analysis" | "generating">(
    "input"
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [cvId, setCvId] = useState("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [templateId, setTemplateId] = useState<string>(DEFAULT_VARIANT);

  async function handleAnalyze(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAnalyzing(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const jobOfferText = fd.get("jobOfferText") as string;
    const companyUrl = fd.get("companyUrl") as string;

    const res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobOfferText, companyUrl }),
    });

    const data = await res.json();
    setAnalyzing(false);

    if (!res.ok) {
      setError(data.error || "Erreur lors de l'analyse");
      return;
    }

    setCvId(data.cvId);
    setAnalysis(data.analysis);
    setStep("analysis");
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");

    const res = await fetch("/api/ai/generate-cv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvId, templateId }),
    });

    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      setError(data.error || "Erreur lors de la génération");
      return;
    }

    router.push(`/cv/${cvId}/studio`);
  }

  if (step === "analysis" && analysis) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Résultats de l&apos;analyse
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {analysis.jobTitle} - {analysis.company}
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Match Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Score de matching</p>
                <p className="text-4xl font-bold text-blue-600">
                  {analysis.matchScore}%
                </p>
              </div>
              <div
                className="w-20 h-20 rounded-full border-4 flex items-center justify-center"
                style={{
                  borderColor:
                    analysis.matchScore >= 70
                      ? "#16a34a"
                      : analysis.matchScore >= 50
                      ? "#eab308"
                      : "#dc2626",
                }}
              >
                <span className="text-lg font-bold">
                  {analysis.matchScore >= 70
                    ? "Bon"
                    : analysis.matchScore >= 50
                    ? "Moyen"
                    : "Faible"}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              {analysis.jobSummary}
            </p>
          </CardContent>
        </Card>

        {/* Matched Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Compétences correspondantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.matchedSkills.map((ms) => (
                <Badge
                  key={ms.skill}
                  variant={
                    ms.relevance === "high"
                      ? "success"
                      : ms.relevance === "medium"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {ms.skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Missing Skills */}
        {analysis.missingSkills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Compétences manquantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analysis.missingSkills.map((ms) => (
                  <div
                    key={ms.skill}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Badge
                      variant={
                        ms.importance === "required"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {ms.skill}
                    </Badge>
                    <span className="text-gray-500">{ms.suggestion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tailoring Advice */}
        <Card>
          <CardHeader>
            <CardTitle>Conseil de personnalisation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{analysis.tailoringAdvice}</p>
          </CardContent>
        </Card>

        {/* Generate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Select
                  label="Style"
                  options={TEMPLATES}
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                size="lg"
              >
                {generating
                  ? "Génération en cours..."
                  : "Générer le CV"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nouveau CV</h1>
        <p className="text-sm text-gray-500 mt-1">
          Collez l&apos;offre d&apos;emploi et l&apos;IA analysera la
          correspondance avec vos compétences.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleAnalyze} className="space-y-4">
        <Textarea
          name="jobOfferText"
          label="Offre d'emploi"
          placeholder="Collez ici le texte complet de l'offre d'emploi..."
          rows={12}
          required
        />

        <Input
          name="companyUrl"
          label="Site web de l'entreprise (optionnel)"
          placeholder="https://entreprise.com"
          type="url"
        />

        <Button type="submit" disabled={analyzing} size="lg">
          {analyzing
            ? "Analyse en cours..."
            : "Analyser l'offre"}
        </Button>
      </form>
    </div>
  );
}
