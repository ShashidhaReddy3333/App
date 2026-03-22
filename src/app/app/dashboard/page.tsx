import { DollarSign, ShoppingBag, Globe, AlertTriangle, Clock, Truck, Boxes } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/state-card";
import { PageHeader } from "@/components/page-header";
import { requireAppSession } from "@/lib/auth/guards";
import { getDashboardMetrics } from "@/lib/services/reporting-query-service";
import { toDashboardCards } from "@/lib/view-models/app";

const cardIcons = [DollarSign, ShoppingBag, Globe, AlertTriangle, Clock, Truck, Boxes];

export default async function DashboardPage() {
  const session = await requireAppSession();
  const metrics = await getDashboardMetrics(session.user.businessId!);
  const summaryCards = toDashboardCards(metrics);

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
          const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
          return (
            <Card
              key={card.title}
              className={`metric-card gradient-panel animate-fade-in-up ${staggerClass}`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className="flex size-10 items-center justify-center rounded-[18px] bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-semibold tracking-[-0.04em]">{card.value}</div>
                {/* TODO: Replace with real 7-day trend data from reporting service */}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gradient-panel animate-fade-in-up stagger-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="size-4 text-primary" />
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
              <div key={item.productId} className="data-row flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </div>
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="font-semibold tabular-nums">{item.quantity}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="gradient-panel animate-fade-in-up stagger-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
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
              <div key={entry.id} className="data-row">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-foreground">{entry.action}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(entry.createdAt))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
