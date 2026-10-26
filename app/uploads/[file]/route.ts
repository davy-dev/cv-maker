import { readFile } from "fs/promises";
import path from "path";
import { UPLOAD_DIR, IMAGE_CONTENT_TYPES, type ImageExtension } from "@/lib/uploads";

// Only names produced by the upload route: "<userId>-<timestamp>.<ext>"
const FILE_NAME = /^[a-z0-9]+-\d+\.(png|jpg|gif|webp)$/;

export async function GET(_request: Request, ctx: RouteContext<"/uploads/[file]">) {
  const { file } = await ctx.params;
  const match = FILE_NAME.exec(file);
  if (!match) {
    return new Response(null, { status: 404 });
  }

  try {
    const data = await readFile(path.join(UPLOAD_DIR, file));
    return new Response(data, {
      headers: {
        "Content-Type": IMAGE_CONTENT_TYPES[match[1] as ImageExtension],
        "X-Content-Type-Options": "nosniff",
        // Each upload gets a new name, so a given URL never changes
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
