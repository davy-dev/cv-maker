import type { ComponentType } from "react";
import type { CoverLetterData, TemplateId } from "@/types/cv";

interface CoverLetterPreviewProps {
  data: CoverLetterData;
  templateId: TemplateId;
}

const templateComponents: Record<TemplateId, ComponentType<{ data: CoverLetterData }>> = {
  modern: ModernPreview,
  classic: ClassicPreview,
  minimalist: MinimalistPreview,
  elegant: ElegantPreview,
};

export function CoverLetterPreview({ data, templateId }: CoverLetterPreviewProps) {
  const Template = templateComponents[templateId] ?? ModernPreview;
  return <Template data={data} />;
}

// --- Modern Template (dark navy header bar, blue accents, sans-serif) ---
function ModernPreview({ data }: { data: CoverLetterData }) {
  return (
    <div
      className="bg-white shadow-lg text-[10px] leading-relaxed overflow-hidden flex flex-col"
      style={{ minHeight: "842px", aspectRatio: "210/297" }}
    >
      {/* Header bar */}
      <div className="px-6 py-4" style={{ backgroundColor: "#0f172a" }}>
        <h1 className="text-[14px] font-bold text-white tracking-wide">
          {data.senderName}
        </h1>
        <p className="text-[9px] text-blue-300 mt-0.5">{data.senderCity}</p>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-5 space-y-4">
        {/* Recipient block - right aligned */}
        <div className="text-right space-y-0.5">
          <p className="font-semibold text-[10px] text-gray-900">
            {data.recipient.companyName}
          </p>
          {data.recipient.contactName && (
            <p className="text-[9px] text-gray-700">{data.recipient.contactName}</p>
          )}
          {data.recipient.contactTitle && (
            <p className="text-[9px] text-gray-500">{data.recipient.contactTitle}</p>
          )}
          {data.recipient.address && (
            <p className="text-[9px] text-gray-500">{data.recipient.address}</p>
          )}
          {data.recipient.city && (
            <p className="text-[9px] text-gray-500">{data.recipient.city}</p>
          )}
        </div>

        {/* Date - right aligned */}
        <p className="text-right text-[9px] text-gray-500">
          {data.senderCity}, le {data.date}
        </p>

        {/* Subject */}
        <div className="border-l-[2px] border-[#2563eb] pl-3">
          <p className="font-bold text-[10px] text-gray-900">
            Objet : {data.subject}
          </p>
        </div>

        {/* Letter body */}
        <div className="space-y-3 text-[9px] text-gray-700 leading-relaxed text-justify">
          <p>{data.opening},</p>
          <p>{data.introduction}</p>
          <p>{data.motivation}</p>
          <p>{data.skillsMatch}</p>
          <p>{data.conclusion}</p>
          <p>{data.closing}</p>
        </div>

        {/* Signature - right aligned */}
        <div className="text-right pt-4">
          <p className="font-semibold text-[10px] text-gray-900">
            {data.senderName}
          </p>
        </div>
      </div>

      {/* Footer accent */}
      <div className="h-1" style={{ backgroundColor: "#2563eb" }} />
    </div>
  );
}

// --- Classic Template (serif fonts, centered elements, traditional gray borders) ---
function ClassicPreview({ data }: { data: CoverLetterData }) {
  return (
    <div
      className="bg-white shadow-lg text-[10px] text-gray-800 leading-relaxed overflow-hidden flex flex-col"
      style={{ minHeight: "842px", aspectRatio: "210/297" }}
    >
      {/* Body */}
      <div className="flex-1 px-8 py-6 space-y-4">
        {/* Sender block - top left */}
        <div className="space-y-0.5 border-b border-gray-300 pb-3">
          <h1 className="text-[14px] font-serif font-bold text-gray-900">
            {data.senderName}
          </h1>
          <p className="text-[9px] font-serif text-gray-500">{data.senderCity}</p>
        </div>

        {/* Recipient block - right aligned */}
        <div className="text-right space-y-0.5">
          <p className="font-serif font-semibold text-[10px] text-gray-900">
            {data.recipient.companyName}
          </p>
          {data.recipient.contactName && (
            <p className="font-serif text-[9px] text-gray-700">
              {data.recipient.contactName}
            </p>
          )}
          {data.recipient.contactTitle && (
            <p className="font-serif text-[9px] text-gray-500">
              {data.recipient.contactTitle}
            </p>
          )}
          {data.recipient.address && (
            <p className="font-serif text-[9px] text-gray-500">
              {data.recipient.address}
            </p>
          )}
          {data.recipient.city && (
            <p className="font-serif text-[9px] text-gray-500">
              {data.recipient.city}
            </p>
          )}
        </div>

        {/* Date - right aligned */}
        <p className="text-right font-serif text-[9px] text-gray-500 italic">
          {data.senderCity}, le {data.date}
        </p>

        {/* Subject */}
        <div className="border-b border-gray-300 pb-2">
          <p className="font-serif font-bold text-[10px] text-gray-900">
            Objet : {data.subject}
          </p>
        </div>

        {/* Letter body */}
        <div className="space-y-3 font-serif text-[9px] text-gray-700 leading-relaxed text-justify">
          <p>{data.opening},</p>
          <p>{data.introduction}</p>
          <p>{data.motivation}</p>
          <p>{data.skillsMatch}</p>
          <p>{data.conclusion}</p>
          <p>{data.closing}</p>
        </div>

        {/* Signature - right aligned */}
        <div className="text-right pt-6">
          <p className="font-serif font-semibold text-[10px] text-gray-900">
            {data.senderName}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 text-center py-1.5 px-8">
        <p className="font-serif text-[7px] text-gray-400">
          {data.senderName} - Lettre de motivation
        </p>
      </div>
    </div>
  );
}

// --- Minimalist Template (ultra-clean, light weight, lots of whitespace, subtle grays) ---
function MinimalistPreview({ data }: { data: CoverLetterData }) {
  return (
    <div
      className="bg-white shadow-lg text-[10px] text-gray-600 leading-relaxed overflow-hidden flex flex-col"
      style={{ minHeight: "842px", aspectRatio: "210/297" }}
    >
      {/* Body */}
      <div className="flex-1 px-8 py-8 space-y-5">
        {/* Sender block - top left */}
        <div className="space-y-0.5">
          <h1 className="text-[14px] font-light tracking-wider text-gray-900">
            {data.senderName}
          </h1>
          <p className="text-[8px] text-gray-400">{data.senderCity}</p>
        </div>

        {/* Recipient block - right aligned */}
        <div className="text-right space-y-0.5">
          <p className="font-medium text-[10px] text-gray-800">
            {data.recipient.companyName}
          </p>
          {data.recipient.contactName && (
            <p className="text-[9px] text-gray-500">{data.recipient.contactName}</p>
          )}
          {data.recipient.contactTitle && (
            <p className="text-[8px] text-gray-400">{data.recipient.contactTitle}</p>
          )}
          {data.recipient.address && (
            <p className="text-[8px] text-gray-400">{data.recipient.address}</p>
          )}
          {data.recipient.city && (
            <p className="text-[8px] text-gray-400">{data.recipient.city}</p>
          )}
        </div>

        {/* Date - right aligned */}
        <p className="text-right text-[8px] text-gray-400">
          {data.senderCity}, le {data.date}
        </p>

        {/* Subject */}
        <div>
          <p className="text-[7px] uppercase tracking-[0.2em] text-gray-400 mb-1">
            Objet
          </p>
          <p className="font-medium text-[10px] text-gray-800">{data.subject}</p>
        </div>

        {/* Letter body */}
        <div className="space-y-3 text-[9px] text-gray-600 leading-relaxed text-justify">
          <p>{data.opening},</p>
          <p>{data.introduction}</p>
          <p>{data.motivation}</p>
          <p>{data.skillsMatch}</p>
          <p>{data.conclusion}</p>
          <p>{data.closing}</p>
        </div>

        {/* Signature - right aligned */}
        <div className="text-right pt-6">
          <p className="font-light tracking-wider text-[10px] text-gray-800">
            {data.senderName}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Elegant Template (dark slate accents, blue accent elements, refined typography) ---
function ElegantPreview({ data }: { data: CoverLetterData }) {
  return (
    <div
      className="bg-white shadow-lg text-[10px] leading-relaxed overflow-hidden flex flex-col"
      style={{ minHeight: "842px", aspectRatio: "210/297" }}
    >
      {/* Header */}
      <div className="px-6 py-4" style={{ backgroundColor: "#0f172a" }}>
        <h1 className="text-[14px] font-bold text-white tracking-tight">
          {data.senderName}
        </h1>
        <p className="text-[9px] text-slate-400 mt-0.5">{data.senderCity}</p>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-5 space-y-4">
        {/* Recipient block - right aligned */}
        <div className="text-right space-y-0.5">
          <p className="font-semibold text-[10px] text-slate-800">
            {data.recipient.companyName}
          </p>
          {data.recipient.contactName && (
            <p className="text-[9px] text-slate-700">{data.recipient.contactName}</p>
          )}
          {data.recipient.contactTitle && (
            <p className="text-[9px] text-slate-500">{data.recipient.contactTitle}</p>
          )}
          {data.recipient.address && (
            <p className="text-[9px] text-slate-500">{data.recipient.address}</p>
          )}
          {data.recipient.city && (
            <p className="text-[9px] text-slate-500">{data.recipient.city}</p>
          )}
        </div>

        {/* Date - right aligned */}
        <p className="text-right text-[9px] text-slate-500">
          {data.senderCity}, le {data.date}
        </p>

        {/* Subject */}
        <div className="border-l-[2px] border-blue-500 pl-3">
          <p className="font-bold text-[10px] text-slate-800">
            Objet : {data.subject}
          </p>
        </div>

        {/* Letter body */}
        <div className="space-y-3 text-[9px] text-slate-600 leading-relaxed text-justify">
          <p>{data.opening},</p>
          <p>{data.introduction}</p>
          <p>{data.motivation}</p>
          <p>{data.skillsMatch}</p>
          <p>{data.conclusion}</p>
          <p>{data.closing}</p>
        </div>

        {/* Signature - right aligned */}
        <div className="text-right pt-4">
          <p className="font-semibold text-[10px] text-slate-800">
            {data.senderName}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-1.5" style={{ backgroundColor: "#0f172a" }}>
        <p className="text-[7px] text-slate-500">
          {data.senderName} - Lettre de motivation
        </p>
      </div>
    </div>
  );
}
