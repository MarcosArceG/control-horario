import { LoginForm } from "@/components/login-form";
import { authSafe } from "@/lib/auth-safe";
import { hasValidAppSession } from "@/lib/session-id";
import { redirect } from "next/navigation";
import { Suspense } from "react";

/** Siempre leer cookies en el servidor; evita parpadeo login/dashboard por useSession en cliente. */
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await authSafe();
  if (hasValidAppSession(session)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-gradient-to-b from-blue-50/90 via-slate-50 to-slate-100 px-4 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] pt-[max(3rem,env(safe-area-inset-top))] dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <Suspense fallback={<p className="text-sm text-slate-500">Cargando…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
