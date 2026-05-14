import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const authUserTypes = ["admin", "worker", "hr"] as const;
type AuthUserType = (typeof authUserTypes)[number];

function getUserType(path: string): AuthUserType | null {
  const [type] = path.split("/");
  return authUserTypes.includes(type as AuthUserType) ? (type as AuthUserType) : null;
}

async function readJson(response: Response) {
  return response.json().catch(() => null);
}

function getPayload(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const envelope = data as { data?: unknown };
  return envelope.data && typeof envelope.data === "object"
    ? (envelope.data as Record<string, unknown>)
    : (data as Record<string, unknown>);
}

function setAuthCookies(payload: Record<string, unknown>, path: string) {
  const cookieStore = cookies();
  const userType = getUserType(path);

  if (typeof payload.access_token === "string") {
    cookieStore.set("access_token", payload.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  }

  if (typeof payload.refresh_token === "string") {
    cookieStore.set("refresh_token", payload.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  if (userType) {
    cookieStore.set("user_type", userType, {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }
}

async function forwardAuthPost(path: string, body: unknown) {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await readJson(response);
  return { response, data };
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const body = await req.json();

  // Login, OTP verification, and refresh need cookie handling; other auth posts are forwarded.
  if (path.endsWith("login") || path.endsWith("verify-otp")) {
    const { response, data } = await forwardAuthPost(path, body);

    if (response.ok) {
      const payload = getPayload(data);
      setAuthCookies(payload, path);

      // Return data without tokens to the client
      const { access_token, refresh_token, ...rest } = payload;
      return NextResponse.json({ ...(data || {}), data: rest });
    }

    return NextResponse.json(data, { status: response.status });
  }

  if (path.endsWith("refresh")) {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const data = await readJson(response);

    if (response.ok) {
      const payload = getPayload(data);
      setAuthCookies(payload, path);

      const { access_token, refresh_token, ...rest } = payload;
      return NextResponse.json({ ...(data || {}), data: rest });
    }

    return NextResponse.json(data, { status: response.status });
  }

  const { response, data } = await forwardAuthPost(path, body);
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  const cookieStore = cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user_type");
  return NextResponse.json({ success: true });
}
