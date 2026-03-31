"use client";

import { adminReviewCorrection } from "@/lib/actions";
import { formatFechaHora } from "@/lib/locale";
import { etiquetaTipoEvento } from "@/lib/labels-es";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Row = {
  id: string;
  proposedOccurredAt: Date;
  reason: string;
  subject: { email: string; name: string | null };
  timeEvent: { type: string; occurredAt: Date };
  requestedBy: { email: string };
};

export function CorrectionReviewList({ rows }: { rows: Row[] }) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No hay solicitudes de corrección pendientes.
      </p>
    );
  }

  return (
    <ul className="space-y-6">
      {rows.map((c) => (
        <li
          key={c.id}
          className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
        >
          <div className="flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {c.subject.email}
            </span>
            <span>· solicitada por {c.requestedBy.email}</span>
          </div>
          <p className="mt-2 text-sm">
            <span className="text-slate-500">Evento:</span>{" "}
            <span className="font-mono text-slate-800 dark:text-slate-200">
              {etiquetaTipoEvento(c.timeEvent.type)}
            </span>{" "}
            el {formatFechaHora(c.timeEvent.occurredAt)}
          </p>
          <p className="mt-1 text-sm">
            <span className="text-slate-500">Propuesta:</span>{" "}
            {formatFechaHora(c.proposedOccurredAt)}
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {c.reason}
          </p>
          <ReviewActions id={c.id} onDone={() => router.refresh()} />
        </li>
      ))}
    </ul>
  );
}

function ReviewActions({ id, onDone }: { id: string; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: "APPROVED" | "REJECTED") {
    setError(null);
    startTransition(async () => {
      try {
        await adminReviewCorrection(id, decision, note || undefined);
        setNote("");
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al procesar.");
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="text-slate-500">Nota (opcional)</span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        />
      </label>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("APPROVED")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          Aprobar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("REJECTED")}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Rechazar
        </button>
      </div>
      {error ? (
        <p className="w-full text-sm text-red-600 sm:order-last">{error}</p>
      ) : null}
    </div>
  );
}
