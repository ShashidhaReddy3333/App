import type { Metadata } from "next";
import type { Route } from "next";
import { MapPin, DollarSign, Package, Check } from "lucide-react";

import { SupplierOrderStatusForm } from "@/components/forms/supplier-order-status-form";
import { SupplierRelationshipManager } from "@/components/supplier-relationship-manager";
import { SupplierShell } from "@/components/supplier-shell";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { withNoIndex } from "@/lib/public-metadata";
import { listSupplierPortalData } from "@/lib/services/procurement-query-service";

export const metadata: Metadata = withNoIndex({
  title: "Retailer Orders | Human Pulse",
});

const statusSteps = ["sent", "accepted", "shipped", "partially_received", "received"] as const;

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const isCancelled = currentStatus === "cancelled" || currentStatus === "rejected";
  const normalizedStatus = currentStatus === "closed" ? "received" : currentStatus;
  const currentIndex = statusSteps.indexOf(normalizedStatus as (typeof statusSteps)[number]);

  return (
    <div className="flex items-center gap-1">
      {statusSteps.map((step, index) => {
        const isCompleted = !isCancelled && currentIndex >= 0 && index <= currentIndex;
        const isCurrent = !isCancelled && step === normalizedStatus;
        return (
          <div key={step} className="flex items-center gap-1">
            <div className="flex flex-col items-center">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  isCancelled
                    ? "bg-red-100 text-red-400"
                    : isCompleted
                      ? "bg-[#06C167] text-white"
                      : "bg-muted text-muted-foreground"
                } ${isCurrent ? "ring-2 ring-foreground" : ""}`}
              >
                {isCompleted ? <Check className="size-3.5" /> : index + 1}
              </div>
              <span
                className={`mt-1 text-[10px] capitalize ${isCompleted ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {step.replaceAll("_", " ")}
              </span>
            </div>
            {index < statusSteps.length - 1 ? (
              <div
                className={`mb-4 h-0.5 w-4 rounded-full sm:w-6 ${
                  !isCancelled && currentIndex > index ? "bg-[#06C167]" : "bg-muted"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default async function SupplierOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ relationship?: string }>;
}) {
  const params = await searchParams;
  const session = await requireRole("supplier", "/forbidden" as Route);
  const data = await listSupplierPortalData(session.user.id, {
    relationshipSupplierId: params.relationship,
  });

  return (
    <SupplierShell supplierName={data.supplierOrganization.name} userName={session.user.fullName}>
      <div className="space-y-6">
        <SupplierRelationshipManager
          basePath="/orders"
          relationships={data.relationshipSummaries}
          activeRelationshipId={data.activeRelationship.id}
          showingAllRelationships={data.showingAllRelationships}
          description="Focus retailer purchase orders on one relationship when you need a cleaner fulfillment queue."
        />

        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Retailer purchase orders</h1>
          <p className="text-muted-foreground">
            Review incoming wholesale orders and update fulfillment status as goods move through
            your pipeline across all connected retailer relationships.
          </p>
          <p className="text-xs text-muted-foreground">
            {data.supplierRelationships.length} retailer relationship
            {data.supplierRelationships.length === 1 ? "" : "s"} currently linked to this supplier
            organization.
          </p>
          {!data.showingAllRelationships ? (
            <p className="text-xs text-muted-foreground">
              Focused on {data.activeRelationship.business.businessName}.
            </p>
          ) : null}
        </div>
        {data.purchaseOrders.length === 0 ? (
          <EmptyState
            icon="inbox"
            title="No retailer orders yet"
            description="Retailer purchase orders will appear here once managers start ordering wholesale stock."
          />
        ) : null}
        <div className="grid gap-4">
          {data.purchaseOrders.map((purchaseOrder) => {
            return (
              <Card key={purchaseOrder.id}>
                <CardHeader className="pb-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                        <Package className="size-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {purchaseOrder.poNumber ?? purchaseOrder.id.slice(0, 8)}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {purchaseOrder.location.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {purchaseOrder.business.businessName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={purchaseOrder.status} />
                      <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <DollarSign className="size-3.5" />
                        {Number(purchaseOrder.totalCost).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StatusTimeline currentStatus={purchaseOrder.status} />

                  {purchaseOrder.trackingNumber ? (
                    <div className="rounded-2xl border border-border/60 bg-white/70 px-4 py-3 text-sm">
                      <span className="font-medium text-foreground">Tracking number:</span>{" "}
                      <span className="text-muted-foreground">{purchaseOrder.trackingNumber}</span>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Order Items
                    </div>
                    {purchaseOrder.items.map((item) => {
                      const ordered = Number(item.orderedQuantity);
                      const received = Number(item.receivedQuantity);
                      const progress = ordered > 0 ? Math.min((received / ordered) * 100, 100) : 0;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 rounded-lg bg-secondary p-3 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="size-3.5 text-muted-foreground" />
                            <span className="font-medium">
                              {item.supplierProduct?.name ?? item.product.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
                              <div
                                className="h-full rounded-full bg-[#06C167] transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="whitespace-nowrap text-muted-foreground">
                              {received.toFixed(0)}/{ordered.toFixed(0)} received
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <SupplierOrderStatusForm
                    purchaseOrderId={purchaseOrder.id}
                    currentStatus={purchaseOrder.status}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SupplierShell>
  );
}
