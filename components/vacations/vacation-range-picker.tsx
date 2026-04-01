"use client";

import { useEffect, useState } from "react";
import { APP_LOCALE, formatFecha } from "@/lib/locale";

function ymd(y: number, m0: number, d: number): string {
  return `${y}-${String(m0 + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

type Props = {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  /** Mes inicial visible (0–11) */
  initialMonth?: number;
  initialYear?: number;
};

/**
 * Un solo calendario: primer toque = inicio (y fin el mismo día), segundo toque = cierra el rango.
 * Un tercer toque reinicia la selección.
 */
export function VacationRangePicker({
  startDate,
  endDate,
  onChange,
  initialMonth,
  initialYear,
}: Props) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(
    () => initialYear ?? now.getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    () => initialMonth ?? now.getMonth(),
  );
  /** Primer día del par actual (mientras se espera el segundo toque). */
  const [anchor, setAnchor] = useState<string | null>(null);

  useEffect(() => {
    if (!startDate?.trim() && !endDate?.trim()) {
      setAnchor(null);
    }
  }, [startDate, endDate]);

  const first = new Date(Date.UTC(viewYear, viewMonth, 1));
  const lastDay = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
  const startPad = first.getUTCDay();
  const pad = startPad === 0 ? 6 : startPad - 1;

  const label = new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString(
    APP_LOCALE,
    { month: "long", year: "numeric" },
  );

  const cells: (number | null)[] = [...Array(pad).fill(null)];
  for (let d = 1; d <= lastDay; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekDays = ["L", "M", "X", "J", "V", "S", "D"];

  function onDayClick(iso: string) {
    if (!anchor) {
      setAnchor(iso);
      onChange(iso, iso);
      return;
    }
    const lo = anchor < iso ? anchor : iso;
    const hi = anchor < iso ? iso : anchor;
    onChange(lo, hi);
    setAnchor(null);
  }

  function cellState(iso: string): "in-range" | "edge" | "anchor" | "idle" {
    if (anchor && iso === anchor) return "anchor";
    const s = startDate?.trim();
    const e = endDate?.trim();
    if (!s || !e) return "idle";
    if (iso >= s && iso <= e) {
      if (iso === s || iso === e) return "edge";
      return "in-range";
    }
    return "idle";
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const summary =
    startDate && endDate
      ? `${formatFecha(new Date(startDate + "T12:00:00Z"))} — ${formatFecha(new Date(endDate + "T12:00:00Z"))}`
      : null;

  return (
    <div className="space-y-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Mes anterior"
          >
            ←
          </button>
          <p className="min-w-0 flex-1 text-center text-sm font-semibold capitalize text-slate-800 dark:text-slate-100">
            {label}
          </p>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Mes siguiente"
          >
            →
          </button>
        </div>
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
            const iso = ymd(viewYear, viewMonth, d);
            const st = cellState(iso);
            const baseCell =
              "flex aspect-square items-center justify-center rounded-lg text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500";

            let cls = `${baseCell} `;
            if (st === "anchor") {
              cls +=
                "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 dark:ring-offset-slate-900";
            } else if (st === "edge") {
              cls +=
                "bg-teal-600 text-white shadow-sm dark:bg-teal-600";
            } else if (st === "in-range") {
              cls +=
                "bg-teal-100 text-teal-900 dark:bg-teal-900/50 dark:text-teal-100";
            } else {
              cls +=
                "cursor-pointer bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700";
            }

            return (
              <button
                key={iso}
                type="button"
                onClick={() => onDayClick(iso)}
                className={cls}
                aria-label={`Día ${d}`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
      {summary ? (
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
          Selección: {summary}
        </p>
      ) : null}
    </div>
  );
}
