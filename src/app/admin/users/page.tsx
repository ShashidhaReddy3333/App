import type { Metadata } from "next";

import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin Users | Human Pulse",
  description: "Review and monitor platform user accounts in the Human Pulse admin portal."
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    include: {
      business: { select: { businessName: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const rows = users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    businessName: user.business?.businessName ?? null,
    joinedAtLabel: new Date(user.createdAt).toLocaleDateString()
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">{users.length} users (showing last 100)</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <AdminUsersTable users={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
