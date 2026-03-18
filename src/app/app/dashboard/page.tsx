import type { Metadata } from "next";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, Clock, DollarSign, Globe, ShoppingBag, Truck } from "lucide-react";
import { CategoryInventoryChart, OrderVolumeChart, RevenueTrendChart, TopCustomersChart } from "@/components/dashboard-charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state-card";
import { PageHeader } from "@/components/page-header";
import { requireAppSession } from "@/lib/auth/guards";
import { getDashboardMetrics, getEnhancedDashboardMetrics } from "@/lib/services/reporting-query-service";
import { cn } from "@/lib/utils";
import { toDashboardCards } from "@/lib/view-models/app";

export const metadata: Metadata = {
  title: "Dashboard | Human Pulse",
};

const cardIcons = [DollarSign, ShoppingBag, Globe, AlertTriangle, Clock, Truck, Boxes];

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function growth(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function orderVolumeTrend(data: Array<{ count: number }>) {
  const recent = data.slice(-7).reduce((sum, day) => sum + day.count, 0);
  const prior = data.slice(-14, -7).reduce((sum, day) => sum + day.count, 0);
  return growth(recent, prior);
}

export default async function DashboardPage() {
  const session = await requireAppSession();
  const [metrics, enhancedMetrics] = await Promise.all([
    getDashboardMetrics(session.user.businessId!),
    getEnhancedDashboardMetrics(session.user.businessId!)
  ]);
  const summaryCards = toDashboardCards(metrics);

  const revenueGrowth = enhancedMetrics.revenueComparison.growthPercentage;
  const ordersGrowth = orderVolumeTrend(enhancedMetrics.orderVolumeDaily);
  const growthIndicators = [revenueGrowth, ordersGrowth, ordersGrowth, -revenueGrowth, -revenueGrowth, -revenueGrowth, revenueGrowth];
  const hasDailyRevenue = enhancedMetrics.dailyRevenue.some((entry) => entry.revenue > 0);
  const hasOrderVolume = enhancedMetrics.orderVolumeDaily.some((entry) => entry.count > 0);
  const hasTopCustomers = enhancedMetrics.topCustomers.some((entry) => entry.total > 0);
  const hasCategoryInventory = enhancedMetrics.categoryInventory.some((entry) => entry.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session.user.fullName}. Your live operational metrics are calculated from POS sales, customer web orders, inventory balances, procurement activity, and recent audit events.`}
        breadcrumbs={[{ label: "Dashboard" }]}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {summaryCards.map((card, index) => {
          const Icon = cardIcons[index] ?? ShoppingBag;
          const indicator = growthIndicators[index] ?? 0;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="size-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{card.value}</div>
                <div className="mt-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-semibold",
                      indicator >= 0
                        ? "border-uber-green/30 bg-uber-green/10 text-uber-green"
                        : "border-red-200 bg-red-50 text-red-600"
                    )}
                  >
                    {indicator >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {Math.abs(indicator).toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Revenue — Last 30 Days</CardTitle>
          <CardDescription>Completed-sale revenue trend for your business timezone.</CardDescription>
        </CardHeader>
        <CardContent>
          {hasDailyRevenue ? (
            <RevenueTrendChart data={enhancedMetrics.dailyRevenue} />
          ) : (
            <EmptyState
              icon="default"
              title="No completed sales yet"
              description="Revenue trend will appear after completed sales are recorded."
            />
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order Volume</CardTitle>
            <CardDescription>Orders created per day over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasOrderVolume ? (
              <OrderVolumeChart data={enhancedMetrics.orderVolumeDaily} />
            ) : (
              <EmptyState title="No orders recorded" description="Order volume will appear once orders are created." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Top 5 customers by total order spend.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasTopCustomers ? (
              <TopCustomersChart data={enhancedMetrics.topCustomers} />
            ) : (
              <EmptyState
                title="No customer spend data"
                description="Top customers will appear after customer-linked orders are completed."
              />
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
            <CardDescription>Current stock value and at-risk inventory counts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="text-sm text-muted-foreground">Inventory Value</div>
              <div className="mt-1 text-4xl font-bold tracking-tight">{formatCurrency(enhancedMetrics.totalInventoryValue)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-white p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Low Stock</div>
                <div className="mt-1 text-2xl font-semibold">{enhancedMetrics.lowStockCount}</div>
              </div>
              <div className="rounded-lg border border-border bg-white p-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Out of Stock</div>
                <div className="mt-1 text-2xl font-semibold">{enhancedMetrics.outOfStockCount}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
            <CardDescription>Inventory value distribution across product categories.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasCategoryInventory ? (
              <CategoryInventoryChart data={enhancedMetrics.categoryInventory} />
            ) : (
              <EmptyState title="No inventory distribution data" description="Category distribution appears once products are stocked." />
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="size-4" />
              Top products
            </CardTitle>
            <CardDescription>Best-selling items for the current business day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {metrics.topSellingProducts.length === 0 ? (
              <EmptyState
                icon="package"
                title="No completed sales yet"
                description="Top-selling products will appear after the first completed sale for the business day."
              />
            ) : null}
            {metrics.topSellingProducts.map((item, index) => (
              <div
                key={item.productId}
                className="flex items-center justify-between p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-secondary text-xs font-semibold">
                    {index + 1}
                  </div>
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="font-semibold tabular-nums">{item.quantity}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4" />
              Recent activity
            </CardTitle>
            <CardDescription>Latest audit events for the business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {metrics.recentActivity.length === 0 ? (
              <EmptyState
                icon="inbox"
                title="No recent activity"
                description="Audit events will appear here after sign-ins, sales, refunds, or inventory changes."
              />
            ) : null}
            {metrics.recentActivity.map((entry) => (
              <div key={entry.id} className="p-3 transition-colors hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-foreground">{entry.action}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


