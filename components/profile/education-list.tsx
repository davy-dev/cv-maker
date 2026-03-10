"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  addEducation,
  updateEducation,
  deleteEducation,
} from "@/lib/actions/profile";
import type { EducationInput } from "@/lib/validators";

interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
}

interface EducationListProps {
  initialData: EducationItem[];
}

export function EducationList({ initialData }: EducationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function getFormData(fd: FormData): EducationInput {
    return {
      institution: fd.get("institution") as string,
      degree: fd.get("degree") as string,
      field: fd.get("field") as string,
      startDate: fd.get("startDate") as string,
      endDate: (fd.get("endDate") as string) || undefined,
      description: (fd.get("description") as string) || undefined,
    };
  }

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const data = getFormData(new FormData(e.currentTarget));
    const result = await addEducation(data);
    setSaving(false);
    if (result.success) {
      setShowForm(false);
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setSaving(true);
    const data = getFormData(new FormData(e.currentTarget));
    const result = await updateEducation(id, data);
    setSaving(false);
    if (result.success) {
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette formation ?")) return;
    await deleteEducation(id);
  }

  function renderForm(
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void,
    submitLabel: string,
    defaults?: EducationItem
  ) {
    return (
      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          name="institution"
          label="Établissement"
          defaultValue={defaults?.institution}
          required
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            name="degree"
            label="Diplôme"
            defaultValue={defaults?.degree}
            required
          />
          <Input
            name="field"
            label="Domaine"
            defaultValue={defaults?.field}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            name="startDate"
            label="Date de début"
            placeholder="2018"
            defaultValue={defaults?.startDate}
            required
          />
          <Input
            name="endDate"
            label="Date de fin"
            placeholder="2022"
            defaultValue={defaults?.endDate ?? ""}
          />
        </div>
        <Textarea
          name="description"
          label="Description (optionnel)"
          rows={2}
          defaultValue={defaults?.description ?? ""}
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
        <h3 className="text-lg font-semibold text-gray-900">Formations</h3>
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
            {renderForm(handleAdd, "Ajouter la formation")}
          </CardContent>
        </Card>
      )}

      {initialData.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 py-4 text-center">
          Aucune formation ajoutée.
        </p>
      )}

      {initialData.map((edu) => (
        <Card key={edu.id}>
          <CardContent className="p-4">
            {editingId === edu.id ? (
              renderForm(
                (e) => handleUpdate(e, edu.id),
                "Enregistrer",
                edu
              )
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {edu.degree} - {edu.field}
                    </p>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {edu.startDate} - {edu.endDate ?? "En cours"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(edu.id);
                        setShowForm(false);
                      }}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDelete(edu.id)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
                {edu.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {edu.description}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
