import { getAdminVacationUsers } from "@/lib/vacation-actions";
import { VACATION_DAYS_PER_YEAR } from "@/lib/vacation-days";
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
          Registra las vacaciones por empleado. El tope por defecto es{" "}
          {VACATION_DAYS_PER_YEAR} días naturales al año natural; puedes cambiarlo
          por persona (p. ej. incorporación a mitad de año).
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
