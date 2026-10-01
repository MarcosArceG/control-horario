import { addDays, startOfMonth } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { escapeHtml, sendEmail } from "@/lib/email";
import { APP_TIMEZONE, formatDuracionHM } from "@/lib/locale";
import { mondayOfWeek, toEffectiveEvents, type EffectiveEvent } from "@/lib/time";

/**
 * Informe semanal de horas (lunes–domingo) por trabajador, con el acumulado del mes.
 * Se envía los domingos por la tarde vía /api/cron/informe-semanal.
 *
 * Variables:
 *   WEEKLY_REPORT_EMAILS   destinatarios separados por coma (por defecto informes@njm.es)
 *   WEEKLY_REPORT_EXCLUDE  correos de usuarios a excluir, separados por coma
 *                          (por defecto los perfiles de prueba: Marcos Arce y Tester)
 */

const DEFAULT_RECIPIENTS = ["informes@njm.es"];
const DEFAULT_EXCLUDED = ["markosarce@gmail.com", "info@gestiondelamianto.com"];
/** Un tramo más largo que esto casi seguro es una salida olvidada. */
const LONG_SESSION_MS = 12 * 60 * 60 * 1000;

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function emailList(raw: string | undefined, fallback: string[]): string[] {
  const list = (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? [...new Set(list)] : fallback;
}

export function weeklyReportRecipients(): string[] {
  return emailList(process.env.WEEKLY_REPORT_EMAILS, DEFAULT_RECIPIENTS);
}

function excludedEmails(): string[] {
  return emailList(process.env.WEEKLY_REPORT_EXCLUDE, DEFAULT_EXCLUDED);
}

/** Tramo Entrada → Salida. `end` null = jornada sin cerrar (falta la salida). */
type Session = { start: Date; end: Date | null; breakMs: number };

function buildSessions(events: EffectiveEvent[]): Session[] {
  const sessions: Session[] = [];
  let open: { start: Date; breakMs: number; breakOpen?: Date } | null = null;

  for (const e of events) {
    switch (e.type) {
      case "CLOCK_IN":
        if (!open) open = { start: e.occurredAt, breakMs: 0 };
        break;
      case "BREAK_START":
        if (open && !open.breakOpen) open.breakOpen = e.occurredAt;
        break;
      case "BREAK_END":
        if (open?.breakOpen) {
          open.breakMs += e.occurredAt.getTime() - open.breakOpen.getTime();
          open.breakOpen = undefined;
        }
        break;
      case "CLOCK_OUT":
        if (open) {
          const breakMs = open.breakOpen
            ? open.breakMs + e.occurredAt.getTime() - open.breakOpen.getTime()
            : open.breakMs;
          sessions.push({ start: open.start, end: e.occurredAt, breakMs });
          open = null;
        }
        break;
    }
  }
  if (open) sessions.push({ start: open.start, end: null, breakMs: open.breakMs });
  return sessions;
}

/** Horas netas del tramo. Sin salida o con salida olvidada (> 12 h) no suma hasta que se corrija. */
function sessionMs(s: Session): number {
  if (!s.end || s.end.getTime() - s.start.getTime() > LONG_SESSION_MS) return 0;
  return Math.max(0, s.end.getTime() - s.start.getTime() - s.breakMs);
}

const ymd = (d: Date) => formatInTimeZone(d, APP_TIMEZONE, "yyyy-MM-dd");
const hm = (d: Date) => formatInTimeZone(d, APP_TIMEZONE, "HH:mm");
const dm = (d: Date) => formatInTimeZone(d, APP_TIMEZONE, "dd/MM");
const dmy = (d: Date) => formatInTimeZone(d, APP_TIMEZONE, "dd/MM/yyyy");

/** "9 h 05 min" para totales (más legible que HH:MM en importes grandes). */
function horas(ms: number): string {
  const [h, m] = formatDuracionHM(ms).split(":");
  return `${Number(h)} h ${m} min`;
}

export type ReportDay = {
  ymd: string;
  label: string;
  /** Pares entrada/salida en hora local; salida null = falta fichar la salida. */
  sessions: { in: string; out: string | null }[];
  workedMs: number;
  vacation: boolean;
  issues: string[];
};

export type ReportWorker = {
  name: string;
  email: string;
  days: ReportDay[];
  weekMs: number;
  weekVacationDays: number;
  /** Acumulado del mes del domingo, del día 1 al domingo. */
  monthMs: number;
  /** Si la semana empieza en el mes anterior: total cerrado de ese mes. */
  prevMonthMs: number | null;
  issueCount: number;
};

export type WeeklyReport = {
  weekStart: Date;
  weekEnd: Date;
  monthName: string;
  prevMonthName: string | null;
  workers: ReportWorker[];
};

/** Calcula el informe de la semana (lunes–domingo) que contiene `ref`. */
export async function buildWeeklyReport(ref: Date = new Date()): Promise<WeeklyReport> {
  const weekStart = mondayOfWeek(ref);
  const zMon = toZonedTime(weekStart, APP_TIMEZONE);
  const zSun = addDays(zMon, 6);
  const weekEnd = fromZonedTime(addDays(zMon, 7), APP_TIMEZONE);

  const zMonthStart = startOfMonth(zSun);
  const monthStart = fromZonedTime(zMonthStart, APP_TIMEZONE);
  const spansTwoMonths = zMon.getMonth() !== zSun.getMonth();
  const zPrevMonthStart = startOfMonth(zMon);
  const rangeStart = spansTwoMonths ? fromZonedTime(zPrevMonthStart, APP_TIMEZONE) : monthStart;

  const excluded = excludedEmails();
  const users = await prisma.user.findMany({
    where: { role: "USER", email: { notIn: excluded } },
    select: { id: true, email: true, name: true },
    orderBy: { name: "asc" },
  });
  const userIds = users.map((u) => u.id);

  // Margen de un día antes para no perder una entrada de la víspera.
  const [events, corrections, vacations] = await Promise.all([
    prisma.timeEvent.findMany({
      where: {
        userId: { in: userIds },
        occurredAt: { gte: addDays(rangeStart, -1), lt: addDays(weekEnd, 1) },
      },
    }),
    prisma.timeCorrection.findMany({ where: { userId: { in: userIds }, status: "APPROVED" } }),
    prisma.vacationEntry.findMany({
      where: {
        userId: { in: userIds },
        status: "APPROVED",
        startDate: { lte: new Date(`${ymd(addDays(weekEnd, -1))}T00:00:00Z`) },
        endDate: { gte: new Date(`${ymd(weekStart)}T00:00:00Z`) },
      },
    }),
  ]);

  const dayList = Array.from({ length: 7 }, (_, i) => {
    const start = fromZonedTime(addDays(zMon, i), APP_TIMEZONE);
    return { ymd: ymd(start), label: `${WEEKDAYS[i]} ${dm(start)}`, weekend: i >= 5 };
  });
  const weekEndYmd = dayList[6].ymd;
  const monthStartYmd = ymd(monthStart);
  const todayYmd = ymd(new Date());

  const workers: ReportWorker[] = users.map((u) => {
    const effective = toEffectiveEvents(
      events.filter((e) => e.userId === u.id),
      corrections.filter((c) => c.userId === u.id),
    );
    // Cada tramo cuenta entero en el día en que se fichó la entrada.
    const sessions = buildSessions(effective).filter(
      (s) => s.start >= rangeStart && s.start < weekEnd,
    );
    const userVacations = vacations
      .filter((v) => v.userId === u.id)
      .map((v) => ({ from: v.startDate.toISOString().slice(0, 10), to: v.endDate.toISOString().slice(0, 10) }));

    let monthMs = 0;
    let prevMonthMs = 0;
    for (const s of sessions) {
      const day = ymd(s.start);
      if (day > weekEndYmd) continue;
      if (day >= monthStartYmd) monthMs += sessionMs(s);
      else prevMonthMs += sessionMs(s);
    }

    const days: ReportDay[] = dayList.map((d) => {
      const daySessions = sessions.filter((s) => ymd(s.start) === d.ymd);
      const vacation = userVacations.some((v) => v.from <= d.ymd && d.ymd <= v.to);
      const issues: string[] = [];
      for (const s of daySessions) {
        if (!s.end) issues.push(`Falta fichar la salida (entrada ${hm(s.start)})`);
        else if (s.end.getTime() - s.start.getTime() > LONG_SESSION_MS)
          issues.push(`Tramo de ${horas(s.end.getTime() - s.start.getTime())}: posible salida olvidada, no se suma`);
        else if (ymd(s.end) !== d.ymd) issues.push(`Salida al día siguiente (${dmy(s.end)})`);
      }
      if (vacation && daySessions.length > 0) issues.push("Ha fichado estando de vacaciones");
      if (!vacation && !d.weekend && daySessions.length === 0 && d.ymd <= todayYmd)
        issues.push("Sin fichajes");
      return {
        ymd: d.ymd,
        label: d.label,
        sessions: daySessions.map((s) => ({ in: hm(s.start), out: s.end ? hm(s.end) : null })),
        workedMs: daySessions.reduce((acc, s) => acc + sessionMs(s), 0),
        vacation,
        issues,
      };
    });

    return {
      name: u.name?.trim() || u.email,
      email: u.email,
      days,
      weekMs: days.reduce((acc, d) => acc + d.workedMs, 0),
      weekVacationDays: days.filter((d) => d.vacation).length,
      monthMs,
      prevMonthMs: spansTwoMonths ? prevMonthMs : null,
      issueCount: days.reduce((acc, d) => acc + d.issues.length, 0),
    };
  });

  return {
    weekStart,
    weekEnd,
    monthName: MONTHS[zSun.getMonth()],
    prevMonthName: spansTwoMonths ? MONTHS[zMon.getMonth()] : null,
    workers,
  };
}

// ---------------------------------------------------------------------------
// Presentación
// ---------------------------------------------------------------------------

const C = {
  border: "#ddd",
  head: "#f3f3f3",
  muted: "#888",
  vacation: "#e8f4ea",
  vacationText: "#2e7d32",
  warn: "#fff4e5",
  warnText: "#b45309",
};
const td = (extra = "") =>
  `style="padding:6px 8px;border:1px solid ${C.border};${extra}"`;

function weekTitle(r: WeeklyReport) {
  return `${dmy(r.weekStart)} – ${dmy(addDays(r.weekEnd, -1))}`;
}

function sessionColumns(w: ReportWorker): number {
  return Math.max(2, ...w.days.map((d) => d.sessions.length));
}

function workerHtml(w: ReportWorker, r: WeeklyReport): string {
  const pairs = sessionColumns(w);
  const head = [
    "Día",
    ...Array.from({ length: pairs }, (_, i) => [`Entrada ${i + 1}`, `Salida ${i + 1}`]).flat(),
    "Horas",
  ];
  const cols = head.length;

  const rows = w.days
    .filter((d, i) => i < 5 || d.sessions.length > 0 || d.vacation)
    .map((d) => {
      const bg = d.vacation ? C.vacation : d.issues.length ? C.warn : "#fff";
      let cells: string;
      if (d.vacation && d.sessions.length === 0) {
        cells = `<td ${td(`text-align:center;color:${C.vacationText}`)} colspan="${cols - 1}">Vacaciones</td>`;
      } else {
        const times = Array.from({ length: pairs }, (_, i) => {
          const s = d.sessions[i];
          return [
            s?.in ?? "",
            s ? (s.out ?? `<span style="color:${C.warnText}">—</span>`) : "",
          ];
        }).flat();
        cells =
          times.map((t) => `<td ${td("text-align:center")}>${t}</td>`).join("") +
          `<td ${td("text-align:right;font-weight:bold")}>${d.workedMs ? formatDuracionHM(d.workedMs) : ""}</td>`;
      }
      const issueRow = d.issues.length
        ? `<tr style="background:${bg}"><td ${td(`font-size:12px;color:${C.warnText}`)} colspan="${cols}">⚠ ${d.issues.map(escapeHtml).join(" · ")}</td></tr>`
        : "";
      return `<tr style="background:${bg}"><td ${td("white-space:nowrap")}>${d.label}</td>${cells}</tr>${issueRow}`;
    })
    .join("");

  const totals = [
    `<strong>Total semana:</strong> ${horas(w.weekMs)}`,
    `<strong>Acumulado ${r.monthName}:</strong> ${horas(w.monthMs)}`,
    ...(w.prevMonthMs !== null && r.prevMonthName
      ? [`<strong>Total ${r.prevMonthName} (cerrado):</strong> ${horas(w.prevMonthMs)}`]
      : []),
    ...(w.weekVacationDays
      ? [`<strong>Vacaciones esta semana:</strong> ${w.weekVacationDays} ${w.weekVacationDays === 1 ? "día" : "días"}`]
      : []),
  ];

  return `
<h3 style="margin:28px 0 6px">${escapeHtml(w.name)} <span style="font-weight:normal;color:${C.muted};font-size:13px">${escapeHtml(w.email)}</span></h3>
<table style="border-collapse:collapse;font-size:13px;width:100%;max-width:760px">
  <tr style="background:${C.head}">${head.map((h) => `<th ${td("text-align:center")}>${h}</th>`).join("")}</tr>
  ${rows}
</table>
<p style="margin:6px 0 0">${totals.join(" &nbsp;·&nbsp; ")}</p>`;
}

export function renderWeeklyReport(r: WeeklyReport): { subject: string; html: string; text: string } {
  const title = weekTitle(r);
  const prevCol = r.prevMonthName;

  const summaryHead = [
    "Trabajador",
    "Semana",
    `Acumulado ${r.monthName}`,
    ...(prevCol ? [`Total ${prevCol}`] : []),
    "Vacaciones",
    "Incidencias",
  ];
  const summaryRows = r.workers
    .map(
      (w) => `<tr>
    <td ${td()}>${escapeHtml(w.name)}</td>
    <td ${td("text-align:right;font-weight:bold")}>${horas(w.weekMs)}</td>
    <td ${td("text-align:right")}>${horas(w.monthMs)}</td>
    ${prevCol ? `<td ${td("text-align:right")}>${horas(w.prevMonthMs ?? 0)}</td>` : ""}
    <td ${td("text-align:center")}>${w.weekVacationDays ? `${w.weekVacationDays} d` : "—"}</td>
    <td ${td(`text-align:center;${w.issueCount ? `color:${C.warnText};font-weight:bold` : ""}`)}>${w.issueCount || "—"}</td>
  </tr>`,
    )
    .join("");

  const html = `
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.5">
  <h2 style="margin:0 0 4px">Informe semanal de horas</h2>
  <p style="margin:0 0 16px;color:${C.muted}">Semana del ${title} · horario de España peninsular</p>
  <table style="border-collapse:collapse;font-size:13px">
    <tr style="background:${C.head}">${summaryHead.map((h) => `<th ${td()}>${h}</th>`).join("")}</tr>
    ${summaryRows}
  </table>
  ${r.workers.map((w) => workerHtml(w, r)).join("\n")}
  <p style="margin-top:28px;font-size:12px;color:${C.muted}">
    Las horas son netas (sin pausas) e incluyen las correcciones aprobadas. Cada tramo cuenta en el día de su entrada.
    Fondo verde: vacaciones aprobadas. Fondo naranja: día con incidencias para revisar.
    Un “—” en la salida (no se fichó) o un tramo de más de 12 h (salida olvidada) no suma horas hasta que se corrija en la app.
  </p>
</div>`;

  const text = [
    `Informe semanal de horas — semana del ${title}`,
    "",
    ...r.workers.flatMap((w) => [
      `== ${w.name} (${w.email}) ==`,
      ...w.days
        .filter((d, i) => i < 5 || d.sessions.length > 0 || d.vacation)
        .map((d) => {
          const times = d.sessions.map((s) => `${s.in}-${s.out ?? "??"}`).join("  ");
          const body =
            d.vacation && d.sessions.length === 0
              ? "Vacaciones"
              : `${times || "—"}${d.workedMs ? `  [${formatDuracionHM(d.workedMs)}]` : ""}`;
          return `${d.label}: ${body}${d.issues.length ? `  ⚠ ${d.issues.join(" · ")}` : ""}`;
        }),
      `Total semana: ${horas(w.weekMs)} | Acumulado ${r.monthName}: ${horas(w.monthMs)}` +
        (w.prevMonthMs !== null && r.prevMonthName ? ` | Total ${r.prevMonthName}: ${horas(w.prevMonthMs)}` : "") +
        (w.weekVacationDays ? ` | Vacaciones: ${w.weekVacationDays} d` : ""),
      "",
    ]),
  ].join("\n");

  return { subject: `Informe semanal de horas (${title})`, html, text };
}

export async function sendWeeklyReport(ref: Date = new Date(), to = weeklyReportRecipients()) {
  const report = await buildWeeklyReport(ref);
  const { subject, html, text } = renderWeeklyReport(report);
  await sendEmail({ to, subject, html, text });
  return { to, subject, workers: report.workers.length };
}
