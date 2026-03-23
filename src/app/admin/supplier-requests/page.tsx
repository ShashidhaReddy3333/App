import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { AdminSupplierRequestsTable } from "@/components/admin/admin-supplier-requests-table";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listSupplierOnboardingRequests } from "@/lib/services/auth-service";
import { listPlatformApprovalBusinesses } from "@/lib/services/platform-service";

export const metadata: Metadata = {
  title: "Supplier Requests | Human Pulse",
  description: "Review, approve, or reject supplier portal access requests.",
};

const STATUS_FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
] as const;

export const dynamic = "force-dynamic";

export default async function AdminSupplierRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status =
    params.status === "approved" || params.status === "rejected" || params.status === "all"
      ? params.status
      : "pending";

  const [requestData, businesses] = await Promise.all([
    listSupplierOnboardingRequests({
      page,
      limit: 25,
      status: status === "all" ? undefined : status,
    }),
    listPlatformApprovalBusinesses(),
  ]);

  const businessNameById = new Map(
    businesses.map((business) => [business.id, business.businessName])
  );

  const rows = requestData.requests.map((request) => ({
    id: request.id,
    fullName: request.fullName,
    businessName: request.businessName,
    email: request.email,
    phone: request.phone,
    notes: request.notes,
    status: request.status,
    createdAtLabel: new Date(request.createdAt).toLocaleString(),
    reviewedAtLabel: request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : null,
    approvedBusinessId: request.approvedBusinessId,
    approvedBusinessName: request.approvedBusinessId
      ? (businessNameById.get(request.approvedBusinessId) ?? request.approvedBusinessId)
      : null,
    rejectionReason: request.rejectionReason,
  }));

  const approvalBusinesses = businesses.map((business) => ({
    id: business.id,
    label: `${business.businessName} (${business.primaryCountry} - ${business.businessType.replaceAll("_", " ")})`,
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="section-label">Supplier access workflow</div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em]">Supplier requests</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Review supplier portal requests, assign the first retailer relationship, and approve or
            reject access with an explicit audit trail.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((filter) => {
            const href =
              filter.value === "pending"
                ? "/admin/supplier-requests"
                : (`/admin/supplier-requests?status=${filter.value}` as Route);

            return (
              <Button
                key={filter.value}
                asChild
                size="sm"
                variant={status === filter.value ? "default" : "outline"}
              >
                <Link href={href}>{filter.label}</Link>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="metric-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tracking-[-0.04em]">
              {requestData.counts.pending}
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tracking-[-0.04em]">
              {requestData.counts.approved}
            </div>
          </CardContent>
        </Card>
        <Card className="metric-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-semibold tracking-[-0.04em]">
              {requestData.counts.rejected}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Portal access requests</CardTitle>
            <Badge variant="outline">{requestData.total} requests</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <AdminSupplierRequestsTable requests={rows} businesses={approvalBusinesses} />
        </CardContent>
      </Card>

      <Pagination
        basePath={
          status === "pending"
            ? "/admin/supplier-requests"
            : `/admin/supplier-requests?status=${status}`
        }
        currentPage={requestData.page}
        totalPages={requestData.totalPages}
        totalItems={requestData.total}
      />
    </div>
  );
}
