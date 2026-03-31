import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const authMiddleware = auth((req) => {
  const { pathname } = req.nextUrl;
  const loggedIn = !!req.auth;

  if (pathname.startsWith("/login")) {
    if (loggedIn) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/corrections") ||
    pathname.startsWith("/vacaciones") ||
    pathname.startsWith("/admin")
  ) {
    if (!loggedIn) {
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname || "/");
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/admin")) {
      if (req.auth?.user?.role !== "SUPERADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
});

export default async function middleware(
  ...args: Parameters<typeof authMiddleware>
) {
  try {
    return await authMiddleware(...args);
  } catch (e) {
    console.error("[middleware]", e);
    const req = args[0];
    const login = new URL("/login", req.url);
    login.searchParams.set("callbackUrl", req.nextUrl.pathname || "/");
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/corrections",
    "/corrections/:path*",
    "/vacaciones",
    "/vacaciones/:path*",
    "/admin",
    "/admin/:path*",
    "/login",
    "/login/:path*",
  ],
};
