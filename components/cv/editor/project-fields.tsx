"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { CvDispatch } from "@/lib/cv/reducer";
import type { CvExperience, CvProject, ProjectDisplayMode, ProjectType } from "@/types/cv";
import { str } from "./utils";

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  personal: "Personnel",
  "open-source": "Open-source",
  freelance: "Freelance",
  hackathon: "Hackathon",
  academic: "Académique",
  "side-project": "Side-project",
};

const DISPLAY_MODE_LABELS: Record<ProjectDisplayMode, string> = {
  "projects-section": "Dans le bloc Projets",
  "under-experience": "Sous l'expérience liée",
};

/** Fields of one project. */
export function ProjectFields({
  project,
  index,
  experiences,
  dispatch,
}: {
  project: CvProject;
  index: number;
  experiences: CvExperience[];
  dispatch: CvDispatch;
}) {
  const [newTech, setNewTech] = useState("");
  const [newHighlight, setNewHighlight] = useState("");
  const [newLink, setNewLink] = useState({ label: "", url: "" });

  const setField = (field: keyof CvProject, value: string) =>
    dispatch({ type: "SET_PROJECT_FIELD", index, field, value });

  const addTech = () => {
    if (!newTech.trim()) return;
    dispatch({ type: "ADD_PROJECT_TECHNOLOGY", index, value: newTech.trim() });
    setNewTech("");
  };
  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    dispatch({ type: "ADD_PROJECT_HIGHLIGHT", index, value: newHighlight.trim() });
    setNewHighlight("");
  };
  const addLink = () => {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    dispatch({ type: "ADD_PROJECT_LINK", index, label: newLink.label.trim(), url: newLink.url.trim() });
    setNewLink({ label: "", url: "" });
  };

  return (
    <>
      {/* Identité */}
      <div className="grid gap-2 sm:grid-cols-2">
        <Input label="Nom du projet" value={project.name} onChange={(e) => setField("name", e.target.value)} />
        <Select
          label="Type de projet"
          options={Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
          value={project.type}
          onChange={(e) => setField("type", e.target.value)}
        />
      </div>

      {/* Contexte */}
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          label="Rôle"
          placeholder="ex: Lead technique, Initiateur"
          value={project.role}
          onChange={(e) => setField("role", e.target.value)}
        />
        <Input
          label="URL principale (optionnel)"
          value={str(project.url)}
          placeholder="https://..."
          onChange={(e) => setField("url", e.target.value)}
        />
      </div>

      <Textarea
        label="Motivation / Contexte"
        placeholder="Pourquoi ce projet a-t-il été initié ?"
        value={project.motivation}
        rows={2}
        onChange={(e) => setField("motivation", e.target.value)}
      />

      <Textarea
        label="Description"
        value={project.description}
        rows={2}
        onChange={(e) => setField("description", e.target.value)}
      />

      {/* Technologies */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Technologies</label>
        <div className="flex flex-wrap gap-1">
          {project.technologies.map((tech, techIndex) => (
            <span
              key={techIndex}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
            >
              {tech}
              <button
                onClick={() => dispatch({ type: "REMOVE_PROJECT_TECHNOLOGY", projectIndex: index, techIndex })}
                className="hover:text-red-600"
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            placeholder="Nouvelle technologie"
            value={newTech}
            onChange={(e) => setNewTech(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newTech.trim()) {
                e.preventDefault();
                addTech();
              }
            }}
            className="flex-1"
          />
          <Button variant="ghost" size="sm" onClick={addTech}>
            + Ajouter
          </Button>
        </div>
      </div>

      {/* Highlights techniques */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Points clés techniques</label>
        <div className="flex flex-wrap gap-1">
          {project.highlights.map((highlight, highlightIndex) => (
            <span
              key={highlightIndex}
              className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs text-green-700"
            >
              {highlight}
              <button
                onClick={() => dispatch({ type: "REMOVE_PROJECT_HIGHLIGHT", projectIndex: index, highlightIndex })}
                className="hover:text-red-600"
              >
                x
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            placeholder="Défi technique résolu..."
            value={newHighlight}
            onChange={(e) => setNewHighlight(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newHighlight.trim()) {
                e.preventDefault();
                addHighlight();
              }
            }}
            className="flex-1"
          />
          <Button variant="ghost" size="sm" onClick={addHighlight}>
            + Ajouter
          </Button>
        </div>
      </div>

      <Textarea
        label="Impact / Résultats mesurables"
        placeholder="ex: Réduction de 40% du temps de traitement, 500+ utilisateurs"
        value={project.impact}
        rows={2}
        onChange={(e) => setField("impact", e.target.value)}
      />

      {/* Liens multiples */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Liens</label>
        {project.links.map((link, linkIndex) => (
          <div key={linkIndex} className="flex gap-1">
            <Input
              placeholder="Label (ex: Repo, Démo)"
              value={link.label}
              onChange={(e) =>
                dispatch({ type: "SET_PROJECT_LINK_FIELD", projectIndex: index, linkIndex, field: "label", value: e.target.value })
              }
              className="w-1/3"
            />
            <Input
              placeholder="https://..."
              value={link.url}
              onChange={(e) =>
                dispatch({ type: "SET_PROJECT_LINK_FIELD", projectIndex: index, linkIndex, field: "url", value: e.target.value })
              }
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch({ type: "REMOVE_PROJECT_LINK", projectIndex: index, linkIndex })}
              className="shrink-0 text-red-400"
            >
              x
            </Button>
          </div>
        ))}
        <div className="flex gap-1">
          <Input
            placeholder="Label"
            value={newLink.label}
            onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
            className="w-1/3"
          />
          <Input
            placeholder="https://..."
            value={newLink.url}
            onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newLink.label.trim() && newLink.url.trim()) {
                e.preventDefault();
                addLink();
              }
            }}
            className="flex-1"
          />
          <Button variant="ghost" size="sm" onClick={addLink}>
            + Ajouter
          </Button>
        </div>
      </div>

      {/* Lien expérience */}
      <div className="space-y-2 rounded-md bg-gray-50 p-3">
        <label className="text-sm font-medium text-gray-700">Lier à une expérience (optionnel)</label>
        <Select
          options={[
            { value: "", label: "Aucune expérience liée" },
            ...experiences.map((exp) => ({
              value: exp.id,
              label: `${exp.position}${exp.company ? ` — ${exp.company}` : ""}`,
            })),
          ]}
          value={project.linkedExperienceId ?? ""}
          onChange={(e) => setField("linkedExperienceId", e.target.value || "")}
        />
        {project.linkedExperienceId && (
          <Select
            label="Mode d'affichage"
            options={Object.entries(DISPLAY_MODE_LABELS).map(([value, label]) => ({ value, label }))}
            value={project.displayMode}
            onChange={(e) => setField("displayMode", e.target.value)}
          />
        )}
      </div>
    </>
  );
}
