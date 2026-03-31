/**
 * Se ejecuta al arrancar el runtime de Node en Vercel / servidor.
 * Ayuda a detectar variables críticas ausentes (revisa logs de despliegue).
 */
export function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const missing: string[] = [];
  if (!process.env.AUTH_SECRET?.trim()) missing.push("AUTH_SECRET");
  if (!process.env.DATABASE_URL?.trim()) missing.push("DATABASE_URL");

  if (missing.length > 0) {
    console.error(
      `[control-horario] Faltan variables de entorno: ${missing.join(", ")}. ` +
        "En Vercel: Project → Settings → Environment Variables.",
    );
  }

  const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (process.env.VERCEL && !url?.trim()) {
    console.warn(
      "[control-horario] AUTH_URL no está definida. En producción conviene " +
        "AUTH_URL=https://<tu-dominio> (misma URL pública que usa el navegador).",
    );
  } else if (
    url?.trim() &&
    url.trim().toLowerCase().startsWith("http://") &&
    (process.env.VERCEL || process.env.NODE_ENV === "production")
  ) {
    console.error(
      "[control-horario] AUTH_URL usa http:// pero el sitio en producción es https://. " +
        "Eso provoca fallos de Auth.js (/api/auth/error). Usa https:// + tu dominio público.",
    );
  }
}
