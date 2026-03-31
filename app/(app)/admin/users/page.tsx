import { AdminResetPasswordButton } from "@/components/admin-reset-password-button";
import { CreateUserForm } from "@/components/create-user-form";
import { DeleteUserButton } from "@/components/delete-user-button";
import { getAdminUsers } from "@/lib/actions";
import { authSafe, redirectToLoginClearingSession } from "@/lib/auth-safe";
import { formatFecha } from "@/lib/locale";
import { etiquetaRol } from "@/lib/labels-es";
import {
  envSuperadminCount,
  isEnvSuperadminEmail,
} from "@/lib/superadmin-env";

export default async function AdminUsersPage() {
  const session = await authSafe();
  if (!session?.user) redirectToLoginClearingSession();
  const users = await getAdminUsers();
  const superAdminCount = users.filter((u) => u.role === "SUPERADMIN").length;
  const envSuperAdmins = envSuperadminCount();
  const currentUserId = session?.user?.id ?? "";

  return (
    <div className="space-y-10">
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/35 ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Crear usuario
        </h2>
        <div className="mt-4 max-w-md">
          <CreateUserForm />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/35 ring-1 ring-slate-100/60 dark:border-slate-800 dark:bg-slate-900 dark:ring-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Todos los usuarios
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <th className="py-2 pr-4 font-medium">Correo</th>
                <th className="py-2 pr-4 font-medium">Nombre</th>
                <th className="py-2 pr-4 font-medium">Rol</th>
                <th className="py-2 pr-4 font-medium">Alta</th>
                <th className="py-2 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-100 dark:border-slate-800"
                >
                  <td className="py-2 pr-4 text-slate-900 dark:text-slate-100">
                    {u.email}
                  </td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                    {u.name ?? "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        u.role === "SUPERADMIN"
                          ? "rounded bg-blue-100 px-2 py-0.5 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                          : "text-slate-600 dark:text-slate-400"
                      }
                    >
                      {etiquetaRol(u.role)}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-500">
                    {formatFecha(u.createdAt)}
                  </td>
                  <td className="py-2 text-right">
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end sm:gap-3">
                      {u.role === "USER" ? (
                        <AdminResetPasswordButton
                          userId={u.id}
                          email={u.email}
                        />
                      ) : null}
                      <DeleteUserButton
                        userId={u.id}
                        email={u.email}
                        role={u.role}
                        currentUserId={currentUserId}
                        superAdminCount={superAdminCount}
                        envSuperadminCount={envSuperAdmins}
                        isEnvSuperadminEmail={isEnvSuperadminEmail(u.email)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
