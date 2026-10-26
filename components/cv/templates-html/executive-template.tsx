import type { CvField } from "@/lib/cv/fields";
import { parseCustomSectionId, resolveLayout } from "@/lib/cv/layout";
import { selectionKey } from "@/lib/cv/selection";
import type { CvData, CvProject, SectionId } from "@/types/cv";
import { Editable, WhenFilled } from "./editable";
import styles from "./executive-template.module.css";

const DEFAULT_HEADER_BG = "linear-gradient(90deg, #110040cf 0%, #000829 91%)";
const DEFAULT_HEADER_TEXT = "#ffffff";

interface TemplateProps {
  data: CvData;
  /**
   * In the studio: text can be edited in place, and empty slots stay on the
   * page (with a placeholder) so they can be filled.
   */
  editable?: boolean;
}

/**
 * HTML template: printed to PDF by Chromium (see lib/cv/print-pdf.ts),
 * so the page shown is exactly the file downloaded.
 * Expects data already passed through applyVisibility().
 */
export function ExecutiveTemplate({ data, editable = false }: TemplateProps) {
  const { header } = data;
  const layout = resolveLayout(data);
  const position = data.headerBgImagePosition ?? { x: 50, y: 50 };
  const placeholder = (text: string) => (editable ? text : undefined);

  return (
    <div className={styles.page}>
      <header
        data-select="header"
        className={styles.header}
        style={{
          background: data.headerBgColor || DEFAULT_HEADER_BG,
          color: data.headerTextColor || DEFAULT_HEADER_TEXT,
        }}
      >
        {data.headerBgImage && (
          // eslint-disable-next-line @next/next/no-img-element -- printed by Chromium, no optimization wanted
          <img
            src={data.headerBgImage}
            alt=""
            className={styles.headerBgImage}
            style={{ objectPosition: `${position.x}% ${position.y}%` }}
          />
        )}
        {data.showPhoto &&
          (header.image ? (
            // eslint-disable-next-line @next/next/no-img-element -- printed by Chromium, no optimization wanted
            <img src={header.image} alt={header.name} className={styles.photo} />
          ) : (
            <div className={styles.photoPlaceholder} aria-hidden="true">
              {header.name?.[0] ?? "?"}
            </div>
          ))}
        <div className={styles.headerContent}>
          <h1 className={styles.name}>
            <Editable field={{ kind: "header", field: "name" }} value={header.name} placeholder={placeholder("Votre nom")} />
          </h1>
          {(header.title || editable) && (
            <div className={styles.title}>
              <Editable
                field={{ kind: "header", field: "title" }}
                value={header.title}
                placeholder={placeholder("Titre du poste visé")}
              />
            </div>
          )}
          {(data.yearsExperience || header.location || editable) && (
            <div className={styles.subtitle}>
              <Editable
                field={{ kind: "yearsExperience" }}
                value={data.yearsExperience}
                placeholder={placeholder("Années d'expérience")}
              />
              {data.yearsExperience && header.location && " · "}
              <Editable field={{ kind: "header", field: "location" }} value={header.location} />
            </div>
          )}
          <div className={styles.contacts}>
            <WhenFilled field={{ kind: "header", field: "email" }} value={header.email}>
              <a className={styles.contact} href={`mailto:${header.email}`}>
                <MailIcon />
                <Editable field={{ kind: "header", field: "email" }} value={header.email} />
              </a>
            </WhenFilled>
            <WhenFilled field={{ kind: "header", field: "phone" }} value={header.phone}>
              <span className={styles.contact}>
                <PhoneIcon />
                <Editable field={{ kind: "header", field: "phone" }} value={header.phone} />
              </span>
            </WhenFilled>
            <WhenFilled field={{ kind: "header", field: "linkedin" }} value={header.linkedin}>
              <a className={styles.contact} href={toHref(header.linkedin ?? "")}>
                <LinkedinIcon />
                <Editable
                  field={{ kind: "header", field: "linkedin" }}
                  value={header.linkedin ?? ""}
                  display={toDisplayUrl(header.linkedin ?? "")}
                />
              </a>
            </WhenFilled>
            <WhenFilled field={{ kind: "header", field: "github" }} value={header.github}>
              <a className={styles.contact} href={toHref(header.github ?? "")}>
                <GithubIcon />
                <Editable
                  field={{ kind: "header", field: "github" }}
                  value={header.github ?? ""}
                  display={toDisplayUrl(header.github ?? "")}
                />
              </a>
            </WhenFilled>
            <WhenFilled field={{ kind: "header", field: "website" }} value={header.website}>
              <a className={styles.contact} href={toHref(header.website ?? "")}>
                <GlobeIcon />
                <Editable
                  field={{ kind: "header", field: "website" }}
                  value={header.website ?? ""}
                  display={toDisplayUrl(header.website ?? "")}
                />
              </a>
            </WhenFilled>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <main className={styles.main}>
          {layout.main.map((section) => (
            <Section key={section} id={section} data={data} editable={editable} />
          ))}
        </main>
        <aside className={styles.aside}>
          {layout.aside.map((section) => (
            <Section key={section} id={section} data={data} editable={editable} />
          ))}
        </aside>
      </div>
    </div>
  );
}

/** One section, in whichever column the layout puts it; nothing when it is empty. */
function Section({ id, data, editable }: { id: SectionId; data: CvData; editable: boolean }) {
  const key = selectionKey({ kind: "section", section: id });
  const customId = parseCustomSectionId(id);
  if (customId) {
    const section = data.customSections?.find((s) => s.id === customId);
    if (!section) return null;
    // Line numbers address the stored content, blank lines included
    const lines = section.content
      .split("\n")
      .map((text, index) => ({ text, index }))
      .filter((line) => editable || line.text.trim());
    if (lines.length === 0) return null;
    return (
      <section data-select={key}>
        <h2 className={styles.sectionTitle}>
          <Editable
            field={{ kind: "customTitle", id: section.id }}
            value={section.title}
            placeholder={editable ? "Titre" : undefined}
          />
        </h2>
        {lines.map((line) => (
          <div key={line.index} className={styles.line}>
            <Editable
              field={{ kind: "customLine", id: section.id, index: line.index }}
              value={line.text}
              rich
              placeholder={editable ? "Écrire ici…" : undefined}
            />
          </div>
        ))}
      </section>
    );
  }

  switch (id) {
    case "summary": {
      // A hidden summary arrives empty: it stays off the page in the studio too
      const shown = data.summary || (editable && !data.hiddenSections?.includes("summary"));
      return (
        shown && (
          <section data-select={key}>
            <h2 className={styles.sectionTitle}>Profil</h2>
            <p className={styles.paragraph}>
              <Editable
                field={{ kind: "summary" }}
                value={data.summary}
                rich
                placeholder={editable ? "Présentez-vous en quelques lignes" : undefined}
              />
            </p>
          </section>
        )
      );
    }

    case "experience":
      return (
        data.experience.length > 0 && (
          <section data-select={key}>
            <h2 className={styles.sectionTitle}>Expérience professionnelle</h2>
            {data.experience.map((exp) => {
              const linkedProjects = data.projects.filter(
                (p) => p.displayMode === "under-experience" && p.linkedExperienceId === exp.id
              );
              const field = (name: "position" | "company" | "location" | "startDate" | "endDate"): CvField => ({
                kind: "experience",
                id: exp.id,
                field: name,
              });
              return (
                <div key={exp.id} data-select={`item:experience:${exp.id}`} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <div className={styles.itemTitle}>
                      <Editable
                        field={field("position")}
                        value={exp.position}
                        placeholder={editable && !exp.company ? "Poste" : undefined}
                      />
                      {exp.position && exp.company && " — "}
                      <Editable field={field("company")} value={exp.company} />
                    </div>
                    {(exp.startDate || exp.endDate || exp.location || editable) && (
                      <div className={styles.itemMeta}>
                        <Editable field={field("startDate")} value={exp.startDate} />
                        {exp.startDate && exp.endDate && " – "}
                        <Editable field={field("endDate")} value={exp.endDate} />
                        {(exp.startDate || exp.endDate) && exp.location && " · "}
                        <Editable field={field("location")} value={exp.location} />
                      </div>
                    )}
                  </div>
                  <Bullets
                    items={exp.bullets}
                    field={(index) => ({ kind: "experienceBullet", id: exp.id, index })}
                    editable={editable}
                  />
                  {linkedProjects.map((project) => (
                    <div key={project.id} data-select={`item:projects:${project.id}`} className={styles.subProject}>
                      <span className={styles.subProjectTitle}>
                        <Editable field={{ kind: "project", id: project.id, field: "name" }} value={project.name} />
                      </span>
                      {project.description && " — "}
                      <Editable
                        field={{ kind: "project", id: project.id, field: "description" }}
                        value={project.description}
                        rich
                      />
                      <Bullets
                        items={project.highlights}
                        field={(index) => ({ kind: "projectHighlight", id: project.id, index })}
                        editable={editable}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </section>
        )
      );

    case "projects": {
      const projects = data.projects.filter((p) => !p.displayMode || p.displayMode === "projects-section");
      return (
        projects.length > 0 && (
          <section data-select={key}>
            <h2 className={styles.sectionTitle}>Projets</h2>
            {projects.map((project) => (
              <ProjectItem key={project.id} project={project} editable={editable} />
            ))}
          </section>
        )
      );
    }

    case "skills": {
      const categories = Object.entries(data.skills).filter(([, skills]) => skills.length > 0);
      return (
        categories.length > 0 && (
          <section data-select={key}>
            <h2 className={styles.sectionTitle}>Compétences techniques</h2>
            <div className={styles.stack}>
              {categories.map(([category, skills]) => (
                <div key={category} data-select={`item:skills:${category}`} className={styles.item}>
                  <div className={styles.strong}>
                    <Editable field={{ kind: "skillCategory", category }} value={category} />
                  </div>
                  <div>
                    <Editable field={{ kind: "skillList", category }} value={skills.join(", ")} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      );
    }

    case "education":
      return (
        data.education.length > 0 && (
          <section data-select={key}>
            <h2 className={styles.sectionTitle}>Formation</h2>
            <div className={styles.stackLoose}>
              {data.education.map((edu) => {
                const field = (
                  name: "degree" | "field" | "institution" | "startDate" | "endDate" | "description"
                ): CvField => ({ kind: "education", id: edu.id, field: name });
                return (
                  <div key={edu.id} data-select={`item:education:${edu.id}`} className={styles.item}>
                    <div className={styles.strong}>
                      <Editable
                        field={field("degree")}
                        value={edu.degree}
                        placeholder={editable && !edu.field ? "Diplôme" : undefined}
                      />
                      {edu.degree && edu.field && " — "}
                      <Editable field={field("field")} value={edu.field} />
                    </div>
                    {(edu.institution || edu.startDate || edu.endDate || editable) && (
                      <div>
                        <Editable field={field("institution")} value={edu.institution} />
                        {edu.institution && (edu.startDate || edu.endDate) && " · "}
                        <Editable field={field("startDate")} value={edu.startDate} />
                        {edu.startDate && edu.endDate && " – "}
                        <Editable field={field("endDate")} value={edu.endDate} />
                      </div>
                    )}
                    {(edu.description || editable) && (
                      <div className={styles.muted}>
                        <Editable field={field("description")} value={edu.description} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )
      );

    case "interests":
      return (
        data.interests.length > 0 && (
          <section data-select={key}>
            <h2 className={styles.sectionTitle}>Centres d&apos;intérêt</h2>
            {data.interests.map((interest, index) => (
              <div key={index} className={styles.line}>
                <Editable
                  field={{ kind: "interest", index }}
                  value={interest}
                  placeholder={editable ? "Nouvel intérêt" : undefined}
                />
              </div>
            ))}
          </section>
        )
      );
  }
}

function ProjectItem({ project, editable }: { project: CvProject; editable: boolean }) {
  const field = (name: "name" | "role" | "description" | "impact"): CvField => ({
    kind: "project",
    id: project.id,
    field: name,
  });
  const technologies = project.technologies.join(", ");
  return (
    <div data-select={`item:projects:${project.id}`} className={styles.item}>
      <div className={styles.itemHeader}>
        <div className={styles.itemTitle}>
          <Editable field={field("name")} value={project.name} placeholder={editable ? "Nom du projet" : undefined} />
        </div>
        {project.url && (
          <a className={styles.itemMeta} href={toHref(project.url)}>
            {toDisplayUrl(project.url)}
          </a>
        )}
      </div>
      {(project.role || technologies || editable) && (
        <div className={styles.itemNote}>
          <Editable field={field("role")} value={project.role} />
          {project.role && technologies && " · "}
          {technologies}
        </div>
      )}
      {(project.description || editable) && (
        <p className={styles.paragraph}>
          <Editable field={field("description")} value={project.description} rich />
        </p>
      )}
      <Bullets
        items={project.highlights}
        field={(index) => ({ kind: "projectHighlight", id: project.id, index })}
        editable={editable}
      />
      {(project.impact || editable) && (
        <p className={styles.paragraph}>
          <Editable field={field("impact")} value={project.impact} rich />
        </p>
      )}
    </div>
  );
}

/** Empty points are left out of the print, but kept in the studio to be typed into. */
function Bullets({
  items,
  field,
  editable,
}: {
  items: string[];
  field: (index: number) => CvField;
  editable: boolean;
}) {
  const lines = items.map((text, index) => ({ text, index })).filter((line) => editable || line.text.trim());
  if (lines.length === 0) return null;
  return (
    <ul className={styles.bullets}>
      {lines.map((line) => (
        <li key={line.index}>
          <Editable field={field(line.index)} value={line.text} rich placeholder={editable ? "Nouveau point" : undefined} />
        </li>
      ))}
    </ul>
  );
}

function toHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function toDisplayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

// Stroke icons drawn with the header text color
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function MailIcon() {
  return (
    <Icon>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </Icon>
  );
}

function PhoneIcon() {
  return (
    <Icon>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </Icon>
  );
}

function LinkedinIcon() {
  return (
    <Icon>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </Icon>
  );
}

function GithubIcon() {
  return (
    <Icon>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </Icon>
  );
}

function GlobeIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </Icon>
  );
}
