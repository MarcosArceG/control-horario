"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  adminApproveVacation,
  adminDeleteVacation,
  getAdminPendingVacationRequests,
  type AdminPendingVacationRow,
} from "@/lib/vacation-actions";
import { formatFecha } from "@/lib/locale";

type Props = { initial: AdminPendingVacationRow[] };

export function AdminPendingVacations({ initial }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(initial);
  }, [initial]);

  function onApprove(id: string) {
    startTransition(async () => {
      try {
        setError(null);
        await adminApproveVacation(id);
        const next = await getAdminPendingVacationRequests();
        setRows(next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo aprobar.");
      }
    });
  }

  function onReject(id: string) {
    const ok = window.confirm(
      "¿Rechazar y eliminar esta solicitud? El empleado podrá enviar otras fechas.",
    );
    if (!ok) return;
    startTransition(async () => {
      try {
        setError(null);
        await adminDeleteVacation(id);
        const next = await getAdminPendingVacationRequests();
        setRows(next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar.");
      }
    });
  }

  if (rows.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Solicitudes pendientes de aprobación
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          No hay solicitudes de empleados esperando revisión. Las nuevas aparecerán aquí cuando envíen fechas desde su área de vacaciones.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-200/90 bg-amber-50/40 p-4 shadow-sm ring-1 ring-amber-100/80 dark:border-amber-900/40 dark:bg-amber-950/25 dark:ring-amber-900/30">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Solicitudes pendientes de aprobación
        </h2>
        <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-medium text-amber-950 dark:bg-amber-900/60 dark:text-amber-100">
          {rows.length} {rows.length === 1 ? "solicitud" : "solicitudes"}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Aprueba las fechas para registrarlas como vacaciones aprobadas, o rechaza eliminando la solicitud.
      </p>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-amber-200/60 bg-white dark:border-amber-900/40 dark:bg-slate-950/50">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-amber-100/50 text-slate-700 dark:bg-amber-950/40 dark:text-slate-300">
            <tr>
              <th className="px-3 py-2 font-medium">Empleado</th>
              <th className="px-3 py-2 font-medium">Desde</th>
              <th className="px-3 py-2 font-medium">Hasta</th>
              <th className="px-3 py-2 font-medium">Días</th>
              <th className="px-3 py-2 font-medium">Notas</th>
              <th className="px-3 py-2 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100/80 dark:divide-amber-900/40">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                  {r.employeeName ? (
                    <span>
                      {r.employeeName}
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {r.employeeEmail}
                      </span>
                    </span>
                  ) : (
                    r.employeeEmail
                  )}
                </td>
                <td className="px-3 py-2 tabular-nums text-slate-800 dark:text-slate-200">
                  {formatFecha(new Date(r.startDate + "T12:00:00Z"))}
                </td>
                <td className="px-3 py-2 tabular-nums text-slate-800 dark:text-slate-200">
                  {formatFecha(new Date(r.endDate + "T12:00:00Z"))}
                </td>
                <td className="px-3 py-2">{r.calendarDays}</td>
                <td className="max-w-[10rem] truncate px-3 py-2 text-slate-600 dark:text-slate-400">
                  {r.note ?? "—"}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onApprove(r.id)}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      Aprobar
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onReject(r.id)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Rechazar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
