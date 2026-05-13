import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const body = await req.json();

  // We only handle login and refresh here specifically to set cookies
  if (path.endsWith("login") || path.endsWith("verify-otp")) {
    const response = await fetch(`${API_URL}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      const payload = data.data || data;
      const cookieStore = cookies();
      
      if (payload.access_token) {
        cookieStore.set("access_token", payload.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });
      }
      
      if (payload.refresh_token) {
        cookieStore.set("refresh_token", payload.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
        });
      }

      // Return data without tokens to the client
      const { access_token, refresh_token, ...rest } = payload;
      return NextResponse.json({ ...data, data: rest });
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

    const data = await response.json();

    if (response.ok) {
      const payload = data.data || data;
      
      if (payload.access_token) {
        cookieStore.set("access_token", payload.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        });
      }
      
      if (payload.refresh_token) {
        cookieStore.set("refresh_token", payload.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
      }

      const { access_token, refresh_token, ...rest } = payload;
      return NextResponse.json({ ...data, data: rest });
    }

    return NextResponse.json(data, { status: response.status });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  const cookieStore = cookies();
  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  return NextResponse.json({ success: true });
}
