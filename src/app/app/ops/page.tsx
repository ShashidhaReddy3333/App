import { FailedNotificationsList } from "@/components/failed-notifications-list";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { getOperationsSnapshot } from "@/lib/services/operations-query-service";
import { toAuditActivityCards, toFailedNotificationCards } from "@/lib/view-models/app";

export default async function OperationsPage() {
  const session = await requirePermission("owner_dashboard");
  const snapshot = await getOperationsSnapshot(session.user.businessId!);
  const failedNotifications = toFailedNotificationCards(snapshot.recentFailedNotifications);
  const auditActivity = toAuditActivityCards(snapshot.recentAudit);

  const summaryCards = [
    { title: "Active sessions", value: snapshot.summary.activeSessions.toString() },
    { title: "Pending invites", value: snapshot.summary.pendingInvites.toString() },
    { title: "Queued notifications", value: snapshot.summary.queuedNotifications.toString() },
    { title: "Failed notifications", value: snapshot.summary.failedNotifications.toString() },
    { title: "Expired reset tokens", value: snapshot.summary.expiredResetTokens.toString() },
    { title: "Stale reservations", value: snapshot.summary.staleReservations.toString() },
    { title: "Runtime errors", value: snapshot.summary.runtimeErrors.toString() },
    { title: "Runtime warnings", value: snapshot.summary.runtimeWarnings.toString() }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description="Owner-only operational visibility for runtime checks, failed notifications, stale records, and recent audited actions."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="gradient-panel">
            <CardHeader>
              <CardDescription>{card.title}</CardDescription>
              <CardTitle className="text-3xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Failed notifications</h2>
            <Badge>{failedNotifications.length}</Badge>
          </div>
          {failedNotifications.length === 0 ? (
            <EmptyState title="No failed notifications" description="Failed delivery attempts will appear here for owner review and retry." />
          ) : (
            <FailedNotificationsList notifications={failedNotifications} />
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Runtime checks</h2>
              <Badge>{snapshot.runtimeIssues.length}</Badge>
            </div>
            {snapshot.runtimeIssues.length === 0 ? (
              <EmptyState title="No runtime issues" description="Environment and readiness checks are currently clear." />
            ) : (
              <div className="grid gap-4">
                {snapshot.runtimeIssues.map((issue) => (
                  <Card key={`${issue.severity}-${issue.key}`} className="gradient-panel">
                    <CardHeader>
                      <CardTitle>{issue.key}</CardTitle>
                      <CardDescription>{issue.severity}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{issue.message}</CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent audit activity</h2>
              <Badge>{auditActivity.length}</Badge>
            </div>
            {auditActivity.length === 0 ? (
              <EmptyState title="No recent audit activity" description="Audited operational actions will appear here." />
            ) : (
              <div className="grid gap-4">
                {auditActivity.map((entry) => (
                  <Card key={entry.id} className="gradient-panel">
                    <CardHeader>
                      <CardTitle>{entry.actionLabel}</CardTitle>
                      <CardDescription>{entry.resourceLabel}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">{entry.createdAtLabel}</CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
