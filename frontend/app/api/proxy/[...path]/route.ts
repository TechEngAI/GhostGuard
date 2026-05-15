import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function handleProxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  const searchParams = req.nextUrl.searchParams.toString();
  const url = `${API_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

  const cookieStore = cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const options: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      options.body = JSON.stringify(await req.json());
    } else if (contentType?.includes("multipart/form-data")) {
      options.body = await req.formData();
    }
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);
    
    return NextResponse.json(data, { 
      status: response.status,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Proxy request failed" }, { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
