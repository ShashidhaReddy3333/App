import { AuthShell } from "@/components/auth/auth-shell";
import { SupplierSignUpForm } from "@/components/forms/supplier-sign-up-form";

export default function SupplierSignUpPage() {
  return (
    <AuthShell
      title="Create supplier portal account"
      description="Publish wholesale products, manage retailer purchase orders, and update fulfillment in one place."
    >
      <SupplierSignUpForm />
    </AuthShell>
  );
}
