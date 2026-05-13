import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const userType = request.cookies.get("user_type")?.value;
  const path = request.nextUrl.pathname;

  const isAdminPath = path.startsWith("/admin");
  const isWorkerPath = path.startsWith("/worker");
  const isHrPath = path.startsWith("/hr");

  const isAuthPage = 
    path.includes("/login") || 
    path.includes("/register") || 
    path.includes("/verify") || 
    path.includes("/forgot-password") || 
    path.includes("/reset-password");

  // If not logged in and trying to access a protected path, redirect to login
  if (!accessToken) {
    if ((isAdminPath || isWorkerPath || isHrPath) && !isAuthPage) {
      if (isAdminPath) return NextResponse.redirect(new URL("/admin/login", request.url));
      if (isWorkerPath) return NextResponse.redirect(new URL("/worker/login", request.url));
      if (isHrPath) return NextResponse.redirect(new URL("/hr/login", request.url));
    }
    return NextResponse.next();
  }

  // If logged in, prevent access to auth pages - redirect to their dashboard
  if (isAuthPage) {
    if (userType === "admin") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    if (userType === "worker") return NextResponse.redirect(new URL("/worker/dashboard", request.url));
    if (userType === "hr") return NextResponse.redirect(new URL("/hr/dashboard", request.url));
  }

  // Role-based path protection
  if (isAdminPath && userType !== "admin") {
    return NextResponse.redirect(new URL(`/${userType}/dashboard`, request.url));
  }
  if (isWorkerPath && userType !== "worker") {
    return NextResponse.redirect(new URL(`/${userType}/dashboard`, request.url));
  }
  if (isHrPath && userType !== "hr") {
    return NextResponse.redirect(new URL(`/${userType}/dashboard`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/worker/:path*", "/hr/:path*"],
};
