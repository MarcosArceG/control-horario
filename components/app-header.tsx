import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export async function AppHeader() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.role === "SUPERADMIN";

  return (
    <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50"
        >
          Control Horario
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-400">
          <Link
            href="/dashboard"
            className="hover:text-slate-900 dark:hover:text-slate-100"
          >
            Panel
          </Link>
          <Link
            href="/corrections"
            className="hover:text-slate-900 dark:hover:text-slate-100"
          >
            Correcciones
          </Link>
          {isAdmin ? (
            <>
              <Link
                href="/admin/users"
                className="rounded-md bg-blue-100 px-2 py-0.5 text-blue-900 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900"
              >
                Administración
              </Link>
            </>
          ) : null}
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden text-right text-xs text-slate-500 sm:block">
            {session.user.email}
          </span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
