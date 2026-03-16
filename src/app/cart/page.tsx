import { CustomerCheckoutForm } from "@/components/forms/customer-checkout-form";
import { CustomerShell } from "@/components/customer-shell";
import { RemoveCartItemButton } from "@/components/remove-cart-item-button";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { decimalToNumber } from "@/lib/money";
import { getCustomerCart } from "@/lib/services/customer-commerce-query-service";

export default async function CartPage() {
  const session = await requireRole("customer", "/sign-in");
  const cart = await getCustomerCart(session.user.id);
  const total = cart.items.reduce((sum, item) => sum + decimalToNumber(item.totalPrice), 0);

  return (
    <CustomerShell customerName={session.user.fullName}>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="gradient-panel">
          <CardHeader>
            <CardTitle>Your cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.items.length === 0 ? (
              <EmptyState title="Your cart is empty" description="Add products from the storefront to begin checkout." />
            ) : null}
            {cart.items.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-medium">{item.product.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {Number(item.quantity).toFixed(0)} x ${decimalToNumber(item.unitPrice).toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-medium">${decimalToNumber(item.totalPrice).toFixed(2)}</div>
                  <RemoveCartItemButton itemId={item.id} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <CustomerCheckoutForm cartTotal={total} />
      </div>
    </CustomerShell>
  );
}
