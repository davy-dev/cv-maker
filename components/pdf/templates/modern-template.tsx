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
  headerAccent: "#1e3a5f",
  blue: "#2563eb",
  blue200: "#bfdbfe",
  blueLight: "#93c5fd",
  white: "#ffffff",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray900: "#111827",
  amber50: "#fffbeb",
  amber300: "#fcd34d",
  amber700: "#b45309",
  amber800: "#92400e",
};

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, color: colors.gray700 },

  // Header — px-5 py-4 gap-3
  header: {
    backgroundColor: colors.headerBg,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  // w-14 h-14 rounded-full border-2 border-white/30
  photoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  // bg-gray-600
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray600,
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitial: { color: "rgba(255,255,255,0.5)", fontSize: 18, fontWeight: "bold" },
  headerContent: { flex: 1 },
  // text-[11px] font-semibold text-blue-300 tracking-wide
  headerTitle: { fontSize: 11, fontWeight: "bold", color: colors.blueLight, letterSpacing: 0.5 },
  // text-lg font-bold mt-0.5
  headerName: { fontSize: 18, fontWeight: "bold", color: colors.white, marginTop: 2 },
  // gap-3 mt-1.5
  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 },
  // text-[8px] text-gray-300
  contactItem: { fontSize: 8, color: colors.gray300 },
  // gap-1
  contactItemRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  // text-[9px] text-gray-300 italic
  yearsExp: { fontSize: 9, color: colors.gray300, fontStyle: "italic", textAlign: "right" },

  // Content wrapper
  contentWrapper: {
    flex: 1,
  },
  // Body — 2-column layout
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
  // flex-1 bg-gray-50 border-l border-gray-200 px-3 py-3
  sideCol: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.gray50,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray200,
  },

  // Section headings (main) — gap-1 pb-1 mb-1.5 border-b-[1.5px] border-blue-600 w-fit
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 4,
    marginBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.blue,
    alignSelf: "flex-start",
  },
  // text-[11px] font-bold text-[#1e3a5f]
  sectionTitleText: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.headerAccent,
  },
  // Sidebar section headings — gap-1 pb-1 mb-2 border-b-[1.5px] border-blue-600 w-fit
  sectionTitleRowSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 4,
    marginBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.blue,
    alignSelf: "flex-start",
  },
  // text-[10px] font-bold text-[#1e3a5f]
  sectionTitleTextSide: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.headerAccent,
  },

  // space-y-3 = 12
  sectionSpacing: { marginBottom: 12 },

  // Summary — text-[8px] text-gray-700 leading-relaxed text-justify
  summaryText: {
    fontSize: 8,
    color: colors.gray700,
    lineHeight: 1.625,
    textAlign: "justify",
  },

  // Experience item — border-l-[1.5px] border-blue-200 pl-2 (space-y-2 = mb-8)
  expItem: { marginBottom: 8, paddingLeft: 8, borderLeftWidth: 1.5, borderLeftColor: colors.blue200 },
  // font-bold text-[9.5px] text-gray-900
  expTitle: { fontWeight: "bold", fontSize: 9.5, color: colors.gray900 },
  // flex justify-between items-center mt-0.5 mb-1
  expMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 4,
  },
  // font-semibold text-[8px] text-gray-700
  expCompany: { fontSize: 8, color: colors.gray700, fontWeight: "bold" },
  // text-[7px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded
  expPeriodBadge: {
    backgroundColor: colors.gray100,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  expPeriod: { fontSize: 7, color: colors.gray500 },
  // space-y-0.5 = mb-2, pl-2
  bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 2 },
  // before:text-[#1e3a5f] before:font-bold
  bulletDot: { width: 8, fontSize: 8, color: colors.headerAccent, fontWeight: "bold" },
  // text-[8px] text-gray-700
  bulletText: { flex: 1, fontSize: 8, color: colors.gray700 },

  // Projects full-width section
  // Pinned to the bottom of the page, in the space left above the footer
  projectsFullWidth: {
    marginTop: "auto",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  projectsGrid: { flexDirection: "row", gap: 6 },
  // Projects — bg-gray-50 border border-gray-200 rounded p-2
  projectItem: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 4,
    padding: 6,
  },
  // font-bold text-[9px] text-gray-900
  projectTitle: { fontWeight: "bold", fontSize: 9, color: colors.gray900 },
  // text-[7.5px] text-gray-500 mt-0.5 mb-1
  projectDesc: { fontSize: 7.5, color: colors.gray500, marginTop: 2, marginBottom: 4 },
  // text-[7px] text-gray-700 bg-white border border-gray-200 rounded px-1 py-0.5
  techTag: {
    fontSize: 7,
    color: colors.gray700,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  tagsRow: { flexDirection: "row", flexWrap: "wrap" },

  // Skills (sidebar) — mb-2
  skillCategory: { marginBottom: 8 },
  // font-bold text-[8.5px] text-gray-900 mb-1
  skillCatName: { fontWeight: "bold", fontSize: 8.5, color: colors.gray900, marginBottom: 4 },
  // text-[7.5px] text-gray-700 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5
  skillTag: {
    fontSize: 7.5,
    color: colors.gray700,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },

  // Education (sidebar) — border-l-[1.5px] border-blue-200 pl-2 mb-2
  eduItem: { marginBottom: 8, paddingLeft: 8, borderLeftWidth: 1.5, borderLeftColor: colors.blue200 },
  // font-bold text-[8.5px] text-gray-900 leading-tight
  eduDegree: { fontWeight: "bold", fontSize: 8.5, color: colors.gray900 },
  // text-[7.5px] text-gray-500 mt-0.5
  eduInstitution: { fontSize: 7.5, color: colors.gray500, marginTop: 2 },
  // text-[7px] text-gray-400 font-semibold mt-0.5
  eduYear: { fontSize: 7, color: colors.gray400, fontWeight: "bold", marginTop: 2 },

  // Interests box — bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-2
  interestsBox: {
    backgroundColor: colors.amber50,
    borderWidth: 1,
    borderColor: colors.amber300,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  // gap-1 mb-1
  interestsTitleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  // text-[8px] font-bold text-amber-700
  interestsTitleText: { fontSize: 8, fontWeight: "bold", color: colors.amber700 },
  // text-[7.5px] text-amber-800 italic
  interestItem: { fontSize: 7.5, color: colors.amber800, fontStyle: "italic", marginBottom: 1 },

  // Project enriched styles
  projectTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  projectTypeBadge: {
    fontSize: 6.5,
    color: colors.blue,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: colors.blue200,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  projectRole: { fontSize: 7.5, color: colors.gray600, marginBottom: 2 },
  projectImpact: { fontSize: 7.5, color: colors.gray900, fontWeight: "bold", marginTop: 2, marginBottom: 2 },
  projectLinksRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 3 },
  projectLink: { fontSize: 7, color: colors.blue, textDecoration: "underline" },

  // Linked projects under experience
  linkedProjectsContainer: { marginTop: 6, marginLeft: 4, paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: colors.gray200 },
  linkedProjectsTitle: { fontSize: 7.5, color: colors.gray500, fontWeight: "bold", marginBottom: 4 },
  linkedProjectItem: {
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 3,
    padding: 6,
    marginBottom: 4,
  },
  linkedProjectName: { fontWeight: "bold", fontSize: 8, color: colors.gray900 },
  linkedProjectTitleRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  linkedProjectImpact: { fontSize: 7, color: colors.gray900, fontWeight: "bold", marginTop: 2, marginBottom: 2 },
});

export function ModernPdfTemplate({ data }: { data: CvData }) {
  const hBg = data.headerBgColor || colors.headerBg;
  const hText = data.headerTextColor || colors.white;

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
              <View style={[styles.photoPlaceholder]}>
                <Text style={styles.photoInitial}>
                  {data.header.name?.[0] ?? "?"}
                </Text>
              </View>
            )
          )}

          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.blueLight }]}>{data.header.title}</Text>
            <Text style={[styles.headerName, { color: hText }]}>{data.header.name}</Text>
            <View style={styles.contactRow}>
              {data.header.email && (
                <View style={styles.contactItemRow}>
                  <EmailIcon size={8} color={colors.gray300} />
                  <Text style={styles.contactItem}>{data.header.email}</Text>
                </View>
              )}
              {data.header.phone && (
                <View style={styles.contactItemRow}>
                  <PhoneIcon size={8} color={colors.gray300} />
                  <Text style={styles.contactItem}>{data.header.phone}</Text>
                </View>
              )}
              {data.header.location && (
                <View style={styles.contactItemRow}>
                  <LocationIcon size={8} color={colors.gray300} />
                  <Text style={styles.contactItem}>{data.header.location}</Text>
                </View>
              )}
              {data.header.linkedin && (
                <Link src={data.header.linkedin}>
                  <Text style={styles.contactItem}>LinkedIn</Text>
                </Link>
              )}
              {data.header.github && (
                <Link src={data.header.github}>
                  <Text style={styles.contactItem}>GitHub</Text>
                </Link>
              )}
            </View>
          </View>

          {data.yearsExperience && (
            <View>
              <Text style={styles.yearsExp}>{data.yearsExperience}</Text>
            </View>
          )}
          </View>
        </View>

        {/* Content wrapper */}
        <View style={styles.contentWrapper}>
          {/* Body — 2-column layout */}
          <View style={styles.body}>
            {/* Main column */}
            <View style={styles.mainCol}>
              {/* Summary */}
              {data.summary && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRow} minPresenceAhead={60}>
                    <SummaryIcon size={10} color={colors.headerAccent} />
                    <Text style={styles.sectionTitleText}>A propos</Text>
                  </View>
                  <Text style={styles.summaryText}>{data.summary}</Text>
                </View>
              )}

              {/* Experiences */}
              {data.experience.length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRow} minPresenceAhead={60}>
                    <ExperienceIcon size={10} color={colors.headerAccent} />
                    <Text style={styles.sectionTitleText}>Experiences professionnelles</Text>
                  </View>
                  {data.experience.map((exp) => {
                    const linkedProjects = getProjectsForExperience(data, exp.id);
                    return (
                      <View key={exp.id} wrap={false} style={styles.expItem}>
                        <Text style={styles.expTitle}>{exp.position}</Text>
                        <View style={styles.expMeta}>
                          <Text style={styles.expCompany}>{exp.company}</Text>
                          <View style={styles.expPeriodBadge}>
                            <Text style={styles.expPeriod}>
                              {exp.startDate} - {exp.endDate}
                              {exp.location ? ` • ${exp.location}` : ""}
                            </Text>
                          </View>
                        </View>
                        {exp.bullets.map((b, i) => (
                          <View key={i} style={styles.bullet}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>{b}</Text>
                          </View>
                        ))}
                        {linkedProjects.length > 0 && (
                          <View style={styles.linkedProjectsContainer}>
                            <Text style={styles.linkedProjectsTitle}>Projets associes</Text>
                            {linkedProjects.map((project) => (
                              <View key={project.id} wrap={false} style={styles.linkedProjectItem}>
                                <View style={styles.linkedProjectTitleRow}>
                                  <Text style={styles.linkedProjectName}>{project.name}</Text>
                                  {project.type && (
                                    <Text style={styles.projectTypeBadge}>
                                      {PROJECT_TYPE_LABELS[project.type]}
                                    </Text>
                                  )}
                                </View>
                                {project.highlights && project.highlights.length > 0 && (
                                  <View>
                                    {project.highlights.map((h, i) => (
                                      <View key={i} style={styles.bullet}>
                                        <Text style={styles.bulletDot}>•</Text>
                                        <Text style={styles.bulletText}>{h}</Text>
                                      </View>
                                    ))}
                                  </View>
                                )}
                                {project.impact && (
                                  <Text style={styles.linkedProjectImpact}>{project.impact}</Text>
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
                    );
                  })}
                </View>
              )}
            </View>

            {/* Sidebar */}
            <View style={styles.sideCol}>
              {/* Skills */}
              {Object.keys(data.skills).length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRowSide} minPresenceAhead={60}>
                    <SkillsIcon size={10} color={colors.headerAccent} />
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
                    <EducationIcon size={10} color={colors.headerAccent} />
                    <Text style={styles.sectionTitleTextSide}>Formations</Text>
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
                  <View style={styles.interestsBox}>
                    <View style={styles.interestsTitleRow} minPresenceAhead={60}>
                      <InterestsIcon size={8} color={colors.amber700} />
                      <Text style={styles.interestsTitleText}>Centres d&apos;interets</Text>
                    </View>
                    {data.interests.map((interest, i) => (
                      <Text key={i} style={styles.interestItem}>{interest}</Text>
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
                <ProjectsIcon size={10} color={colors.headerAccent} />
                <Text style={styles.sectionTitleText}>Projets</Text>
              </View>
              <View style={styles.projectsGrid}>
                {getProjectsForSection(data).map((project) => {
                  const companyName = getLinkedCompanyName(data, project);
                  return (
                    <View key={project.id} wrap={false} style={styles.projectItem}>
                      {project.type && (
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 }}>
                          <Text style={styles.projectTypeBadge}>
                            {PROJECT_TYPE_LABELS[project.type]}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.projectTitle}>{project.name}</Text>
                      {(project.role || companyName) && (
                        <Text style={styles.projectRole}>
                          {project.role}{project.role && companyName ? " - " : ""}{companyName ?? ""}
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
                        <Text style={styles.projectImpact}>{project.impact}</Text>
                      )}
                      {project.technologies.length > 0 && (
                        <View style={styles.tagsRow}>
                          {project.technologies.map((t, i) => (
                            <Text key={i} style={styles.techTag}>{t}</Text>
                          ))}
                        </View>
                      )}
                      {project.links && project.links.length > 0 && (
                        <View style={styles.projectLinksRow}>
                          {project.links.map((link, i) => (
                            <Link key={i} src={link.url}>
                              <Text style={styles.projectLink}>{link.label}</Text>
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
      </Page>
    </Document>
  );
}
