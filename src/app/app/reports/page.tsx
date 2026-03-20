import type { Metadata } from "next";
import { DollarSign, TrendingUp, ShoppingBag, Globe, Truck } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { PageHeader } from "@/components/page-header";
import { ReportsChart, WeeklyRevenueLineChart } from "@/components/reports-charts";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { getEnhancedDashboardMetrics, getReportsSnapshot } from "@/lib/services/reporting-query-service";
import { toReportCards } from "@/lib/view-models/app";

export const metadata: Metadata = {
  title: "Reports | Human Pulse",
};

const reportIcons = [DollarSign, TrendingUp, ShoppingBag, Globe, Truck];

export default async function ReportsPage() {
  const session = await requirePermission("reports");
  const [report, enhancedMetrics] = await Promise.all([
    getReportsSnapshot(session.user.businessId!),
    getEnhancedDashboardMetrics(session.user.businessId!)
  ]);
  const cards = toReportCards(report);
  const hasWeeklyRevenue = enhancedMetrics.weeklyRevenue.some((entry) => entry.revenue > 0);

  const exportHeaders = ["Metric", "Value"];
  const exportRows: (string | number | null | undefined)[][] = cards.map((card) => [
    card.title,
    card.value
  ]);

  if (report.paymentBreakdown.length > 0) {
    exportRows.push([], ["Payment Method", "Amount"]);
    for (const entry of report.paymentBreakdown) {
      exportRows.push([entry.method, entry.amount]);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Daily and monthly performance summaries combine POS and online ordering, and use the business timezone for all cutoffs."
        breadcrumbs={[{ label: "Reports" }]}
        actions={<ExportButton filename="report.csv" headers={exportHeaders} rows={exportRows} />}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, index) => {
          const Icon = reportIcons[index] ?? DollarSign;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <div className="flex size-9 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="size-4 text-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tracking-tight">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment method breakdown</CardTitle>
          <CardDescription>Generated for {report.generatedAt} in the business timezone.</CardDescription>
        </CardHeader>
        <CardContent>
          {report.paymentBreakdown.length === 0 ? (
            <EmptyState title="No payment activity yet" description="Payment method reporting will appear after completed sales are recorded." />
          ) : (
            <ReportsChart data={report.paymentBreakdown} />
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Revenue Trend</CardTitle>
          <CardDescription>Completed-sale revenue across the last 12 business weeks.</CardDescription>
        </CardHeader>
        <CardContent>
          {hasWeeklyRevenue ? (
            <WeeklyRevenueLineChart data={enhancedMetrics.weeklyRevenue} />
          ) : (
            <EmptyState
              title="No weekly revenue yet"
              description="Weekly trend data will appear after completed sales are recorded."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


