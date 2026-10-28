import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset the password for your Miracle Collections account.",
};

/**
 * Password-recovery request page. Shown only when the customer asks for it
 * (via the "Forgot Password?" link on /login) — the login page itself is
 * otherwise unchanged.
 */
export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <ForgotPasswordForm />
    </main>
  );
}
