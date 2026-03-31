import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export async function AppHeader() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.role === "SUPERADMIN";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
          <Link
            href="/dashboard"
            className="min-w-0 shrink truncate text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-lg"
          >
            Control Horario
          </Link>
          <div className="shrink-0 sm:hidden">
            <LogoutButton />
          </div>
        </div>

        <nav
          className="-mx-1 flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 overflow-x-auto pb-0.5 text-sm font-medium text-slate-600 dark:text-slate-400 sm:justify-end sm:overflow-visible sm:pb-0"
          aria-label="Principal"
        >
          <Link
            href="/dashboard"
            className="shrink-0 rounded-md px-1 py-1.5 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            Panel
          </Link>
          <Link
            href="/corrections"
            className="shrink-0 rounded-md px-1 py-1.5 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            Correcciones
          </Link>
          {!isAdmin ? (
            <Link
              href="/vacaciones"
              className="shrink-0 rounded-md px-1 py-1.5 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              Vacaciones
            </Link>
          ) : null}
          {isAdmin ? (
            <Link
              href="/admin/users"
              className="shrink-0 rounded-md bg-blue-100 px-2 py-1.5 text-blue-900 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
            >
              Administración
            </Link>
          ) : null}
        </nav>

        <div className="hidden min-w-0 items-center gap-3 sm:flex">
          <span className="max-w-[200px] truncate text-right text-xs text-slate-500 lg:max-w-xs">
            {session.user.email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
