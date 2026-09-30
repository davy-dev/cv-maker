import "server-only";
import path from "path";

/**
 * Uploaded profile photos live outside public/: in production, `next start` only
 * serves the public files that existed at build time. They are served by
 * app/uploads/[file]/route.ts under the same /uploads/<file> URLs.
 */
export const UPLOAD_DIR =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "data", "uploads");

export const IMAGE_CONTENT_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
} as const;

export type ImageExtension = keyof typeof IMAGE_CONTENT_TYPES;

/** Detects the real image format from the file's first bytes. */
export function detectImageExtension(bytes: Buffer): ImageExtension | null {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, i) => bytes[offset + i] === byte);

  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (startsWith([0xff, 0xd8, 0xff])) return "jpg";
  if (bytes.subarray(0, 6).toString("ascii").match(/^GIF8[79]a$/)) return "gif";
  if (
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}
