"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="min-h-11 min-w-[2.75rem] touch-manipulation rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-200 hover:bg-blue-50/80 active:bg-slate-100 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
    >
      Cerrar sesión
    </button>
  );
}
