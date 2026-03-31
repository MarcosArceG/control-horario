"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-4 dark:bg-slate-950">
      <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
        Algo ha salido mal
      </h1>
      <p className="max-w-md text-center text-sm text-slate-600 dark:text-slate-400">
        {error.message || "Error inesperado al cargar la página."}
      </p>
      {error.digest ? (
        <p className="font-mono text-xs text-slate-500 dark:text-slate-500">
          Referencia: {error.digest}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );
}
