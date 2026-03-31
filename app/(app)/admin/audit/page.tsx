import { getAdminAuditLogs } from "@/lib/actions";
import { formatFechaHora } from "@/lib/locale";
import {
  etiquetaAccionAuditoria,
  etiquetaTipoEntidadAuditoria,
} from "@/lib/labels-es";

export default async function AdminAuditPage() {
  const logs = await getAdminAuditLogs();

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/35 ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        Registro de auditoría
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Acciones recientes de seguridad y datos (más recientes primero).
      </p>
      <ul className="mt-6 space-y-3 text-sm">
        {logs.map((l) => (
          <li
            key={l.id}
            className="rounded-lg border border-slate-100 p-3 text-xs dark:border-slate-800"
          >
            <div className="flex flex-wrap gap-2 text-slate-500">
              <span>{formatFechaHora(l.createdAt)}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {etiquetaAccionAuditoria(l.action)}
              </span>
            </div>
            <div className="mt-1 text-slate-600 dark:text-slate-400">
              Usuario: {l.actor?.email ?? "—"} ·{" "}
              {etiquetaTipoEntidadAuditoria(l.entityType)}
              {l.entityId ? ` · identificador: ${l.entityId}` : ""}
            </div>
            {l.metadata != null ? (
              <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all font-mono text-slate-500">
                {JSON.stringify(l.metadata, null, 2)}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
