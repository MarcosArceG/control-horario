import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
import {
  findEnvSuperadminMatch,
  isEnvSuperadminEmail,
} from "@/lib/superadmin-env";

export async function authorizeCredentials(credentials: unknown) {
  try {
    const c = credentials as { email?: string; password?: string } | undefined;
    const email = c?.email?.trim().toLowerCase();
    const password = c?.password;
    if (!email || !password) return null;

    const envMatch = findEnvSuperadminMatch(email, password);
    if (envMatch) {
      const passwordHash = await bcrypt.hash(envMatch.password, 12);
      const user = await prisma.user.upsert({
        where: { email },
        create: {
          email,
          passwordHash,
          name: "Superadministrador",
          role: "SUPERADMIN",
        },
        update: {
          passwordHash,
          role: "SUPERADMIN",
        },
      });
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role as Role,
      };
    }

    if (isEnvSuperadminEmail(email)) {
      return null;
    }

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
  } catch (e) {
    console.error("[auth] authorizeCredentials:", e);
    return null;
  }
}
