import type { Metadata } from "next";

import { PortalSignInPage } from "@/components/auth/portal-sign-in-page";
import { getCanonicalPath, withNoIndex } from "@/lib/public-metadata";
import { getCurrentRequestOrigin, getPortalAbsoluteUrl } from "@/lib/portal";

export const metadata: Metadata = withNoIndex({
  title: "Retail Sign In | Human Pulse",
  description:
    "Sign in to the Human Pulse retail portal for POS, products, inventory, procurement, and reporting.",
  alternates: {
    canonical: getCanonicalPath("/sign-in"),
  },
});

export default async function RetailSignInPage() {
  const origin = await getCurrentRequestOrigin();

  return (
    <PortalSignInPage
      portal="retail"
      authPath="/api/auth/retail/sign-in"
      footerLinkLabel="Create retail account"
      footerLinkHref="/sign-up"
      alternatePortalCtas={[
        { label: "Accept staff invite", href: "/accept-invite" },
        {
          label: "Customer sign in instead",
          href: getPortalAbsoluteUrl("shop", "/sign-in", origin),
        },
        {
          label: "Supplier sign in instead",
          href: getPortalAbsoluteUrl("supply", "/sign-in", origin),
        },
      ]}
    />
  );
}
