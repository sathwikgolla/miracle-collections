/**
 * Short-lived, server-signed proof that a password-recovery link was verified.
 *
 * The Supabase browser client normally consumes the emailed PKCE code during
 * initialization, before React can inspect it. That made the old reset form
 * unable to tell a genuine recovery session apart from a normal logged-in
 * session, so it could update the wrong account. The proxy now verifies the
 * code server-side (where Supabase reports `redirectType === "recovery"`) and
 * sets this cookie. The reset page and the update action both require it, and
 * the value is bound to the Supabase user id the link belonged to.
 *
 * SECURITY NOTES
 * - The cookie is httpOnly and HMAC-signed, so the browser cannot mint or edit
 *   one for another account.
 * - It is NOT the authentication boundary on its own: the update action also
 *   requires a valid Supabase session and `getUser()` validation. The marker
 *   only proves *which* account the emailed link was verified for.
 * - The signing key (`SUPABASE_SERVICE_ROLE_KEY`) never leaves the server: it
 *   is not NEXT_PUBLIC_*, so Next.js does not inline it into client bundles.
 *   This module must only be imported by server code (proxy, server
 *   components, server actions).
 */

export const RECOVERY_COOKIE = "mc-pw-recovery";

/** How long a verified link stays usable before the customer must request a new one. */
export const RECOVERY_COOKIE_MAX_AGE_SECONDS = 15 * 60;

const TTL_MS = RECOVERY_COOKIE_MAX_AGE_SECONDS * 1000;
const encoder = new TextEncoder();

function signingKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

function hex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

async function sign(payload: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(`miracle-recovery:${key}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(payload));
  return hex(new Uint8Array(signature));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Builds the cookie value for a just-verified recovery link. */
export async function createRecoveryToken(userId: string): Promise<string | null> {
  const key = signingKey();
  if (!key || !userId) return null;
  const expiresAt = Date.now() + TTL_MS;
  const payload = `${userId}:${expiresAt}`;
  return `${payload}:${await sign(payload, key)}`;
}

/** Returns the verified user id, or null for missing/expired/tampered tokens. */
export async function verifyRecoveryToken(
  token: string | null | undefined
): Promise<{ userId: string; expiresAt: number } | null> {
  const key = signingKey();
  if (!token || !key) return null;

  const parts = token.split(":");
  if (parts.length !== 3) return null;
  const [userId, expiresAtRaw, signature] = parts;
  if (!userId || !expiresAtRaw || !signature) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;

  const expected = await sign(`${userId}:${expiresAtRaw}`, key);
  if (!constantTimeEqual(signature, expected)) return null;

  return { userId, expiresAt };
}
