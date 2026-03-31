import type { DashboardWeekDay } from "@/lib/actions";
import { formatDuracionHM } from "@/lib/locale";

type Props = {
  days: DashboardWeekDay[];
  targetDayMs: number;
};

export function WeekStrip({ days, targetDayMs }: Props) {
  return (
    <div className="-mx-1 overflow-x-auto pb-1">
      <div className="flex min-w-min gap-2 px-1">
        {days.map((d) => {
          const ratio = Math.min(1, d.workedMs / targetDayMs);
          const ring = 2 * Math.PI * 10;
          const off = ring * (1 - ratio);
          return (
            <div
              key={d.dateISO}
              className={`flex w-[4.5rem] shrink-0 flex-col items-center rounded-2xl px-2 py-3 text-center shadow-sm transition ${
                d.isToday
                  ? "bg-white shadow-md ring-2 ring-blue-500/30 dark:bg-slate-800 dark:ring-blue-400/40"
                  : "bg-slate-100/90 dark:bg-slate-800/80"
              }`}
            >
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {d.weekdayShort}
              </span>
              <span className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-slate-50">
                {d.dayNum.toString().padStart(2, "0")}
              </span>
              <div className="relative mt-2 h-9 w-9">
                <svg
                  className="h-9 w-9 -rotate-90"
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
              <span className="mt-1 font-mono text-[0.7rem] tabular-nums text-slate-600 dark:text-slate-300">
                {formatDuracionHM(d.workedMs)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
