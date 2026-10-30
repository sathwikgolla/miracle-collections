import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { RECOVERY_COOKIE, verifyRecoveryToken } from "@/lib/recoveryMarker";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Miracle Collections account.",
};

const INVALID_LINK_MESSAGE =
  "This password reset link is invalid, has expired, or has already been used. Reset links can only be used once and only work in the browser that requested them. Please request a new link.";

const DIRECT_VISIT_MESSAGE =
  "This page can only be opened from the password reset link we email you. Request a new link to change your password.";

const EXPIRED_SESSION_MESSAGE =
  "Your password reset session has expired. Please request a new reset link.";

interface Props {
  searchParams: Promise<{ reason?: string | string[] }>;
}

/**
 * Landing page for the recovery link sent by email.
 *
 * The link is verified server-side in `src/proxy.ts`, which exchanges the
 * Supabase PKCE code and sets a short-lived signed marker cookie bound to the
 * recovery user. A browser that merely happens to be signed in — or a link that
 * is expired, reused, or opened in a different browser — has no marker, so the
 * password form is never rendered for it.
 */
export default async function ResetPasswordPage({ searchParams }: Props) {
  const sp = await searchParams;
  const store = await cookies();

  const marker = await verifyRecoveryToken(store.get(RECOVERY_COOKIE)?.value);

  let error: string | null = null;

  if (!marker) {
    error = sp.reason ? INVALID_LINK_MESSAGE : DIRECT_VISIT_MESSAGE;
  } else {
    try {
      // The marker proves the link was verified; the session must still be
      // valid and belong to the same account the link was issued for.
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== marker.userId) error = EXPIRED_SESSION_MESSAGE;
    } catch {
      error = EXPIRED_SESSION_MESSAGE;
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <ResetPasswordForm initialError={error} />
    </main>
  );
}
