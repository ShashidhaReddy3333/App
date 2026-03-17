import Link from "next/link";
import { Package, ShoppingCart, User, ArrowRight } from "lucide-react";

import { SupplierShell } from "@/components/supplier-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { listSupplierPortalData } from "@/lib/services/procurement-query-service";

export default async function SupplierDashboardPage() {
  const session = await requireRole("supplier", "/sign-in");
  const data = await listSupplierPortalData(session.user.id);

  const openOrders = data.purchaseOrders.filter(
    (order) => !["received", "closed", "cancelled"].includes(order.status)
  ).length;

  return (
    <SupplierShell supplierName={data.supplier.name} userName={session.user.fullName}>
      <div className="space-y-8">
        <div className="animate-fade-in space-y-1">
          <h1 className="text-3xl font-semibold">Supplier dashboard</h1>
          <p className="text-muted-foreground">Manage your wholesale catalog and respond to retailer purchase orders.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="metric-card animate-fade-in-up stagger-1">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Wholesale products</CardTitle>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Package className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{data.supplierProducts.length}</div>
              <p className="mt-1 text-xs text-muted-foreground">Active catalog items</p>
            </CardContent>
          </Card>

          <Card className="metric-card animate-fade-in-up stagger-2">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open retailer orders</CardTitle>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <ShoppingCart className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{openOrders}</div>
              <p className="mt-1 text-xs text-muted-foreground">Awaiting fulfillment</p>
            </CardContent>
          </Card>

          <Card className="metric-card animate-fade-in-up stagger-3">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Supplier profile</CardTitle>
              <div className="flex size-10 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <User className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="font-medium text-foreground">{data.supplier.name}</div>
                <div className="text-muted-foreground">{data.supplier.email || "No email"}</div>
                <div className="text-muted-foreground">{data.supplier.phone || "No phone"}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/supplier/catalog" className="group">
            <Card className="gradient-panel animate-fade-in-up stagger-4 h-full">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Package className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">Wholesale Catalog</div>
                  <div className="text-sm text-muted-foreground">Manage products, pricing, and availability</div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/supplier/orders" className="group">
            <Card className="gradient-panel animate-fade-in-up stagger-5 h-full">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 transition-colors group-hover:bg-amber-200">
                  <ShoppingCart className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">Retailer Orders</div>
                  <div className="text-sm text-muted-foreground">Review and fulfill purchase orders</div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </SupplierShell>
  );
}
