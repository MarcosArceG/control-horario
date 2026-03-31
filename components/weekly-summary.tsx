import { formatDuracionLarga } from "@/lib/locale";

type Props = {
  remainingDayMs: number;
  workedWeekMs: number;
  remainingWeekMs: number;
};

export function WeeklySummary({
  remainingDayMs,
  workedWeekMs,
  remainingWeekMs,
}: Props) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-50">
        Resumen semanal
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-teal-50 p-4 text-teal-950 shadow-sm ring-1 ring-teal-100 dark:bg-teal-950/40 dark:text-teal-50 dark:ring-teal-900/50">
          <p className="text-xl font-semibold tabular-nums">
            {formatDuracionLarga(remainingDayMs)}
          </p>
          <p className="mt-1 text-sm text-teal-800/90 dark:text-teal-200/90">
            Para finalizar la jornada (obj. 8 h)
          </p>
        </div>
        <div className="rounded-2xl bg-blue-50 p-4 text-blue-950 shadow-sm ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-50 dark:ring-blue-900/50">
          <p className="text-xl font-semibold tabular-nums">
            {formatDuracionLarga(workedWeekMs)}
          </p>
          <p className="mt-1 text-sm text-blue-800/90 dark:text-blue-200/90">
            Trabajadas esta semana
          </p>
        </div>
        <div className="rounded-2xl bg-red-50 p-4 text-red-950 shadow-sm ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-50 dark:ring-red-900/50">
          <p className="text-xl font-semibold tabular-nums">
            {formatDuracionLarga(remainingWeekMs)}
          </p>
          <p className="mt-1 text-sm text-red-800/90 dark:text-red-200/90">
            Para finalizar la semana (obj. 40 h)
          </p>
        </div>
      </div>
    </section>
  );
}
