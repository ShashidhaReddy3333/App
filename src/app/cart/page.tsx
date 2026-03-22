import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ShoppingCart } from "lucide-react";

export const metadata: Metadata = {
  title: "Cart | Human Pulse",
};

import { CustomerCheckoutForm } from "@/components/forms/customer-checkout-form";
import { CustomerShell } from "@/components/customer-shell";
import { RemoveCartItemButton } from "@/components/remove-cart-item-button";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/guards";
import { decimalToNumber } from "@/lib/money";
import { getCustomerCart } from "@/lib/services/customer-commerce-query-service";

export default async function CartPage() {
  const session = await requireRole("customer", "/sign-in");
  const cart = await getCustomerCart(session.user.id);
  const total = cart.items.reduce((sum, item) => sum + decimalToNumber(item.totalPrice), 0);

  return (
    <CustomerShell customerName={session.user.fullName}>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShoppingCart className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your Cart</h1>
            <p className="text-sm text-muted-foreground">
              {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {cart.items.length === 0 ? (
          <EmptyState
            icon="cart"
            title="Your cart is empty"
            description="Add products from the storefront to begin checkout."
            action={
              <Button asChild>
                <Link href={"/shop" as Route}>Browse products</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="data-row flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-[18px] bg-[hsl(var(--surface-high))] text-lg font-bold text-foreground">
                      {item.product.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{item.product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {Number(item.quantity).toFixed(0)} x $
                        {decimalToNumber(item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-semibold">
                      ${decimalToNumber(item.totalPrice).toFixed(2)}
                    </div>
                    <RemoveCartItemButton itemId={item.id} />
                  </div>
                </div>
              ))}

              <div className="surface-shell mt-4 rounded-[22px] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-xl font-bold text-foreground">${total.toFixed(2)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {cart.items.length} {cart.items.length === 1 ? "item" : "items"}
                  </span>
                  <span>Taxes calculated at checkout</span>
                </div>
              </div>
            </div>
            <CustomerCheckoutForm cartTotal={total} />
          </div>
        )}
      </div>
    </CustomerShell>
  );
}
