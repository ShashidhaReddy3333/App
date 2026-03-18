import type { Metadata } from "next";
import { CheckoutForm } from "@/components/forms/checkout-form";
import { CompleteSaleForm } from "@/components/forms/complete-sale-form";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { decimalToNumber } from "@/lib/money";
import { listCatalogData } from "@/lib/services/catalog-query-service";
import { getSaleDetail } from "@/lib/services/sales-query-service";
import { toCheckoutProductOptions } from "@/lib/view-models/app";

export const metadata: Metadata = {
  title: "POS Checkout | Human Pulse",
};

export default async function CheckoutPage({
  searchParams
}: {
  searchParams: Promise<{ saleId?: string }>;
}) {
  const session = await requirePermission("sales");
  const catalog = await listCatalogData(session.user.businessId!);
  const params = await searchParams;
  const pendingSale = params.saleId ? await getSaleDetail(session.user.businessId!, params.saleId).catch(() => null) : null;
  const activePendingSale = pendingSale?.status === "pending_payment" ? pendingSale : null;
  const checkoutOptions = toCheckoutProductOptions(catalog.products);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Checkout"
        description="Reserve stock, collect split payments, and complete the sale in one cashier flow."
        breadcrumbs={[{ label: "Checkout" }]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div>
          <CheckoutForm locationId={catalog.location.id} products={checkoutOptions} />
        </div>
        {activePendingSale ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">Pending cart</CardTitle>
                  <Badge variant="warning">Awaiting payment</Badge>
                </div>
                <CardDescription>Sale #{activePendingSale.id.slice(0, 8)} is reserved until payment is completed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {activePendingSale.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 transition-colors hover:bg-muted/50">
                    <span className="font-medium">{item.product.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {item.quantity.toString()} x ${item.unitPrice.toString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between rounded-lg bg-secondary p-3 font-semibold">
                  <span>Total due</span>
                  <span>${activePendingSale.amountDue.toString()}</span>
                </div>
              </CardContent>
            </Card>
            <CompleteSaleForm saleId={activePendingSale.id} amountDue={decimalToNumber(activePendingSale.amountDue)} />
          </div>
        ) : (
          <div>
            <EmptyState
              icon="cart"
              title="No active pending cart"
              description="Create a checkout draft on the left to reserve stock and begin payment collection."
            />
          </div>
        )}
      </div>
    </div>
  );
}


