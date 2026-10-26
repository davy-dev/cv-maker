import { Fragment } from "react";

const BOLD = /\*\*(.+?)\*\*/g;

/** Splits "**Lead-in** : rest" into plain and bold runs. */
export function parseRichText(text: string): { text: string; bold: boolean }[] {
  const runs: { text: string; bold: boolean }[] = [];
  let last = 0;
  for (const match of text.matchAll(BOLD)) {
    if (match.index > last) runs.push({ text: text.slice(last, match.index), bold: false });
    runs.push({ text: match[1], bold: true });
    last = match.index + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), bold: false });
  return runs;
}

/** Renders text where **double asterisks** mark bold, the only formatting a CV line needs. */
export function RichText({ text }: { text: string }) {
  return parseRichText(text).map((run, i) =>
    run.bold ? <b key={i}>{run.text}</b> : <Fragment key={i}>{run.text}</Fragment>
  );
}
