import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { generatedCvs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CvPageTabs } from "@/components/cv/cv-page-tabs";
import type { CvData, CoverLetterData, TemplateId } from "@/types/cv";

interface CvEditorPageProps {
  params: Promise<{ id: string }>;
}

export default async function CvEditorPage({ params }: CvEditorPageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const cv = await db.query.generatedCvs.findFirst({
    where: eq(generatedCvs.id, id),
  });

  if (!cv || cv.userId !== session.user.id) {
    notFound();
  }

  const emptyCvData: CvData = {
    header: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      website: null,
      linkedin: null,
      github: null,
      image: null,
    },
    summary: "",
    yearsExperience: "",
    showPhoto: false,
    showProjects: true,
    headerBgColor: null,
    headerTextColor: null,
    headerBgImage: null,
    headerBgImagePosition: null,
    experience: [],
    education: [],
    skills: {},
    projects: [],
    interests: [],
  };

  let cvData: CvData;
  try {
    const parsed = JSON.parse(cv.cvData);
    // Ensure all required fields exist (cvData can be "{}" before generation)
    cvData = {
      header: { ...emptyCvData.header, ...parsed.header },
      summary: parsed.summary ?? "",
      yearsExperience: parsed.yearsExperience ?? "",
      showPhoto: parsed.showPhoto ?? false,
      showProjects: parsed.showProjects ?? true,
      headerBgColor: parsed.headerBgColor ?? null,
      headerTextColor: parsed.headerTextColor ?? null,
      headerBgImage: parsed.headerBgImage ?? null,
      headerBgImagePosition: parsed.headerBgImagePosition ?? null,
      experience: Array.isArray(parsed.experience) ? parsed.experience : [],
      education: Array.isArray(parsed.education) ? parsed.education : [],
      skills: parsed.skills && typeof parsed.skills === "object" ? parsed.skills : {},
      projects: Array.isArray(parsed.projects)
        ? parsed.projects.map((p: Record<string, unknown>) => ({
            id: p.id ?? crypto.randomUUID(),
            name: p.name ?? "",
            description: p.description ?? "",
            technologies: Array.isArray(p.technologies) ? p.technologies : [],
            url: p.url ?? null,
            type: p.type ?? "personal",
            role: p.role ?? "",
            impact: p.impact ?? "",
            highlights: Array.isArray(p.highlights) ? p.highlights : [],
            motivation: p.motivation ?? "",
            links: Array.isArray(p.links) ? p.links : [],
            linkedExperienceId: p.linkedExperienceId ?? null,
            displayMode: p.displayMode ?? "projects-section",
          }))
        : [],
      interests: Array.isArray(parsed.interests) ? parsed.interests : [],
    };
  } catch {
    cvData = emptyCvData;
  }

  let coverLetterData: CoverLetterData | null = null;
  if (cv.coverLetterData) {
    try {
      coverLetterData = JSON.parse(cv.coverLetterData);
    } catch {
      coverLetterData = null;
    }
  }

  return (
    <div className="-m-6 h-[calc(100vh-4rem)]">
      <CvPageTabs
        cvId={cv.id}
        initialCvData={cvData}
        initialTemplateId={cv.templateId as TemplateId}
        initialCoverLetterData={coverLetterData}
      />
    </div>
  );
}
