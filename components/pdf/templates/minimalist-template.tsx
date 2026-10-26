"use client";

import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CvData, CvProject, ProjectType } from "@/types/cv";
import { EmailIcon, PhoneIcon, LocationIcon, ExperienceIcon, ProjectsIcon, SkillsIcon, EducationIcon, InterestsIcon } from "@/components/pdf/icons";
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
  black: "#222222",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray900: "#111827",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.gray600,
  },

  // Header — px-8 pt-6 pb-3 border-b border-gray-100
  header: {
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  // text-xl font-light tracking-wider
  name: { fontSize: 20, color: colors.black, letterSpacing: 1 },
  // text-[11px] mt-0.5
  title: { fontSize: 11, marginTop: 2 },
  // gap-3 mt-1.5 text-[8px]
  contactRow: { flexDirection: "row", gap: 12, marginTop: 6, fontSize: 8 },
  contactItemRow: { flexDirection: "row", alignItems: "center", gap: 4 },

  // Content wrapper
  contentWrapper: {
    flex: 1,
  },
  // Body — 2-column
  body: {
    flexDirection: "row",
  },
  // flex-[2] px-6 py-3 space-y-3
  mainCol: {
    flex: 2,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  // flex-1 border-l border-gray-100 px-4 py-3 space-y-3
  sideCol: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray100,
  },

  // Section titles (main) — text-[8px] uppercase tracking-[0.2em] text-gray-400 mb-2
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  sectionTitleText: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    color: colors.gray400,
  },
  // Sidebar section titles — text-[7.5px] uppercase tracking-[0.2em] text-gray-400 mb-2
  sectionTitleRowSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  sectionTitleTextSide: {
    fontSize: 7.5,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.gray400,
  },

  // space-y-3 = 12
  sectionSpacing: { marginBottom: 12 },

  // Summary — text-[9px] text-gray-500 leading-relaxed
  summary: { color: colors.gray500, lineHeight: 1.625, fontSize: 9 },

  // Experience — mb-3
  expItem: { marginBottom: 12 },
  // flex justify-between items-baseline
  expRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  // font-medium text-gray-900 text-[9.5px]
  expPosition: { fontWeight: "bold", color: colors.gray900, fontSize: 9.5 },
  // text-[7.5px] text-gray-400
  expDate: { fontSize: 7.5, color: colors.gray400 },
  // text-[8px] text-gray-400 mt-0.5 mb-1
  expCompany: { color: colors.gray400, fontSize: 8, marginTop: 2, marginBottom: 4 },
  // pl-2 border-l border-gray-200 text-[8px] text-gray-600
  bullet: {
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray200,
    marginBottom: 2,
    fontSize: 8,
    color: colors.gray600,
  },

  // Projects full-width section
  // Pinned to the bottom of the page, in the space left above the footer
  projectsFullWidth: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  projectsGrid: { flexDirection: "row", gap: 6 },
  // Projects card
  projectItem: { flex: 1 },
  // font-medium text-gray-900 text-[9px]
  projectTitle: { fontWeight: "bold", color: colors.gray900, fontSize: 9 },
  // text-[8px] text-gray-500 mt-0.5
  projectDesc: { fontSize: 8, color: colors.gray500, marginTop: 2, marginBottom: 2 },
  // text-[7.5px] text-gray-400 mt-0.5
  techText: { fontSize: 7.5, color: colors.gray400 },
  // type label after project name
  projectTypeLabel: { fontSize: 7.5, color: colors.gray400 },
  // role + company line
  projectRole: { fontSize: 8, color: colors.gray500, marginTop: 1 },
  // highlight items with left border
  projectHighlight: {
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray200,
    marginBottom: 2,
    fontSize: 8,
    color: colors.gray600,
  },
  // impact line — bold
  projectImpact: { fontSize: 8, color: colors.gray600, fontFamily: "Helvetica-Bold", marginTop: 2 },
  // links row
  projectLink: { fontSize: 7.5, color: colors.gray400, marginTop: 1 },
  // linked project block under experience
  linkedProjectBlock: {
    marginTop: 6,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray200,
  },
  linkedProjectTitle: { fontWeight: "bold", color: colors.gray900, fontSize: 8.5 },
  linkedProjectTypeLabel: { fontSize: 7, color: colors.gray400 },

  // Education (sidebar) — mb-2
  eduItem: { marginBottom: 8 },
  // font-medium text-gray-900 text-[8.5px]
  eduTitle: { fontWeight: "bold", color: colors.gray900, fontSize: 8.5 },
  // text-[7.5px] text-gray-400 mt-0.5
  eduInstitution: { color: colors.gray400, fontSize: 7.5, marginTop: 2 },
  // text-[7px] text-gray-300 mt-0.5
  eduYear: { fontSize: 7, color: colors.gray300, marginTop: 2 },

  // Skills (sidebar) — flex flex-wrap gap-1
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  // text-[7.5px] text-gray-600 border border-gray-200 rounded px-1.5 py-0.5
  skillTag: {
    fontSize: 7.5,
    color: colors.gray600,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // Interests (sidebar) — text-[8px] text-gray-500
  interestItem: { fontSize: 8, color: colors.gray500, marginBottom: 2 },
});

export function MinimalistPdfTemplate({ data }: { data: CvData }) {
  const hBg = data.headerBgColor || "#ffffff";
  const hText = data.headerTextColor || colors.black;
  const hSub = `${hText}99`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={{ backgroundColor: hBg, position: "relative", overflow: "hidden" }}>
          {data.headerBgImage && (
            <Image src={toImageSrc(data.headerBgImage)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, objectFit: "cover", objectPosition: `${(data.headerBgImagePosition ?? { x: 50, y: 50 }).x}% ${(data.headerBgImagePosition ?? { x: 50, y: 50 }).y}%` }} />
          )}
          <View style={[styles.header, { backgroundColor: "transparent", flexDirection: "row", alignItems: "center", gap: 16 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: hText }]}>{data.header.name}</Text>
              <Text style={[styles.title, { color: hSub }]}>{data.header.title}</Text>
              <View style={styles.contactRow}>
                {data.header.email && (
                  <View style={styles.contactItemRow}>
                    <EmailIcon size={8} color={hSub} />
                    <Text style={{ color: hSub }}>{data.header.email}</Text>
                  </View>
                )}
                {data.header.phone && (
                  <View style={styles.contactItemRow}>
                    <PhoneIcon size={8} color={hSub} />
                    <Text style={{ color: hSub }}>{data.header.phone}</Text>
                  </View>
                )}
                {data.header.location && (
                  <View style={styles.contactItemRow}>
                    <LocationIcon size={8} color={hSub} />
                    <Text style={{ color: hSub }}>{data.header.location}</Text>
                  </View>
                )}
              </View>
            </View>
            {data.showPhoto && data.header.image && (
              <Image src={toImageSrc(data.header.image)} style={{ width: 48, height: 48, borderRadius: 24, objectFit: "cover" }} />
            )}
          </View>
        </View>

        {/* Content wrapper */}
        <View style={styles.contentWrapper}>
          {/* Body — 2-column */}
          <View style={styles.body}>
            {/* Main column */}
            <View style={styles.mainCol}>
              {/* Summary */}
              {data.summary && (
                <View style={styles.sectionSpacing}>
                  <Text style={styles.summary}>{data.summary}</Text>
                </View>
              )}

              {/* Experience */}
              {data.experience.length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRow} minPresenceAhead={60}>
                    <ExperienceIcon size={8} color={colors.gray400} />
                    <Text style={styles.sectionTitleText}>Expérience</Text>
                  </View>
                  {data.experience.map((exp) => {
                    const linkedProjects = getProjectsForExperience(data, exp.id);
                    return (
                      <View key={exp.id} wrap={false} style={styles.expItem}>
                        <View style={styles.expRow}>
                          <Text style={styles.expPosition}>{exp.position}</Text>
                          <Text style={styles.expDate}>{exp.startDate} - {exp.endDate}</Text>
                        </View>
                        <Text style={styles.expCompany}>{exp.company}</Text>
                        {exp.bullets.map((b, i) => (
                          <View key={i} style={styles.bullet}>
                            <Text>{b}</Text>
                          </View>
                        ))}
                        {linkedProjects.length > 0 &&
                          linkedProjects.map((project) => (
                            <View key={project.id} wrap={false} style={styles.linkedProjectBlock}>
                              <Text style={styles.linkedProjectTitle}>
                                {project.name}
                                {project.type && (
                                  <Text style={styles.linkedProjectTypeLabel}>
                                    {" "}({PROJECT_TYPE_LABELS[project.type]})
                                  </Text>
                                )}
                              </Text>
                              {project.highlights?.length > 0 &&
                                project.highlights.map((h, i) => (
                                  <View key={i} style={styles.projectHighlight}>
                                    <Text>{h}</Text>
                                  </View>
                                ))}
                              {project.impact && (
                                <Text style={styles.projectImpact}>{project.impact}</Text>
                              )}
                              {project.technologies.length > 0 && (
                                <Text style={styles.techText}>
                                  {project.technologies.join(" · ")}
                                </Text>
                              )}
                            </View>
                          ))}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Sidebar */}
            <View style={styles.sideCol}>
              {/* Education */}
              {data.education.length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRowSide} minPresenceAhead={60}>
                    <EducationIcon size={7} color={colors.gray400} />
                    <Text style={styles.sectionTitleTextSide}>Formation</Text>
                  </View>
                  {data.education.map((edu) => (
                    <View key={edu.id} wrap={false} style={styles.eduItem}>
                      <Text style={styles.eduTitle}>{edu.degree}</Text>
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

              {/* Skills */}
              {Object.keys(data.skills).length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRowSide} minPresenceAhead={60}>
                    <SkillsIcon size={7} color={colors.gray400} />
                    <Text style={styles.sectionTitleTextSide}>Compétences</Text>
                  </View>
                  <View style={styles.skillsWrap}>
                    {Object.values(data.skills)
                      .flat()
                      .map((skill, i) => (
                        <Text key={i} style={styles.skillTag}>
                          {skill}
                        </Text>
                      ))}
                  </View>
                </View>
              )}

              {/* Interests */}
              {data.interests && data.interests.length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRowSide} minPresenceAhead={60}>
                    <InterestsIcon size={7} color={colors.gray400} />
                    <Text style={styles.sectionTitleTextSide}>Intérêts</Text>
                  </View>
                  {data.interests.map((interest, i) => (
                    <Text key={i} style={styles.interestItem}>{interest}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Projects — full-width */}
          {data.showProjects !== false && getProjectsForSection(data).length > 0 && (
            <View style={styles.projectsFullWidth}>
              <View style={styles.sectionTitleRow} minPresenceAhead={60}>
                <ProjectsIcon size={8} color={colors.gray400} />
                <Text style={styles.sectionTitleText}>Projets</Text>
              </View>
              <View style={styles.projectsGrid}>
                {getProjectsForSection(data).map((project) => {
                  const companyName = getLinkedCompanyName(data, project);
                  return (
                    <View key={project.id} wrap={false} style={styles.projectItem}>
                      {project.type && (
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 }}>
                          <Text style={styles.projectTypeLabel}>
                            ({PROJECT_TYPE_LABELS[project.type]})
                          </Text>
                        </View>
                      )}
                      <Text style={styles.projectTitle}>{project.name}</Text>
                      {(project.role || companyName) && (
                        <Text style={styles.projectRole}>
                          {project.role}
                          {project.role && companyName ? " — " : ""}
                          {companyName}
                        </Text>
                      )}
                      <Text style={styles.projectDesc}>{project.description}</Text>
                      {project.highlights?.length > 0 &&
                        project.highlights.map((h, i) => (
                          <View key={i} style={styles.projectHighlight}>
                            <Text>{h}</Text>
                          </View>
                        ))}
                      {project.impact && (
                        <Text style={styles.projectImpact}>{project.impact}</Text>
                      )}
                      {project.technologies.length > 0 && (
                        <Text style={styles.techText}>
                          {project.technologies.join(" · ")}
                        </Text>
                      )}
                      {project.links?.length > 0 &&
                        project.links.map((link, i) => (
                          <Text key={i} style={styles.projectLink}>
                            {link.label}: {link.url}
                          </Text>
                        ))}
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
