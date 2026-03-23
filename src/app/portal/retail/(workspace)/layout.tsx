import type { Metadata } from "next";
import { headers } from "next/headers";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { RetailShell } from "@/components/app-shell";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { requireAppSession } from "@/lib/auth/guards";
import { withNoIndex } from "@/lib/public-metadata";

export const metadata: Metadata = withNoIndex({
  title: "Retail Workspace | Human Pulse",
});

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAppSession();

  // Redirect new businesses (owner role, onboarding not completed) to onboarding
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  const isOnboardingPage = pathname.startsWith("/onboarding");

  if (
    session.user.role === "owner" &&
    session.user.business &&
    !session.user.business.onboardingCompletedAt &&
    !isOnboardingPage
  ) {
    redirect("/onboarding" as Route);
  }

  const showVerificationBanner = !session.user.emailVerifiedAt;

  return (
    <RetailShell
      role={session.user.role}
      businessName={session.user.business?.businessName ?? "Business"}
      userName={session.user.fullName}
    >
      {showVerificationBanner && <EmailVerificationBanner />}
      {children}
    </RetailShell>
  );
}
