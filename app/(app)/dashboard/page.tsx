import { DashboardLive } from "@/components/dashboard-live";
import { getDashboardData } from "@/lib/actions";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="w-full min-w-0 max-w-2xl space-y-8 sm:max-w-none">
      <DashboardLive
        initial={{
          displayName: data.displayName,
          state: data.state,
          workedTodayMs: data.workedTodayMs,
          workedWeekMs: data.workedWeekMs,
          remainingDayMs: data.remainingDayMs,
          remainingWeekMs: data.remainingWeekMs,
          targetDayMs: data.targetDayMs,
          targetWeekMs: data.targetWeekMs,
          weekDays: data.weekDays,
          sessionStart: data.sessionStart,
        }}
      />
    </div>
  );
}
