import { Buffer } from "buffer";

/**
 * Convert a base64 data URL to a Buffer that react-pdf can render.
 * react-pdf has a known bug with base64 data URL strings in the Image `src` prop,
 * so we pass the raw binary Buffer instead.
 */
export function toImageSrc(
  dataUrl: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  if (!dataUrl.startsWith("data:")) return dataUrl;

  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return dataUrl;

  return Buffer.from(match[2], "base64");
}
