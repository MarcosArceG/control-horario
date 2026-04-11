import { formatInTimeZone } from "date-fns-tz";

/**
 * Idioma único de la aplicación: español (España).
 * Usa siempre estas funciones para fechas en pantalla.
 */
export const APP_LOCALE = "es-ES" as const;

/** Zona horaria de negocio: jornada, días y exportaciones. */
export const APP_TIMEZONE = "Europe/Madrid" as const;

/** Año natural en calendario de España (útil en servidor sin depender de TZ del proceso). */
export function calendarYearSpain(now: Date = new Date()): number {
  return Number(formatInTimeZone(now, APP_TIMEZONE, "yyyy"));
}

export function formatFechaHora(d: Date): string {
  return d.toLocaleString(APP_LOCALE, { timeZone: APP_TIMEZONE });
}

export function formatFecha(d: Date): string {
  return d.toLocaleDateString(APP_LOCALE, { timeZone: APP_TIMEZONE });
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
