import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import { redirect, unstable_rethrow } from "next/navigation";
import { isValidSessionUserId } from "@/lib/session-id";

export { hasValidAppSession, isValidSessionUserId } from "@/lib/session-id";

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
  const id = session?.user?.id;
  if (!isValidSessionUserId(id)) {
    throw new Error("No autorizado.");
  }
  return { ...session!.user, id } as SessionUser;
}

export async function sessionSuperadminOrThrow(): Promise<SessionUser> {
  const user = await sessionUserOrThrow();
  if (user.role !== "SUPERADMIN") {
    throw new Error("Acceso denegado.");
  }
  return user;
}

/**
 * Vuelve a /login sin encadenar signOut (en producción signOut + AUTH_URL mal
 * configurada generaba bucles y redirecciones raras). El middleware ya no fuerza
 * /login → /dashboard; así no choca con el RSC.
 */
export function redirectToLoginClearingSession(): never {
  redirect("/login");
}

/**
 * Para loaders llamados desde Server Components: sin sesión válida → signout y login.
 */
export async function sessionUserOrRedirect(): Promise<SessionUser> {
  const session = await authSafe();
  const id = session?.user?.id;
  if (!isValidSessionUserId(id)) {
    redirectToLoginClearingSession();
  }
  return { ...session!.user, id } as SessionUser;
}

/** Sin sesión → login; usuario normal en ruta admin → /dashboard */
export async function sessionSuperadminOrRedirect(): Promise<SessionUser> {
  const session = await authSafe();
  const id = session?.user?.id;
  if (!isValidSessionUserId(id)) {
    redirectToLoginClearingSession();
  }
  const user = { ...session!.user, id } as SessionUser;
  if (user.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }
  return user;
}
