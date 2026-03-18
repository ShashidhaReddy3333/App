import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password | Human Pulse",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Recover account access" description="Generate a one-time token and then use it to set a new password.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}


