import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Miracle Collections account.",
};

/**
 * Landing page for the recovery link sent by email
 * (…/reset-password?code=… or …/reset-password#access_token=…&type=recovery).
 * The form verifies the recovery session before allowing a password change.
 */
export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <ResetPasswordForm />
    </main>
  );
}
