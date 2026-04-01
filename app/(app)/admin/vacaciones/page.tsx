import {
  getAdminPendingVacationRequests,
  getAdminVacationUsers,
} from "@/lib/vacation-actions";
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
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        Vacaciones
      </h2>
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
