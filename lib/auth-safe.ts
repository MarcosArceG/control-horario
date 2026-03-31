import { auth, signOut } from "@/lib/auth";
import type { Session } from "next-auth";
import { redirect, unstable_rethrow } from "next/navigation";

/** Usuario de sesión con id garantizado (p. ej. callbacks JWT). */
export type SessionUser = NonNullable<Session["user"]> & { id: string };

/**
 * Evita que un fallo real de Auth en el layout tumbe toda la app (p. ej. AUTH_SECRET mal copiado en Vercel).
 * No atrapa errores internos de Next (p. ej. render dinámico con `headers()` durante el prerender).
 */
export async function authSafe(): Promise<Session | null> {
  try {
    return await auth();
  } catch (err) {
    unstable_rethrow(err);
    const message = err instanceof Error ? err.message : String(err);
    console.error("[control-horario][auth]", message);
    return null;
  }
}

/**
 * Para server actions y datos: sesión válida o error controlado.
 * Usa esto en lugar de `auth()` + assertUser: `auth()` puede lanzar con cookie/JWT inválidos y tumbar el render RSC.
 */
export async function sessionUserOrThrow(): Promise<SessionUser> {
  const session = await authSafe();
  if (!session?.user?.id) {
    throw new Error("No autorizado.");
  }
  return session.user as SessionUser;
}

export async function sessionSuperadminOrThrow(): Promise<SessionUser> {
  const user = await sessionUserOrThrow();
  if (user.role !== "SUPERADMIN") {
    throw new Error("Acceso denegado.");
  }
  return user;
}

/** URL de login tras cerrar sesión (absoluta si hay AUTH_URL / NEXT_PUBLIC_APP_URL). */
function buildLoginCallbackUrl(): string {
  const base =
    process.env.AUTH_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (base) {
    return `${base.replace(/\/$/, "")}/login`;
  }
  return "/login";
}

/**
 * Cierra sesión con POST interno (Auth.js) y redirige a /login. Úsalo cuando la
 * sesión no es válida en RSC pero el middleware aún ve cookie: evita el bucle
 * login ↔ dashboard (ERR_TOO_MANY_REDIRECTS).
 */
export async function redirectToLoginClearingSession(): Promise<never> {
  await signOut({ redirectTo: buildLoginCallbackUrl() });
  throw new Error("signOut debería redirigir");
}

/**
 * Para loaders llamados desde Server Components: sin sesión válida → signout y login.
 */
export async function sessionUserOrRedirect(): Promise<SessionUser> {
  const session = await authSafe();
  if (!session?.user?.id) {
    await redirectToLoginClearingSession();
  }
  return session!.user as SessionUser;
}

/** Sin sesión → signout + login; usuario normal en ruta admin → /dashboard */
export async function sessionSuperadminOrRedirect(): Promise<SessionUser> {
  const session = await authSafe();
  if (!session?.user?.id) {
    await redirectToLoginClearingSession();
  }
  const user = session!.user as SessionUser;
  if (user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }
  return user;
}
