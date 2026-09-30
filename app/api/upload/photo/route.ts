import { getCurrentUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { UPLOAD_DIR, detectImageExtension } from "@/lib/uploads";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Fichier trop volumineux (max 2 Mo)" },
      { status: 400 }
    );
  }

  // Validate the actual content: the MIME type and file name are client-controlled,
  // and anything saved here is served from our own origin.
  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = detectImageExtension(buffer);
  if (!ext) {
    return NextResponse.json(
      { error: "Format non supporté : utilisez une image JPG, PNG, GIF ou WebP" },
      { status: 400 }
    );
  }

  // A new name on every upload, so browsers and the image optimizer never serve the old photo.
  // Previous files are kept: CVs generated earlier still reference them.
  const fileName = `${userId}-${Date.now()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, fileName), buffer);

  const imageUrl = `/uploads/${fileName}`;

  await db
    .update(users)
    .set({ image: imageUrl, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return NextResponse.json({ url: imageUrl });
}
