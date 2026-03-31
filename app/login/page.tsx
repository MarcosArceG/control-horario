import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-blue-50/90 via-slate-50 to-slate-100 px-4 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
