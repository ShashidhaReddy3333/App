import { notFound } from "next/navigation";

import { RefundForm } from "@/components/forms/refund-form";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/rbac";
import { getSaleDetail } from "@/lib/services/sales-query-service";
import { toRefundItemOptions } from "@/lib/view-models/app";

export default async function SaleDetailPage({ params }: { params: Promise<{ saleId: string }> }) {
  const session = await requirePermission("sales");
  const { saleId } = await params;
  const sale = await getSaleDetail(session.user.businessId!, saleId).catch(() => null);

  if (!sale) {
    notFound();
  }

  const canRefund =
    hasPermission(session.user.role, "refunds") &&
    (sale.status === "completed" || sale.status === "refunded_partially");
  const refundItems = toRefundItemOptions(sale.items);
  const pageDescription =
    sale.completedAt && sale.status !== "pending_payment"
      ? `Completed by ${sale.cashier.fullName} at ${sale.location.name}.`
      : `Reserved by ${sale.cashier.fullName} at ${sale.location.name}.`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={sale.receiptNumber ?? "Sale receipt"}
        description={pageDescription}
        breadcrumbs={[{ label: "Sales", href: "/app/sales" }, { label: "Receipt" }]}
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Receipt</CardTitle>
                <CardDescription>
                  Immutable sale snapshot with line-level tax breakdown.
                </CardDescription>
              </div>
              <StatusBadge status={sale.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {sale.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{item.product.name}</div>
                    <div className="font-semibold">${item.lineTotal.toString()}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span>Qty {item.quantity.toString()}</span>
                    <span className="text-border">|</span>
                    <span>Unit ${item.unitPrice.toString()}</span>
                    <span className="text-border">|</span>
                    <span>Discount ${item.lineDiscountAmount.toString()}</span>
                    <span className="text-border">|</span>
                    <span>Tax ${item.taxAmount.toString()}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-muted/30 p-4">
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${sale.subtotalAmount.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span>${sale.discountAmount.toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${sale.taxAmount.toString()}</span>
                </div>
                <div className="border-t border-border pt-2" />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span className="text-primary">${sale.totalAmount.toString()}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-medium">Payments</div>
              {sale.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <span className="capitalize text-muted-foreground">
                    {payment.method.replaceAll("_", " ")}
                  </span>
                  <span className="font-medium">${payment.amount.toString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div>
          {canRefund ? (
            refundItems.length > 0 ? (
              <RefundForm saleId={sale.id} items={refundItems} />
            ) : (
              <EmptyState
                illustration="receipt"
                title="No refundable line items"
                description="All sale lines are already fully refunded."
              />
            )
          ) : (
            <EmptyState
              illustration="receipt"
              title="Refunds unavailable"
              description="This sale is not currently eligible for a new refund."
            />
          )}
        </div>
      </div>
    </div>
  );
}
