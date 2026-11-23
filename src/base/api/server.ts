import "server-only";
import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, refreshCookie } from "./policy";
export const ACCESS = "vivu_admin_access";
export const REFRESH = "vivu_admin_refresh";
const core = axios.create({
  baseURL:
    (process.env.CORE_SERVICE_URL || "http://localhost:8866").replace(
      /\/$/,
      "",
    ) + "/api",
  timeout: 15000,
  validateStatus: () => true,
});
export async function coreRequest(
  path: string,
  method = "GET",
  token?: string,
  data?: unknown,
  refresh?: string,
  params?: Record<string, string>,
) {
  return core.request({
    url: path,
    method,
    data,
    params,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(refresh ? { Cookie: `refresh_token=${refresh}` } : {}),
    },
  });
}
export function guarded(request: NextRequest) {
  return sameOrigin(request.url, request.headers.get("origin"));
}
export function fail(message: string, status: number) {
  return NextResponse.json(
    { message, data: null, status },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
export function setSession(
  response: NextResponse,
  access: string,
  setCookie: readonly string[] | string | undefined,
) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set(ACCESS, access, { ...options, maxAge: 900 });
  const refresh = refreshCookie(setCookie);
  if (refresh)
    response.cookies.set(REFRESH, refresh, { ...options, maxAge: 30 * 86400 });
  return response;
}
export function clearSession(response: NextResponse) {
  response.cookies.set(ACCESS, "", { maxAge: 0, path: "/" });
  response.cookies.set(REFRESH, "", { maxAge: 0, path: "/" });
  return response;
}
export async function currentAdmin() {
  const jar = await cookies();
  const token = jar.get(ACCESS)?.value;
  if (!token)
    return { status: 401, data: null, refresh: !!jar.get(REFRESH)?.value };
  try {
    const response = await coreRequest("/admin/me", "GET", token);
    return {
      status: response.status,
      data: response.status === 200 ? response.data.data : null,
      refresh: !!jar.get(REFRESH)?.value,
    };
  } catch {
    return { status: 503, data: null, refresh: false };
  }
}
