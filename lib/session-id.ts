import type { Session } from "next-auth";

/** Id de usuario en JWT (cuid Prisma); evita `where: { id: undefined }` y bucles login↔dashboard. */
export function isValidSessionUserId(id: unknown): id is string {
  if (typeof id !== "string") return false;
  const s = id.trim();
  return s.length >= 16 && s.length <= 128 && /^[a-z0-9]+$/i.test(s);
}

export type SessionWithValidUser = Session & {
  user: NonNullable<Session["user"]> & { id: string };
};

/** Sesión utilizable en la app (no solo cookie con JWT incompleto). */
export function hasValidAppSession(
  session: Session | null | undefined,
): session is SessionWithValidUser {
  return !!session?.user && isValidSessionUserId(session.user.id);
}
