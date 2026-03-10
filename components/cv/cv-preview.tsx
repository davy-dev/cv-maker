import type { CvData, CvProject, TemplateId, ProjectType } from "@/types/cv";
import Image from "next/image";

function bgImageStyles(data: CvData): React.CSSProperties {
  if (!data.headerBgImage) return {};
  const pos = data.headerBgImagePosition ?? { x: 50, y: 50 };
  return {
    backgroundImage: `url(${data.headerBgImage})`,
    backgroundSize: "cover",
    backgroundPosition: `${pos.x}% ${pos.y}%`,
    backgroundRepeat: "no-repeat",
  };
}

const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  personal: "Personnel",
  "open-source": "Open-source",
  freelance: "Freelance",
  hackathon: "Hackathon",
  academic: "Académique",
  "side-project": "Side-project",
};

function getProjectsForSection(data: CvData): CvProject[] {
  return data.projects.filter(
    (p) => !p.displayMode || p.displayMode === "projects-section"
  );
}

function getProjectsForExperience(data: CvData, experienceId: string): CvProject[] {
  return data.projects.filter(
    (p) => p.displayMode === "under-experience" && p.linkedExperienceId === experienceId
  );
}

function getLinkedCompanyName(data: CvData, project: CvProject): string | null {
  if (!project.linkedExperienceId) return null;
  const exp = data.experience.find((e) => e.id === project.linkedExperienceId);
  return exp?.company ?? null;
}

function IconEmail({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "w-[8px] h-[8px]"}>
      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
      <path d="M19 8.839l-7.831 3.916a2.75 2.75 0 01-2.338 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
    </svg>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "w-[8px] h-[8px]"}>
      <path d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 006.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 011.767-1.052l3.223.716A1.5 1.5 0 0118 15.352V16.5a1.5 1.5 0 01-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 012.43 8.326 13.019 13.019 0 012 5V3.5z" />
    </svg>
  );
}

function IconLocation({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "w-[8px] h-[8px]"}>
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
  );
}

// --- Section icons ---
function IconSummary({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "w-[10px] h-[10px]"}>
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );
}

function IconExperience({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "w-[10px] h-[10px]"}>
      <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-1a1 1 0 00-1 1v1h2V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function IconProjects({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "w-[10px] h-[10px]"}>
      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

function IconSkills({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "w-[10px] h-[10px]"}>
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

function IconEducation({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "w-[10px] h-[10px]"}>
      <path fillRule="evenodd" d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" clipRule="evenodd" />
    </svg>
  );
}

function IconInterests({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? "w-[10px] h-[10px]"}>
      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
  );
}

interface CvPreviewProps {
  data: CvData;
  templateId: TemplateId;
}

const templateComponents: Record<TemplateId, React.ComponentType<{ data: CvData }>> = {
  modern: ModernPreview,
  classic: ClassicPreview,
  minimalist: MinimalistPreview,
  elegant: ElegantPreview,
};

export function CvPreview({ data, templateId }: CvPreviewProps) {
  const Template = templateComponents[templateId] ?? ModernPreview;
  return <Template data={data} />;
}

// --- Modern Template (2-column with dark header, sidebar) ---
function ModernPreview({ data }: { data: CvData }) {
  const hBg = data.headerBgColor || "#0f172a";
  const hText = data.headerTextColor || "#ffffff";

  return (
    <div className="bg-white shadow-lg text-[10px] leading-relaxed overflow-hidden flex flex-col" style={{ minHeight: "842px", aspectRatio: "210/297" }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ backgroundColor: hBg, color: hText, ...bgImageStyles(data) }}>
        <div className="flex items-center gap-3">
          {data.showPhoto && (
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 bg-gray-600 shrink-0">
              {data.header.image ? (
                <Image src={data.header.image} alt="" width={56} height={56} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 text-lg font-bold">
                  {data.header.name?.[0] ?? "?"}
                </div>
              )}
            </div>
          )}
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-blue-300 tracking-wide">{data.header.title}</p>
            <h1 className="text-lg font-bold mt-0.5">{data.header.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[8px] text-gray-300">
              {data.header.email && <span className="flex items-center gap-1"><IconEmail /> {data.header.email}</span>}
              {data.header.phone && <span className="flex items-center gap-1"><IconPhone /> {data.header.phone}</span>}
              {data.header.location && <span className="flex items-center gap-1"><IconLocation /> {data.header.location}</span>}
              {data.header.linkedin && <span>LinkedIn</span>}
              {data.header.github && <span>GitHub</span>}
            </div>
          </div>
          {data.yearsExperience && (
            <div className="text-right shrink-0">
              <p className="text-[9px] text-gray-300 italic">{data.yearsExperience}</p>
            </div>
          )}
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Body: 2 columns */}
        <div className="flex overflow-hidden">
          {/* Main column */}
          <div className="flex-[2] px-4 py-3 space-y-3 overflow-hidden">
            {data.summary && (
              <div>
                <h2 className="flex items-center gap-1 text-[11px] font-bold text-[#1e3a5f] border-b-[1.5px] border-blue-600 pb-1 mb-1.5 w-fit"><IconSummary /> A propos</h2>
                <p className="text-[8px] text-gray-700 leading-relaxed text-justify">{data.summary}</p>
              </div>
            )}

            {data.experience.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[11px] font-bold text-[#1e3a5f] border-b-[1.5px] border-blue-600 pb-1 mb-2 w-fit"><IconExperience /> Experiences professionnelles</h2>
                <div className="space-y-2">
                  {data.experience.map((exp) => {
                    const linkedProjects = getProjectsForExperience(data, exp.id);
                    return (
                      <div key={exp.id} className="border-l-[1.5px] border-blue-200 pl-2">
                        <p className="font-bold text-[9.5px] text-gray-900">{exp.position}</p>
                        <div className="flex justify-between items-center mt-0.5 mb-1">
                          <span className="font-semibold text-[8px] text-gray-700">{exp.company}</span>
                          <span className="text-[7px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {exp.startDate} - {exp.endDate}{exp.location ? ` • ${exp.location}` : ""}
                          </span>
                        </div>
                        <ul className="space-y-0.5">
                          {exp.bullets.map((b, i) => (
                            <li key={i} className="relative pl-2 text-[8px] text-gray-700 before:content-['•'] before:absolute before:left-0 before:text-[#1e3a5f] before:font-bold">
                              {b}
                            </li>
                          ))}
                        </ul>
                        {linkedProjects.length > 0 && (
                          <div className="mt-1.5 ml-2 space-y-1">
                            {linkedProjects.map((project) => (
                              <div key={project.id} className="bg-blue-50/50 border border-blue-100 rounded p-1.5">
                                <div className="flex items-center gap-1">
                                  <IconProjects className="w-[7px] h-[7px] text-blue-400" />
                                  <span className="font-bold text-[8px] text-gray-800">{project.name}</span>
                                  {project.type && (
                                    <span className="text-[6px] text-blue-600 bg-blue-100 rounded px-0.5">{PROJECT_TYPE_LABELS[project.type]}</span>
                                  )}
                                </div>
                                {project.highlights?.length > 0 && (
                                  <ul className="mt-0.5">
                                    {project.highlights.map((h, i) => (
                                      <li key={i} className="text-[7px] text-gray-600 pl-2 relative before:content-['▸'] before:absolute before:left-0 before:text-blue-400">{h}</li>
                                    ))}
                                  </ul>
                                )}
                                {project.impact && <p className="text-[7px] text-blue-700 font-semibold mt-0.5">{project.impact}</p>}
                                <div className="flex flex-wrap gap-0.5 mt-0.5">
                                  {project.technologies.map((t, i) => (
                                    <span key={i} className="text-[6.5px] text-gray-600 bg-white border border-gray-200 rounded px-0.5">{t}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex-1 bg-gray-50 border-l border-gray-200 px-3 py-3 space-y-3 overflow-hidden">
            {Object.keys(data.skills).length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[10px] font-bold text-[#1e3a5f] border-b-[1.5px] border-blue-600 pb-1 mb-2 w-fit"><IconSkills /> Competences</h2>
                {Object.entries(data.skills).map(([cat, skills]) => (
                  <div key={cat} className="mb-2">
                    <p className="font-bold text-[8.5px] text-gray-900 mb-1">{cat}</p>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((skill, idx) => (
                        <span key={idx} className="text-[7.5px] text-gray-700 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">{skill}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.education.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[10px] font-bold text-[#1e3a5f] border-b-[1.5px] border-blue-600 pb-1 mb-2 w-fit"><IconEducation /> Formations</h2>
                {data.education.map((edu) => (
                  <div key={edu.id} className="border-l-[1.5px] border-blue-200 pl-2 mb-2">
                    <p className="font-bold text-[8.5px] text-gray-900 leading-tight">{edu.degree}</p>
                    <p className="text-[7.5px] text-gray-500 mt-0.5">{edu.institution}</p>
                    <p className="text-[7px] text-gray-400 font-semibold mt-0.5">
                      {edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.endDate || edu.startDate}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {data.interests && data.interests.length > 0 && (
              <div>
                <div className="bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-2">
                  <h3 className="flex items-center gap-1 text-[8px] font-bold text-amber-700 mb-1"><IconInterests className="w-[8px] h-[8px]" /> Centres d&apos;interets</h3>
                  {data.interests.map((interest, i) => (
                    <p key={i} className="text-[7.5px] text-amber-800 italic">{interest}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Projects — full-width */}
        {data.showProjects !== false && getProjectsForSection(data).length > 0 && (
          <div className="px-4 pt-1.5 pb-2 border-t border-gray-200">
            <h2 className="flex items-center gap-1 text-[11px] font-bold text-[#1e3a5f] border-b-[1.5px] border-blue-600 pb-1 mb-2 w-fit"><IconProjects /> Projets</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {getProjectsForSection(data).map((project) => {
                const company = getLinkedCompanyName(data, project);
                return (
                  <div key={project.id} className="bg-gray-50 border border-gray-200 rounded p-1.5 relative">
                    {project.type && (
                      <div className="flex justify-end mb-0.5">
                        <span className="text-[6.5px] text-blue-600 bg-blue-50 border border-blue-200 rounded px-1 py-0.5">{PROJECT_TYPE_LABELS[project.type]}</span>
                      </div>
                    )}
                    <p className="font-bold text-[9px] text-gray-900">{project.name}</p>
                    {(project.role || company) && (
                      <p className="text-[7.5px] text-gray-500 mt-0.5">
                        {project.role}{company ? ` — chez ${company}` : ""}
                      </p>
                    )}
                    <p className="text-[7.5px] text-gray-600 mt-0.5">{project.description}</p>
                    {project.highlights?.length > 0 && (
                      <ul className="mt-0.5 space-y-0.5">
                        {project.highlights.map((h, i) => (
                          <li key={i} className="relative pl-2 text-[7.5px] text-gray-600 before:content-['•'] before:absolute before:left-0 before:text-blue-500 before:font-bold">{h}</li>
                        ))}
                      </ul>
                    )}
                    {project.impact && <p className="text-[7.5px] text-blue-700 font-semibold mt-0.5">{project.impact}</p>}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.technologies.map((t, i) => (
                        <span key={i} className="text-[7px] text-gray-700 bg-white border border-gray-200 rounded px-1 py-0.5">{t}</span>
                      ))}
                    </div>
                    {project.links?.length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {project.links.map((link, i) => (
                          <span key={i} className="text-[7px] text-blue-600 underline">{link.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Classic Template (2-column with centered header) ---
function ClassicPreview({ data }: { data: CvData }) {
  const hBg = data.headerBgColor || "#ffffff";
  const hText = data.headerTextColor || "#1a1a1a";

  return (
    <div className="bg-white shadow-lg text-gray-800 text-[10px] leading-relaxed overflow-hidden flex flex-col" style={{ minHeight: "842px", aspectRatio: "210/297" }}>
      {/* Header - Centered */}
      <div className="text-center border-b-[1.5px] border-gray-800 pt-6 pb-3 px-8" style={{ backgroundColor: hBg, color: hText, ...bgImageStyles(data) }}>
        <h1 className="text-2xl font-serif font-bold" style={{ color: hText }}>{data.header.name}</h1>
        <p className="text-[11px] mt-1" style={{ color: `${hText}aa` }}>{data.header.title}</p>
        <div className="flex justify-center gap-4 mt-2 text-[9px] text-gray-500">
          {data.header.email && <span className="flex items-center gap-1"><IconEmail /> {data.header.email}</span>}
          {data.header.phone && <span className="flex items-center gap-1"><IconPhone /> {data.header.phone}</span>}
          {data.header.location && <span className="flex items-center gap-1"><IconLocation /> {data.header.location}</span>}
          {data.header.linkedin && <span>LinkedIn</span>}
          {data.header.github && <span>GitHub</span>}
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Body: 2 columns */}
        <div className="flex overflow-hidden">
          {/* Main column */}
          <div className="flex-[2] px-6 py-3 space-y-3 overflow-hidden">
            {data.summary && (
              <div>
                <h2 className="flex items-center gap-1 text-[10px] font-serif font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2"><IconSummary className="w-[9px] h-[9px]" /> Profil professionnel</h2>
                <p className="italic text-[9px] text-gray-600 leading-relaxed">{data.summary}</p>
              </div>
            )}

            {data.experience.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[10px] font-serif font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2"><IconExperience className="w-[9px] h-[9px]" /> Experience professionnelle</h2>
                {data.experience.map((exp) => {
                  const linkedProjects = getProjectsForExperience(data, exp.id);
                  return (
                    <div key={exp.id} className="mb-2.5">
                      <p className="font-bold text-[9.5px] text-gray-900">{exp.position}</p>
                      <div className="flex justify-between text-[8px] mt-0.5 mb-1">
                        <span className="italic text-gray-600">{exp.company}{exp.location ? ` - ${exp.location}` : ""}</span>
                        <span className="text-gray-500">{exp.startDate} - {exp.endDate}</span>
                      </div>
                      <ul className="pl-3 space-y-0.5">
                        {exp.bullets.map((b, i) => (
                          <li key={i} className="relative pl-2 text-[8px] text-gray-700 before:content-['–'] before:absolute before:left-0 before:text-gray-500">{b}</li>
                        ))}
                      </ul>
                      {linkedProjects.length > 0 && (
                        <div className="mt-1.5 ml-3 space-y-1">
                          {linkedProjects.map((project) => (
                            <div key={project.id} className="pl-2 border-l border-gray-300">
                              <p className="font-bold text-[8.5px] text-gray-800">{project.name}
                                {project.type && <span className="text-[6.5px] text-gray-500 font-normal ml-1">({PROJECT_TYPE_LABELS[project.type]})</span>}
                              </p>
                              {project.highlights?.length > 0 && (
                                <ul className="space-y-0.5 mt-0.5">
                                  {project.highlights.map((h, i) => (
                                    <li key={i} className="text-[7.5px] text-gray-600 pl-2 relative before:content-['–'] before:absolute before:left-0 before:text-gray-400">{h}</li>
                                  ))}
                                </ul>
                              )}
                              {project.impact && <p className="text-[7.5px] text-gray-800 font-semibold mt-0.5">{project.impact}</p>}
                              <p className="text-[7px] text-gray-500 italic mt-0.5">{project.technologies.join(" • ")}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex-1 border-l border-gray-200 px-4 py-3 space-y-3 overflow-hidden">
            {data.education.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[9px] font-serif font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2"><IconEducation className="w-[8px] h-[8px]" /> Formation</h2>
                {data.education.map((edu) => (
                  <div key={edu.id} className="mb-2">
                    <p className="font-bold text-[8.5px] text-gray-900">{edu.degree}{edu.field ? ` en ${edu.field}` : ""}</p>
                    <p className="text-[7.5px] text-gray-600 italic mt-0.5">{edu.institution}</p>
                    <p className="text-[7px] text-gray-500 mt-0.5">
                      {edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.endDate || edu.startDate}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(data.skills).length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[9px] font-serif font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2"><IconSkills className="w-[8px] h-[8px]" /> Competences</h2>
                {Object.entries(data.skills).map(([cat, skills]) => (
                  <div key={cat} className="mb-1.5">
                    <p className="font-bold text-[8px] text-gray-900">{cat}</p>
                    <p className="text-[7.5px] text-gray-600">{skills.join(" • ")}</p>
                  </div>
                ))}
              </div>
            )}

            {data.interests && data.interests.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[9px] font-serif font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2"><IconInterests className="w-[8px] h-[8px]" /> Centres d&apos;interet</h2>
                {data.interests.map((interest, i) => (
                  <p key={i} className="text-[8px] text-gray-600 italic">{interest}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Projects — full-width */}
        {data.showProjects !== false && getProjectsForSection(data).length > 0 && (
          <div className="px-6 pt-1.5 pb-2 border-t border-gray-300">
            <h2 className="flex items-center gap-1 text-[10px] font-serif font-bold uppercase tracking-wider text-gray-900 border-b border-gray-300 pb-1 mb-2"><IconProjects className="w-[9px] h-[9px]" /> Projets</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {getProjectsForSection(data).map((project) => {
                const company = getLinkedCompanyName(data, project);
                return (
                  <div key={project.id} className="pl-2 border-l border-gray-200">
                    {project.type && (
                      <div className="flex justify-end mb-0.5">
                        <span className="text-[7px] text-gray-500 font-normal">({PROJECT_TYPE_LABELS[project.type]})</span>
                      </div>
                    )}
                    <p className="font-bold text-[9px] text-gray-900">{project.name}</p>
                    {(project.role || company) && (
                      <p className="text-[7.5px] text-gray-500 mt-0.5">{project.role}{company ? ` — chez ${company}` : ""}</p>
                    )}
                    <p className="text-[8px] text-gray-600 mt-0.5">{project.description}</p>
                    {project.highlights?.length > 0 && (
                      <ul className="mt-0.5">
                        {project.highlights.map((h, i) => (
                          <li key={i} className="text-[7.5px] text-gray-600 pl-2 relative before:content-['–'] before:absolute before:left-0 before:text-gray-400">{h}</li>
                        ))}
                      </ul>
                    )}
                    {project.impact && <p className="text-[7.5px] text-gray-800 font-semibold mt-0.5">{project.impact}</p>}
                    <p className="text-[7.5px] text-gray-500 italic mt-0.5">{project.technologies.join(" • ")}</p>
                    {project.links?.length > 0 && (
                      <div className="flex gap-2 mt-0.5">
                        {project.links.map((link, i) => (
                          <span key={i} className="text-[7px] text-gray-600 underline">{link.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-300 text-center py-1.5 px-6">
        <p className="text-[7px] text-gray-400">{data.header.name} - {data.header.email}</p>
      </div>
    </div>
  );
}

// --- Elegant Template (2-column with dark header, sidebar, timeline) ---
function ElegantPreview({ data }: { data: CvData }) {
  const hBg = data.headerBgColor || "#0f172a";
  const hText = data.headerTextColor || "#ffffff";

  return (
    <div className="bg-white shadow-lg text-[10px] leading-relaxed overflow-hidden flex flex-col" style={{ minHeight: "842px" }}>
      {/* Header */}
      <div className="px-3 py-4" style={{ backgroundColor: hBg, color: hText, ...bgImageStyles(data) }}>
        <div className="flex items-center gap-3">
          {data.showPhoto && (
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/40 bg-gray-600 shrink-0">
              {data.header.image ? (
                <Image src={data.header.image} alt="" width={3134} height={1217} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60 text-lg font-bold">
                  {data.header.name?.[0] ?? "?"}
                </div>
              )}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-tight" style={{ color: hText }}>{data.header.name}</h1>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: `${hText}cc` }}>{data.header.title}</p>
            <div className="flex flex-wrap gap-3 mt-1.5 text-[8px]" style={{ color: `${hText}bb` }}>
              {data.header.email && <span className="flex items-center gap-1"><IconEmail /> {data.header.email}</span>}
              {data.header.phone && <span className="flex items-center gap-1"><IconPhone /> {data.header.phone}</span>}
              {data.header.location && <span className="flex items-center gap-1"><IconLocation /> {data.header.location}</span>}
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {data.header.linkedin && (
                <span className="text-[7px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${hText}22`, color: hText }}>LinkedIn</span>
              )}
              {data.header.github && (
                <span className="text-[7px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${hText}22`, color: hText }}>GitHub</span>
              )}
              {data.header.website && (
                <span className="text-[7px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${hText}22`, color: hText }}>Portfolio</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Body: 2 columns */}
        <div className="flex overflow-hidden">
          {/* Main column */}
          <div className="flex-[2] px-4 py-3 space-y-3 overflow-hidden">
            {data.summary && (
              <div>
                <h2 className="flex items-center gap-1 text-[11px] font-bold text-slate-800 border-b-[1.5px] border-blue-500 pb-1 mb-1.5 w-fit"><IconSummary /> A propos</h2>
                <p className="text-[8px] text-slate-600 leading-relaxed text-justify">{data.summary}</p>
              </div>
            )}

            {data.experience.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[11px] font-bold text-slate-800 border-b-[1.5px] border-blue-500 pb-1 mb-2 w-fit"><IconExperience /> Experience</h2>
                <div className="space-y-2">
                  {data.experience.map((exp) => {
                    const linkedProjects = getProjectsForExperience(data, exp.id);
                    return (
                      <div key={exp.id} className="border-l-[1.5px] border-blue-200 pl-2">
                        <p className="font-bold text-[9.5px] text-slate-800">{exp.position}</p>
                        <div className="flex justify-between items-center mt-0.5 mb-1">
                          <span className="font-semibold text-[8px] text-slate-700">{exp.company}</span>
                          <span className="text-[7px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {exp.startDate} - {exp.endDate}
                          </span>
                        </div>
                        <ul className="space-y-0.5">
                          {exp.bullets.map((b, i) => (
                            <li key={i} className="relative pl-2 text-[8px] text-slate-600 before:content-['•'] before:absolute before:left-0 before:text-blue-400 before:font-bold">
                              {b}
                            </li>
                          ))}
                        </ul>
                        {linkedProjects.length > 0 && (
                          <div className="mt-1.5 ml-2 space-y-1">
                            {linkedProjects.map((project) => (
                              <div key={project.id} className="bg-blue-50/30 border border-blue-100 rounded p-1.5">
                                <div className="flex items-center gap-1">
                                  <IconProjects className="w-[7px] h-[7px] text-blue-400" />
                                  <span className="font-bold text-[8px] text-slate-800">{project.name}</span>
                                  {project.type && (
                                    <span className="text-[6px] text-blue-600 bg-blue-100 rounded px-0.5">{PROJECT_TYPE_LABELS[project.type]}</span>
                                  )}
                                </div>
                                {project.highlights?.length > 0 && (
                                  <ul className="mt-0.5">
                                    {project.highlights.map((h, i) => (
                                      <li key={i} className="text-[7px] text-slate-600 pl-2 relative before:content-['▸'] before:absolute before:left-0 before:text-blue-400">{h}</li>
                                    ))}
                                  </ul>
                                )}
                                {project.impact && <p className="text-[7px] text-blue-700 font-semibold mt-0.5">{project.impact}</p>}
                                <div className="flex flex-wrap gap-0.5 mt-0.5">
                                  {project.technologies.map((t, i) => (
                                    <span key={i} className="text-[6.5px] text-slate-600 bg-white border border-slate-200 rounded px-0.5">{t}</span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex-1 bg-slate-50 border-l border-slate-200 px-3 py-3 space-y-3 overflow-hidden">
            {Object.keys(data.skills).length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[10px] font-bold text-slate-800 border-b-[1.5px] border-blue-500 pb-1 mb-2 w-fit"><IconSkills /> Competences</h2>
                {Object.entries(data.skills).map(([cat, skills]) => (
                  <div key={cat} className="mb-2">
                    <p className="font-bold text-[8.5px] text-slate-800 mb-1">{cat}</p>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((skill, idx) => (
                        <span key={idx} className="text-[7.5px] text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">{skill}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data.education.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[10px] font-bold text-slate-800 border-b-[1.5px] border-blue-500 pb-1 mb-2 w-fit"><IconEducation /> Formation</h2>
                {data.education.map((edu) => (
                  <div key={edu.id} className="border-l-[1.5px] border-blue-200 pl-2 mb-2">
                    <p className="font-bold text-[8.5px] text-slate-800 leading-tight">{edu.degree}</p>
                    <p className="text-[7.5px] text-slate-600 mt-0.5">{edu.institution}</p>
                    <p className="text-[7px] text-slate-400 font-semibold mt-0.5">
                      {edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.endDate || edu.startDate}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {data.interests && data.interests.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[10px] font-bold text-slate-800 border-b-[1.5px] border-blue-500 pb-1 mb-2 w-fit"><IconInterests /> Centres d&apos;interet</h2>
                <div className="flex flex-wrap gap-1">
                  {data.interests.map((interest, i) => (
                    <span key={i} className="text-[7.5px] text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">{interest}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Projects — full-width */}
        {data.showProjects !== false && getProjectsForSection(data).length > 0 && (
          <div className="px-4 pt-1.5 pb-2 border-t border-slate-200">
            <h2 className="flex items-center gap-1 text-[11px] font-bold text-slate-800 border-b-[1.5px] border-blue-500 pb-1 mb-2 w-fit"><IconProjects /> Projets</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {getProjectsForSection(data).map((project) => {
                const company = getLinkedCompanyName(data, project);
                return (
                  <div key={project.id} className="bg-slate-50 border border-slate-200 rounded p-1.5">
                    {project.type && (
                      <div className="flex justify-end mb-0.5">
                        <span className="text-[6.5px] text-blue-600 bg-blue-50 rounded px-0.5">{PROJECT_TYPE_LABELS[project.type]}</span>
                      </div>
                    )}
                    <p className="font-bold text-[9px] text-slate-800">{project.name}</p>
                    {(project.role || company) && (
                      <p className="text-[7px] text-slate-500 mt-0.5">{project.role}{company ? ` — chez ${company}` : ""}</p>
                    )}
                    <p className="text-[7.5px] text-slate-600 mt-0.5 mb-1">{project.description}</p>
                    {project.highlights?.length > 0 && (
                      <ul className="mb-1">
                        {project.highlights.map((h, i) => (
                          <li key={i} className="text-[7px] text-slate-600 pl-2 relative before:content-['•'] before:absolute before:left-0 before:text-blue-400">{h}</li>
                        ))}
                      </ul>
                    )}
                    {project.impact && <p className="text-[7px] text-blue-700 font-semibold mb-1">{project.impact}</p>}
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((t, i) => (
                        <span key={i} className="text-[7px] text-slate-600 bg-white border border-slate-200 rounded px-1 py-0.5">{t}</span>
                      ))}
                    </div>
                    {project.links?.length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {project.links.map((link, i) => (
                          <span key={i} className="text-[6.5px] text-blue-600 underline">{link.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-1.5" style={{ backgroundColor: hBg, ...bgImageStyles(data) }}>
        <p className="text-[7px]" style={{ color: `${hText}99` }}>{data.header.name} - CV {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

// --- Minimalist Template (2-column, clean) ---
function MinimalistPreview({ data }: { data: CvData }) {
  const hBg = data.headerBgColor || "#ffffff";
  const hText = data.headerTextColor || "#222222";

  return (
    <div className="bg-white shadow-lg text-[10px] text-gray-600 leading-relaxed overflow-hidden flex flex-col" style={{ minHeight: "842px", aspectRatio: "210/297" }}>
      {/* Header */}
      <div className="px-8 pt-6 pb-3 border-b border-gray-100" style={{ backgroundColor: hBg, color: hText, ...bgImageStyles(data) }}>
        <h1 className="text-xl font-light tracking-wider" style={{ color: hText }}>{data.header.name}</h1>
        <p className="text-[11px] mt-0.5" style={{ color: `${hText}99` }}>{data.header.title}</p>
        <div className="flex gap-3 mt-1.5 text-[8px]" style={{ color: `${hText}99` }}>
          {data.header.email && <span className="flex items-center gap-1"><IconEmail /> {data.header.email}</span>}
          {data.header.phone && <span className="flex items-center gap-1"><IconPhone /> {data.header.phone}</span>}
          {data.header.location && <span className="flex items-center gap-1"><IconLocation /> {data.header.location}</span>}
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Body: 2 columns */}
        <div className="flex overflow-hidden">
          {/* Main column */}
          <div className="flex-[2] px-6 py-3 space-y-3 overflow-hidden">
            {data.summary && (
              <p className="text-[9px] text-gray-500 leading-relaxed">{data.summary}</p>
            )}

            {data.experience.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[8px] uppercase tracking-[0.2em] text-gray-600 mb-2"><IconExperience className="w-[8px] h-[8px]" /> Experience</h2>
                {data.experience.map((exp) => {
                  const linkedProjects = getProjectsForExperience(data, exp.id);
                  return (
                    <div key={exp.id} className="mb-3">
                      <div className="flex justify-between items-baseline">
                        <span className="font-medium text-gray-900 text-[9.5px]">{exp.position}</span>
                        <span className="text-[7.5px] text-gray-400">{exp.startDate} - {exp.endDate}</span>
                      </div>
                      <p className="text-[8px] text-gray-400 mt-0.5 mb-1">{exp.company}</p>
                      <ul className="space-y-0.5">
                        {exp.bullets.map((b, i) => (
                          <li key={i} className="pl-2 border-l border-gray-200 text-[8px] text-gray-600">{b}</li>
                        ))}
                      </ul>
                      {linkedProjects.length > 0 && (
                        <div className="mt-1.5 ml-2 space-y-1">
                          {linkedProjects.map((project) => (
                            <div key={project.id} className="pl-2 border-l border-gray-300">
                              <p className="font-medium text-gray-800 text-[8.5px]">{project.name}
                                {project.type && <span className="text-[6.5px] text-gray-400 font-normal ml-1">({PROJECT_TYPE_LABELS[project.type]})</span>}
                              </p>
                              {project.highlights?.length > 0 && (
                                <ul className="mt-0.5">
                                  {project.highlights.map((h, i) => (
                                    <li key={i} className="pl-2 border-l border-gray-200 text-[7.5px] text-gray-600">{h}</li>
                                  ))}
                                </ul>
                              )}
                              {project.impact && <p className="text-[7.5px] text-gray-800 font-medium mt-0.5">{project.impact}</p>}
                              <p className="text-[7px] text-gray-400 mt-0.5">{project.technologies.join(" · ")}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex-1 border-l border-gray-100 px-4 py-3 space-y-3 overflow-hidden">
            {data.education.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[7.5px] uppercase tracking-[0.2em] text-gray-600 mb-2"><IconEducation className="w-[7px] h-[7px]" /> Formation</h2>
                {data.education.map((edu) => (
                  <div key={edu.id} className="mb-2">
                    <p className="font-medium text-gray-900 text-[8.5px]">{edu.degree}</p>
                    <p className="text-[7.5px] text-gray-400 mt-0.5">{edu.institution}</p>
                    <p className="text-[7px] text-gray-300 mt-0.5">
                      {edu.startDate && edu.endDate ? `${edu.startDate} - ${edu.endDate}` : edu.endDate || edu.startDate}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(data.skills).length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[7.5px] uppercase tracking-[0.2em] text-gray-600 mb-2"><IconSkills className="w-[7px] h-[7px]" /> Competences</h2>
                <div className="flex flex-wrap gap-1">
                  {Object.values(data.skills).flat().map((skill, i) => (
                    <span key={i} className="text-[7.5px] text-gray-600 border border-gray-200 rounded px-1.5 py-0.5">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {data.interests && data.interests.length > 0 && (
              <div>
                <h2 className="flex items-center gap-1 text-[7.5px] uppercase tracking-[0.2em] text-gray-600 mb-2"><IconInterests className="w-[7px] h-[7px]" /> Interets</h2>
                {data.interests.map((interest, i) => (
                  <p key={i} className="text-[8px] text-gray-500">{interest}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Projects — full-width */}
        {data.showProjects !== false && getProjectsForSection(data).length > 0 && (
          <div className="px-6 pt-1.5 pb-2 border-t border-gray-100">
            <h2 className="flex items-center gap-1 text-[8px] uppercase tracking-[0.2em] text-gray-600 mb-2"><IconProjects className="w-[8px] h-[8px]" /> Projets</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {getProjectsForSection(data).map((project) => {
                const company = getLinkedCompanyName(data, project);
                return (
                  <div key={project.id}>
                    {project.type && (
                      <div className="flex justify-end mb-0.5">
                        <span className="text-[7px] text-gray-400 font-normal">({PROJECT_TYPE_LABELS[project.type]})</span>
                      </div>
                    )}
                    <p className="font-medium text-gray-900 text-[9px]">{project.name}</p>
                    {(project.role || company) && (
                      <p className="text-[7.5px] text-gray-400 mt-0.5">{project.role}{company ? ` — chez ${company}` : ""}</p>
                    )}
                    <p className="text-[8px] text-gray-500 mt-0.5">{project.description}</p>
                    {project.highlights?.length > 0 && (
                      <ul className="mt-0.5">
                        {project.highlights.map((h, i) => (
                          <li key={i} className="pl-2 border-l border-gray-200 text-[7.5px] text-gray-600">{h}</li>
                        ))}
                      </ul>
                    )}
                    {project.impact && <p className="text-[7.5px] text-gray-800 font-medium mt-0.5">{project.impact}</p>}
                    <p className="text-[7.5px] text-gray-400 mt-0.5">{project.technologies.join(" · ")}</p>
                    {project.links?.length > 0 && (
                      <div className="flex gap-2 mt-0.5">
                        {project.links.map((link, i) => (
                          <span key={i} className="text-[7px] text-gray-500 underline">{link.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
