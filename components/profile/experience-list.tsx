"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  addExperience,
  updateExperience,
  deleteExperience,
} from "@/lib/actions/profile";
import type { WorkExperienceInput } from "@/lib/validators";

interface Experience {
  id: string;
  company: string;
  position: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  description: string | null;
  achievements: string | null;
  technologies: string | null;
}

interface ExperienceListProps {
  initialData: Experience[];
}

export function ExperienceList({ initialData }: ExperienceListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function getFormData(fd: FormData): WorkExperienceInput {
    return {
      company: fd.get("company") as string,
      position: fd.get("position") as string,
      location: (fd.get("location") as string) || undefined,
      startDate: fd.get("startDate") as string,
      endDate: (fd.get("endDate") as string) || undefined,
      description: (fd.get("description") as string) || undefined,
      achievements: (fd.get("achievements") as string)
        .split("\n")
        .filter(Boolean),
      technologies: (fd.get("technologies") as string)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const data = getFormData(new FormData(e.currentTarget));
    const result = await addExperience(data);
    setSaving(false);
    if (result.success) {
      setShowForm(false);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setSaving(true);
    const data = getFormData(new FormData(e.currentTarget));
    const result = await updateExperience(id, data);
    setSaving(false);
    if (result.success) {
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette expérience ?")) return;
    await deleteExperience(id);
  }

  function renderForm(
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
    submitLabel: string,
    defaults?: Experience
  ) {
    const achievements = defaults?.achievements
      ? (JSON.parse(defaults.achievements) as string[]).join("\n")
      : "";
    const technologies = defaults?.technologies
      ? (JSON.parse(defaults.technologies) as string[]).join(", ")
      : "";

    return (
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            name="company"
            label="Entreprise"
            defaultValue={defaults?.company}
            required
          />
          <Input
            name="position"
            label="Poste"
            defaultValue={defaults?.position}
            required
          />
        </div>
        <Input
          name="location"
          label="Localisation"
          defaultValue={defaults?.location ?? ""}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            name="startDate"
            label="Date de début"
            placeholder="2022-01"
            defaultValue={defaults?.startDate}
            required
          />
          <Input
            name="endDate"
            label="Date de fin"
            placeholder="Laisser vide si en cours"
            defaultValue={defaults?.endDate ?? ""}
          />
        </div>
        <Textarea
          name="description"
          label="Description"
          rows={2}
          defaultValue={defaults?.description ?? ""}
        />
        <Textarea
          name="achievements"
          label="Réalisations (une par ligne)"
          placeholder={"Augmentation du trafic de 30%\nMise en place du CI/CD"}
          rows={3}
          defaultValue={achievements}
        />
        <Input
          name="technologies"
          label="Technologies (séparées par des virgules)"
          placeholder="React, Node.js, PostgreSQL"
          defaultValue={technologies}
        />
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "Enregistrement..." : submitLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingId(null);
              setShowForm(false);
            }}
          >
            Annuler
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Expériences professionnelles
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
          }}
        >
          {showForm ? "Annuler" : "Ajouter"}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            {renderForm(handleAdd, "Ajouter l'expérience")}
          </CardContent>
        </Card>
      )}

      {initialData.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 py-4 text-center">
          Aucune expérience ajoutée.
        </p>
      )}

      {initialData.map((exp) => (
        <Card key={exp.id}>
          <CardContent className="p-4">
            {editingId === exp.id ? (
              renderForm(
                (e) => handleUpdate(e, exp.id),
                "Enregistrer",
                exp
              )
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {exp.position}
                    </p>
                    <p className="text-sm text-gray-600">
                      {exp.company}
                      {exp.location ? ` - ${exp.location}` : ""}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {exp.startDate} - {exp.endDate ?? "Présent"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(exp.id);
                        setShowForm(false);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(exp.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {exp.description}
                  </p>
                )}
                {exp.achievements && (
                  <ul className="mt-2 space-y-1">
                    {(JSON.parse(exp.achievements) as string[]).map((a, i) => (
                      <li
                        key={i}
                        className="text-sm text-gray-600 flex items-start gap-1"
                      >
                        <span className="text-gray-400 mt-0.5">-</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
                {exp.technologies && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(JSON.parse(exp.technologies) as string[]).map((t) => (
                      <span
                        key={t}
                        className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
