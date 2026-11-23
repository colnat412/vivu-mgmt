import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  coreRequest,
  guarded,
  fail,
  setSession,
  clearSession,
  REFRESH,
} from "@/base/api/server";
async function refresh(request: NextRequest, navigation: boolean) {
  const token = (await cookies()).get(REFRESH)?.value;
  const denied = () =>
    clearSession(
      navigation
        ? NextResponse.redirect(new URL("/login", request.url))
        : fail("SESSION_EXPIRED", 401),
    );
  if (!token) return denied();
  try {
    const response = await coreRequest(
      "/auth/refresh",
      "POST",
      undefined,
      undefined,
      token,
    );
    const access = response.data?.data?.accessToken;
    if (response.status >= 400 || typeof access !== "string") return denied();
    const identity = await coreRequest("/admin/me", "GET", access);
    if (identity.status !== 200) {
      await coreRequest("/auth/logout", "POST", access).catch(() => undefined);
      return denied();
    }
    return setSession(
      navigation
        ? NextResponse.redirect(new URL("/", request.url))
        : NextResponse.json(
            { data: true },
            { headers: { "Cache-Control": "no-store" } },
          ),
      access,
      response.headers["set-cookie"],
    );
  } catch {
    return navigation
      ? NextResponse.redirect(new URL("/login?error=unavailable", request.url))
      : fail("CORE_UNAVAILABLE", 503);
  }
}
export async function POST(request: NextRequest) {
  if (!guarded(request)) return fail("INVALID_ORIGIN", 403);
  return refresh(request, false);
}
export async function GET(request: NextRequest) {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return fail("INVALID_ORIGIN", 403);
  return refresh(request, true);
}
