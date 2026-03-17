import { DollarSign, TrendingUp, ShoppingBag, Globe, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ReportsChart } from "@/components/reports-chart";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { getReportsSnapshot } from "@/lib/services/reporting-query-service";
import { toReportCards } from "@/lib/view-models/app";

const reportIcons = [DollarSign, TrendingUp, ShoppingBag, Globe, Truck];

export default async function ReportsPage() {
  const session = await requirePermission("reports");
  const report = await getReportsSnapshot(session.user.businessId!);
  const cards = toReportCards(report);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Daily and monthly performance summaries combine POS and online ordering, and use the business timezone for all cutoffs."
        breadcrumbs={[{ label: "Reports" }]}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, index) => {
          const Icon = reportIcons[index] ?? DollarSign;
          const staggerClass = `stagger-${Math.min(index + 1, 5)}`;
          return (
            <Card key={card.title} className={`metric-card gradient-panel animate-fade-in-up ${staggerClass}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold tracking-tight">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Card className="gradient-panel animate-fade-in-up stagger-3">
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
    </div>
  );
}
