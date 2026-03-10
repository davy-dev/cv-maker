"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { addSkill, deleteSkill } from "@/lib/actions/skills";
import type { SkillInput } from "@/lib/validators";

const CATEGORIES = [
  { value: "language", label: "Langage" },
  { value: "framework", label: "Framework" },
  { value: "tool", label: "Outil" },
  { value: "database", label: "Base de données" },
  { value: "devops", label: "DevOps" },
  { value: "soft_skill", label: "Soft skill" },
  { value: "other", label: "Autre" },
];

const CATEGORY_LABELS: Record<string, string> = {
  language: "Langages",
  framework: "Frameworks",
  tool: "Outils",
  database: "Bases de données",
  devops: "DevOps",
  soft_skill: "Soft skills",
  other: "Autres",
};

const LEVEL_LABELS = ["", "Débutant", "Junior", "Intermédiaire", "Avancé", "Expert"];

interface Skill {
  id: string;
  name: string;
  category: string;
  level: number;
  yearsOfExperience: number | null;
}

interface SkillsManagerProps {
  initialData: Skill[];
}

export function SkillsManager({ initialData }: SkillsManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Group skills by category
  const grouped = initialData.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill);
    return acc;
  }, {});

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    const data: SkillInput = {
      name: fd.get("name") as string,
      category: fd.get("category") as SkillInput["category"],
      level: parseInt(fd.get("level") as string, 10),
      yearsOfExperience: fd.get("years")
        ? parseFloat(fd.get("years") as string)
        : undefined,
    };

    const result = await addSkill(data);
    setSaving(false);
    if (result.success) {
      setShowForm(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette compétence ?")) return;
    await deleteSkill(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes compétences</h1>
          <p className="text-sm text-gray-500 mt-1">
            {initialData.length} compétence{initialData.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Annuler" : "Ajouter une compétence"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="name" label="Nom" placeholder="ex: React" required />
                <Select
                  name="category"
                  label="Catégorie"
                  options={CATEGORIES}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  name="level"
                  label="Niveau"
                  options={[1, 2, 3, 4, 5].map((n) => ({
                    value: String(n),
                    label: `${n}/5 - ${LEVEL_LABELS[n]}`,
                  }))}
                />
                <Input
                  name="years"
                  label="Années d'expérience"
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="3.5"
                />
              </div>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Ajout..." : "Ajouter"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {Object.keys(grouped).length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          <p>Aucune compétence ajoutée.</p>
          <p className="text-sm mt-1">
            Ajoutez vos compétences pour que l&apos;IA puisse les matcher avec
            les offres d&apos;emploi.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([category, categorySkills]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {CATEGORY_LABELS[category] ?? category}
          </h3>
          <div className="flex flex-wrap gap-2">
            {categorySkills.map((skill) => (
              <div
                key={skill.id}
                className="group flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:border-red-200 transition-colors"
              >
                <span className="font-medium text-gray-900">{skill.name}</span>
                <Badge variant="secondary">
                  {skill.level}/5
                </Badge>
                {skill.yearsOfExperience != null && (
                  <span className="text-xs text-gray-400">
                    {skill.yearsOfExperience} an{skill.yearsOfExperience > 1 ? "s" : ""}
                  </span>
                )}
                <button
                  onClick={() => handleDelete(skill.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity ml-1"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
