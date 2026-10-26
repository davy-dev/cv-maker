import Database from "better-sqlite3";

// The CV is written straight into the E2E database: the app never calls Claude here.
export function insertCv(email: string, experienceCount = 1): string {
  const db = new Database("data/e2e.db");
  try {
    const { id: userId } = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string };
    const cvId = `e2e${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
    const cvData = {
      header: { name: "Camille Test", title: "Développeuse fullstack", email, phone: "0600000000", location: "Lyon", website: null, linkedin: "linkedin.com/in/camille", github: null, image: null },
      summary: "Développeuse **full-stack** depuis 5 ans.",
      yearsExperience: "5 ans d'expérience",
      showPhoto: true,
      showProjects: true,
      headerBgColor: null,
      headerTextColor: null,
      headerBgImage: null,
      headerBgImagePosition: null,
      experience: Array.from({ length: experienceCount }, (_, i) => ({
        id: `exp${i}`, company: `Entreprise ${i}`, position: "Développeuse", location: "Lyon", startDate: "2020-01", endDate: "Présent",
        bullets: Array.from({ length: 4 }, (_, j) => `**Réalisation ${j}** décrite assez longuement pour occuper une ligne entière du CV.`),
      })),
      education: [],
      skills: { Langages: ["TypeScript", "SQL"] },
      projects: [],
      interests: ["Piano"],
    };
    db.prepare(
      "INSERT INTO generated_cvs (id, user_id, title, job_offer_text, cv_data, template_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'modern', 'draft', ?, ?)"
    ).run(cvId, userId, "Test", "Offre", JSON.stringify(cvData), Date.now() / 1000, Date.now() / 1000);
    return cvId;
  } finally {
    db.close();
  }
}
