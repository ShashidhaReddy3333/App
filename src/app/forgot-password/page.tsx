import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/forms/forgot-password-form";
import { getCurrentPortal } from "@/lib/portal";

export async function generateMetadata(): Promise<Metadata> {
  const portal = await getCurrentPortal();

  return {
    title:
      portal === "shop"
        ? "Customer Password Reset | Human Pulse"
        : portal === "supply"
          ? "Supplier Password Reset | Human Pulse"
          : "Retail Password Reset | Human Pulse",
  };
}

export default async function ForgotPasswordPage() {
  const portal = await getCurrentPortal();

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
      title="Recover account access"
      description="Request a one-time reset link for the portal account you are trying to access."
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
      <ForgotPasswordForm />
    </AuthShell>
  );
}
