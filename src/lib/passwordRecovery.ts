/**
 * Password-recovery redirect resolution.
 *
 * The recovery link Supabase emails must bring the customer back to the
 * password-reset page on the correct origin:
 *
 *   - production: https://miraclecollection.co.in/reset-password
 *   - local dev:  http://localhost:3000/reset-password
 *
 * `NEXT_PUBLIC_SITE_URL` (optional) always wins so a preview/staging origin
 * can be pointed elsewhere without a code change; otherwise production Node
 * environments use the official domain and development uses localhost.
 *
 * SECURITY: this value is passed as `redirectTo` to
 * `resetPasswordForEmail()`. Supabase Auth only honours it when the exact URL
 * is present in the project's allow-listed Redirect URLs — so an attacker
 * cannot redirect the email link anywhere we did not configure. Never build
 * this from the request Host header or from user input (open redirect).
 */

const PRODUCTION_ORIGIN = "https://miraclecollection.co.in";
const LOCAL_ORIGIN = "http://localhost:3000";

/** The absolute URL the recovery email link must return to. */
export function passwordRecoveryRedirectUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  const origin =
    configured ||
    (process.env.NODE_ENV === "production" ? PRODUCTION_ORIGIN : LOCAL_ORIGIN);
  return `${origin}/reset-password`;
}
