import { NextRequest, NextResponse } from "next/server";
import { coreRequest, guarded, fail, setSession } from "@/base/api/server";
export async function POST(request: NextRequest) {
  if (!guarded(request)) return fail("INVALID_ORIGIN", 403);
  try {
    const body = await request.json();
    if (
      typeof body.email !== "string" ||
      typeof body.password !== "string" ||
      body.email.length > 254 ||
      body.password.length > 256
    )
      return fail("INVALID_CREDENTIALS", 400);
    const response = await coreRequest(
      "/auth/login",
      "POST",
      undefined,
      {
        email: body.email,
        password: body.password,
      },
      undefined,
      undefined,
      {
        userAgent: request.headers.get("user-agent") || "",
        clientType: "ADMIN",
      },
    );
    if (response.status === 401) return fail("INVALID_CREDENTIALS", 401);
    if (response.status === 404 || response.status >= 500)
      return fail("CORE_UNAVAILABLE", 503);
    if (response.status >= 400) return fail("LOGIN_FAILED", response.status);
    const token = response.data?.data?.accessToken;
    if (typeof token !== "string") return fail("CORE_UNAVAILABLE", 502);
    const identity = await coreRequest("/admin/me", "GET", token);
    if (identity.status !== 200) {
      await coreRequest("/auth/logout", "POST", token).catch(() => undefined);
      if (identity.data?.code === "POLICY_ACCEPTANCE_REQUIRED")
        return fail("POLICY_ACCEPTANCE_REQUIRED", 403);
      if (identity.status === 404) return fail("ADMIN_UNAVAILABLE", 503);
      if (identity.status >= 500) return fail("CORE_UNAVAILABLE", 503);
      if (identity.status === 401) return fail("ADMIN_SESSION_INVALID", 401);
      return fail("ADMIN_REQUIRED", identity.status);
    }
    return setSession(
      NextResponse.json(
        { data: identity.data.data },
        { headers: { "Cache-Control": "no-store" } },
      ),
      token,
      response.headers["set-cookie"],
    );
  } catch {
    return fail("CORE_UNAVAILABLE", 503);
  }
}
