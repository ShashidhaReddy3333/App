import { RevokeSessionButton } from "@/components/revoke-session-button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listBusinessSessions } from "@/lib/services/management-query-service";
import { toSessionCards } from "@/lib/view-models/app";

export default async function SessionsPage() {
  const session = await requirePermission("sessions");
  const sessions = await listBusinessSessions(session.user.businessId!);
  const cards = toSessionCards(sessions);

  return (
    <div className="space-y-6">
      <PageHeader title="Session management" description="Owners can review device sessions and revoke any active session." />
      <div className="grid gap-4">
        {cards.length === 0 ? <EmptyState title="No active sessions" description="Device sessions will appear here after users sign in." /> : null}
        {cards.map((deviceSession) => (
          <Card key={deviceSession.id} className="gradient-panel">
            <CardHeader>
              <CardTitle>{deviceSession.userName}</CardTitle>
              <CardDescription>{deviceSession.deviceName}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <div>Last seen: {deviceSession.lastSeenLabel}</div>
              <RevokeSessionButton sessionId={deviceSession.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
