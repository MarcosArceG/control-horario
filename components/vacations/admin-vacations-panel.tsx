"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { VacationStatus } from "@prisma/client";
import {
  adminApproveVacation,
  adminCreateVacation,
  adminDeleteVacation,
  adminSetUserVacationDays,
  getAdminVacationEntries,
} from "@/lib/vacation-actions";
import { VACATION_DAYS_PER_YEAR } from "@/lib/vacation-days";
import { DatePickerField } from "@/components/date-picker-field";
import { VacationCalendar } from "@/components/vacations/vacation-calendar";
import { formatFecha } from "@/lib/locale";

type UserOpt = {
  id: string;
  email: string;
  name: string | null;
  vacationDaysPerYear: number;
};

type Initial = Awaited<ReturnType<typeof getAdminVacationEntries>>;

function statusLabel(s: VacationStatus) {
  if (s === "APPROVED") return "Disfrutada";
  if (s === "PENDING") return "Pendiente";
  return s;
}

export function AdminVacationsPanel({
  users,
  initialUserId,
  initialYear,
  initial,
}: {
  users: UserOpt[];
  initialUserId: string | null;
  initialYear: number;
  initial: Initial | null;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(initialUserId ?? "");
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [data, setData] = useState<Initial | null>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ start: "", end: "" });
  const [entitlementDraft, setEntitlementDraft] = useState("");

  useEffect(() => {
    if (data?.entitlement != null) {
      setEntitlementDraft(String(data.entitlement));
    }
  }, [data?.entitlement, data?.user.id]);

  function load(uid: string, y: number) {
    if (!uid) {
      setData(null);
      return;
    }
    startTransition(async () => {
      try {
        setError(null);
        const next = await getAdminVacationEntries(uid, y);
        setData(next);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al cargar.");
      }
    });
  }

  function onUserChange(uid: string) {
    setUserId(uid);
    load(uid, year);
  }

  function onYearChange(y: number) {
    setYear(y);
    if (userId) load(userId, y);
  }

  function onSaveEntitlement(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const n = Number.parseInt(entitlementDraft, 10);
    if (!Number.isInteger(n) || n < 0 || n > 366) {
      setError("El tope debe ser un entero entre 0 y 366.");
      return;
    }
    startTransition(async () => {
      try {
        setError(null);
        await adminSetUserVacationDays({ userId, vacationDaysPerYear: n });
        load(userId, year);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar el tope.");
      }
    });
  }

  function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    startTransition(async () => {
      try {
        setError(null);
        await adminCreateVacation({
          userId,
          startDate: form.start,
          endDate: form.end,
        });
        setForm({ start: "", end: "" });
        load(userId, year);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    });
  }

  const spans = useMemo(() => {
    if (!data?.entries) return [];
    return data.entries.map((e) => ({
      start: e.startDate,
      end: e.endDate,
    }));
  }, [data?.entries]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-4">
        <label className="block min-w-[200px] text-sm">
          <span className="text-slate-600 dark:text-slate-400">Empleado</span>
          <select
            value={userId}
            onChange={(e) => onUserChange(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          >
            <option value="">— Seleccionar —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ? `${u.name} (${u.email})` : u.email}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-400">Año</span>
          <select
            value={year}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-600 dark:text-slate-400">Mes en calendario</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(2000, i, 1).toLocaleDateString("es-ES", { month: "long" })}
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

      {!userId ? (
        <p className="text-sm text-slate-500">Selecciona un empleado para ver y editar sus vacaciones.</p>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-teal-50 p-4 ring-1 ring-teal-100 dark:bg-teal-950/40 dark:ring-teal-900/50">
              <p className="text-2xl font-semibold tabular-nums text-teal-950 dark:text-teal-50">
                {data.remaining}
              </p>
              <p className="mt-1 text-sm text-teal-800/90 dark:text-teal-200/90">
                Días que le quedan ({data.year})
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:ring-blue-900/50">
              <p className="text-2xl font-semibold tabular-nums text-blue-950 dark:text-blue-50">
                {data.approvedDaysInYear}
              </p>
              <p className="mt-1 text-sm text-blue-800/90 dark:text-blue-200/90">
                Días naturales disfrutados
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-4 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {data.user.name ?? data.user.email}
              </p>
              <form
                onSubmit={onSaveEntitlement}
                className="mt-3 flex flex-wrap items-end gap-2"
              >
                <label className="flex min-w-[8rem] flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-400">
                  Tope anual (días naturales)
                  <input
                    type="number"
                    min={0}
                    max={366}
                    required
                    value={entitlementDraft}
                    onChange={(e) => setEntitlementDraft(e.target.value)}
                    className="mt-0.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 tabular-nums dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
                >
                  Guardar tope
                </button>
              </form>
              <p className="mt-2 text-xs text-slate-500">
                Por defecto {VACATION_DAYS_PER_YEAR}; cámbialo si el empleado se
                incorporó con el año ya empezado.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <section>
              <form
                onSubmit={onCreate}
                className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <DatePickerField
                    label="Desde"
                    required
                    value={form.start}
                    onChange={(v) => setForm((f) => ({ ...f, start: v }))}
                  />
                  <DatePickerField
                    label="Hasta"
                    required
                    value={form.end}
                    onChange={(v) => setForm((f) => ({ ...f, end: v }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Guardar vacaciones
                </button>
              </form>
            </section>
            <VacationCalendar year={year} month={month} spans={spans} />
          </div>

          <section>
            <h2 className="mb-3 text-lg font-bold text-slate-900 dark:text-slate-50">
              Registros ({data.year})
            </h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2 font-medium">Inicio</th>
                    <th className="px-3 py-2 font-medium">Fin</th>
                    <th className="px-3 py-2 font-medium">Días naturales</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                    <th className="px-3 py-2 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.entries.map((r) => (
                    <tr key={r.id}>
                      <td className="px-3 py-2 tabular-nums">
                        {formatFecha(new Date(r.startDate + "T12:00:00Z"))}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {formatFecha(new Date(r.endDate + "T12:00:00Z"))}
                      </td>
                      <td className="px-3 py-2">{r.calendarDays}</td>
                      <td className="px-3 py-2">{statusLabel(r.status)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          {r.status === "PENDING" ? (
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => {
                                startTransition(async () => {
                                  try {
                                    setError(null);
                                    await adminApproveVacation(r.id);
                                    load(userId, year);
                                  } catch (err) {
                                    setError(
                                      err instanceof Error
                                        ? err.message
                                        : "Error",
                                    );
                                  }
                                });
                              }}
                              className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                            >
                              Aprobar
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              startTransition(async () => {
                                try {
                                  setError(null);
                                  await adminDeleteVacation(r.id);
                                  load(userId, year);
                                } catch (err) {
                                  setError(
                                    err instanceof Error ? err.message : "Error",
                                  );
                                }
                              });
                            }}
                            className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.entries.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Sin registros en este año.</p>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
