import { DashboardHero } from "@/components/dashboard-hero";
import { UpcomingEventsPlaceholder } from "@/components/upcoming-events-placeholder";
import { WeekStrip } from "@/components/week-strip";
import { WeeklySummary } from "@/components/weekly-summary";
import { getDashboardData } from "@/lib/actions";
import { etiquetaTipoEvento } from "@/lib/labels-es";
import { formatFechaHora } from "@/lib/locale";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-lg space-y-8 sm:max-w-none">
      <DashboardHero
        displayName={data.displayName}
        state={data.state}
        workedTodayMs={data.workedTodayMs}
        targetDayMs={data.targetDayMs}
        sessionStart={data.sessionStart}
      />

      <WeekStrip days={data.weekDays} targetDayMs={data.targetDayMs} />

      <WeeklySummary
        remainingDayMs={data.remainingDayMs}
        workedWeekMs={data.workedWeekMs}
        remainingWeekMs={data.remainingWeekMs}
      />

      <UpcomingEventsPlaceholder />

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/35 ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Eventos recientes
        </h2>
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {data.recentEvents.length === 0 ? (
            <li className="py-3 text-sm text-slate-500">Aún no hay eventos.</li>
          ) : (
            data.recentEvents.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {etiquetaTipoEvento(e.type)}
                </span>
                <time
                  dateTime={e.occurredAt.toISOString()}
                  className="text-slate-500"
                >
                  {formatFechaHora(e.occurredAt)}
                </time>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
