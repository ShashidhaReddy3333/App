import { PurchaseOrderForm } from "@/components/forms/purchase-order-form";
import { PageHeader } from "@/components/page-header";
import { ReceivePurchaseOrderButton } from "@/components/receive-purchase-order-button";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listProcurementData } from "@/lib/services/procurement-query-service";

export default async function ProcurementPage() {
  const session = await requirePermission("procurement");
  const data = await listProcurementData(session.user.businessId!);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement"
        description="Compare supplier offers, issue purchase orders, and receive wholesale stock into store inventory."
      />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <PurchaseOrderForm
          locationId={data.location.id}
          suppliers={data.suppliers.map((supplier) => ({ id: supplier.id, name: supplier.name }))}
          supplierProducts={data.supplierProducts.map((product) => ({
            id: product.id,
            supplierId: product.supplierId,
            label: `${product.name} - ${product.supplier.name} - $${Number(product.wholesalePrice).toFixed(2)}`
          }))}
        />
        <div className="space-y-4">
          {data.purchaseOrders.length === 0 ? (
            <EmptyState title="No purchase orders yet" description="Create the first procurement order to start restocking from suppliers." />
          ) : null}
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
                  <div>Supplier: {purchaseOrder.supplier.name}</div>
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
                <ReceivePurchaseOrderButton
                  purchaseOrderId={purchaseOrder.id}
                  items={purchaseOrder.items.map((item) => ({
                    itemId: item.id,
                    remainingQuantity: Math.max(Number(item.orderedQuantity) - Number(item.receivedQuantity), 0)
                  }))}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
