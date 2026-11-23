import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ACCESS, coreRequest, guarded, fail } from "@/base/api/server";
import { allowedAdminRoute } from "@/base/api/policy";
type Context = { params: Promise<{ path: string[] }> };
async function handler(request: NextRequest, context: Context) {
  const { path: segments } = await context.params;
  const path = segments.join("/");
  if (!allowedAdminRoute(request.method, path)) return fail("NOT_FOUND", 404);
  if (request.method !== "GET" && !guarded(request))
    return fail("INVALID_ORIGIN", 403);
  const token = (await cookies()).get(ACCESS)?.value;
  if (!token) return fail("SESSION_EXPIRED", 401);
  try {
    const params: Record<string, string> = {};
    for (const key of ["q", "status", "page", "size"]) {
      const value = request.nextUrl.searchParams.get(key);
      if (value !== null) params[key] = value;
    }
    const body = request.method === "GET" ? undefined : await request.json();
    const response = await coreRequest(
      "/admin/" + path,
      request.method,
      token,
      body,
      undefined,
      params,
    );
    return NextResponse.json(response.data, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return fail("CORE_UNAVAILABLE", 503);
  }
}
export { handler as GET, handler as POST, handler as PATCH, handler as PUT };
