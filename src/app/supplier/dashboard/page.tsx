import { SupplierShell } from "@/components/supplier-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { listSupplierPortalData } from "@/lib/services/procurement-query-service";

export default async function SupplierDashboardPage() {
  const session = await requireRole("supplier", "/sign-in");
  const data = await listSupplierPortalData(session.user.id);

  return (
    <SupplierShell supplierName={data.supplier.name} userName={session.user.fullName}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Supplier dashboard</h1>
          <p className="text-muted-foreground">Manage your wholesale catalog and respond to retailer purchase orders.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="gradient-panel">
            <CardHeader>
              <CardTitle>Wholesale products</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{data.supplierProducts.length}</CardContent>
          </Card>
          <Card className="gradient-panel">
            <CardHeader>
              <CardTitle>Open retailer orders</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">
              {data.purchaseOrders.filter((order) => !["received", "closed", "cancelled"].includes(order.status)).length}
            </CardContent>
          </Card>
          <Card className="gradient-panel">
            <CardHeader>
              <CardTitle>Supplier profile</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div>{data.supplier.email || "No email"}</div>
              <div>{data.supplier.phone || "No phone"}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SupplierShell>
  );
}
