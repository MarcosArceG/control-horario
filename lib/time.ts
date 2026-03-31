import type { TimeEvent, TimeCorrection, TimeEventType } from "@prisma/client";

export type EffectiveEvent = {
  id: string;
  type: TimeEventType;
  occurredAt: Date;
};

export type SessionState =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "on_break" };

function correctionMap(
  events: TimeEvent[],
  corrections: TimeCorrection[],
): Map<string, Date> {
  const m = new Map<string, Date>();
  for (const c of corrections) {
    if (c.status === "APPROVED") {
      m.set(c.timeEventId, c.proposedOccurredAt);
    }
  }
  return m;
}

export function toEffectiveEvents(
  events: TimeEvent[],
  corrections: TimeCorrection[],
): EffectiveEvent[] {
  const cmap = correctionMap(events, corrections);
  return events
    .map((e) => ({
      id: e.id,
      type: e.type,
      occurredAt: cmap.get(e.id) ?? e.occurredAt,
    }))
    .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
}

export function deriveSessionState(events: EffectiveEvent[]): SessionState {
  let state: SessionState = { kind: "idle" };

  for (const e of events) {
    switch (e.type) {
      case "CLOCK_IN":
        if (state.kind === "idle") state = { kind: "working" };
        break;
      case "BREAK_START":
        if (state.kind === "working") state = { kind: "on_break" };
        break;
      case "BREAK_END":
        if (state.kind === "on_break") state = { kind: "working" };
        break;
      case "CLOCK_OUT":
        if (state.kind === "working" || state.kind === "on_break")
          state = { kind: "idle" };
        break;
    }
  }

  return state;
}

type WorkSession = {
  start: Date;
  end: Date;
  breaks: { start: Date; end: Date }[];
};

export function buildWorkSessions(events: EffectiveEvent[]): WorkSession[] {
  const sorted = [...events].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  const sessions: WorkSession[] = [];
  let open: {
    start: Date;
    breaks: { start: Date; end: Date }[];
    breakOpen?: Date;
  } | null = null;

  for (const e of sorted) {
    switch (e.type) {
      case "CLOCK_IN":
        if (!open) open = { start: e.occurredAt, breaks: [] };
        break;
      case "BREAK_START":
        if (open && !open.breakOpen) open.breakOpen = e.occurredAt;
        break;
      case "BREAK_END":
        if (open?.breakOpen) {
          open.breaks.push({ start: open.breakOpen, end: e.occurredAt });
          open.breakOpen = undefined;
        }
        break;
      case "CLOCK_OUT":
        if (open) {
          sessions.push({
            start: open.start,
            end: e.occurredAt,
            breaks: [...open.breaks],
          });
          open = null;
        }
        break;
    }
  }

  return sessions;
}

/** Sesiones cerradas + sesión abierta hasta `now` (para tiempo en curso). */
export function buildWorkSessionsIncludingOpen(
  events: EffectiveEvent[],
  now: Date,
): WorkSession[] {
  const sorted = [...events].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  const sessions: WorkSession[] = [];
  let open: {
    start: Date;
    breaks: { start: Date; end: Date }[];
    breakOpen?: Date;
  } | null = null;

  for (const e of sorted) {
    switch (e.type) {
      case "CLOCK_IN":
        if (!open) open = { start: e.occurredAt, breaks: [] };
        break;
      case "BREAK_START":
        if (open && !open.breakOpen) open.breakOpen = e.occurredAt;
        break;
      case "BREAK_END":
        if (open?.breakOpen) {
          open.breaks.push({ start: open.breakOpen, end: e.occurredAt });
          open.breakOpen = undefined;
        }
        break;
      case "CLOCK_OUT":
        if (open) {
          sessions.push({
            start: open.start,
            end: e.occurredAt,
            breaks: [...open.breaks],
          });
          open = null;
        }
        break;
    }
  }

  if (open) {
    const breaks = [...open.breaks];
    if (open.breakOpen) {
      breaks.push({ start: open.breakOpen, end: now });
    }
    sessions.push({
      start: open.start,
      end: now,
      breaks,
    });
  }

  return sessions;
}

function intersectMs(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): number {
  const s = Math.max(aStart, bStart);
  const e = Math.min(aEnd, bEnd);
  return e > s ? e - s : 0;
}

/** Milisegundos trabajados dentro de [rangeStart, rangeEnd). Incluye sesión abierta hasta `asOf`. */
export function workedMsInRange(
  events: EffectiveEvent[],
  rangeStart: Date,
  rangeEnd: Date,
  asOf?: Date,
): number {
  const rs = rangeStart.getTime();
  const re = rangeEnd.getTime();
  if (re <= rs) return 0;

  const sessions = asOf
    ? buildWorkSessionsIncludingOpen(events, asOf)
    : buildWorkSessions(events);

  let total = 0;
  for (const s of sessions) {
    const ss = s.start.getTime();
    const se = s.end.getTime();
    const gross = intersectMs(ss, se, rs, re);
    if (gross <= 0) continue;

    const breakInWindow = s.breaks.reduce(
      (acc, b) =>
        acc +
        intersectMs(b.start.getTime(), b.end.getTime(), rs, re),
      0,
    );

    total += gross - breakInWindow;
  }

  return Math.max(0, total);
}

/** Días naturales UTC en el rango con milisegundos trabajados positivos. */
export function workedMsByUserDay(
  events: EffectiveEvent[],
  rangeStart: Date,
  rangeEnd: Date,
): Map<string, number> {
  const byDay = new Map<string, number>();
  const cursor = new Date(rangeStart);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor < rangeEnd) {
    const dayStart = new Date(cursor);
    const dayEnd = new Date(cursor);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const dayKey = dayStart.toISOString().slice(0, 10);
    const clippedStart = dayStart < rangeStart ? rangeStart : dayStart;
    const clippedEnd = dayEnd > rangeEnd ? rangeEnd : dayEnd;
    const ms = workedMsInRange(events, clippedStart, clippedEnd);
    if (ms > 0) byDay.set(dayKey, ms);

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return byDay;
}

/** Inicio del día local [00:00, 24:00). */
export function localDayBounds(d: Date): { start: Date; end: Date } {
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/** Lunes 00:00 local de la semana que contiene `d` (semana laboral LUN–DOM). */
export function mondayOfWeek(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

/** Hora de la última entrada sin salida (jornada abierta). */
export function getOpenSessionStart(events: EffectiveEvent[]): Date | null {
  const sorted = [...events].sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  let lastIn: Date | null = null;
  for (const e of sorted) {
    if (e.type === "CLOCK_IN") lastIn = e.occurredAt;
    else if (e.type === "CLOCK_OUT") lastIn = null;
  }
  return lastIn;
}
