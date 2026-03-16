import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/state-card";
import { requireAppSession } from "@/lib/auth/guards";
import { getDashboardMetrics } from "@/lib/services/reporting-query-service";
import { toDashboardCards } from "@/lib/view-models/app";

export default async function DashboardPage() {
  const session = await requireAppSession();
  const metrics = await getDashboardMetrics(session.user.businessId!);
  const summaryCards = toDashboardCards(metrics);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session.user.fullName}. Your live operational metrics are calculated from POS sales, customer web orders,
          inventory balances, procurement activity, and recent audit events.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {summaryCards.map((card) => (
          <Card key={card.title} className="gradient-panel">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{card.value}</CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gradient-panel">
          <CardHeader>
            <CardTitle>Top products</CardTitle>
            <CardDescription>Best-selling items for the current business day.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {metrics.topSellingProducts.length === 0 ? (
              <EmptyState
                title="No completed sales yet"
                description="Top-selling products will appear after the first completed sale for the business day."
              />
            ) : null}
            {metrics.topSellingProducts.map((item) => (
              <div key={item.productId} className="flex items-center justify-between rounded-2xl border p-3">
                <span>{item.name}</span>
                <span>{item.quantity}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="gradient-panel">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest audit events for the business.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            {metrics.recentActivity.length === 0 ? (
              <EmptyState
                title="No recent activity"
                description="Audit events will appear here after sign-ins, sales, refunds, or inventory changes."
              />
            ) : null}
            {metrics.recentActivity.map((entry) => (
              <div key={entry.id} className="rounded-2xl border p-3">
                <div className="font-medium text-foreground">{entry.action}</div>
                <div>{new Date(entry.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
