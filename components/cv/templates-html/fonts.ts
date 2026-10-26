import { Source_Sans_3, Source_Serif_4 } from "next/font/google";

// Self-hosted by next/font: nothing is fetched from Google when Chromium prints
const sans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-cv-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-cv-serif" });

/** Class names defining the CSS variables the HTML templates use for their fonts. */
export const cvFontVariables = `${sans.variable} ${serif.variable}`;
