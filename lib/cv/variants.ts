/**
 * The looks a CV can take: one HTML structure (the executive template) with
 * different colours, fonts and header styles. The ids are the template ids
 * stored with each CV, so CVs made before keep the style they were given.
 */
export const VARIANTS = [
  {
    id: "executive",
    label: "Executive",
    description: "Bandeau dégradé nuit, nom en serif, accents bleus",
    swatch: { band: "#1b0f4d", accent: "#2f6fb0" },
  },
  {
    id: "modern",
    label: "Moderne",
    description: "Bandeau bleu marine, tout en sans-serif, bleu vif",
    swatch: { band: "#0f172a", accent: "#2563eb" },
  },
  {
    id: "classic",
    label: "Classique",
    description: "En-tête blanc centré, filet noir, serif",
    swatch: { band: "#ffffff", accent: "#1a1a1a" },
  },
  {
    id: "minimalist",
    label: "Minimaliste",
    description: "Sans couleur, aéré, titres gris discrets",
    swatch: { band: "#ffffff", accent: "#6b7280" },
  },
  {
    id: "elegant",
    label: "Élégant",
    description: "Bandeau ardoise, titres serif, accents dorés",
    swatch: { band: "#1e293b", accent: "#c9a54c" },
  },
] as const;

export type VariantId = (typeof VARIANTS)[number]["id"];

export const VARIANT_IDS = VARIANTS.map((v) => v.id) as [VariantId, ...VariantId[]];

export const DEFAULT_VARIANT: VariantId = "executive";
