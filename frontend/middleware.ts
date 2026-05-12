import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const userType = request.cookies.get("user_type")?.value;
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/admin") &&
    !path.startsWith("/admin/login") &&
    !path.startsWith("/admin/register") &&
    !path.startsWith("/admin/verify") &&
    (!accessToken || userType !== "admin")
  ) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (
    path.startsWith("/worker") &&
    !path.startsWith("/worker/login") &&
    !path.startsWith("/worker/register") &&
    !path.startsWith("/worker/verify") &&
    (!accessToken || userType !== "worker")
  ) {
    return NextResponse.redirect(new URL("/worker/login", request.url));
  }

  if (path.startsWith("/hr") && !path.startsWith("/hr/login") && (!accessToken || userType !== "hr")) {
    return NextResponse.redirect(new URL("/hr/login", request.url));
  }

  if (accessToken) {
    if (path.startsWith("/admin/login") || path.startsWith("/admin/register")) return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    if (path.startsWith("/worker/login") || path.startsWith("/worker/register")) return NextResponse.redirect(new URL("/worker/dashboard", request.url));
    if (path.startsWith("/hr/login")) return NextResponse.redirect(new URL("/hr/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/worker/:path*", "/hr/:path*"],
};
