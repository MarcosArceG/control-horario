"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * En /login: si ya hay sesión (JWT válido en cliente), ir al panel.
 * Sustituye el redirect del middleware para evitar bucles con el render RSC.
 */
export function RedirectIfAuthenticated() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  return null;
}
