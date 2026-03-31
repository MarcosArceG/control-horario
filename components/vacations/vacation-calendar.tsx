"use client";

import { useMemo } from "react";
import { APP_LOCALE } from "@/lib/locale";

export type VacationCalendarSpan = { start: string; end: string };

function todayISODateLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Acepta YYYY-MM-DD o ISO completo (p. ej. serialización JSON). */
function toYMD(s: string): string {
  const t = s.trim();
  if (t.length >= 10) return t.slice(0, 10);
  return t;
}

function normalizeSpans(spans: VacationCalendarSpan[]): VacationCalendarSpan[] {
  return spans.map((sp) => ({
    start: toYMD(sp.start),
    end: toYMD(sp.end),
  }));
}

function isInSpan(isoDay: string, spans: VacationCalendarSpan[]): boolean {
  return spans.some((sp) => isoDay >= sp.start && isoDay <= sp.end);
}

function dayKind(
  isoDay: string,
  spans: VacationCalendarSpan[],
  todayISO: string,
): "past" | "future" | null {
  if (!isInSpan(isoDay, spans)) return null;
  if (isoDay < todayISO) return "past";
  return "future";
}

type Props = {
  year: number;
  month: number;
  spans: VacationCalendarSpan[];
};

export function VacationCalendar({ year, month, spans }: Props) {
  const todayISO = todayISODateLocal();
  const spansNorm = useMemo(() => normalizeSpans(spans ?? []), [spans]);

  const first = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startPad = first.getUTCDay();
  const pad = startPad === 0 ? 6 : startPad - 1;

  const label = new Date(Date.UTC(year, month, 1)).toLocaleDateString(
    APP_LOCALE,
    { month: "long", year: "numeric" },
  );

  const cells: (number | null)[] = [...Array(pad).fill(null)];
  for (let d = 1; d <= lastDay; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekDays = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-3 text-center text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
        {label}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
        {weekDays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) {
            return <span key={`e-${i}`} className="aspect-square" />;
          }
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(
            d,
          ).padStart(2, "0")}`;
          const kind = dayKind(iso, spansNorm, todayISO);
          const baseCell =
            "flex aspect-square items-center justify-center rounded-lg text-xs font-semibold";

          if (kind === "past") {
            return (
              <div
                key={iso}
                className={baseCell}
                style={{
                  backgroundColor: "#059669",
                  color: "#ffffff",
                  boxShadow: "0 1px 2px rgb(0 0 0 / 0.08)",
                }}
              >
                {d}
              </div>
            );
          }
          if (kind === "future") {
            return (
              <div
                key={iso}
                className={baseCell}
                style={{
                  backgroundColor: "#f59e0b",
                  color: "#422006",
                  boxShadow: "0 1px 2px rgb(0 0 0 / 0.08)",
                }}
              >
                {d}
              </div>
            );
          }
          return (
            <div
              key={iso}
              className={`${baseCell} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`}
            >
              {d}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-600 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded"
            style={{ backgroundColor: "#059669" }}
          />
          Disfrutadas
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded"
            style={{ backgroundColor: "#f59e0b" }}
          />
          Solicitadas
        </span>
      </div>
    </div>
  );
}
