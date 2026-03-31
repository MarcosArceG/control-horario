/**
 * Idioma único de la aplicación: español (España).
 * Usa siempre estas funciones para fechas en pantalla.
 */
export const APP_LOCALE = "es-ES" as const;

export function formatFechaHora(d: Date): string {
  return d.toLocaleString(APP_LOCALE);
}

export function formatFecha(d: Date): string {
  return d.toLocaleDateString(APP_LOCALE);
}

/** Duración tipo "04:13" (horas:minutos, reloj de 24 h máx). */
export function formatDuracionHM(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Texto legible: "4 h 16 min". */
export function formatDuracionLarga(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
}
