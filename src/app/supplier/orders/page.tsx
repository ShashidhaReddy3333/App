import type { Metadata } from "next";
import { MapPin, DollarSign, Package, Check, Truck, XCircle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Retailer Orders | Human Pulse",
};

import { SupplierOrderStatusForm } from "@/components/forms/supplier-order-status-form";
import { SupplierShell } from "@/components/supplier-shell";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/guards";
import { listSupplierPortalData } from "@/lib/services/procurement-query-service";

const statusConfig: Record<string, { variant: "warning" | "default" | "success" | "destructive"; icon: typeof Clock }> = {
  draft: { variant: "default", icon: Clock },
  submitted: { variant: "warning", icon: Clock },
  approved: { variant: "default", icon: Check },
  shipped: { variant: "default", icon: Truck },
  received: { variant: "success", icon: Check },
  closed: { variant: "success", icon: Check },
  cancelled: { variant: "destructive", icon: XCircle }
};

const statusSteps = ["submitted", "approved", "shipped", "received"] as const;

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const isCancelled = currentStatus === "cancelled";
  const currentIndex = statusSteps.indexOf(currentStatus as (typeof statusSteps)[number]);

  return (
    <div className="flex items-center gap-1">
      {statusSteps.map((step, index) => {
        const isCompleted = !isCancelled && currentIndex >= 0 && index <= currentIndex;
        const isCurrent = !isCancelled && step === currentStatus;
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
              <span className={`mt-1 text-[10px] capitalize ${isCompleted ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                {step}
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

export default async function SupplierOrdersPage() {
  const session = await requireRole("supplier", "/sign-in");
  const data = await listSupplierPortalData(session.user.id);

  return (
    <SupplierShell supplierName={data.supplier.name} userName={session.user.fullName}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">Retailer purchase orders</h1>
          <p className="text-muted-foreground">Review incoming wholesale orders and update fulfillment status as goods move through your pipeline.</p>
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
            const config = statusConfig[purchaseOrder.status] ?? { variant: "default" as const, icon: Clock };
            const StatusIcon = config.icon;
            return (
              <Card
                key={purchaseOrder.id}
              >
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
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={config.variant} className="gap-1">
                        <StatusIcon className="size-3" />
                        <span className="capitalize">{purchaseOrder.status.replaceAll("_", " ")}</span>
                      </Badge>
                      <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        <DollarSign className="size-3.5" />
                        {Number(purchaseOrder.totalCost).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StatusTimeline currentStatus={purchaseOrder.status} />

                  <div className="space-y-2">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Order Items</div>
                    {purchaseOrder.items.map((item) => {
                      const ordered = Number(item.orderedQuantity);
                      const received = Number(item.receivedQuantity);
                      const progress = ordered > 0 ? Math.min((received / ordered) * 100, 100) : 0;
                      return (
                        <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg bg-secondary p-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="size-3.5 text-muted-foreground" />
                            <span className="font-medium">{item.supplierProduct?.name ?? item.product.name}</span>
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
                  <SupplierOrderStatusForm purchaseOrderId={purchaseOrder.id} currentStatus={purchaseOrder.status} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </SupplierShell>
  );
}


