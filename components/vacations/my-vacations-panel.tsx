"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { VacationCalendar } from "@/components/vacations/vacation-calendar";
import { getMyVacationSummary } from "@/lib/vacation-actions";

type Initial = Awaited<ReturnType<typeof getMyVacationSummary>>;

export function MyVacationsPanel({
  initial,
  initialYear,
}: {
  initial: Initial;
  initialYear: number;
}) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [data, setData] = useState(initial);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh(nextYear: number) {
    startTransition(async () => {
      try {
        setError(null);
        const next = await getMyVacationSummary(nextYear);
        setData(next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar.");
      }
    });
  }

  function onYearChange(y: number) {
    setYear(y);
    refresh(y);
  }

  const years = [initialYear - 1, initialYear, initialYear + 1].filter(
    (y) => y >= 2000 && y <= 2100,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-400">Año natural</span>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-400">Mes</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2000, i, 1).toLocaleDateString("es-ES", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-teal-50 p-4 ring-1 ring-teal-100 dark:bg-teal-950/40 dark:ring-teal-900/50">
          <p className="text-2xl font-semibold tabular-nums text-teal-950 dark:text-teal-50">
            {data.remaining}
          </p>
          <p className="mt-1 text-sm text-teal-800/90 dark:text-teal-200/90">
            Días que te quedan ({data.year})
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:ring-blue-900/50">
          <p className="text-2xl font-semibold tabular-nums text-blue-950 dark:text-blue-50">
            {data.approvedDaysInYear}
          </p>
          <p className="mt-1 text-sm text-blue-800/90 dark:text-blue-200/90">
            Días laborables disfrutados
          </p>
        </div>
      </div>

      <div className="max-w-[320px]">
        <VacationCalendar
          year={year}
          month={month}
          spans={data.calendarSpans}
        />
      </div>
    </div>
  );
}
