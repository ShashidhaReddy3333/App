import { InviteStaffForm } from "@/components/forms/invite-staff-form";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/guards";
import { listStaff } from "@/lib/services/management-query-service";
import { toStaffCards } from "@/lib/view-models/app";

export default async function StaffPage() {
  const session = await requirePermission("staff");
  const staff = await listStaff(session.user.businessId!);
  const cards = toStaffCards(staff);

  return (
    <div className="space-y-6">
      <PageHeader title="Staff management" description="Invite new staff members and review current role assignments." />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <InviteStaffForm />
        <div className="grid gap-4 md:grid-cols-2">
          {cards.length === 0 ? (
            <EmptyState title="No staff members yet" description="Send the first invite to add a manager, cashier, or inventory team member." />
          ) : null}
          {cards.map((user) => (
            <Card key={user.id} className="gradient-panel">
              <CardHeader>
                <CardTitle>{user.fullName}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div>Role: {user.roleLabel}</div>
                <div>Status: {user.status}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
