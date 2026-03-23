import type { Metadata } from "next";
import type { Route } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShoppingBag, Store, Truck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/forms/sign-in-form";
import { Button } from "@/components/ui/button";
import { getCurrentSession } from "@/lib/auth/session";
import { getCanonicalPath } from "@/lib/public-metadata";
import {
  getCurrentRequestOrigin,
  getPortalAbsoluteUrl,
  getPortalForRole,
  getPortalPostSignInPath,
  getPortalPresentation,
  isRoleAllowedInPortal,
  normalizePortal,
} from "@/lib/portal";

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

const portalLaunchers = [
  {
    portal: "shop" as const,
    title: "Customer Portal",
    description: "Browse products, manage orders, and keep checkout moving quickly.",
    icon: ShoppingBag,
  },
  {
    portal: "retail" as const,
    title: "Retail Portal",
    description: "Run checkout, inventory, staff, procurement, and reporting.",
    icon: Store,
  },
  {
    portal: "supply" as const,
    title: "Supplier Portal",
    description: "Manage wholesale catalog, retailer orders, and fulfillment status.",
    icon: Truck,
  },
] as const;

export default async function SignInPage() {
  const headerStore = await headers();
  const portal = normalizePortal(headerStore.get("x-portal"));
  const presentation = getPortalPresentation(portal);
  const origin = await getCurrentRequestOrigin();
  const session = await getCurrentSession();

  if (session) {
    const rolePortal = getPortalForRole(session.user.role);
    if (portal === "main" || !isRoleAllowedInPortal(portal, session.user.role)) {
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

  if (portal === "main") {
    return (
      <AuthShell
        eyebrow="Choose your portal"
        title="Sign in through the right Human Pulse portal"
        description="Human Pulse uses separate web experiences for customers, retailers, and suppliers. Pick the portal that matches your role."
        homeHref="/"
        homeLabel="Human Pulse"
        homeTagline="Connected Commerce Ecosystem"
        highlights={[
          {
            title: "Customer portal",
            description:
              "Shopping, checkout, order tracking, and account history stay customer-only.",
          },
          {
            title: "Retail and supplier portals",
            description:
              "Operational and fulfillment workflows stay isolated from customer access.",
          },
        ]}
      >
        <div className="grid gap-3">
          {portalLaunchers.map((launcher) => {
            const Icon = launcher.icon;
            return (
              <a
                key={launcher.portal}
                href={getPortalAbsoluteUrl(launcher.portal, "/sign-in", origin)}
              >
                <div className="data-row flex items-start gap-3 transition-transform hover:-translate-y-[1px]">
                  <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground">{launcher.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{launcher.description}</p>
                  </div>
                  <ArrowRight className="mt-1 size-4 text-muted-foreground" />
                </div>
              </a>
            );
          })}
        </div>
      </AuthShell>
    );
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
          cardTitle={presentation.signInCardTitle}
          cardDescription={presentation.signInCardDescription}
          submitLabel={presentation.signInSubmitLabel}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <Link href="/forgot-password" className="hover:text-foreground">
            Forgot password?
          </Link>
          {presentation.signUpHref && presentation.signUpLabel ? (
            <a href={presentation.signUpHref} className="hover:text-foreground">
              {presentation.signUpLabel}
            </a>
          ) : null}
        </div>
        {portal === "retail" ? (
          <Button asChild variant="outline" className="w-full">
            <a href={getPortalAbsoluteUrl("shop", "/sign-in", origin)}>Customer sign in instead</a>
          </Button>
        ) : null}
      </div>
    </AuthShell>
  );
}
