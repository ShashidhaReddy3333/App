import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailClient } from "@/components/verify-email-client";
import { getCurrentPortal } from "@/lib/portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getCurrentPortal();

  return {
    title:
      portal === "shop"
        ? "Verify Customer Email | Human Pulse"
        : portal === "supply"
          ? "Verify Supplier Email | Human Pulse"
          : "Verify Retail Email | Human Pulse",
  };
}

export default async function VerifyEmailPage({
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
      title="Verify your email"
      description="Confirm your email address to activate the account for the current Human Pulse portal."
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
      <VerifyEmailClient email={params.email ?? ""} token={params.token ?? ""} />
    </AuthShell>
  );
}
