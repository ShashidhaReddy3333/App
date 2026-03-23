import type { Metadata } from "next";
import { FailedNotificationsList } from "@/components/failed-notifications-list";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { getOperationsSnapshot } from "@/lib/services/operations-query-service";
import { toAuditActivityCards, toFailedNotificationCards } from "@/lib/view-models/app";

export const metadata: Metadata = {
  title: "Operations | Human Pulse",
};

function getSummaryCardVariant(
  title: string,
  value: number
): "default" | "warning" | "destructive" | "success" {
  if (title.includes("Failed") || title.includes("Runtime errors")) {
    return value > 0 ? "destructive" : "success";
  }
  if (title.includes("Stale") || title.includes("Expired") || title.includes("Runtime warnings")) {
    return value > 0 ? "warning" : "success";
  }
  return "default";
}

export default async function OperationsPage() {
  const session = await requirePermission("owner_dashboard");
  const snapshot = await getOperationsSnapshot(session.user.businessId!);
  const failedNotifications = toFailedNotificationCards(snapshot.recentFailedNotifications);
  const auditActivity = toAuditActivityCards(snapshot.recentAudit);

  const summaryCards = [
    {
      title: "Active sessions",
      value: snapshot.summary.activeSessions.toString(),
      numValue: snapshot.summary.activeSessions,
    },
    {
      title: "Pending invites",
      value: snapshot.summary.pendingInvites.toString(),
      numValue: snapshot.summary.pendingInvites,
    },
    {
      title: "Queued notifications",
      value: snapshot.summary.queuedNotifications.toString(),
      numValue: snapshot.summary.queuedNotifications,
    },
    {
      title: "Failed notifications",
      value: snapshot.summary.failedNotifications.toString(),
      numValue: snapshot.summary.failedNotifications,
    },
    {
      title: "Expired reset tokens",
      value: snapshot.summary.expiredResetTokens.toString(),
      numValue: snapshot.summary.expiredResetTokens,
    },
    {
      title: "Stale reservations",
      value: snapshot.summary.staleReservations.toString(),
      numValue: snapshot.summary.staleReservations,
    },
    {
      title: "Runtime errors",
      value: snapshot.summary.runtimeErrors.toString(),
      numValue: snapshot.summary.runtimeErrors,
    },
    {
      title: "Runtime warnings",
      value: snapshot.summary.runtimeWarnings.toString(),
      numValue: snapshot.summary.runtimeWarnings,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description="Owner-only operational visibility for runtime checks, failed notifications, stale records, and recent audited actions."
        breadcrumbs={[{ label: "Operations" }]}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const variant = getSummaryCardVariant(card.title, card.numValue);
          return (
            <Card
              key={card.title}
              className={`${
                variant === "destructive"
                  ? "border-l-4 border-l-red-500"
                  : variant === "warning"
                    ? "border-l-4 border-l-amber-500"
                    : ""
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription>{card.title}</CardDescription>
                  {variant !== "default" && (
                    <Badge variant={variant === "success" ? "success" : variant}>
                      {variant === "success"
                        ? "clear"
                        : variant === "destructive"
                          ? "alert"
                          : "check"}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl">{card.value}</CardTitle>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Failed notifications</h2>
            <Badge variant={failedNotifications.length > 0 ? "destructive" : "outline"}>
              {failedNotifications.length}
            </Badge>
          </div>
          {failedNotifications.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="No failed notifications"
              description="Failed delivery attempts will appear here for owner review and retry."
            />
          ) : (
            <FailedNotificationsList notifications={failedNotifications} />
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Runtime checks</h2>
              <Badge variant={snapshot.runtimeIssues.length > 0 ? "warning" : "outline"}>
                {snapshot.runtimeIssues.length}
              </Badge>
            </div>
            {snapshot.runtimeIssues.length === 0 ? (
              <EmptyState
                title="No runtime issues"
                description="Environment and readiness checks are currently clear."
              />
            ) : (
              <div className="grid gap-4">
                {snapshot.runtimeIssues.map((issue) => (
                  <Card
                    key={`${issue.severity}-${issue.key}`}
                    className={`${
                      issue.severity === "error"
                        ? "border-l-4 border-l-red-500"
                        : issue.severity === "warning"
                          ? "border-l-4 border-l-amber-500"
                          : ""
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{issue.key}</CardTitle>
                        <Badge
                          variant={
                            issue.severity === "error"
                              ? "destructive"
                              : issue.severity === "warning"
                                ? "warning"
                                : "outline"
                          }
                        >
                          {issue.severity}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {issue.message}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent audit activity</h2>
              <Badge variant="outline">{auditActivity.length}</Badge>
            </div>
            {auditActivity.length === 0 ? (
              <EmptyState
                title="No recent audit activity"
                description="Audited operational actions will appear here."
              />
            ) : (
              <div className="grid gap-4">
                {auditActivity.map((entry) => (
                  <Card key={entry.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{entry.actionLabel}</CardTitle>
                      <CardDescription>{entry.resourceLabel}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      {entry.createdAtLabel}
                    </CardContent>
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
