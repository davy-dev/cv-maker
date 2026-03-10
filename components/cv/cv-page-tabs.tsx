"use client";

import { useState } from "react";
import { CvEditor } from "@/components/cv/cv-editor";
import { CoverLetterEditor } from "@/components/cover-letter/cover-letter-editor";
import type { CvData, CoverLetterData, TemplateId } from "@/types/cv";

type ActiveTab = "cv" | "cover-letter";

interface CvPageTabsProps {
  cvId: string;
  initialCvData: CvData;
  initialTemplateId: TemplateId;
  initialCoverLetterData: CoverLetterData | null;
}

const tabLabels: Record<ActiveTab, string> = {
  cv: "CV",
  "cover-letter": "Lettre de motivation",
};

export function CvPageTabs({
  cvId,
  initialCvData,
  initialTemplateId,
  initialCoverLetterData,
}: CvPageTabsProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("cv");

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 bg-white">
        {(["cv", "cover-letter"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "cv" && (
          <CvEditor
            cvId={cvId}
            initialData={initialCvData}
            initialTemplateId={initialTemplateId}
          />
        )}
        {activeTab === "cover-letter" && (
          <CoverLetterEditor
            cvId={cvId}
            initialData={initialCoverLetterData}
            templateId={initialTemplateId}
          />
        )}
      </div>
    </div>
  );
}
