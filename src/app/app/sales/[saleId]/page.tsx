import { notFound } from "next/navigation";

import { RefundForm } from "@/components/forms/refund-form";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
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

  const canRefund = hasPermission(session.user.role, "refunds") && (sale.status === "completed" || sale.status === "refunded_partially");
  const refundItems = toRefundItemOptions(sale.items);
  const pageDescription =
    sale.completedAt && sale.status !== "pending_payment"
      ? `Completed by ${sale.cashier.fullName} at ${sale.location.name}.`
      : `Reserved by ${sale.cashier.fullName} at ${sale.location.name}.`;

  return (
    <div className="space-y-6">
      <PageHeader title={sale.receiptNumber ?? "Sale receipt"} description={pageDescription} />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="gradient-panel">
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
            <CardDescription>Immutable sale snapshot with line-level tax breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Status</span>
              <Badge>{sale.status.replaceAll("_", " ")}</Badge>
            </div>
            <div className="space-y-3">
              {sale.items.map((item) => (
                <div key={item.id} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{item.product.name}</div>
                    <div>${item.lineTotal.toString()}</div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Qty {item.quantity.toString()} · Unit ${item.unitPrice.toString()} · Discount ${item.lineDiscountAmount.toString()} · Tax $
                    {item.taxAmount.toString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${sale.subtotalAmount.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>${sale.discountAmount.toString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${sale.taxAmount.toString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${sale.totalAmount.toString()}</span>
              </div>
            </div>
            <div className="space-y-2 border-t pt-4 text-sm">
              <div className="font-medium">Payments</div>
              {sale.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between text-muted-foreground">
                  <span>{payment.method.replaceAll("_", " ")}</span>
                  <span>${payment.amount.toString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {canRefund ? (
          refundItems.length > 0 ? (
            <RefundForm saleId={sale.id} items={refundItems} />
          ) : (
            <EmptyState title="No refundable line items" description="All sale lines are already fully refunded." />
          )
        ) : (
          <EmptyState title="Refunds unavailable" description="This sale is not currently eligible for a new refund." />
        )}
      </div>
    </div>
  );
}
