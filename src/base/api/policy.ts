export function allowedAdminRoute(method: string, path: string): boolean {
  if (method === "GET")
    return /^(me|overview|users|users\/[a-zA-Z0-9]+(?:\/sessions)?|settings|audit)$/.test(
      path,
    );
  if (method === "PATCH")
    return /^users\/[a-zA-Z0-9]+(?:\/status)?$/.test(path);
  if (method === "PUT") return path === "settings";
  return (
    method === "POST" &&
    /^users\/[a-zA-Z0-9]+\/sessions(?:\/[a-fA-F0-9-]{36})?\/revoke$/.test(path)
  );
}
export function sameOrigin(url: string, origin: string | null): boolean {
  try {
    return !!origin && new URL(url).origin === new URL(origin).origin;
  } catch {
    return false;
  }
}
export function refreshCookie(
  headers: readonly string[] | string | undefined,
): string | null {
  const values = typeof headers === "string" ? [headers] : (headers ?? []);
  for (const value of values) {
    const match = /(?:^|,\s*)refresh_token=([^;]+)/.exec(value);
    if (match) return match[1];
  }
  return null;
}
