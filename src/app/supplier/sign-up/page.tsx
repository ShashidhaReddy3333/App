import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { SupplierSignUpForm } from "@/components/forms/supplier-sign-up-form";
import { getCanonicalPath } from "@/lib/public-metadata";

export const metadata: Metadata = {
  title: "Create Supplier Account | Human Pulse",
  description:
    "Create a supplier account to manage wholesale catalog, retailer orders, and fulfillment.",
  alternates: {
    canonical: getCanonicalPath("/sign-up"),
  },
};

export default function SupplierSignUpPage() {
  return (
    <AuthShell
      eyebrow="Supplier portal"
      title="Create a supplier account"
      description="Join the Human Pulse supplier portal to publish wholesale products, respond to retailer orders, and manage fulfillment updates."
      homeHref="/"
      homeLabel="Human Pulse"
      homeTagline="Supplier Portal"
      highlights={[
        {
          title: "Manage wholesale catalog",
          description:
            "Publish product availability, pricing, lead times, and service coverage in one workspace.",
        },
        {
          title: "Stay on top of fulfillment",
          description:
            "Track retailer purchase orders, update status, and keep your pipeline visible.",
        },
      ]}
    >
      <SupplierSignUpForm />
    </AuthShell>
  );
}
