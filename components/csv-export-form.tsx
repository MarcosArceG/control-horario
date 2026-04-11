"use client";

import { exportWorkedHoursCsv } from "@/lib/actions";
import { APP_TIMEZONE } from "@/lib/locale";
import { formatInTimeZone } from "date-fns-tz";
import { useState, useTransition } from "react";

type UserOption = { id: string; email: string; name: string | null };

export function CsvExportForm({ users }: { users: UserOption[] }) {
  const [from, setFrom] = useState(() => {
    const now = new Date();
    const y = formatInTimeZone(now, APP_TIMEZONE, "yyyy");
    const m = formatInTimeZone(now, APP_TIMEZONE, "MM");
    return `${y}-${m}-01`;
  });
  const [to, setTo] = useState(() =>
    formatInTimeZone(new Date(), APP_TIMEZONE, "yyyy-MM-dd"),
  );
  const [userId, setUserId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function download(filename: string, text: string) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const csv = await exportWorkedHoursCsv({
          from,
          to,
          userId: userId || null,
        });
        const picked = users.find((u) => u.id === userId);
        const slug = picked
          ? `${picked.email.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}`
          : "todos";
        download(`horas-${slug}-${from}-${to}.csv`, csv);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al exportar.",
        );
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Trabajador
        </span>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">Todos los trabajadores</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ? `${u.name} (${u.email})` : u.email}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Desde (fecha, calendario España)
          </span>
          <input
            type="date"
            required
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            Hasta (fecha, calendario España)
          </span>
          <input
            type="date"
            required
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        {pending ? "Generando…" : "Descargar archivo"}
      </button>
    </form>
  );
}
