import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { CustomerSignUpForm } from "@/components/forms/customer-sign-up-form";
import { getCanonicalPath } from "@/lib/public-metadata";

export const metadata: Metadata = {
  title: "Create Account | Human Pulse",
  description: "Create a customer account to place online orders and track order history.",
  alternates: {
    canonical: getCanonicalPath("/customer/sign-up"),
  },
};

export default function CustomerSignUpPage() {
  return (
    <AuthShell
      title="Create customer account"
      description="Order online, choose pickup or delivery, and track your history from one account."
    >
      <CustomerSignUpForm />
    </AuthShell>
  );
}
