import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SupplierSignUpForm } from "@/components/forms/supplier-sign-up-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCanonicalPath, withNoIndex } from "@/lib/public-metadata";

export const metadata: Metadata = withNoIndex({
  title: "Request Supplier Access | Human Pulse",
  description:
    "Request supplier portal access to manage wholesale catalog, retailer orders, and fulfillment.",
  alternates: {
    canonical: getCanonicalPath("/sign-up"),
  },
});

export default async function SupplierSignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ requested?: string }>;
}) {
  const params = await searchParams;
  const requested = params.requested === "1";

  if (requested) {
    return (
      <AuthShell
        eyebrow="Supplier portal"
        title="Supplier access request submitted"
        description="We received your supplier details. Human Pulse will review the request before activating a supplier portal account."
        homeHref="/"
        homeLabel="Human Pulse"
        homeTagline="Supplier Portal"
      >
        <Card className="gradient-panel">
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
            <CardDescription>
              Supplier onboarding now requires review so supplier access stays separate from
              retailer business data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>We will verify your company details and follow up before enabling portal access.</p>
            <p>
              You do not need to submit another request unless your business information changes.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/sign-in">Back to supplier sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Return to supplier portal home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Supplier portal"
      title="Request supplier portal access"
      description="Submit your supplier business details to request access to the Human Pulse supplier portal."
      homeHref="/"
      homeLabel="Human Pulse"
      homeTagline="Supplier Portal"
      highlights={[
        {
          title: "Managed onboarding",
          description:
            "Supplier access is reviewed before activation so vendor access stays cleanly separated from retailer data.",
        },
        {
          title: "Portal built for fulfillment",
          description:
            "Once approved, suppliers manage wholesale products, retailer orders, and fulfillment updates in one workspace.",
        },
      ]}
    >
      <SupplierSignUpForm authPath="/api/auth/supplier/sign-up" />
    </AuthShell>
  );
}
