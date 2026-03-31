/**
 * Superadministradores definidos solo en variables de entorno (varios pares email/contraseña).
 * Formato: SUPERADMIN_ACCOUNTS JSON array, p. ej.
 * [{"email":"admin@empresa.com","password":"secreto1"},{"email":"otro@empresa.com","password":"secreto2"}]
 */

export type EnvSuperadminAccount = { email: string; password: string };

export function parseSuperadminAccountsFromEnv(): EnvSuperadminAccount[] {
  const raw = process.env.SUPERADMIN_ACCOUNTS;
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const out: EnvSuperadminAccount[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        "email" in item &&
        "password" in item &&
        typeof (item as { email: unknown }).email === "string" &&
        typeof (item as { password: unknown }).password === "string"
      ) {
        const email = (item as { email: string }).email.trim().toLowerCase();
        const password = (item as { password: string }).password;
        if (email && password.length > 0) {
          out.push({ email, password });
        }
      }
    }
    return out;
  } catch {
    return [];
  }
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
