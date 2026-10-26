"use client";

import type { CvDispatch } from "@/lib/cv/reducer";

/** Skills of one category, each removable. */
export function SkillCategoryFields({
  category,
  skills,
  dispatch,
}: {
  category: string;
  skills: string[];
  dispatch: CvDispatch;
}) {
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {skills.map((skill, skillIndex) => (
        <span
          key={skillIndex}
          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
        >
          {skill}
          <button
            onClick={() => dispatch({ type: "REMOVE_SKILL", category, skillIndex })}
            className="hover:text-red-600"
          >
            x
          </button>
        </span>
      ))}
    </div>
  );
}
