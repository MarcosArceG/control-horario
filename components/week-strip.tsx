import type { DashboardWeekDay } from "@/lib/actions";
import { formatDuracionHM } from "@/lib/locale";

type Props = {
  days: DashboardWeekDay[];
  targetDayMs: number;
};

export function WeekStrip({ days, targetDayMs }: Props) {
  return (
    <section className="w-full min-w-0" aria-label="Semana actual">
      <h2 className="mb-2 text-lg font-bold text-slate-900 dark:text-slate-50">
        Esta semana
      </h2>
      {/*
        -mx-4 px-4 compensa el padding del main: el scroll llega al borde de pantalla
        y los días no quedan “cortados” a los lados.
      */}
      <div className="-mx-4 flex overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:thin] sm:mx-0 sm:px-0">
        <div className="flex min-w-max snap-x snap-mandatory gap-2 py-0.5 pr-1">
          {days.map((d) => {
            const safeTarget = targetDayMs > 0 ? targetDayMs : 1;
            const ratio = Math.min(1, d.workedMs / safeTarget);
            const ring = 2 * Math.PI * 10;
            const off = ring * (1 - ratio);
            return (
              <div
                key={d.dateISO}
                className={`flex w-[4.25rem] shrink-0 snap-start flex-col items-center rounded-2xl px-1.5 py-2.5 text-center shadow-sm transition sm:w-[4.5rem] sm:px-2 sm:py-3 ${
                  d.isToday
                    ? "bg-white shadow-md ring-2 ring-blue-500/30 dark:bg-slate-800 dark:ring-blue-400/40"
                    : "bg-slate-100/90 dark:bg-slate-800/80"
                }`}
              >
                <span className="max-w-full truncate text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {d.weekdayShort}
                </span>
                <span className="mt-0.5 text-base font-semibold tabular-nums text-slate-900 dark:text-slate-50 sm:text-lg">
                  {d.dayNum.toString().padStart(2, "0")}
                </span>
                <div className="relative mt-1.5 h-8 w-8 shrink-0 sm:mt-2 sm:h-9 sm:w-9">
                  <svg
                    className="h-full w-full -rotate-90"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      className={
                        d.isToday
                          ? "stroke-slate-200 dark:stroke-slate-600"
                          : "stroke-slate-200/80 dark:stroke-slate-700"
                      }
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      fill="none"
                      className={
                        d.isToday
                          ? "stroke-blue-500 dark:stroke-blue-400"
                          : "stroke-blue-400/70 dark:stroke-blue-500/70"
                      }
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray={ring}
                      strokeDashoffset={off}
                    />
                  </svg>
                </div>
                <span className="mt-0.5 max-w-full truncate font-mono text-[0.65rem] tabular-nums leading-tight text-slate-600 dark:text-slate-300 sm:mt-1 sm:text-[0.7rem]">
                  {formatDuracionHM(d.workedMs)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
