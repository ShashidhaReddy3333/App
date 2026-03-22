import type { Metadata } from "next";
import type { Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/forms/sign-in-form";
import { getPostSignInPath } from "@/lib/auth/guards";
import { getCurrentSession } from "@/lib/auth/session";
import { getCanonicalPath } from "@/lib/public-metadata";
import { getPortalPresentation, normalizePortal } from "@/lib/portal";

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const portal = normalizePortal(headerStore.get("x-portal"));
  const presentation = getPortalPresentation(portal);

  return {
    title: presentation.signInMetadataTitle,
    description: presentation.signInDescription,
    alternates: {
      canonical: getCanonicalPath("/sign-in"),
    },
  };
}

export default async function SignInPage() {
  const headerStore = await headers();
  const portal = normalizePortal(headerStore.get("x-portal"));
  const presentation = getPortalPresentation(portal);
  const session = await getCurrentSession();

  if (session) {
    if (portal === "admin" && session.user.role !== "platform_admin") {
      redirect("/admin/forbidden" as Route);
    }
    if (portal === "supply" && session.user.role !== "supplier") {
      redirect("/supplier/forbidden" as Route);
    }

    redirect(getPostSignInPath(session.user.role));
  }

  return (
    <AuthShell
      eyebrow={presentation.label}
      title={presentation.signInTitle}
      description={presentation.signInDescription}
    >
      <div className="space-y-4">
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
