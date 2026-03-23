import { headers } from "next/headers";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { EmailVerificationBanner } from "@/components/email-verification-banner";
import { requireAppSession } from "@/lib/auth/guards";
import { getCurrentPortal } from "@/lib/portal";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAppSession();

  // Redirect new businesses (owner role, onboarding not completed) to onboarding
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";
  const portal = await getCurrentPortal();
  const onboardingPath = portal === "retail" ? "/onboarding" : "/app/onboarding";
  const isOnboardingPage =
    pathname.startsWith("/onboarding") || pathname.startsWith("/app/onboarding");

  if (
    session.user.role === "owner" &&
    session.user.business &&
    !session.user.business.onboardingCompletedAt &&
    !isOnboardingPage
  ) {
    redirect(onboardingPath as Route);
  }

  const showVerificationBanner = !session.user.emailVerifiedAt;

  return (
    <AppShell
      role={session.user.role}
      businessName={session.user.business?.businessName ?? "Business"}
      userName={session.user.fullName}
    >
      {showVerificationBanner && <EmailVerificationBanner />}
      {children}
    </AppShell>
  );
}
