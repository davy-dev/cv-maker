import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generatedCvs } from "@/lib/db/schema";
import { normalizeCvData } from "@/lib/cv/normalize";
import { printPageToPdf } from "@/lib/cv/print-pdf";

/** Downloads the CV as a PDF printed by Chromium from its HTML print page. */
export async function GET(request: Request, ctx: RouteContext<"/api/cv/[id]/pdf">) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const cv = await db.query.generatedCvs.findFirst({
    where: eq(generatedCvs.id, id),
    columns: { userId: true, cvData: true },
  });
  if (!cv || cv.userId !== userId) {
    return NextResponse.json({ error: "CV non trouvé" }, { status: 404 });
  }

  let pdf: Buffer;
  try {
    pdf = await printPageToPdf(
      new URL(`/cv/${id}/print`, request.url).href,
      request.headers.get("cookie") ?? ""
    );
  } catch (error) {
    console.error("PDF printing failed:", error);
    return NextResponse.json({ error: "La génération du PDF a échoué" }, { status: 500 });
  }

  const name = normalizeCvData(cv.cvData).header.name || "sans_nom";
  const fileName = `CV_${name}`.replace(/[^a-zA-Z0-9]/g, "_");
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
