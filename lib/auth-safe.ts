import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import { unstable_rethrow } from "next/navigation";

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
