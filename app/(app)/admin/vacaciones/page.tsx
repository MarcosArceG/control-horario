import {
  getAdminPendingVacationRequests,
  getAdminVacationUsers,
} from "@/lib/vacation-actions";
import { VACATION_DAYS_PER_YEAR } from "@/lib/vacation-days";
import { AdminPendingVacations } from "@/components/vacations/admin-pending-vacations";
import { AdminVacationsPanel } from "@/components/vacations/admin-vacations-panel";
import { unstable_noStore as noStore } from "next/cache";

/** Datos en tiempo real: lista de pendientes y no caché RSC obsoleto. */
export const dynamic = "force-dynamic";

export default async function AdminVacacionesPage() {
  noStore();
  const [users, pendingRequests] = await Promise.all([
    getAdminVacationUsers(),
    getAdminPendingVacationRequests(),
  ]);
  const year = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Vacaciones
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Aprueba las solicitudes que envían los empleados desde su pestaña de vacaciones,
          o registra períodos directamente por persona. El tope por defecto es{" "}
          {VACATION_DAYS_PER_YEAR} días naturales al año natural; puedes cambiarlo por
          persona (p. ej. incorporación a mitad de año).
        </p>
      </div>
      <AdminPendingVacations initial={pendingRequests} />
      <AdminVacationsPanel
        users={users}
        initialUserId={null}
        initialYear={year}
        initial={null}
      />
    </div>
  );
}
