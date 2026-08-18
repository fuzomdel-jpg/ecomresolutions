import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaff } from "@/lib/rbac";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const guestAllowed =
    pathname.startsWith("/app/new") ||
    pathname.startsWith("/app/checkout") ||
    pathname.startsWith("/api/intake") ||
    pathname.startsWith("/api/search") ||
    pathname.startsWith("/api/checkout/preview");

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!req.auth?.user || !isStaff(req.auth.user.role)) {
      const login = new URL("/login", req.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (pathname.startsWith("/app") && !guestAllowed && !req.auth) {
    const login = new URL("/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/admin/:path*", "/api/admin/:path*"],
};
