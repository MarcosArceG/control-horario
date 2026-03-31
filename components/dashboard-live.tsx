"use client";

import type { SessionState } from "@/lib/time";
import {
  getDashboardLiveMetrics,
  type DashboardWeekDay,
} from "@/lib/actions";
import { DashboardHero } from "@/components/dashboard-hero";
import { WeekStrip } from "@/components/week-strip";
import { WeeklySummary } from "@/components/weekly-summary";
import { useCallback, useEffect, useState } from "react";

const POLL_MS_IDLE = 12_000;
const POLL_MS_WORKING = 5_000;

type Initial = {
  displayName: string;
  state: SessionState;
  workedTodayMs: number;
  workedWeekMs: number;
  remainingDayMs: number;
  remainingWeekMs: number;
  targetDayMs: number;
  targetWeekMs: number;
  weekDays: DashboardWeekDay[];
  sessionStart: string | null;
};

export function DashboardLive({ initial }: { initial: Initial }) {
  const [m, setM] = useState(initial);

  const refresh = useCallback(async () => {
    try {
      const next = await getDashboardLiveMetrics();
      setM((prev) => ({
        ...prev,
        ...next,
      }));
    } catch {
      /* sesión caducada u offline */
    }
  }, []);

  const activo =
    m.state.kind === "working" || m.state.kind === "on_break";

  useEffect(() => {
    const ms = activo ? POLL_MS_WORKING : POLL_MS_IDLE;
    const id = window.setInterval(() => {
      void refresh();
    }, ms);
    return () => window.clearInterval(id);
  }, [activo, refresh]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refresh]);

  return (
    <>
      <DashboardHero
        displayName={initial.displayName}
        state={m.state}
        workedTodayMs={m.workedTodayMs}
        targetDayMs={m.targetDayMs}
        sessionStart={m.sessionStart}
        onMetricsRefresh={refresh}
      />

      <WeekStrip days={m.weekDays} targetDayMs={m.targetDayMs} />

      <WeeklySummary
        remainingDayMs={m.remainingDayMs}
        workedWeekMs={m.workedWeekMs}
        remainingWeekMs={m.remainingWeekMs}
      />
    </>
  );
}
