/** Días naturales de vacaciones al año (calendario). */
export const VACATION_DAYS_PER_YEAR = 30;

/** Cuenta todos los días del calendario entre dos fechas (inclusive). Fechas en calendario UTC (DATE de PostgreSQL). */
export function countCalendarDaysInclusive(start: Date, end: Date): number {
  const t0 = start.getTime();
  const t1 = end.getTime();
  if (t0 > t1) return 0;
  let n = 0;
  const cur = new Date(start);
  while (cur.getTime() <= t1) {
    n++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return n;
}

/** Días naturales del tramo que caen en el año natural indicado. */
export function calendarDaysInCalendarYear(
  year: number,
  start: Date,
  end: Date,
): number {
  const yStart = new Date(Date.UTC(year, 0, 1));
  const yEnd = new Date(Date.UTC(year, 11, 31));
  const lo = start > yStart ? start : yStart;
  const hi = end < yEnd ? end : yEnd;
  return countCalendarDaysInclusive(lo, hi);
}

export function parseDateInput(isoDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) throw new Error("Fecha no válida.");
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== mo - 1 ||
    dt.getUTCDate() !== d
  ) {
    throw new Error("Fecha no válida.");
  }
  return dt;
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}
