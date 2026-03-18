import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { CustomerSignUpForm } from "@/components/forms/customer-sign-up-form";

export const metadata: Metadata = {
  title: "Create Account | Human Pulse",
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


