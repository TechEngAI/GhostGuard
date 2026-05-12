"use client";

import Cookies from "js-cookie";
import type { UserType } from "@/types";

const cookieOptions: Cookies.CookieAttributes = {
  expires: 7,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

export function setTokens(accessToken: string, refreshToken: string, userType: UserType) {
  Cookies.set("access_token", accessToken, cookieOptions);
  Cookies.set("refresh_token", refreshToken, cookieOptions);
  Cookies.set("user_type", userType, cookieOptions);
}

export function clearTokens() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  Cookies.remove("user_type");
}

export function getAccessToken() {
  return Cookies.get("access_token");
}

export function getRefreshToken() {
  return Cookies.get("refresh_token");
}

export function getUserType(): UserType | null {
  const value = Cookies.get("user_type");
  return value === "admin" || value === "worker" || value === "hr" ? value : null;
}
