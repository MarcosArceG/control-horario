/**
 * Evita router.push("/undefined") cuando ?callbackUrl=undefined u otros valores inválidos.
 * Solo acepta rutas relativas del mismo sitio (sin // ni protocolos).
 */
export function safeCallbackPath(
  raw: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (raw == null || raw === "") return fallback;
  const s = raw.trim();
  if (s === "undefined" || s === "null") return fallback;
  if (!s.startsWith("/") || s.startsWith("//")) return fallback;
  if (s.length > 2048) return fallback;
  return s;
}
