import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/forms/sign-in-form";
import { getCurrentSession } from "@/lib/auth/session";

export default async function SignInPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/app/dashboard");
  }

  return (
    <AuthShell
      title="Sign into your business"
      description="Use email and password to access the store dashboard, checkout, reports, and staff tools."
    >
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors lg:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
        <SignInForm />
        <div className="flex justify-between text-sm text-muted-foreground">
          <Link href="/forgot-password" className="hover:text-foreground">
            Forgot password?
          </Link>
          <Link href="/sign-up" className="hover:text-foreground">
            Create business
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
