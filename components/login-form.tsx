"use client";

import { signIn } from "next-auth/react";
import { safeCallbackPath } from "@/lib/safe-callback-path";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackPath(
    searchParams?.get("callbackUrl"),
    "/dashboard",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Correo o contraseña incorrectos.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-8 shadow-md shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-950 dark:shadow-none"
    >
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Iniciar sesión
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Usa tu correo y contraseña de trabajo.
        </p>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Correo electrónico
        </span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-500/50 focus:border-blue-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Contraseña
        </span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-blue-500/50 focus:border-blue-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-400 dark:shadow-none"
      >
        {pending ? "Entrando…" : "Continuar"}
      </button>
    </form>
  );
}
