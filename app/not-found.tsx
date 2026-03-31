import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-b from-blue-50/90 via-slate-50 to-slate-100 px-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
        Página no encontrada
      </h1>
      <p className="text-center text-sm text-slate-500">
        La dirección no existe o ha cambiado.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-600/25 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
      >
        Ir al panel
      </Link>
    </div>
  );
}
