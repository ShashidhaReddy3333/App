import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, DollarSign, Package, Percent, ShoppingCart, Store, User } from "lucide-react";

import {
  SupplierRevenueChart,
  SupplierTopProductsChart,
} from "@/components/supplier-dashboard-charts";
import { SupplierRelationshipManager } from "@/components/supplier-relationship-manager";
import { SupplierShell } from "@/components/supplier-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/guards";
import { withNoIndex } from "@/lib/public-metadata";
import { formatCurrency } from "@/lib/utils";
import {
  getSupplierAnalytics,
  listSupplierPortalData,
} from "@/lib/services/procurement-query-service";

export const metadata: Metadata = withNoIndex({
  title: "Supplier Dashboard | Human Pulse",
});

export default async function SupplierDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ relationship?: string }>;
}) {
  const params = await searchParams;
  const session = await requireRole("supplier", "/forbidden" as Route);
  const data = await listSupplierPortalData(session.user.id, {
    relationshipSupplierId: params.relationship,
  });
  const analytics = await getSupplierAnalytics(
    data.showingAllRelationships ? data.supplierIds : [data.activeRelationship.id]
  );

  const openOrders = data.purchaseOrders.filter(
    (order) => !["received", "closed", "cancelled"].includes(order.status)
  ).length;

  return (
    <SupplierShell supplierName={data.supplierOrganization.name} userName={session.user.fullName}>
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="section-label">Supplier operations</div>
          <h1 className="text-4xl font-semibold tracking-[-0.04em]">Supplier dashboard</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Manage your wholesale catalog and respond to retailer purchase orders across your Human
            Pulse supplier relationships.
          </p>
        </div>

        <SupplierRelationshipManager
          basePath="/dashboard"
          relationships={data.relationshipSummaries}
          activeRelationshipId={data.activeRelationship.id}
          showingAllRelationships={data.showingAllRelationships}
          description="Switch dashboard metrics between all linked retailers or a single relationship."
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="metric-card">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Wholesale products
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                <Package className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold tracking-[-0.04em]">
                {data.supplierProducts.length}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Active catalog items</p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open retailer orders
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                <ShoppingCart className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold tracking-[-0.04em]">{openOrders}</div>
              <p className="mt-1 text-xs text-muted-foreground">Awaiting fulfillment</p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Supplier organization
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                <User className="size-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="font-medium text-foreground">{data.supplierOrganization.name}</div>
                <div className="text-muted-foreground">
                  {data.supplierOrganization.email || data.supplier.email || "No email"}
                </div>
                <div className="text-muted-foreground">
                  {data.supplierOrganization.phone || data.supplier.phone || "No phone"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.supplierRelationships.length} retailer relationship
                  {data.supplierRelationships.length === 1 ? "" : "s"} linked
                </div>
                {!data.showingAllRelationships ? (
                  <div className="text-xs text-muted-foreground">
                    Focused on {data.activeRelationship.business.businessName}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href={"/catalog" as Route} className="group">
            <Card className="h-full">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-secondary/80">
                  <Package className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">Wholesale Catalog</div>
                  <div className="text-sm text-muted-foreground">
                    Manage products, pricing, and availability
                  </div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>

          <Link href={"/orders" as Route} className="group">
            <Card className="h-full">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-secondary/80">
                  <ShoppingCart className="size-6" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">Retailer Orders</div>
                  <div className="text-sm text-muted-foreground">
                    Review and fulfill purchase orders
                  </div>
                </div>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="metric-card">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Revenue
                </CardTitle>
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <DollarSign className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold tracking-[-0.04em]">
                  {formatCurrency(analytics.totalRevenue)}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Completed wholesale orders</p>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open Orders
                </CardTitle>
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <ShoppingCart className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold tracking-[-0.04em]">
                  {analytics.openOrders}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Awaiting fulfillment</p>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Fulfillment Rate
                </CardTitle>
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <Percent className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold tracking-[-0.04em]">
                  {analytics.fulfillmentRate.toFixed(1)}%
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Completed vs active orders</p>
              </CardContent>
            </Card>

            <Card className="metric-card">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Retailers
                </CardTitle>
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
                  <Store className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold tracking-[-0.04em]">
                  {analytics.activeRetailers}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Unique businesses ordering</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Monthly Revenue</CardTitle>
                <Badge variant="outline">
                  {analytics.averageFulfillmentDays.toFixed(1)} day avg fulfillment
                </Badge>
              </CardHeader>
              <CardContent>
                <SupplierRevenueChart data={analytics.monthlyRevenue} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
              </CardHeader>
              <CardContent>
                <SupplierTopProductsChart data={analytics.topProducts} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SupplierShell>
  );
}
