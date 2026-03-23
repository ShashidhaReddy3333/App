import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { AdminDisputeDetail } from "@/components/admin/admin-dispute-detail";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

export default async function AdminDisputeDetailPage({
  params,
}: {
  params: Promise<{ disputeId: string }>;
}) {
  const { disputeId } = await params;
  const dispute = await db.platformDispute.findUnique({
    where: { id: disputeId },
    include: {
      business: { select: { id: true, businessName: true } },
      customer: { select: { id: true, fullName: true, email: true } },
      assignedAdmin: { select: { id: true, fullName: true, email: true } },
      events: {
        include: {
          authorUser: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!dispute) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="outline">
        <Link href="/admin/disputes">
          <ArrowLeft className="mr-2 size-4" />
          Back to disputes
        </Link>
      </Button>

      <div className="space-y-2">
        <div className="section-label">Dispute case</div>
        <h1 className="text-3xl font-semibold tracking-[-0.03em]">{dispute.title}</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Review the case, add staff notes, send customer or business-facing updates, and finalize
          the resolution.
        </p>
      </div>

      <AdminDisputeDetail dispute={dispute} />
    </div>
  );
}
