import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/forms/sign-up-form";
import { getCurrentSession } from "@/lib/auth/session";

export default async function SignUpPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/app/dashboard");
  }

  return (
    <AuthShell title="Create a new business" description="Set up the owner account, tax mode, and default store location in a single onboarding flow.">
      <SignUpForm />
    </AuthShell>
  );
}
