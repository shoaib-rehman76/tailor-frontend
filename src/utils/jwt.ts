export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );

    const payload = globalThis.atob
      ? globalThis.atob(padded)
      : Buffer.from(padded, "base64").toString("utf-8");

    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getTokenExpiry(token: string) {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return undefined;
  return exp * 1000;
}
