import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { BarChart3, CheckCircle2, DollarSign, Package, ReceiptText } from "lucide-react";

import { CustomerShell } from "@/components/customer-shell";
import { OrderActivityChart, OrderStatusChart } from "@/components/orders-dashboard-charts";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { withNoIndex } from "@/lib/public-metadata";
import { getCustomerAnalytics } from "@/lib/services/customer-commerce-query-service";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = withNoIndex({
  title: "My Dashboard | Human Pulse",
});

const metricCards = [
  {
    label: "Total Orders",
    icon: Package,
  },
  {
    label: "Total Spent",
    icon: DollarSign,
  },
  {
    label: "Average Order Value",
    icon: ReceiptText,
  },
  {
    label: "Completion Rate",
    icon: CheckCircle2,
  },
] as const;

export default async function CustomerDashboardPage() {
  const session = await requireRole("customer", "/sign-in");
  const analytics = await getCustomerAnalytics(session.user.id);

  const completedCount =
    analytics.statusBreakdown.find((entry) => entry.status === "completed")?.count ?? 0;
  const completionRate =
    analytics.totalOrders > 0 ? (completedCount / analytics.totalOrders) * 100 : 0;

  const metricValues = [
    analytics.totalOrders.toLocaleString("en-US"),
    formatCurrency(analytics.totalSpent, "USD", "en-US"),
    formatCurrency(analytics.averageOrderValue, "USD", "en-US"),
    `${completionRate.toFixed(1)}%`,
  ];

  return (
    <CustomerShell customerName={session.user.fullName}>
      <div className="space-y-6">
        <PageHeader
          title="My Dashboard"
          description="Track your order activity, spending, and top products in one place."
          breadcrumbs={[{ label: "Orders", href: "/orders" }, { label: "Dashboard" }]}
          actions={
            <Button asChild variant="uber-green">
              <Link href={"/shop" as Route}>Continue Shopping</Link>
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            const value = metricValues[index] ?? "-";

            return (
              <Card
                key={metric.label}
                className="rounded-xl border border-border bg-white shadow-sm"
              >
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </CardTitle>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="size-5 text-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">{value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-xl border border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-4 text-foreground" />
                Order Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderActivityChart data={analytics.ordersPerDay} />
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-border bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-foreground" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusChart data={analytics.statusBreakdown} />
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl border border-border bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {analytics.topProducts.length === 0 ? (
              <div className="flex flex-col items-start gap-3 py-2">
                <p className="text-sm text-muted-foreground">
                  Your most ordered products will appear after completed checkouts.
                </p>
                <Button asChild variant="default">
                  <Link href={"/shop" as Route}>Browse products</Link>
                </Button>
              </div>
            ) : (
              analytics.topProducts.map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.timesOrdered} times ordered
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{product.totalQuantity} qty</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </CustomerShell>
  );
}
