import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/forms/reset-password-form";
import { getCurrentPortal } from "@/lib/portal";
import { withNoIndex } from "@/lib/public-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getCurrentPortal();

  return withNoIndex({
    title:
      portal === "shop"
        ? "Reset Customer Password | Human Pulse"
        : portal === "supply"
          ? "Reset Supplier Password | Human Pulse"
          : "Reset Retail Password | Human Pulse",
  });
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const portal = await getCurrentPortal();
  const params = await searchParams;

  return (
    <AuthShell
      eyebrow={
        portal === "shop"
          ? "Customer portal"
          : portal === "supply"
            ? "Supplier portal"
            : portal === "main"
              ? "Portal access"
              : "Retail portal"
      }
      title="Reset password"
      description="Use your one-time token to reset the password for the current Human Pulse portal."
      homeHref="/"
      homeLabel="Human Pulse"
      homeTagline={
        portal === "shop"
          ? "Customer Portal"
          : portal === "supply"
            ? "Supplier Portal"
            : portal === "main"
              ? "Connected Commerce"
              : "Retail Portal"
      }
    >
      <ResetPasswordForm email={params.email ?? ""} token={params.token ?? ""} />
    </AuthShell>
  );
}
