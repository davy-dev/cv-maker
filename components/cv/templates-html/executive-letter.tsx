import type { LetterField, LetterTextField } from "@/lib/cv/letter";
import type { CoverLetterData, CoverLetterRecipient, CvData } from "@/types/cv";
import { Editable } from "./editable";
import { ExecutiveHeader } from "./executive-template";
import page from "./executive-template.module.css";
import styles from "./executive-letter.module.css";

const PARAGRAPHS: LetterTextField[] = ["introduction", "motivation", "skillsMatch", "conclusion"];
const RECIPIENT_LINES: (keyof CoverLetterRecipient)[] = ["contactName", "contactTitle", "address", "city"];

/**
 * The cover letter, matching the CV: same banner (name, title, contacts and
 * colors come from the CV), then a classic French letter layout.
 */
export function ExecutiveLetter({
  cv,
  letter,
  editable = false,
}: {
  cv: CvData;
  letter: CoverLetterData;
  editable?: boolean;
}) {
  const text = (field: LetterTextField, placeholder?: string, rich = false) => (
    <Editable
      field={{ kind: "letter", field } satisfies LetterField}
      value={letter[field]}
      rich={rich}
      placeholder={editable ? placeholder : undefined}
    />
  );

  return (
    <div className={page.page} data-select="letter">
      <ExecutiveHeader data={cv} editable={false} />
      <div className={styles.body}>
        <address className={styles.recipient} style={{ fontStyle: "normal" }}>
          <div className={styles.company}>
            <Editable
              field={{ kind: "letterRecipient", field: "companyName" }}
              value={letter.recipient.companyName}
              placeholder={editable ? "Entreprise" : undefined}
            />
          </div>
          {RECIPIENT_LINES.map((field) =>
            letter.recipient[field] || editable ? (
              <div key={field}>
                <Editable field={{ kind: "letterRecipient", field }} value={letter.recipient[field] ?? ""} />
              </div>
            ) : null
          )}
        </address>

        <div className={styles.dateLine}>
          {text("senderCity", "Ville")}
          {letter.senderCity && letter.date && ", le "}
          {text("date", "Date")}
        </div>

        <p className={styles.subject}>{text("subject", "Objet : …")}</p>
        <p className={styles.paragraph}>{text("opening", "Madame, Monsieur,")}</p>
        {PARAGRAPHS.map((field) =>
          letter[field] || editable ? (
            <p key={field} className={styles.paragraph}>
              {text(field, "Écrire ce paragraphe…", true)}
            </p>
          ) : null
        )}
        <p className={styles.paragraph}>{text("closing", "Formule de politesse")}</p>
        <div className={styles.signature}>{text("senderName", "Votre nom")}</div>
      </div>
    </div>
  );
}
