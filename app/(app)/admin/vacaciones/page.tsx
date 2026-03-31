import { getAdminVacationUsers } from "@/lib/vacation-actions";
import { AdminVacationsPanel } from "@/components/vacations/admin-vacations-panel";

export default async function AdminVacacionesPage() {
  const users = await getAdminVacationUsers();
  const year = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Vacaciones
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Registra las vacaciones disfrutadas por cada empleado (22 días laborables
          al año natural).
        </p>
      </div>
      <AdminVacationsPanel
        users={users}
        initialUserId={null}
        initialYear={year}
        initial={null}
      />
    </div>
  );
}
