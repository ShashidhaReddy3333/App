import { PageHeader } from "@/components/page-header";
import { SessionsList } from "@/components/sessions-list";
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
      <SessionsList sessions={cards} />
    </div>
  );
}
