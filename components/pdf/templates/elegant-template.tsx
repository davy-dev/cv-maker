"use client";

import {
  Document,
  Page,
  View,
  Text,
  Link,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CvData, CvProject, ProjectType } from "@/types/cv";
import { EmailIcon, PhoneIcon, LocationIcon, SummaryIcon, ExperienceIcon, ProjectsIcon, SkillsIcon, EducationIcon, InterestsIcon } from "@/components/pdf/icons";
import { toImageSrc } from "@/components/pdf/image-utils";

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

const colors = {
  headerBg: "#0f172a",
  blue500: "#3b82f6",
  blue400: "#60a5fa",
  blue200: "#bfdbfe",
  blue700: "#1d4ed8",
  white: "#ffffff",
  slate50: "#f8fafc",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1e293b",
  slate900: "#0f172a",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: colors.slate700,
    backgroundColor: colors.white,
  },

  // Header — px-3 py-4 gap-3
  header: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  // w-14 h-14 rounded-full border-2 border-white/40
  photoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.slate700,
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitial: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerContent: { flex: 1 },
  // text-lg font-bold tracking-tight
  headerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.white,
    letterSpacing: -0.45,
  },
  // text-[11px] font-medium mt-0.5
  headerTitle: {
    fontSize: 11,
    color: colors.slate300,
    marginTop: 2,
  },
  // gap-3 mt-1.5 text-[8px]
  contactRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
  },
  // text-[8px]
  contactItem: { fontSize: 8 },
  // gap-1
  contactItemRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  // gap-1.5 mt-1.5
  socialRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  // text-[7px] px-1.5 py-0.5 rounded-full
  socialBadge: {
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  socialText: { fontSize: 7, color: colors.white },

  // Content wrapper
  contentWrapper: {
    flex: 1,
  },
  // Body layout
  body: {
    flexDirection: "row",
  },
  // flex-[2] px-4 py-3
  mainCol: {
    flex: 2,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  // flex-1 bg-slate-50 border-l border-slate-200 px-3 py-3
  sideCol: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.slate50,
    borderLeftWidth: 1,
    borderLeftColor: colors.slate200,
  },

  // Section title (main) — gap-1 pb-1 mb-1.5 border-b-[1.5px] border-blue-500 w-fit
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 4,
    marginBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.blue500,
    alignSelf: "flex-start",
  },
  // text-[11px] font-bold text-slate-800
  sectionTitleText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.slate800,
  },
  // Sidebar section — gap-1 pb-1 mb-2 border-b-[1.5px] border-blue-500 w-fit
  sectionTitleRowSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 4,
    marginBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.blue500,
    alignSelf: "flex-start",
  },
  // text-[10px] font-bold text-slate-800
  sectionTitleTextSide: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.slate800,
  },

  // Summary — text-[8px] text-slate-600 leading-relaxed text-justify
  summaryText: {
    fontSize: 8,
    color: colors.slate600,
    lineHeight: 1.625,
    textAlign: "justify",
  },

  // Experience item — border-l-[1.5px] border-blue-200 pl-2 (space-y-2 = mb-8)
  expItem: { marginBottom: 8, paddingLeft: 8, borderLeftWidth: 1.5, borderLeftColor: colors.blue200 },
  // font-bold text-[9.5px] text-slate-800
  expTitle: { fontWeight: "bold", fontSize: 9.5, color: colors.slate800 },
  // flex justify-between items-center mt-0.5 mb-1
  expMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 4,
  },
  // font-semibold text-[8px] text-slate-700
  expCompany: { fontSize: 8, color: colors.slate700, fontWeight: "bold" },
  // text-[7px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded
  expPeriodBadge: {
    backgroundColor: colors.slate100,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  expPeriod: { fontSize: 7, color: colors.slate500 },
  // space-y-0.5 = mb-2
  bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 2 },
  // before:text-blue-400 before:font-bold
  bulletDot: { width: 8, fontSize: 8, color: colors.blue400, fontWeight: "bold" },
  // text-[8px] text-slate-600
  bulletText: { flex: 1, fontSize: 8, color: colors.slate600 },

  // Projects full-width section
  // Pinned to the bottom of the page, in the space left above the footer
  projectsFullWidth: {
    marginTop: "auto",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.slate200,
  },
  // Projects — at most 2 (applyVisibility): 1 card takes the full width, 2 share it equally
  projectsGrid: { flexDirection: "row", gap: 6 },
  // bg-slate-50 border border-slate-200 rounded p-2
  projectItem: {
    flex: 1,
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 4,
    padding: 6,
  },
  // font-bold text-[9px] text-slate-800
  projectTitle: { fontWeight: "bold", fontSize: 9, color: colors.slate800 },
  // text-[7.5px] text-slate-600 mt-0.5 mb-1 line-clamp-2
  projectDesc: { fontSize: 7.5, color: colors.slate600, marginTop: 2, marginBottom: 4 },
  // text-[7px] text-slate-600 bg-white border border-slate-200 rounded px-1 py-0.5
  techTag: {
    fontSize: 7,
    color: colors.slate600,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },

  // Skills (sidebar) — mb-2
  skillCategory: { marginBottom: 8 },
  // font-bold text-[8.5px] text-slate-800 mb-1
  skillCatName: { fontWeight: "bold", fontSize: 8.5, color: colors.slate800, marginBottom: 4 },
  // text-[7.5px] text-slate-700 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5
  skillTag: {
    fontSize: 7.5,
    color: colors.slate700,
    backgroundColor: colors.slate100,
    borderWidth: 1,
    borderColor: colors.slate200,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },

  // Education (sidebar) — border-l-[1.5px] border-blue-200 pl-2 mb-2
  eduItem: { marginBottom: 8, paddingLeft: 8, borderLeftWidth: 1.5, borderLeftColor: colors.blue200 },
  // font-bold text-[8.5px] text-slate-800 leading-tight
  eduDegree: { fontWeight: "bold", fontSize: 8.5, color: colors.slate800 },
  // text-[7.5px] text-slate-600 mt-0.5
  eduInstitution: { fontSize: 7.5, color: colors.slate600, marginTop: 2 },
  // text-[7px] text-slate-400 font-semibold mt-0.5
  eduYear: { fontSize: 7, color: colors.slate400, fontWeight: "bold", marginTop: 2 },

  // Interests (sidebar) — flex flex-wrap gap-1
  // text-[7.5px] text-slate-600 bg-slate-100 rounded-full px-2 py-0.5
  interestTag: {
    fontSize: 7.5,
    color: colors.slate600,
    backgroundColor: colors.slate100,
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },

  // Footer — py-1.5
  footer: {
    paddingVertical: 6,
    alignItems: "center",
  },
  // text-[7px]
  footerText: { fontSize: 7 },

  // Spacing — space-y-3 = 12
  sectionSpacing: { marginBottom: 12 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap" },
});

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

export function ElegantPdfTemplate({ data }: { data: CvData }) {
  const hBg = data.headerBgColor || colors.headerBg;
  const hText = data.headerTextColor || colors.white;
  const hSub = data.headerTextColor ? `${data.headerTextColor}cc` : `${colors.white}cc`;
  const hContact = data.headerTextColor ? `${data.headerTextColor}bb` : `${colors.white}bb`;
  const hTextBase = data.headerTextColor || colors.white;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={{ backgroundColor: hBg, position: "relative", overflow: "hidden" }}>
          {data.headerBgImage && (
            <Image src={toImageSrc(data.headerBgImage)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, objectFit: "cover", objectPosition: `${(data.headerBgImagePosition ?? { x: 50, y: 50 }).x}% ${(data.headerBgImagePosition ?? { x: 50, y: 50 }).y}%` }} />
          )}
          <View style={[styles.header, { backgroundColor: "transparent" }]}>
          {data.showPhoto && (
            data.header.image ? (
              <View style={{ width: 56, height: 56, borderRadius: 28, overflow: "hidden", borderWidth: 2, borderColor: "#ffffff" }}>
                <Image src={toImageSrc(data.header.image)} style={{ width: 52, height: 52, borderRadius: 26 }} />
              </View>
            ) : (
              <View style={[styles.photoPlaceholder, { backgroundColor: hexToRgba(hTextBase, 0.15) }]}>
                <Text style={[styles.photoInitial, { color: hexToRgba(hTextBase, 0.6) }]}>
                  {data.header.name?.[0] ?? "?"}
                </Text>
              </View>
            )
          )}

          <View style={styles.headerContent}>
            <Text style={[styles.headerName, { color: hText }]}>{data.header.name}</Text>
            <Text style={[styles.headerTitle, { color: hSub }]}>{data.header.title}</Text>

            <View style={styles.contactRow}>
              {data.header.email && (
                <View style={styles.contactItemRow}>
                  <EmailIcon size={8} color={hContact} />
                  <Text style={[styles.contactItem, { color: hContact }]}>{data.header.email}</Text>
                </View>
              )}
              {data.header.phone && (
                <View style={styles.contactItemRow}>
                  <PhoneIcon size={8} color={hContact} />
                  <Text style={[styles.contactItem, { color: hContact }]}>{data.header.phone}</Text>
                </View>
              )}
              {data.header.location && (
                <View style={styles.contactItemRow}>
                  <LocationIcon size={8} color={hContact} />
                  <Text style={[styles.contactItem, { color: hContact }]}>{data.header.location}</Text>
                </View>
              )}
            </View>

            <View style={styles.socialRow}>
              {data.header.linkedin && (
                <Link src={data.header.linkedin}>
                  <View style={[styles.socialBadge, { backgroundColor: hexToRgba(hTextBase, 0.13) }]}>
                    <Text style={[styles.socialText, { color: hText }]}>LinkedIn</Text>
                  </View>
                </Link>
              )}
              {data.header.github && (
                <Link src={data.header.github}>
                  <View style={[styles.socialBadge, { backgroundColor: hexToRgba(hTextBase, 0.13) }]}>
                    <Text style={[styles.socialText, { color: hText }]}>GitHub</Text>
                  </View>
                </Link>
              )}
              {data.header.website && (
                <Link src={data.header.website}>
                  <View style={[styles.socialBadge, { backgroundColor: hexToRgba(hTextBase, 0.13) }]}>
                    <Text style={[styles.socialText, { color: hText }]}>Portfolio</Text>
                  </View>
                </Link>
              )}
            </View>
          </View>
          </View>
        </View>

        {/* Content wrapper */}
        <View style={styles.contentWrapper}>
          {/* Body: 2-column layout */}
          <View style={styles.body}>
            {/* Main column */}
            <View style={styles.mainCol}>
              {/* Summary */}
              {data.summary && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRow} minPresenceAhead={60}>
                    <SummaryIcon size={10} color={colors.slate800} />
                    <Text style={styles.sectionTitleText}>A propos</Text>
                  </View>
                  <Text style={styles.summaryText}>{data.summary}</Text>
                </View>
              )}

              {/* Experience */}
              {data.experience.length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRow} minPresenceAhead={60}>
                    <ExperienceIcon size={10} color={colors.slate800} />
                    <Text style={styles.sectionTitleText}>Experience</Text>
                  </View>
                  {data.experience.map((exp) => (
                    <View key={exp.id} wrap={false} style={styles.expItem}>
                      <Text style={styles.expTitle}>{exp.position}</Text>
                      <View style={styles.expMeta}>
                        <Text style={styles.expCompany}>{exp.company}</Text>
                        <View style={styles.expPeriodBadge}>
                          <Text style={styles.expPeriod}>
                            {exp.startDate} - {exp.endDate}
                          </Text>
                        </View>
                      </View>
                      {exp.bullets.map((b, i) => (
                        <View key={i} style={styles.bullet}>
                          <Text style={styles.bulletDot}>•</Text>
                          <Text style={styles.bulletText}>{b}</Text>
                        </View>
                      ))}
                      {/* Linked projects for this experience */}
                      {getProjectsForExperience(data, exp.id).length > 0 && (
                        <View style={{ marginTop: 4, paddingLeft: 4, borderLeftWidth: 1, borderLeftColor: colors.blue400 }}>
                          <Text style={{ fontSize: 7.5, fontWeight: "bold", color: colors.blue500, marginBottom: 3 }}>
                            Projets associés
                          </Text>
                          {getProjectsForExperience(data, exp.id).map((project) => (
                            <View key={project.id} wrap={false} style={{ marginBottom: 4, paddingLeft: 4 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 1 }}>
                                <Text style={{ fontSize: 8, fontWeight: "bold", color: colors.slate800 }}>
                                  {project.name}
                                </Text>
                                {project.type && (
                                  <Text style={{ fontSize: 6.5, color: colors.blue500, backgroundColor: colors.blue200, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                                    {PROJECT_TYPE_LABELS[project.type]}
                                  </Text>
                                )}
                              </View>
                              {project.highlights && project.highlights.length > 0 && (
                                <View style={{ marginBottom: 2 }}>
                                  {project.highlights.map((h, i) => (
                                    <View key={i} style={styles.bullet}>
                                      <Text style={styles.bulletDot}>•</Text>
                                      <Text style={styles.bulletText}>{h}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}
                              {project.impact && (
                                <Text style={{ fontSize: 7.5, fontWeight: "bold", color: colors.blue700, marginBottom: 2 }}>
                                  {project.impact}
                                </Text>
                              )}
                              {project.technologies.length > 0 && (
                                <View style={styles.tagsRow}>
                                  {project.technologies.map((t, i) => (
                                    <Text key={i} style={styles.techTag}>{t}</Text>
                                  ))}
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Sidebar */}
            <View style={styles.sideCol}>
              {/* Skills */}
              {Object.keys(data.skills).length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRowSide} minPresenceAhead={60}>
                    <SkillsIcon size={10} color={colors.slate800} />
                    <Text style={styles.sectionTitleTextSide}>Competences</Text>
                  </View>
                  {Object.entries(data.skills).map(([cat, skillList]) => (
                    <View key={cat} style={styles.skillCategory}>
                      <Text style={styles.skillCatName}>{cat}</Text>
                      <View style={styles.tagsRow}>
                        {skillList.map((skill, idx) => (
                          <Text key={idx} style={styles.skillTag}>{skill}</Text>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Education */}
              {data.education.length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRowSide} minPresenceAhead={60}>
                    <EducationIcon size={10} color={colors.slate800} />
                    <Text style={styles.sectionTitleTextSide}>Formation</Text>
                  </View>
                  {data.education.map((edu) => (
                    <View key={edu.id} wrap={false} style={styles.eduItem}>
                      <Text style={styles.eduDegree}>{edu.degree}</Text>
                      <Text style={styles.eduInstitution}>{edu.institution}</Text>
                      <Text style={styles.eduYear}>
                        {edu.startDate && edu.endDate
                          ? `${edu.startDate} - ${edu.endDate}`
                          : edu.endDate || edu.startDate}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Interests */}
              {data.interests && data.interests.length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRowSide} minPresenceAhead={60}>
                    <InterestsIcon size={10} color={colors.slate800} />
                    <Text style={styles.sectionTitleTextSide}>Centres d&apos;interet</Text>
                  </View>
                  <View style={styles.tagsRow}>
                    {data.interests.map((interest, i) => (
                      <Text key={i} style={styles.interestTag}>{interest}</Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Projects — full-width */}
          {data.showProjects !== false && getProjectsForSection(data).length > 0 && (
            <View style={styles.projectsFullWidth}>
              <View style={styles.sectionTitleRow} minPresenceAhead={60}>
                <ProjectsIcon size={10} color={colors.slate800} />
                <Text style={styles.sectionTitleText}>Projets</Text>
              </View>
              <View style={styles.projectsGrid}>
                {getProjectsForSection(data).map((project) => {
                  const companyName = getLinkedCompanyName(data, project);
                  return (
                    <View key={project.id} wrap={false} style={styles.projectItem}>
                      {project.type && (
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 }}>
                          <Text style={{ fontSize: 6.5, color: colors.blue500, backgroundColor: colors.blue200, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                            {PROJECT_TYPE_LABELS[project.type]}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.projectTitle, { marginBottom: 2 }]}>{project.name}</Text>
                      {(project.role || companyName) && (
                        <Text style={{ fontSize: 7.5, color: colors.slate500, marginBottom: 2 }}>
                          {project.role}{project.role && companyName ? " · " : ""}{companyName}
                        </Text>
                      )}
                      <Text style={styles.projectDesc}>{project.description}</Text>
                      {project.highlights && project.highlights.length > 0 && (
                        <View style={{ marginBottom: 3 }}>
                          {project.highlights.map((h, i) => (
                            <View key={i} style={styles.bullet}>
                              <Text style={styles.bulletDot}>•</Text>
                              <Text style={styles.bulletText}>{h}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {project.impact && (
                        <Text style={{ fontSize: 7.5, fontWeight: "bold", color: colors.blue700, marginBottom: 3 }}>
                          {project.impact}
                        </Text>
                      )}
                      <View style={styles.tagsRow}>
                        {project.technologies.map((t, i) => (
                          <Text key={i} style={styles.techTag}>{t}</Text>
                        ))}
                      </View>
                      {project.links && project.links.length > 0 && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                          {project.links.map((link, i) => (
                            <Link key={i} src={link.url}>
                              <Text style={{ fontSize: 7, color: colors.blue500 }}>
                                {link.label}
                              </Text>
                            </Link>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={{ backgroundColor: hBg, position: "relative", overflow: "hidden" }}>
          {data.headerBgImage && (
            <Image src={toImageSrc(data.headerBgImage)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, objectFit: "cover", objectPosition: `${(data.headerBgImagePosition ?? { x: 50, y: 50 }).x}% ${(data.headerBgImagePosition ?? { x: 50, y: 50 }).y}%` }} />
          )}
          <View style={[styles.footer, { backgroundColor: "transparent" }]}>
            <Text style={[styles.footerText, { color: `${hTextBase}99` }]}>
              {data.header.name} - CV {new Date().getFullYear()}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
