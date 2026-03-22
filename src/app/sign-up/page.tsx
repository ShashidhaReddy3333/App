import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/forms/sign-up-form";
import { getCurrentSession } from "@/lib/auth/session";
import { getCanonicalPath } from "@/lib/public-metadata";

export const metadata: Metadata = {
  title: "Create Business | Human Pulse",
  description: "Create a Human Pulse business account and set up your first store location.",
  alternates: {
    canonical: getCanonicalPath("/sign-up"),
  },
};

export default async function SignUpPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/app/dashboard");
  }

  return (
    <AuthShell
      title="Create a new business"
      description="Set up the owner account, tax mode, and default store location in a single onboarding flow."
    >
      <SignUpForm />
    </AuthShell>
  );
}
