import { getAdminTimeLogs } from "@/lib/actions";
import { formatFechaHora } from "@/lib/locale";
import { etiquetaTipoEvento } from "@/lib/labels-es";

export default async function AdminTimeLogsPage() {
  const logs = await getAdminTimeLogs();

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/35 ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        Todos los registros
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Registro de solo lectura. Las correcciones siguen el flujo de
        aprobación.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
              <th className="py-2 pr-4 font-medium">Cuándo</th>
              <th className="py-2 pr-4 font-medium">Usuario</th>
              <th className="py-2 font-medium">Tipo</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((e) => (
              <tr
                key={e.id}
                className="border-b border-slate-100 dark:border-slate-800"
              >
                <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                  {formatFechaHora(e.occurredAt)}
                </td>
                <td className="py-2 pr-4 text-slate-900 dark:text-slate-100">
                  {e.user.email}
                  {e.user.name ? (
                    <span className="text-slate-500"> ({e.user.name})</span>
                  ) : null}
                </td>
                <td className="py-2 font-medium text-slate-800 dark:text-slate-200">
                  {etiquetaTipoEvento(e.type)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
