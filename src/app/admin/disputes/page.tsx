import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { AdminDisputesTable } from "@/components/admin/admin-disputes-table";
import { Pagination } from "@/components/pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listPlatformDisputes } from "@/lib/services/platform-service";

export const metadata: Metadata = {
  title: "Admin Disputes | Human Pulse",
  description: "Track and resolve platform disputes across businesses and customers."
};

export const dynamic = "force-dynamic";

const filterTabs = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_review" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "all" }
] as const;

export default async function AdminDisputesPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const activeStatus = filterTabs.some((tab) => tab.value === params.status) ? params.status ?? "all" : "all";
  const page = Math.max(1, Number(params.page) || 1);
  const { disputes, total, totalPages } = await listPlatformDisputes({ status: activeStatus, page, limit: 25 });

  const rows = disputes.map((dispute) => ({
    id: dispute.id,
    title: dispute.title,
    description: dispute.description,
    type: dispute.type,
    businessName: dispute.business?.businessName ?? null,
    customerName: dispute.customer?.fullName ?? null,
    status: dispute.status,
    assignedAdminName: dispute.assignedAdmin?.fullName ?? null,
    resolution: dispute.resolution ?? null,
    createdAtLabel: new Date(dispute.createdAt).toLocaleDateString()
  }));
  const paginationParams = new URLSearchParams();
  if (activeStatus !== "all") {
    paginationParams.set("status", activeStatus);
  }
  const paginationBasePath = paginationParams.toString() ? `/admin/disputes?${paginationParams.toString()}` : "/admin/disputes";

  return (
    <div className="p-6">
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Disputes</h1>
          <p className="mt-1 text-sm text-muted-foreground">{total} disputes in the current filter</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const href = tab.value === "all" ? "/admin/disputes" : (`/admin/disputes?status=${tab.value}` as Route);
            return (
              <Button key={tab.value} asChild variant={activeStatus === tab.value ? "default" : "outline"} size="sm">
                <Link href={href}>{tab.label}</Link>
              </Button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <AdminDisputesTable disputes={rows} />
        </CardContent>
      </Card>

      <div className="mt-4">
        <Pagination
          basePath={paginationBasePath}
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
        />
      </div>
    </div>
  );
}
