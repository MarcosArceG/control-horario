"use client";

import type { SessionState } from "@/lib/time";
import { registerClockEvent } from "@/lib/actions";
import { formatDuracionHM } from "@/lib/locale";
import type { TimeEventType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type Props = {
  displayName: string;
  state: SessionState;
  workedTodayMs: number;
  targetDayMs: number;
  sessionStart: string | null;
  /** Tras fichar, actualiza métricas del panel sin depender solo de router.refresh */
  onMetricsRefresh?: () => void | Promise<void>;
};

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

export function DashboardHero({
  displayName,
  state,
  workedTodayMs,
  targetDayMs,
  sessionStart,
  onMetricsRefresh,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [, setTick] = useState(0);

  const activo =
    state.kind === "working" || state.kind === "on_break";

  useEffect(() => {
    if (!activo || !sessionStart) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [activo, sessionStart]);

  const sessionElapsedMs =
    sessionStart && activo
      ? Math.max(0, Date.now() - new Date(sessionStart).getTime())
      : 0;

  const centerMs = activo ? sessionElapsedMs : workedTodayMs;
  const safeTarget = targetDayMs > 0 ? targetDayMs : 1;
  const progress = Math.min(1, centerMs / safeTarget);
  const dashOffset = RING_C * (1 - progress);

  function fire(type: TimeEventType) {
    setError(null);
    startTransition(async () => {
      try {
        await registerClockEvent(type);
        await onMetricsRefresh?.();
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Ha ocurrido un error inesperado.",
        );
      }
    });
  }

  const greeting = activo
    ? `Hola ${displayName}, continúa con tu jornada`
    : `Hola ${displayName}, comienza tu jornada cuando estés listo`;

  return (
    <div className="rounded-[1.25rem] border border-slate-200/90 bg-gradient-to-br from-white to-slate-50 p-5 shadow-lg shadow-slate-200/40 ring-1 ring-slate-100/80 dark:border-slate-700 dark:from-slate-900 dark:to-slate-900/95 dark:shadow-slate-950/40 dark:ring-slate-800">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="min-w-0 flex-1 space-y-4">
          <p className="text-base font-medium leading-snug text-slate-800 dark:text-slate-100 sm:text-lg">
            {greeting}
          </p>
          <div className="flex flex-wrap gap-3">
            {!activo && (
              <button
                type="button"
                disabled={pending}
                onClick={() => fire("CLOCK_IN")}
                className="min-h-12 touch-manipulation rounded-full bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                {pending ? "…" : "Entrada"}
              </button>
            )}
            {activo && (
              <button
                type="button"
                disabled={pending}
                onClick={() => fire("CLOCK_OUT")}
                className="min-h-12 touch-manipulation rounded-full bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                {pending ? "…" : "Salida"}
              </button>
            )}
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-center sm:justify-end">
          <div className="relative h-[140px] w-[140px]">
            <svg
              className="h-full w-full -rotate-90"
              viewBox="0 0 120 120"
              aria-hidden
            >
              <circle
                cx="60"
                cy="60"
                r={RING_R}
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r={RING_R}
                fill="none"
                className="stroke-blue-500 transition-[stroke-dashoffset] duration-300 dark:stroke-blue-400"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_C}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                {formatDuracionHM(centerMs)}
              </span>
              <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {activo ? "Sesión" : "Hoy"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
