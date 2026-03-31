import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function authorizeCredentials(credentials: unknown) {
  const c = credentials as { email?: string; password?: string } | undefined;
  const email = c?.email;
  const password = c?.password;
  if (!email || !password) return null;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name ?? undefined,
    role: user.role as Role,
  };
}
