import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function load(file, dependencies = {}) {
  const source = fs.readFileSync(
    new URL("../" + file, import.meta.url),
    "utf8",
  );
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, {
    module: loaded,
    exports: loaded.exports,
    require: (name) => {
      if (!(name in dependencies))
        throw new Error("Missing dependency " + name);
      return dependencies[name];
    },
    URL,
    console,
  });
  return loaded.exports;
}
const policy = load("src/base/api/policy.ts");
test("BFF exposes only the intended admin resources and methods", () => {
  for (const [method, path] of [
    ["GET", "me"],
    ["GET", "users/Abcd1234/sessions"],
    ["PATCH", "users/Abcd1234/status"],
    ["PUT", "settings"],
    ["POST", "users/Abcd1234/sessions/revoke"],
    [
      "POST",
      "users/Abcd1234/sessions/00000000-0000-4000-8000-000000000001/revoke",
    ],
  ])
    assert.equal(policy.allowedAdminRoute(method, path), true);
  for (const [method, path] of [
    ["GET", "../auth/me"],
    ["GET", "users/a/../../settings"],
    ["DELETE", "users/a"],
    ["POST", "settings"],
    ["GET", "https://elsewhere.test"],
    ["GET", "users/a/sessions/secrets"],
    ["PATCH", "me"],
  ])
    assert.equal(policy.allowedAdminRoute(method, path), false);
});
test("mutations require an explicit matching origin", () => {
  assert.equal(
    policy.sameOrigin(
      "https://admin.vivu.test/api/auth/login",
      "https://admin.vivu.test",
    ),
    true,
  );
  for (const origin of [
    null,
    "null",
    "https://evil.test",
    "https://admin.vivu.test.evil.test",
    "http://admin.vivu.test",
  ])
    assert.equal(
      policy.sameOrigin("https://admin.vivu.test/api/auth/login", origin),
      false,
    );
});
test("only the refresh cookie is extracted from Core headers", () => {
  assert.equal(
    policy.refreshCookie([
      "unrelated=secret; Path=/",
      "refresh_token=sid.secret; HttpOnly; Path=/api/auth",
    ]),
    "sid.secret",
  );
  assert.equal(policy.refreshCookie(["other=secret; Path=/"]), null);
});
function response(data, options = {}) {
  return {
    body: data,
    status: options.status ?? 200,
    headers: options.headers,
    cookies: new Map(),
  };
}
function authServer(coreRequest) {
  return {
    coreRequest,
    guarded: (req) => policy.sameOrigin(req.url, req.headers.get("origin")),
    fail: (message, status) => response({ message, data: null }, { status }),
    setSession: (res, token, headers) => {
      res.cookies.set("access", token);
      res.cookies.set("refresh", policy.refreshCookie(headers));
      return res;
    },
  };
}
function request(body, origin = "https://admin.vivu.test") {
  return {
    url: "https://admin.vivu.test/api/auth/login",
    headers: new Map([["origin", origin]]),
    json: async () => body,
  };
}
test("login verifies backend admin permission before setting any cookies", async () => {
  const calls = [];
  const server = authServer(async (path) => {
    calls.push(path);
    if (path === "/auth/login")
      return {
        status: 201,
        data: { data: { accessToken: "hidden-token" } },
        headers: { "set-cookie": ["refresh_token=hidden-refresh; HttpOnly"] },
      };
    if (path === "/admin/me")
      return { status: 403, data: { message: "ADMIN_REQUIRED" } };
    return { status: 200 };
  });
  const route = load("src/app/api/auth/login/route.ts", {
    "next/server": { NextResponse: { json: response } },
    "@/base/api/server": server,
  });
  const result = await route.POST(
    request({ email: "member@example.com", password: "password" }),
  );
  assert.equal(result.status, 403);
  assert.equal(result.cookies.size, 0);
  assert.equal(JSON.stringify(result.body).includes("hidden"), false);
  assert.deepEqual(calls, ["/auth/login", "/admin/me", "/auth/logout"]);
});
test("authorized login puts tokens in server cookies, never the JSON response", async () => {
  const actor = { id: "encoded", name: "Admin", email: "admin@gmail.com" };
  const route = load("src/app/api/auth/login/route.ts", {
    "next/server": { NextResponse: { json: response } },
    "@/base/api/server": authServer(async (path) =>
      path === "/auth/login"
        ? {
            status: 201,
            data: { data: { accessToken: "access-secret" } },
            headers: {
              "set-cookie": ["refresh_token=refresh-secret; HttpOnly"],
            },
          }
        : { status: 200, data: { data: actor } },
    ),
  });
  const result = await route.POST(
    request({ email: "admin@gmail.com", password: "password" }),
  );
  assert.equal(result.cookies.get("access"), "access-secret");
  assert.equal(result.cookies.get("refresh"), "refresh-secret");
  assert.equal(JSON.stringify(result.body), JSON.stringify({ data: actor }));
});
test("cross-origin login is rejected before contacting Core", async () => {
  let called = false;
  const route = load("src/app/api/auth/login/route.ts", {
    "next/server": { NextResponse: { json: response } },
    "@/base/api/server": authServer(async () => {
      called = true;
    }),
  });
  assert.equal(
    (
      await route.POST(
        request(
          { email: "admin@gmail.com", password: "password" },
          "https://evil.test",
        ),
      )
    ).status,
    403,
  );
  assert.equal(called, false);
});
test("admin proxy ignores browser Authorization and forwards only bounded query fields", async () => {
  let actual;
  const server = {
    ...authServer(async (...args) => {
      actual = args;
      return { status: 200, data: { data: { items: [] } } };
    }),
    ACCESS: "admin_access",
  };
  const route = load("src/app/api/admin/[...path]/route.ts", {
    "next/server": { NextResponse: { json: response } },
    "next/headers": {
      cookies: async () => ({ get: () => ({ value: "cookie-token" }) }),
    },
    "@/base/api/server": server,
    "@/base/api/policy": policy,
  });
  const req = {
    ...request(null),
    method: "GET",
    nextUrl: new URL(
      "https://admin.vivu.test/api/admin/users?q=member&redirect=https://evil.test",
    ),
    headers: new Map([["authorization", "Bearer browser-value"]]),
  };
  await route.GET(req, { params: Promise.resolve({ path: ["users"] }) });
  assert.equal(actual[0], "/admin/users");
  assert.equal(actual[2], "cookie-token");
  assert.equal(JSON.stringify(actual[5]), JSON.stringify({ q: "member" }));
  assert.equal(
    (
      await route.GET(req, {
        params: Promise.resolve({ path: ["..", "auth", "me"] }),
      })
    ).status,
    404,
  );
});
test("brand assets are identical to the customer web", () => {
  for (const name of ["icon.svg", "favicon.ico"])
    assert.deepEqual(
      fs.readFileSync(new URL("../public/" + name, import.meta.url)),
      fs.readFileSync(
        new URL("../../trip-budget-web/public/" + name, import.meta.url),
      ),
    );
  const brand = fs.readFileSync(
    new URL("../src/base/components/layout/common.tsx", import.meta.url),
    "utf8",
  );
  assert.match(brand, /src=["']\/icon\.svg["']/);
  assert.doesNotMatch(brand, /PlaneTakeoff/);
});
test("VI and EN cover the same interface messages", () => {
  const vi = JSON.parse(
    fs.readFileSync(new URL("../messages/vi.json", import.meta.url)),
  );
  const en = JSON.parse(
    fs.readFileSync(new URL("../messages/en.json", import.meta.url)),
  );
  assert.deepEqual(Object.keys(vi).sort(), Object.keys(en).sort());
});

test("logout revokes the Core session even when only the refresh cookie remains", async () => {
  const calls = [];
  const server = {
    ...authServer(async (...args) => {
      calls.push(args);
      return args[0] === "/auth/refresh"
        ? { status: 200, data: { data: { accessToken: "renewed-access" } } }
        : { status: 200 };
    }),
    ACCESS: "access",
    REFRESH: "refresh",
    clearSession: (res) => {
      res.cleared = true;
      return res;
    },
  };
  const route = load("src/app/api/auth/logout/route.ts", {
    "next/server": { NextResponse: { json: response } },
    "next/headers": {
      cookies: async () => ({
        get: (key) =>
          key === "refresh" ? { value: "refresh-secret" } : undefined,
      }),
    },
    "@/base/api/server": server,
  });
  const result = await route.POST(request(null));
  assert.equal(result.cleared, true);
  assert.equal(calls[0][0], "/auth/refresh");
  assert.equal(calls[0][4], "refresh-secret");
  assert.equal(calls[1][0], "/auth/logout");
  assert.equal(calls[1][2], "renewed-access");
  assert.equal(JSON.stringify(result.body).includes("renewed-access"), false);
});

const paging = load("src/base/lib/pagination.ts");
test("numbered pagination keeps one valid current page and unique ordered page buttons", () => {
  for (const total of [1, 2, 5, 7, 10, 100, 10000]) {
    for (const current of [1, 2, Math.ceil(total / 2), total]) {
      for (const boundary of [0, 1, 2]) {
        const items = paging.paginationItems(current, total, boundary);
        const numbers = items.filter((item) => typeof item === "number");
        const selected = Math.max(1, Math.min(current, total));
        assert.equal(numbers.filter((page) => page === selected).length, 1);
        assert.equal(new Set(numbers).size, numbers.length);
        assert.ok(numbers.every((page) => page >= 1 && page <= total));
        assert.equal(
          JSON.stringify(numbers),
          JSON.stringify([...numbers].sort((a, b) => a - b)),
        );
        assert.ok(items.length <= 9);
      }
    }
  }
});
test("large pagination has gaps and keeps first and last page buttons", () => {
  const items = paging.paginationItems(50, 100, 2);
  assert.equal(items[0], 1);
  assert.equal(items.at(-1), 100);
  assert.ok(items.includes(50));
  assert.equal(items.filter((item) => typeof item === "string").length, 2);
});
test("empty and single-page lists have one page and no ellipsis", () => {
  assert.equal(JSON.stringify(paging.paginationItems(1, 0)), "[1]");
  assert.equal(JSON.stringify(paging.paginationItems(1, 1)), "[1]");
});
