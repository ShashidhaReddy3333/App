import type { Metadata } from "next";

import { PortalSignInPage } from "@/components/auth/portal-sign-in-page";
import { getCanonicalPath, withNoIndex } from "@/lib/public-metadata";
import { getCurrentRequestOrigin, getPortalAbsoluteUrl } from "@/lib/portal";

export const metadata: Metadata = withNoIndex({
  title: "Customer Sign In | Human Pulse",
  description: "Sign in to the Human Pulse customer portal to browse, order, and track purchases.",
  alternates: {
    canonical: getCanonicalPath("/sign-in"),
  },
});

export default async function ShopSignInPage() {
  const origin = await getCurrentRequestOrigin();

  return (
    <PortalSignInPage
      portal="shop"
      authPath="/api/auth/customer/sign-in"
      footerLinkLabel="Create customer account"
      footerLinkHref="/sign-up"
      alternatePortalCtas={[
        {
          label: "Retail sign in instead",
          href: getPortalAbsoluteUrl("retail", "/sign-in", origin),
        },
        {
          label: "Supplier sign in instead",
          href: getPortalAbsoluteUrl("supply", "/sign-in", origin),
        },
      ]}
    />
  );
}
