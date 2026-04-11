import { formatInTimeZone } from "date-fns-tz";
import { APP_TIMEZONE } from "@/lib/locale";

/** Formatea una `Date` para `<input type="datetime-local" />` en hora de España. */
export function toDatetimeLocalValue(d: Date): string {
  return formatInTimeZone(d, APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}
