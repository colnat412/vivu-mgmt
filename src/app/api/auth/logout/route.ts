import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS,
  REFRESH,
  coreRequest,
  guarded,
  fail,
  clearSession,
} from "@/base/api/server";
export async function POST(request: NextRequest) {
  if (!guarded(request)) return fail("INVALID_ORIGIN", 403);
  const jar = await cookies();
  let token = jar.get(ACCESS)?.value;
  const refresh = jar.get(REFRESH)?.value;
  try {
    let result = token
      ? await coreRequest("/auth/logout", "POST", token)
      : null;
    if ((!result || result.status === 401) && refresh) {
      const renewed = await coreRequest(
        "/auth/refresh",
        "POST",
        undefined,
        undefined,
        refresh,
      );
      if (renewed.status >= 500) return fail("CORE_UNAVAILABLE", 503);
      token = renewed.data?.data?.accessToken;
      if (renewed.status < 400 && token)
        result = await coreRequest("/auth/logout", "POST", token);
    }
    if (result && result.status >= 500) return fail("CORE_UNAVAILABLE", 503);
    return clearSession(
      NextResponse.json(
        { data: true },
        { headers: { "Cache-Control": "no-store" } },
      ),
    );
  } catch {
    return fail("CORE_UNAVAILABLE", 503);
  }
}
