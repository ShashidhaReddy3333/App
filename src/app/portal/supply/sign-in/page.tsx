import type { Metadata } from "next";

import { PortalSignInPage } from "@/components/auth/portal-sign-in-page";
import { getCanonicalPath, withNoIndex } from "@/lib/public-metadata";
import { getCurrentRequestOrigin, getPortalAbsoluteUrl } from "@/lib/portal";

export const metadata: Metadata = withNoIndex({
  title: "Supplier Sign In | Human Pulse",
  description:
    "Sign in to the Human Pulse supplier portal to manage wholesale catalog and retailer orders.",
  alternates: {
    canonical: getCanonicalPath("/sign-in"),
  },
});

export default async function SupplySignInPage() {
  const origin = await getCurrentRequestOrigin();

  return (
    <PortalSignInPage
      portal="supply"
      authPath="/api/auth/supplier/sign-in"
      footerLinkLabel="Request supplier access"
      footerLinkHref="/sign-up"
      alternatePortalCtas={[
        {
          label: "Retail sign in instead",
          href: getPortalAbsoluteUrl("retail", "/sign-in", origin),
        },
        {
          label: "Customer sign in instead",
          href: getPortalAbsoluteUrl("shop", "/sign-in", origin),
        },
      ]}
    />
  );
}
