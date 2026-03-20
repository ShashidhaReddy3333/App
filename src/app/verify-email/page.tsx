import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailClient } from "@/components/verify-email-client";

export default async function VerifyEmailPage({
  searchParams
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell
      title="Verify your email"
      description="Confirm your email address to activate your account."
    >
      <VerifyEmailClient email={params.email ?? ""} token={params.token ?? ""} />
    </AuthShell>
  );
}
