import { authSafe, redirectToLoginClearingSession } from "@/lib/auth-safe";
import { hasValidAppSession } from "@/lib/session-id";
import { redirect } from "next/navigation";
import { getMyVacationSummary } from "@/lib/vacation-actions";
import { MyVacationsPanel } from "@/components/vacations/my-vacations-panel";

export default async function VacacionesPage() {
  const session = await authSafe();
  if (!hasValidAppSession(session)) redirectToLoginClearingSession();
  if (session!.user.role === "SUPERADMIN") redirect("/admin/vacaciones");

  const year = new Date().getFullYear();
  const initial = await getMyVacationSummary(year);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Vacaciones
        </h1>
      </div>
      <MyVacationsPanel initial={initial} initialYear={year} />
    </div>
  );
}
