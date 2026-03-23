import type { Metadata } from "next";

import { AdminBusinessesTable } from "@/components/admin/admin-businesses-table";
import { Pagination } from "@/components/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { listPlatformBusinesses } from "@/lib/services/platform-service";

export const metadata: Metadata = {
  title: "Admin Businesses | Human Pulse",
  description: "Review registered businesses, verification status, and marketplace visibility.",
};

export const dynamic = "force-dynamic";

export default async function AdminBusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { businesses, total, totalPages } = await listPlatformBusinesses({
    page,
    limit: 25,
  });

  const rows = businesses.map((business) => ({
    id: business.id,
    businessName: business.businessName,
    currency: business.currency,
    primaryCountry: business.primaryCountry,
    owner: {
      fullName: business.owner.fullName,
      email: business.owner.email,
    },
    businessType: business.businessType,
    isActive: business.isActive,
    verificationStatus: business.businessVerification?.status ?? null,
    stripeLabel: business.stripeAccount
      ? business.stripeAccount.chargesEnabled
        ? "Connected"
        : business.stripeAccount.onboardingStatus
      : "Not connected",
    stripeEnabled: business.stripeAccount?.chargesEnabled ?? false,
    ordersCount: business._count.orders,
    isMarketplaceVisible: business.isMarketplaceVisible,
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Businesses</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} businesses on the platform</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <AdminBusinessesTable businesses={rows} />
        </CardContent>
      </Card>

      <div className="mt-4">
        <Pagination
          basePath="/admin/businesses"
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
        />
      </div>
    </div>
  );
}
