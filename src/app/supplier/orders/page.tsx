import { SupplierOrderStatusForm } from "@/components/forms/supplier-order-status-form";
import { SupplierShell } from "@/components/supplier-shell";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { listSupplierPortalData } from "@/lib/services/procurement-query-service";

export default async function SupplierOrdersPage() {
  const session = await requireRole("supplier", "/sign-in");
  const data = await listSupplierPortalData(session.user.id);

  return (
    <SupplierShell supplierName={data.supplier.name} userName={session.user.fullName}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Retailer purchase orders</h1>
          <p className="text-muted-foreground">Review incoming wholesale orders and update fulfillment status as goods move through your pipeline.</p>
        </div>
        {data.purchaseOrders.length === 0 ? (
          <EmptyState title="No retailer orders yet" description="Retailer purchase orders will appear here once managers start ordering wholesale stock." />
        ) : null}
        <div className="grid gap-4">
          {data.purchaseOrders.map((purchaseOrder) => (
            <Card key={purchaseOrder.id} className="gradient-panel">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>{purchaseOrder.poNumber ?? purchaseOrder.id.slice(0, 8)}</span>
                  <span className="text-base capitalize">{purchaseOrder.status.replaceAll("_", " ")}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <div>Location: {purchaseOrder.location.name}</div>
                  <div>Total: ${Number(purchaseOrder.totalCost).toFixed(2)}</div>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {purchaseOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between rounded-2xl border p-3">
                      <span>{item.supplierProduct?.name ?? item.product.name}</span>
                      <span>
                        {Number(item.orderedQuantity).toFixed(0)} ordered - {Number(item.receivedQuantity).toFixed(0)} received
                      </span>
                    </div>
                  ))}
                </div>
                <SupplierOrderStatusForm purchaseOrderId={purchaseOrder.id} currentStatus={purchaseOrder.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SupplierShell>
  );
}
