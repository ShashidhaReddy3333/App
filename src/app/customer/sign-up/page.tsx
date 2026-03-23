import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { CustomerSignUpForm } from "@/components/forms/customer-sign-up-form";
import { getCanonicalPath } from "@/lib/public-metadata";

export const metadata: Metadata = {
  title: "Create Customer Account | Human Pulse",
  description: "Create a customer account to shop, order, and track purchases in Human Pulse.",
  alternates: {
    canonical: getCanonicalPath("/sign-up"),
  },
};

export default function CustomerSignUpPage() {
  return (
    <AuthShell
      eyebrow="Customer portal"
      title="Create your customer account"
      description="Save time at checkout, track purchases, and manage your Human Pulse order history from one customer login."
      homeHref="/"
      homeLabel="Human Pulse"
      homeTagline="Customer Portal"
      highlights={[
        {
          title: "Checkout faster",
          description: "Use one account for product browsing, cart management, and repeat orders.",
        },
        {
          title: "Track every purchase",
          description:
            "View order status, history, fulfillment details, and customer account activity.",
        },
      ]}
    >
      <CustomerSignUpForm />
    </AuthShell>
  );
}
