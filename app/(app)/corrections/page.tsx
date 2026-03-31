import { CorrectionRequestForm } from "@/components/correction-request-form";
import {
  getMyCorrectionRequests,
  getMyTimeEventsForCorrections,
} from "@/lib/actions";
import { formatFechaHora } from "@/lib/locale";
import { etiquetaEstadoCorreccion, etiquetaTipoEvento } from "@/lib/labels-es";

export default async function CorrectionsPage() {
  const events = await getMyTimeEventsForCorrections();
  const { pending, past } = await getMyCorrectionRequests();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Solicitudes de corrección
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Los eventos no se pueden editar directamente. Solicita un cambio; un
          administrador lo revisará.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/35 ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Nueva solicitud
        </h2>
        <div className="mt-4">
          <CorrectionRequestForm events={events} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/35 ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pendientes
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {pending.length === 0 ? (
            <li className="text-slate-500">No hay solicitudes pendientes.</li>
          ) : (
            pending.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-slate-100 p-3 dark:border-slate-800"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {etiquetaTipoEvento(c.timeEvent.type)} → propuesta{" "}
                  {formatFechaHora(c.proposedOccurredAt)}
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  {c.reason}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/35 ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Historial
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {past.length === 0 ? (
            <li className="text-slate-500">No hay solicitudes anteriores.</li>
          ) : (
            past.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-slate-100 p-3 dark:border-slate-800"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      c.status === "APPROVED"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-red-600 dark:text-red-400"
                    }
                  >
                    {etiquetaEstadoCorreccion(c.status)}
                  </span>
                  <span className="text-slate-500">
                    {etiquetaTipoEvento(c.timeEvent.type)} →{" "}
                    {formatFechaHora(c.proposedOccurredAt)}
                  </span>
                </div>
                {c.reviewNote ? (
                  <p className="mt-1 text-slate-600">{c.reviewNote}</p>
                ) : null}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
