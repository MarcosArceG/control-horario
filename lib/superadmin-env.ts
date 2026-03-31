/**
 * Superadministradores definidos solo en variables de entorno (varios pares email/contraseña).
 * Formato: SUPERADMIN_ACCOUNTS JSON array, p. ej.
 * [{"email":"admin@empresa.com","password":"secreto1"},{"email":"otro@empresa.com","password":"secreto2"}]
 *
 * También se acepta la clave `pass` como alias de `password` (útil si el JSON se acorta en paneles).
 */

export type EnvSuperadminAccount = { email: string; password: string };

/** Normaliza texto pegado desde Vercel u otros paneles (BOM, comillas tipográficas). */
function normalizeEnvJson(raw: string): string {
  let s = raw.trim();
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
  return s
    .replace(/[\u201c\u201d\u201e\u201f]/g, '"')
    .replace(/[\u2018\u2019]/g, "'");
}

/**
 * Acepta el array JSON directo o una cadena JSON que al parsear devuelve el array
 * (doble codificación que a veces introduce el panel de variables).
 */
function tryParseJsonArray(raw: string): unknown[] | null {
  const normalized = normalizeEnvJson(raw);
  if (!normalized) return null;

  function parseFlexible(s: string): unknown[] | null {
    try {
      const v = JSON.parse(s);
      if (Array.isArray(v)) return v;
      if (typeof v === "string") return parseFlexible(v);
      return null;
    } catch {
      return null;
    }
  }

  return parseFlexible(normalized);
}

function passwordFromItem(item: object): string | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;
  if (typeof o.password === "string" && o.password.length > 0) {
    return o.password;
  }
  if (typeof o.pass === "string" && o.pass.length > 0) {
    return o.pass;
  }
  return null;
}

export function parseSuperadminAccountsFromEnv(): EnvSuperadminAccount[] {
  const raw = process.env.SUPERADMIN_ACCOUNTS;
  if (!raw?.trim()) return [];

  const parsed = tryParseJsonArray(raw);
  if (!parsed) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[SUPERADMIN_ACCOUNTS] JSON no válido. Usa un array [{\"email\":\"...\",\"password\":\"...\"}] en una línea.",
      );
    }
    return [];
  }

  const out: EnvSuperadminAccount[] = [];
  for (const item of parsed) {
    if (
      item &&
      typeof item === "object" &&
      "email" in item &&
      typeof (item as { email: unknown }).email === "string"
    ) {
      const email = (item as { email: string }).email.trim().toLowerCase();
      const password = passwordFromItem(item as object);
      if (email && password && password.length > 0) {
        out.push({ email, password });
      }
    }
  }

  if (
    process.env.NODE_ENV === "development" &&
    raw.trim().length > 0 &&
    out.length === 0
  ) {
    console.warn(
      "[SUPERADMIN_ACCOUNTS] El JSON se parseó pero no hay entradas con email y password/pass.",
    );
  }

  return out;
}

export function findEnvSuperadminMatch(
  email: string,
  password: string,
): EnvSuperadminAccount | undefined {
  const e = email.trim().toLowerCase();
  return parseSuperadminAccountsFromEnv().find(
    (a) => a.email === e && a.password === password,
  );
}

export function isEnvSuperadminEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return parseSuperadminAccountsFromEnv().some((a) => a.email === e);
}

export function envSuperadminCount(): number {
  return parseSuperadminAccountsFromEnv().length;
}
