import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/forms/sign-up-form";
import { getCurrentSession } from "@/lib/auth/session";

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
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors lg:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
        <SignUpForm />
      </div>
    </AuthShell>
  );
}
