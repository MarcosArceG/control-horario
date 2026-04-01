"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { VacationCalendar } from "@/components/vacations/vacation-calendar";
import {
  cancelMyVacationRequest,
  getMyVacationSummary,
  requestMyVacation,
} from "@/lib/vacation-actions";
import { DatePickerField } from "@/components/date-picker-field";
import { formatFecha } from "@/lib/locale";
import { etiquetaEstadoVacacion } from "@/lib/labels-es";

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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ start: "", end: "", note: "" });

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

  function onSubmitRequest(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        setError(null);
        await requestMyVacation({
          startDate: form.start,
          endDate: form.end,
          note: form.note || null,
        });
        setForm({ start: "", end: "", note: "" });
        await refresh(year);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo enviar la solicitud.");
      }
    });
  }

  function onCancel(id: string) {
    const ok = window.confirm(
      "¿Cancelar esta solicitud? Podrás enviar otras fechas si lo necesitas.",
    );
    if (!ok) return;
    startTransition(async () => {
      try {
        setError(null);
        await cancelMyVacationRequest(id);
        await refresh(year);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo cancelar.");
      }
    });
  }

  const years = [initialYear - 1, initialYear, initialYear + 1].filter(
    (y) => y >= 2000 && y <= 2100,
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-teal-50 p-4 ring-1 ring-teal-100 dark:bg-teal-950/40 dark:ring-teal-900/50">
          <p className="text-2xl font-semibold tabular-nums text-teal-950 dark:text-teal-50">
            {data.remaining}
          </p>
          <p className="mt-1 text-sm text-teal-800/90 dark:text-teal-200/90">
            Días que te quedan ({data.year})
          </p>
          <p className="mt-1 text-xs text-teal-700/80 dark:text-teal-300/80">
            Tope anual: {data.entitlement} días naturales
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
      </div>

      <section className="grid gap-6 md:grid-cols-[minmax(0,14rem)_1fr] md:items-start">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Calendario
          </p>
          <label className="block text-sm">
            <span className="text-slate-600 dark:text-slate-400">Año natural</span>
            <select
              value={year}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
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
              className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
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
        <div className="flex justify-start md:justify-end">
          <div className="w-full max-w-[320px] md:max-w-[min(100%,360px)]">
            <VacationCalendar
              year={year}
              month={month}
              spans={data.calendarSpans}
            />
          </div>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Solicitar vacaciones
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Indica las fechas (días naturales). Tu responsable las revisará en administración.
        </p>
        <form onSubmit={onSubmitRequest} className="mt-4 space-y-3">
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
          <label className="block text-sm">
            <span className="text-slate-700 dark:text-slate-300">
              Comentario (opcional)
            </span>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
              maxLength={500}
              placeholder="Ej. segunda quincena de agosto"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {pending ? "Enviando…" : "Enviar solicitud"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Registros ({data.year})
        </h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2 font-medium">Inicio</th>
                <th className="px-3 py-2 font-medium">Fin</th>
                <th className="px-3 py-2 font-medium">Días</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Notas</th>
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
                  <td className="px-3 py-2">{etiquetaEstadoVacacion(r.status)}</td>
                  <td className="max-w-[12rem] truncate px-3 py-2 text-slate-600 dark:text-slate-400">
                    {r.note ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.status === "PENDING" ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onCancel(r.id)}
                        className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                      >
                        Cancelar solicitud
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.entries.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No hay registros para este año en el calendario.
          </p>
        ) : null}
      </section>
    </div>
  );
}
