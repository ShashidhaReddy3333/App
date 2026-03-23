import type { Metadata } from "next";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/forms/sign-up-form";
import { getCurrentSession } from "@/lib/auth/session";
import { getCanonicalPath } from "@/lib/public-metadata";

export const metadata: Metadata = {
  title: "Create Retail Account | Human Pulse",
  description: "Create a Human Pulse retail account and launch your first operational workspace.",
  alternates: {
    canonical: getCanonicalPath("/sign-up"),
  },
};

export default async function SignUpPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/dashboard" as Route);
  }

  return (
    <AuthShell
      eyebrow="Retail portal"
      title="Create a retailer workspace"
      description="Set up the owner account, operating defaults, and first store location in one Human Pulse retail onboarding flow."
      homeHref="/"
      homeLabel="Human Pulse"
      homeTagline="Retail Portal"
      highlights={[
        {
          title: "Operational setup",
          description:
            "Create the first retail workspace, location, tax mode, and owner account in one flow.",
        },
        {
          title: "Built for store teams",
          description:
            "The retail portal is designed for checkout, inventory, staff, orders, and reporting.",
        },
      ]}
    >
      <SignUpForm />
    </AuthShell>
  );
}
