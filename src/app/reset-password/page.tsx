import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password | Human Pulse",
};

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell title="Reset password" description="Use the reset token issued from the forgot password flow.">
      <ResetPasswordForm email={params.email ?? ""} token={params.token ?? ""} />
    </AuthShell>
  );
}


