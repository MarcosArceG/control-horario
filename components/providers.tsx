"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
  /** Obligatorio en App Router: evita desincronización hidratación → pantalla en blanco. */
  session: Session | null;
};

export function Providers({ children, session }: Props) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
