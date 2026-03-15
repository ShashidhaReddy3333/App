import { PageHeader } from "@/components/page-header";
import { ReportsChart } from "@/components/reports-chart";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { getReportsSnapshot } from "@/lib/services/reporting-query-service";
import { toReportCards } from "@/lib/view-models/app";

export default async function ReportsPage() {
  const session = await requirePermission("reports");
  const report = await getReportsSnapshot(session.user.businessId!);
  const cards = toReportCards(report);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Daily and monthly performance summaries use the business timezone for all cutoffs." />
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="gradient-panel">
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{card.value}</CardContent>
          </Card>
        ))}
      </div>
      <Card className="gradient-panel">
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
