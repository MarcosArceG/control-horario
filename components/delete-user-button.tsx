"use client";

import { adminDeleteUser } from "@/lib/actions";
import type { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  userId: string;
  email: string;
  role: Role;
  currentUserId: string;
  superAdminCount: number;
};

export function DeleteUserButton({
  userId,
  email,
  role,
  currentUserId,
  superAdminCount,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const blocked =
    userId === currentUserId ||
    (role === "SUPERADMIN" && superAdminCount <= 1);

  function onDelete() {
    if (blocked) return;
    const ok = window.confirm(
      `¿Eliminar definitivamente la cuenta ${email}? Esta acción no se puede deshacer.`,
    );
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      try {
        await adminDeleteUser(userId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo eliminar.");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending || blocked}
        onClick={onDelete}
        title={
          blocked
            ? userId === currentUserId
              ? "No puedes eliminar tu propia cuenta"
              : "No se puede eliminar el único superadministrador"
            : "Eliminar usuario"
        }
        className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950"
      >
        {pending ? "…" : "Eliminar"}
      </button>
      {error ? (
        <span className="max-w-[140px] text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </div>
  );
}
