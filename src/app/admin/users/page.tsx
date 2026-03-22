import type { Metadata } from "next";

import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { Pagination } from "@/components/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { listPlatformUsers } from "@/lib/services/platform-service";

export const metadata: Metadata = {
  title: "Admin Users | Human Pulse",
  description: "Review and monitor platform user accounts in the Human Pulse admin portal.",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { users, total, totalPages } = await listPlatformUsers({ page, limit: 100 });

  const rows = users.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    businessName: user.business?.businessName ?? null,
    joinedAtLabel: new Date(user.createdAt).toLocaleDateString(),
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} users on the platform</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <AdminUsersTable users={rows} />
        </CardContent>
      </Card>

      <div className="mt-4">
        <Pagination
          basePath="/admin/users"
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
        />
      </div>
    </div>
  );
}
