import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/session";
import {
  getCurrentRequestOrigin,
  getPortalAbsoluteUrl,
  getPortalForRole,
  getPortalPostSignInPath,
  getPortalPresentation,
  isRoleAllowedInPortal,
  type Portal,
} from "@/lib/portal";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/forms/sign-in-form";
import { Button } from "@/components/ui/button";

export async function PortalSignInPage({
  portal,
  authPath,
  footerLinkLabel,
  footerLinkHref,
  alternatePortalCtas = [],
}: {
  portal: Exclude<Portal, "main">;
  authPath: string;
  footerLinkLabel?: string | null;
  footerLinkHref?: string | null;
  alternatePortalCtas?: Array<{ label: string; href: string }>;
}) {
  const presentation = getPortalPresentation(portal);
  const origin = await getCurrentRequestOrigin();
  const session = await getCurrentSession();

  if (session) {
    const rolePortal = getPortalForRole(session.user.role);

    if (!isRoleAllowedInPortal(portal, session.user.role)) {
      redirect(
        getPortalAbsoluteUrl(
          rolePortal,
          getPortalPostSignInPath(rolePortal, session.user.role),
          origin
        ) as never
      );
    }

    redirect(getPortalPostSignInPath(portal, session.user.role) as Route);
  }

  return (
    <AuthShell
      eyebrow={presentation.label}
      title={presentation.signInTitle}
      description={presentation.signInDescription}
      homeHref="/"
      homeLabel="Human Pulse"
      homeTagline={presentation.label}
    >
      <div className="space-y-4">
        <SignInForm
          portal={portal}
          authPath={authPath}
          cardTitle={presentation.signInCardTitle}
          cardDescription={presentation.signInCardDescription}
          submitLabel="Sign in"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="hover:text-foreground">
            Forgot password?
          </Link>
          {footerLinkHref && footerLinkLabel ? (
            <a href={footerLinkHref} className="hover:text-foreground">
              {footerLinkLabel}
            </a>
          ) : null}
        </div>
        {alternatePortalCtas.map((cta) => (
          <Button key={cta.href} asChild variant="outline" className="w-full">
            <a href={cta.href}>{cta.label}</a>
          </Button>
        ))}
      </div>
    </AuthShell>
  );
}
