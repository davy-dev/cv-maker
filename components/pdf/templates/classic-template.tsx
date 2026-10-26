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
  black: "#1a1a1a",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    color: colors.gray700,
  },

  // Header — text-center border-b-[1.5px] border-gray-800 pt-6 pb-3 px-8
  headerCenter: {
    textAlign: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: colors.gray800,
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 32,
  },
  // text-2xl font-serif font-bold
  name: { fontSize: 24, fontFamily: "Times-Bold", color: colors.black },
  // text-[11px] mt-1
  title: { fontSize: 11, marginTop: 4 },
  // gap-4 mt-2 text-[9px] text-gray-500
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
    fontSize: 9,
    color: colors.gray500,
  },
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
  // flex-1 border-l border-gray-200 px-4 py-3 space-y-3
  sideCol: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray200,
  },

  // Section titles (main) — text-[10px] font-serif font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 4,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
  },
  sectionTitleText: {
    fontSize: 10,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.gray900,
  },
  // Sidebar section titles — text-[9px] font-serif font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2
  sectionTitleRowSide: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 4,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray300,
  },
  sectionTitleTextSide: {
    fontSize: 9,
    fontFamily: "Times-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.45,
    color: colors.gray900,
  },

  // space-y-3 = 12
  sectionSpacing: { marginBottom: 12 },

  // Summary — italic text-[9px] text-gray-600 leading-relaxed
  summary: { fontFamily: "Times-Italic", fontSize: 9, color: colors.gray600, lineHeight: 1.625 },

  // Experience item — mb-2.5
  expItem: { marginBottom: 10 },
  // font-bold text-[9.5px] text-gray-900
  expTitle: { fontFamily: "Times-Bold", fontSize: 9.5, color: colors.gray900 },
  // flex justify-between text-[8px] mt-0.5 mb-1
  expMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 4,
  },
  // italic text-gray-600
  expSub: { fontFamily: "Times-Italic", fontSize: 8, color: colors.gray600 },
  // text-gray-500
  expPeriod: { fontSize: 8, color: colors.gray500 },
  // pl-3 space-y-0.5, pl-2 text-[8px]
  bullet: { flexDirection: "row", marginBottom: 2, paddingLeft: 12 },
  bulletDot: { width: 8, fontSize: 8, color: colors.gray500 },
  bulletText: { flex: 1, fontSize: 8, color: colors.gray700 },

  // Projects full-width section
  // Pinned to the bottom of the page, in the space left above the footer
  projectsFullWidth: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
  },
  projectsGrid: { flexDirection: "row", gap: 6 },
  // Projects — border-l border-gray-200
  projectItem: {
    flex: 1,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: colors.gray200,
  },
  // font-bold text-[9px] text-gray-900
  projectTitle: { fontFamily: "Times-Bold", fontSize: 9, color: colors.gray900 },
  // text-[8px] text-gray-600 mt-0.5
  projectDesc: { fontSize: 8, color: colors.gray600, marginTop: 2, marginBottom: 2 },
  // text-[7.5px] text-gray-500 italic
  techText: { fontSize: 7.5, color: colors.gray500, fontFamily: "Times-Italic" },

  // Education (sidebar) — mb-2
  eduItem: { marginBottom: 8 },
  // font-bold text-[8.5px] text-gray-900
  eduTitle: { fontFamily: "Times-Bold", fontSize: 8.5, color: colors.gray900 },
  // text-[7.5px] text-gray-600 italic mt-0.5
  eduInstitution: { fontSize: 7.5, color: colors.gray600, fontFamily: "Times-Italic", marginTop: 2 },
  // text-[7px] text-gray-500 mt-0.5
  eduYear: { fontSize: 7, color: colors.gray500, marginTop: 2 },

  // Skills (sidebar) — mb-1.5
  skillCategory: { marginBottom: 6 },
  // font-bold text-[8px] text-gray-900
  skillCatName: { fontFamily: "Times-Bold", fontSize: 8, color: colors.gray900, marginBottom: 2 },
  // text-[7.5px] text-gray-600
  skillLine: { fontSize: 7.5, color: colors.gray600, lineHeight: 1.4 },

  // Interests (sidebar) — text-[8px] text-gray-600 italic
  interestItem: { fontSize: 8, color: colors.gray600, fontFamily: "Times-Italic", marginBottom: 1 },

  // Footer — border-t border-gray-300 text-center py-1.5 px-6
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray300,
    paddingVertical: 6,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  // text-[7px] text-gray-400
  footerText: { fontSize: 7, color: "#9ca3af" },
});

export function ClassicPdfTemplate({ data }: { data: CvData }) {
  const hBg = data.headerBgColor || "#ffffff";
  const hText = data.headerTextColor || colors.black;
  const hSub = `${hText}aa`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header — Centered */}
        <View style={{ backgroundColor: hBg, position: "relative", overflow: "hidden" }}>
          {data.headerBgImage && (
            <Image src={toImageSrc(data.headerBgImage)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, objectFit: "cover", objectPosition: `${(data.headerBgImagePosition ?? { x: 50, y: 50 }).x}% ${(data.headerBgImagePosition ?? { x: 50, y: 50 }).y}%` }} />
          )}
          <View style={[styles.headerCenter, { backgroundColor: "transparent" }]}>
            {data.showPhoto && data.header.image && (
              <View style={{ alignSelf: "center", width: 56, height: 56, borderRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "#d1d5db", marginBottom: 8 }}>
                <Image src={toImageSrc(data.header.image)} style={{ width: 54, height: 54, borderRadius: 27, objectFit: "cover" }} />
              </View>
            )}
            <Text style={[styles.name, { color: hText }]}>{data.header.name}</Text>
            <Text style={[styles.title, { color: hSub }]}>{data.header.title}</Text>
            <View style={styles.contactRow}>
              {data.header.email && (
                <View style={styles.contactItemRow}>
                  <EmailIcon size={8} color={colors.gray500} />
                  <Text style={{ color: colors.gray500 }}>{data.header.email}</Text>
                </View>
              )}
              {data.header.phone && (
                <View style={styles.contactItemRow}>
                  <PhoneIcon size={8} color={colors.gray500} />
                  <Text style={{ color: colors.gray500 }}>{data.header.phone}</Text>
                </View>
              )}
              {data.header.location && (
                <View style={styles.contactItemRow}>
                  <LocationIcon size={8} color={colors.gray500} />
                  <Text style={{ color: colors.gray500 }}>{data.header.location}</Text>
                </View>
              )}
              {data.header.linkedin && <Text style={{ color: colors.gray500 }}>LinkedIn</Text>}
              {data.header.github && <Text style={{ color: colors.gray500 }}>GitHub</Text>}
            </View>
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
                    <SummaryIcon size={9} color={colors.gray900} />
                    <Text style={styles.sectionTitleText}>Profil professionnel</Text>
                  </View>
                  <Text style={styles.summary}>{data.summary}</Text>
                </View>
              )}

              {/* Experience */}
              {data.experience.length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRow} minPresenceAhead={60}>
                    <ExperienceIcon size={9} color={colors.gray900} />
                    <Text style={styles.sectionTitleText}>Expérience professionnelle</Text>
                  </View>
                  {data.experience.map((exp) => {
                    const linkedProjects = getProjectsForExperience(data, exp.id);
                    return (
                      <View key={exp.id} wrap={false} style={styles.expItem}>
                        <Text style={styles.expTitle}>{exp.position}</Text>
                        <View style={styles.expMeta}>
                          <Text style={styles.expSub}>
                            {exp.company}{exp.location ? ` - ${exp.location}` : ""}
                          </Text>
                          <Text style={styles.expPeriod}>
                            {exp.startDate} - {exp.endDate}
                          </Text>
                        </View>
                        {exp.bullets.map((b, i) => (
                          <View key={i} style={styles.bullet}>
                            <Text style={styles.bulletDot}>–</Text>
                            <Text style={styles.bulletText}>{b}</Text>
                          </View>
                        ))}
                        {linkedProjects.length > 0 && (
                          <View style={{ marginTop: 4, paddingLeft: 8, borderLeftWidth: 1.5, borderLeftColor: colors.gray300 }}>
                            {linkedProjects.map((project) => (
                              <View key={project.id} wrap={false} style={{ marginBottom: 4 }}>
                                <Text style={styles.projectTitle}>
                                  {project.name}
                                  {project.type && (
                                    <Text style={styles.techText}>
                                      {" "}({PROJECT_TYPE_LABELS[project.type]})
                                    </Text>
                                  )}
                                </Text>
                                {project.highlights?.length > 0 &&
                                  project.highlights.map((h, i) => (
                                    <View key={i} style={styles.bullet}>
                                      <Text style={styles.bulletDot}>–</Text>
                                      <Text style={styles.bulletText}>{h}</Text>
                                    </View>
                                  ))}
                                {project.impact && (
                                  <Text
                                    style={{
                                      fontSize: 8,
                                      color: colors.gray700,
                                      fontFamily: "Times-Bold",
                                      marginTop: 2,
                                    }}
                                  >
                                    Impact : {project.impact}
                                  </Text>
                                )}
                                {project.technologies.length > 0 && (
                                  <Text style={styles.techText}>
                                    {project.technologies.join(" • ")}
                                  </Text>
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
              {/* Education */}
              {data.education.length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRowSide} minPresenceAhead={60}>
                    <EducationIcon size={8} color={colors.gray900} />
                    <Text style={styles.sectionTitleTextSide}>Formation</Text>
                  </View>
                  {data.education.map((edu) => (
                    <View key={edu.id} wrap={false} style={styles.eduItem}>
                      <Text style={styles.eduTitle}>
                        {edu.degree}{edu.field ? ` en ${edu.field}` : ""}
                      </Text>
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
                    <SkillsIcon size={8} color={colors.gray900} />
                    <Text style={styles.sectionTitleTextSide}>Compétences</Text>
                  </View>
                  {Object.entries(data.skills).map(([cat, skillList]) => (
                    <View key={cat} style={styles.skillCategory}>
                      <Text style={styles.skillCatName}>{cat}</Text>
                      <Text style={styles.skillLine}>{skillList.join(" • ")}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Interests */}
              {data.interests && data.interests.length > 0 && (
                <View style={styles.sectionSpacing}>
                  <View style={styles.sectionTitleRowSide} minPresenceAhead={60}>
                    <InterestsIcon size={8} color={colors.gray900} />
                    <Text style={styles.sectionTitleTextSide}>Centres d&apos;intérêt</Text>
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
                <ProjectsIcon size={9} color={colors.gray900} />
                <Text style={styles.sectionTitleText}>Projets</Text>
              </View>
              <View style={styles.projectsGrid}>
                {getProjectsForSection(data).map((project) => {
                  const companyName = getLinkedCompanyName(data, project);
                  return (
                    <View key={project.id} wrap={false} style={styles.projectItem}>
                      {project.type && (
                        <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 }}>
                          <Text style={styles.techText}>
                            ({PROJECT_TYPE_LABELS[project.type]})
                          </Text>
                        </View>
                      )}
                      <Text style={styles.projectTitle}>{project.name}</Text>
                      {(project.role || companyName) && (
                        <Text style={styles.expSub}>
                          {project.role}
                          {project.role && companyName ? " — " : ""}
                          {companyName}
                        </Text>
                      )}
                      <Text style={styles.projectDesc}>{project.description}</Text>
                      {project.highlights?.length > 0 &&
                        project.highlights.map((h, i) => (
                          <View key={i} style={styles.bullet}>
                            <Text style={styles.bulletDot}>–</Text>
                            <Text style={styles.bulletText}>{h}</Text>
                          </View>
                        ))}
                      {project.impact && (
                        <Text
                          style={{
                            fontSize: 8,
                            color: colors.gray700,
                            fontFamily: "Times-Bold",
                            marginTop: 2,
                          }}
                        >
                          Impact : {project.impact}
                        </Text>
                      )}
                      {project.technologies.length > 0 && (
                        <Text style={styles.techText}>
                          {project.technologies.join(" • ")}
                        </Text>
                      )}
                      {project.links?.length > 0 && (
                        <Text
                          style={{
                            fontSize: 7.5,
                            color: colors.gray500,
                            marginTop: 2,
                          }}
                        >
                          {project.links.map((l) => `${l.label}: ${l.url}`).join(" | ")}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {data.header.name} - {data.header.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
