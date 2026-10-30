/**
 * Password-recovery redirect resolution.
 *
 * The recovery link Supabase emails must bring the customer back to the
 * password-reset page on the SAME origin that requested it:
 *
 *   - production: https://miraclecollection.co.in (or www, whichever the
 *     customer is actually browsing)
 *   - local dev:  http://localhost:3000
 *   - previews:   whatever origin the deployment is served from
 *
 * The reset link uses the PKCE flow, so Supabase stores a one-time code
 * verifier in a cookie on the requesting origin. If the email redirected to a
 * different host (for example production while testing on localhost), that
 * cookie would not be sent and the exchange would fail. Building the redirect
 * from the browser's own origin keeps request and exchange on one host.
 *
 * This runs only in the browser (the "send recovery link" click handler), so
 * `window.location.origin` is always available. It is passed as `redirectTo`
 * to `resetPasswordForEmail()`, and Supabase Auth only honours it when the
 * exact URL is allow-listed under Authentication -> URL Configuration ->
 * Redirect URLs. That allow-list is what prevents an open redirect; never build
 * this from user input.
 *
 * `NEXT_PUBLIC_SITE_URL` remains available as an explicit override for hosted
 * previews/aliases, but it NEVER overrides a loopback origin: local testing must
 * always produce a localhost recovery link. Loopback URLs must be allow-listed
 * in Supabase for that to work.
 */

const PRODUCTION_ORIGIN = "https://miraclecollection.co.in";
const LOCAL_ORIGIN = "http://localhost:3000";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function isLoopback(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".localhost")
  );
}

/** The absolute URL the recovery email link must return to. */
export function passwordRecoveryRedirectUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const configuredOrigin = configured ? trimTrailingSlash(configured) : "";

  // Browser: prefer the origin the customer is actually using. This is what
  // keeps the PKCE verifier cookie and the reset page on the same host.
  if (typeof window !== "undefined") {
    const { origin, hostname } = window.location;
    if (isLoopback(hostname)) return `${origin}/reset-password`;
    if (configuredOrigin) return `${configuredOrigin}/reset-password`;
    return `${origin}/reset-password`;
  }

  // Server pre-render fallback (the value is only used on click, but keep it
  // deterministic for safety).
  const origin =
    configuredOrigin ||
    (process.env.NODE_ENV === "production" ? PRODUCTION_ORIGIN : LOCAL_ORIGIN);
  return `${origin}/reset-password`;
}
