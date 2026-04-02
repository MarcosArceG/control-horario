import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";

export const authConfig = {
  /** Obligatorio en producción; sin esto Auth.js devuelve /api/auth/error "Server error". */
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      authorize: async (credentials) => {
        const { authorizeCredentials } = await import("./auth-authorize");
        return authorizeCredentials(credentials);
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const id = token.id;
        const role = token.role;
        if (typeof id !== "string" || !id.trim()) {
          session.user.id = "";
          session.user.role = "USER";
        } else {
          session.user.id = id;
          session.user.role = (role as Role) ?? "USER";
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      const { logSignIn } = await import("./auth-audit");
      await logSignIn(user);
    },
  },
} satisfies NextAuthConfig;
