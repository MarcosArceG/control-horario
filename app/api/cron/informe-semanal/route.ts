import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { authSafe } from "@/lib/auth-safe";
import { parseDateInput } from "@/lib/vacation-days";
import { buildWeeklyReport, renderWeeklyReport, sendWeeklyReport } from "@/lib/weekly-report";

export const dynamic = "force-dynamic";

/**
 * Informe semanal de horas.
 *
 *   POST  Authorization: Bearer $CRON_SECRET  → envía el informe de la semana actual
 *         ?semana=YYYY-MM-DD  cualquier día de la semana a enviar (por defecto, hoy)
 *         ?para=a@b.com       destinatario alternativo (pruebas)
 *   GET   (sesión de superadmin) → vista previa en HTML, sin enviar. Admite ?semana=.
 *
 * Lo dispara una tarea programada de Coolify los domingos (ver DESPLIEGUE-VPS.md).
 */

function refDate(req: NextRequest): Date | NextResponse {
  const semana = req.nextUrl.searchParams.get("semana");
  if (!semana) return new Date();
  try {
    // Mediodía UTC: cae en el mismo día civil en España.
    return new Date(parseDateInput(semana).getTime() + 12 * 3600 * 1000);
  } catch {
    return NextResponse.json({ error: "semana debe ser YYYY-MM-DD" }, { status: 400 });
  }
}

function validCronSecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function POST(req: NextRequest) {
  if (!validCronSecret(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const ref = refDate(req);
  if (ref instanceof NextResponse) return ref;

  const para = req.nextUrl.searchParams.get("para")?.trim().toLowerCase();
  try {
    const result = await sendWeeklyReport(ref, para ? [para] : undefined);
    console.log("[informe-semanal] enviado", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[informe-semanal]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await authSafe();
  if (session?.user?.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const ref = refDate(req);
  if (ref instanceof NextResponse) return ref;

  const { subject, html } = renderWeeklyReport(await buildWeeklyReport(ref));
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><title>${subject}</title><body style="margin:24px">${html}</body>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
