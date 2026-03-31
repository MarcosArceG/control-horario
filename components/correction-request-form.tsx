"use client";

import type { TimeEvent } from "@prisma/client";
import { requestTimeCorrection } from "@/lib/actions";
import { toDatetimeLocalValue } from "@/lib/datetime-local";
import { formatFechaHora } from "@/lib/locale";
import { etiquetaTipoEvento } from "@/lib/labels-es";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function CorrectionRequestForm({ events }: { events: TimeEvent[] }) {
  const router = useRouter();
  const [timeEventId, setTimeEventId] = useState(events[0]?.id ?? "");
  const [proposed, setProposed] = useState(
    events[0] ? toDatetimeLocalValue(new Date(events[0].occurredAt)) : "",
  );
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const ev = events.find((e) => e.id === timeEventId);
    if (ev) {
      setProposed(toDatetimeLocalValue(new Date(ev.occurredAt)));
    }
  }, [timeEventId, events]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!timeEventId || !reason.trim()) {
      setError("Selecciona un evento y describe el motivo.");
      return;
    }
    if (!proposed) {
      setError("Indica la hora propuesta.");
      return;
    }
    const parsed = new Date(proposed);
    if (Number.isNaN(parsed.getTime())) {
      setError("La hora propuesta no es válida.");
      return;
    }
    const iso = parsed.toISOString();
    startTransition(async () => {
      try {
        await requestTimeCorrection({
          timeEventId,
          proposedOccurredAt: iso,
          reason: reason.trim(),
        });
        setReason("");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo enviar la solicitud.",
        );
      }
    });
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Aún no tienes eventos. Registra una entrada primero.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Evento
        </span>
        <select
          value={timeEventId}
          onChange={(e) => setTimeEventId(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {etiquetaTipoEvento(ev.type)} —{" "}
              {formatFechaHora(ev.occurredAt)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Hora propuesta
        </span>
        <input
          type="datetime-local"
          value={proposed}
          onChange={(e) => setProposed(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
        <span className="text-xs text-slate-500">
          Por defecto coincide con la hora actual del evento; ajústala si
          procede.
        </span>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Motivo
        </span>
        <textarea
          required
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          placeholder="Explica por qué necesitas esta corrección."
        />
      </label>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        {pending ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
