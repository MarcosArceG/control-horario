"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/users", label: "Usuarios" },
  { href: "/admin/time-logs", label: "Registro horario" },
  { href: "/admin/vacaciones", label: "Vacaciones" },
  { href: "/admin/corrections", label: "Correcciones" },
  { href: "/admin/export", label: "Exportar horas" },
  { href: "/admin/audit", label: "Logs" },
] as const;

export function AdminSubnav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 dark:border-slate-800">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20 dark:bg-blue-500 dark:text-white"
                : "text-slate-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
