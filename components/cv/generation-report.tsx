import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GenerationReport } from "@/types/cv";

const SECTION_LABELS: Record<GenerationReport["rejected"][number]["section"], string> = {
  title: "Titre",
  summary: "Résumé",
  experience: "Expérience",
  project: "Projet",
};

/** How the generated CV was checked against the profile, and advice kept off the CV. */
export function GenerationReportPanel({ report }: { report: GenerationReport }) {
  const verified = report.checkedCount - report.rejected.length;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Vérification des faits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-gray-700">
            {verified} phrase{verified > 1 ? "s" : ""} rédigée{verified > 1 ? "s" : ""} par l&apos;IA{" "}
            {verified > 1 ? "ont été vérifiées" : "a été vérifiée"} par rapport à votre profil.
            Entreprises, dates, diplômes et compétences viennent directement de votre profil.
          </p>

          {report.method === "rules-only" && (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-800">
              La vérification approfondie n&apos;a pas pu s&apos;exécuter : seuls les contrôles
              automatiques (sources citées, chiffres) ont été appliqués. Relisez le CV.
            </p>
          )}

          {report.rejected.length > 0 && (
            <details className="rounded-lg border border-gray-200 p-3">
              <summary className="cursor-pointer font-medium text-gray-800">
                {report.rejected.length} élément{report.rejected.length > 1 ? "s" : ""} retiré
                {report.rejected.length > 1 ? "s" : ""} car absent{report.rejected.length > 1 ? "s" : ""} de
                votre profil
              </summary>
              <ul className="mt-3 space-y-2">
                {report.rejected.map((item, index) => (
                  <li key={index} className="text-gray-600">
                    <span className="text-xs font-medium uppercase text-gray-400">
                      {SECTION_LABELS[item.section]}
                    </span>
                    <p className="line-through decoration-gray-300">{item.text}</p>
                    <p className="text-xs text-gray-500">{item.reason}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-500">
                Si l&apos;un de ces éléments est vrai, ajoutez-le à votre profil : il sera utilisé à la
                prochaine génération.
              </p>
            </details>
          )}
        </CardContent>
      </Card>

      {report.skillsToAcquire.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compétences à acquérir pour ce poste</CardTitle>
            <p className="text-xs text-gray-500">
              Demandées par l&apos;offre, absentes de votre profil. Elles ne figurent pas sur votre CV.
            </p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {report.skillsToAcquire.map((item) => (
                <li key={item.skill}>
                  <p className="font-medium text-gray-900">{item.skill}</p>
                  <p className="text-gray-600">{item.reason}</p>
                  <p className="text-gray-500">
                    <span className="font-medium">Pour progresser : </span>
                    {item.howToAcquire}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
