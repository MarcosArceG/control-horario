"use client";

import { adminSetUserPassword } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  userId: string;
  email: string;
};

export function AdminResetPasswordButton({ userId, email }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Mínimo 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    startTransition(async () => {
      try {
        await adminSetUserPassword({ userId, newPassword: password });
        setOpen(false);
        setPassword("");
        setConfirm("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar.");
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-end gap-2 text-left">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          setError(null);
        }}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {open ? "Cerrar" : "Nueva contraseña"}
      </button>
      {open ? (
        <form
          onSubmit={onSubmit}
          className="flex w-[min(100%,18rem)] flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-600 dark:bg-slate-800"
        >
          <p className="text-slate-600 dark:text-slate-400">{email}</p>
          <label className="block">
            <span className="sr-only">Nueva contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nueva contraseña (mín. 8)"
              className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="block">
            <span className="sr-only">Repetir contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repetir contraseña"
              className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          {error ? (
            <p className="text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-slate-900 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            {pending ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
