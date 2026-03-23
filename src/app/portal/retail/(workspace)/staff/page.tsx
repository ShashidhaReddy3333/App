import { InviteStaffForm } from "@/components/forms/invite-staff-form";
import { PendingInvitesList } from "@/components/pending-invites-list";
import { PageHeader } from "@/components/page-header";
import { StaffList } from "@/components/staff-list";
import { EmptyState } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { requirePermission } from "@/lib/auth/guards";
import { listPendingInvites, listStaff } from "@/lib/services/management-query-service";
import { toPendingInviteCards, toStaffCards } from "@/lib/view-models/app";

export default async function StaffPage() {
  const session = await requirePermission("staff");
  const [staff, pendingInvites] = await Promise.all([
    listStaff(session.user.businessId!),
    listPendingInvites(session.user.businessId!),
  ]);
  const cards = toStaffCards(staff);
  const inviteCards = toPendingInviteCards(pendingInvites);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff management"
        description="Invite new staff members and review current role assignments."
        breadcrumbs={[{ label: "Staff" }]}
      />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="animate-fade-in-up stagger-1">
          <InviteStaffForm />
        </div>
        <div className="space-y-6 animate-fade-in-up stagger-2">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pending invitations</h2>
              <Badge variant={inviteCards.length > 0 ? "warning" : "outline"}>
                {inviteCards.length}
              </Badge>
            </div>
            {inviteCards.length === 0 ? (
              <EmptyState
                title="No pending invitations"
                description="New staff invites will appear here until they are accepted or expire."
              />
            ) : (
              <PendingInvitesList invites={inviteCards} />
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Current staff</h2>
              <Badge variant="outline">{cards.length}</Badge>
            </div>
            {cards.length === 0 ? (
              <EmptyState
                title="No staff members yet"
                description="Send the first invite to add a manager, cashier, or inventory team member."
              />
            ) : (
              <StaffList cards={cards} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
