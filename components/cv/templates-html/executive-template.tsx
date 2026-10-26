import type { CvData, CvProject } from "@/types/cv";
import { RichText } from "./rich-text";
import styles from "./executive-template.module.css";

const DEFAULT_HEADER_BG = "linear-gradient(90deg, #110040cf 0%, #000829 91%)";
const DEFAULT_HEADER_TEXT = "#ffffff";

/**
 * HTML template: printed to PDF by Chromium (see lib/cv/print-pdf.ts),
 * so the page shown is exactly the file downloaded.
 * Expects data already passed through applyVisibility().
 */
export function ExecutiveTemplate({ data }: { data: CvData }) {
  const { header } = data;
  const sectionProjects = data.projects.filter(
    (p) => !p.displayMode || p.displayMode === "projects-section"
  );
  const skillCategories = Object.entries(data.skills).filter(([, skills]) => skills.length > 0);
  const subtitle = [data.yearsExperience, header.location].filter(Boolean).join(" · ");
  const position = data.headerBgImagePosition ?? { x: 50, y: 50 };

  return (
    <div className={styles.page}>
      <header
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
          <h1 className={styles.name}>{header.name}</h1>
          {header.title && <div className={styles.title}>{header.title}</div>}
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          <div className={styles.contacts}>
            {header.email && (
              <a className={styles.contact} href={`mailto:${header.email}`}>
                <MailIcon />
                {header.email}
              </a>
            )}
            {header.phone && (
              <span className={styles.contact}>
                <PhoneIcon />
                {header.phone}
              </span>
            )}
            {header.linkedin && (
              <a className={styles.contact} href={toHref(header.linkedin)}>
                <LinkedinIcon />
                {toDisplayUrl(header.linkedin)}
              </a>
            )}
            {header.github && (
              <a className={styles.contact} href={toHref(header.github)}>
                <GithubIcon />
                {toDisplayUrl(header.github)}
              </a>
            )}
            {header.website && (
              <a className={styles.contact} href={toHref(header.website)}>
                <GlobeIcon />
                {toDisplayUrl(header.website)}
              </a>
            )}
          </div>
        </div>
      </header>

      <div className={styles.body}>
        <main className={styles.main}>
          {data.summary && (
            <section>
              <h2 className={styles.sectionTitle}>Profil</h2>
              <p className={styles.paragraph}>
                <RichText text={data.summary} />
              </p>
            </section>
          )}

          {data.experience.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Expérience professionnelle</h2>
              {data.experience.map((exp) => {
                const linkedProjects = data.projects.filter(
                  (p) => p.displayMode === "under-experience" && p.linkedExperienceId === exp.id
                );
                return (
                  <div key={exp.id} className={styles.item}>
                    <div className={styles.itemHeader}>
                      <div className={styles.itemTitle}>
                        {[exp.position, exp.company].filter(Boolean).join(" — ")}
                      </div>
                      <div className={styles.itemMeta}>
                        {[formatPeriod(exp.startDate, exp.endDate), exp.location]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <Bullets items={exp.bullets} />
                    {linkedProjects.map((project) => (
                      <div key={project.id} className={styles.subProject}>
                        <span className={styles.subProjectTitle}>{project.name}</span>
                        {project.description && <> — {project.description}</>}
                        <Bullets items={project.highlights} />
                      </div>
                    ))}
                  </div>
                );
              })}
            </section>
          )}

          {sectionProjects.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Projets</h2>
              {sectionProjects.map((project) => (
                <ProjectItem key={project.id} project={project} />
              ))}
            </section>
          )}
        </main>

        <aside className={styles.aside}>
          {skillCategories.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Compétences techniques</h2>
              <div className={styles.stack}>
                {skillCategories.map(([category, skills]) => (
                  <div key={category} className={styles.item}>
                    <div className={styles.strong}>{category}</div>
                    <div>{skills.join(", ")}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.education.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Formation</h2>
              <div className={styles.stackLoose}>
                {data.education.map((edu) => (
                  <div key={edu.id} className={styles.item}>
                    <div className={styles.strong}>
                      {[edu.degree, edu.field].filter(Boolean).join(" — ")}
                    </div>
                    <div>
                      {[edu.institution, formatPeriod(edu.startDate, edu.endDate)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    {edu.description && <div className={styles.muted}>{edu.description}</div>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.interests.length > 0 && (
            <section>
              <h2 className={styles.sectionTitle}>Centres d&apos;intérêt</h2>
              {data.interests.map((interest, i) => (
                <div key={i}>{interest}</div>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function ProjectItem({ project }: { project: CvProject }) {
  const note = [project.role, project.technologies.join(", ")].filter(Boolean).join(" · ");
  return (
    <div className={styles.item}>
      <div className={styles.itemHeader}>
        <div className={styles.itemTitle}>{project.name}</div>
        {project.url && (
          <a className={styles.itemMeta} href={toHref(project.url)}>
            {toDisplayUrl(project.url)}
          </a>
        )}
      </div>
      {note && <div className={styles.itemNote}>{note}</div>}
      {project.description && (
        <p className={styles.paragraph}>
          <RichText text={project.description} />
        </p>
      )}
      <Bullets items={project.highlights} />
      {project.impact && (
        <p className={styles.paragraph}>
          <RichText text={project.impact} />
        </p>
      )}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  const lines = items.filter((item) => item.trim());
  if (lines.length === 0) return null;
  return (
    <ul className={styles.bullets}>
      {lines.map((line, i) => (
        <li key={i}>
          <RichText text={line} />
        </li>
      ))}
    </ul>
  );
}

function formatPeriod(start: string, end: string): string {
  return start && end ? `${start} – ${end}` : end || start;
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
