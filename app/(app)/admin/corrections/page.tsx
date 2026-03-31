import { CorrectionReviewList } from "@/components/correction-review";
import { getAdminPendingCorrections } from "@/lib/actions";

export default async function AdminCorrectionsPage() {
  const pending = await getAdminPendingCorrections();

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/35 ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        Correcciones pendientes
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Al aprobar, se usa la hora propuesta al calcular el tiempo trabajado.
        Los eventos no se modifican; las correcciones se aplican en el cálculo.
      </p>
      <div className="mt-6">
        <CorrectionReviewList rows={pending} />
      </div>
    </div>
  );
}
