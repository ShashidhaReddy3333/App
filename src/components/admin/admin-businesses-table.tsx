"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError } from "@/lib/client/api";
import { csrfFetch } from "@/lib/client/csrf-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

type BusinessRow = {
  id: string;
  businessName: string;
  currency: string;
  primaryCountry: string;
  owner: { fullName: string; email: string };
  businessType: string;
  isActive: boolean;
  verificationStatus: string | null;
  stripeLabel: string;
  stripeEnabled: boolean;
  ordersCount: number;
  isMarketplaceVisible: boolean;
};

function getVerificationVariant(status: string | null) {
  if (status === "approved") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "secondary" as const;
}

export function AdminBusinessesTable({ businesses }: { businesses: BusinessRow[] }) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function mutateBusiness(key: string, payload: Record<string, unknown>, successMessage: string) {
    setPendingKey(key);
    try {
      await csrfFetch<{ business: { id: string } }>("/api/admin/businesses", {
        method: "PATCH",
        body: payload
      });
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to update business.";
      toast.error(message);
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Business</th>
            <th className="px-4 py-3 text-left font-medium">Owner</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Verification</th>
            <th className="px-4 py-3 text-left font-medium">Stripe</th>
            <th className="px-4 py-3 text-left font-medium">Orders</th>
            <th className="px-4 py-3 text-left font-medium">Marketplace</th>
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((business) => {
            const suspendKey = `suspend-${business.id}`;
            const activateKey = `activate-${business.id}`;
            const verifyKey = `verify-${business.id}`;
            const marketplaceKey = `marketplace-${business.id}`;
            const isBusy = pendingKey?.startsWith(business.id) || [suspendKey, activateKey, verifyKey, marketplaceKey].includes(pendingKey ?? "");

            return (
              <tr key={business.id} className="border-b align-top hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{business.businessName}</p>
                    <p className="text-xs text-muted-foreground">{`${business.currency} - ${business.primaryCountry}`}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p>{business.owner.fullName}</p>
                    <p className="text-xs text-muted-foreground">{business.owner.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{business.businessType.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">
                  <Badge variant={business.isActive ? "default" : "secondary"}>
                    {business.isActive ? "Active" : "Suspended"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getVerificationVariant(business.verificationStatus)}>
                    {business.verificationStatus ?? "not submitted"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={business.stripeEnabled ? "default" : "secondary"}>
                    {business.stripeLabel}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{business.ordersCount}</td>
                <td className="px-4 py-3">
                  {business.isMarketplaceVisible ? (
                    <Badge variant="outline" className="border-green-600 text-green-600">
                      Visible
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Hidden</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {business.isActive ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button type="button" size="sm" variant="destructive" disabled={isBusy}>
                            Suspend
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Suspend business</AlertDialogTitle>
                            <AlertDialogDescription>
                              Suspend {business.businessName}? The business and its staff will remain in the system, but platform access will be disabled until it is reactivated.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() => void mutateBusiness(suspendKey, { businessId: business.id, isActive: false }, `${business.businessName} suspended.`)}
                              disabled={isBusy}
                            >
                              Suspend
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() => void mutateBusiness(activateKey, { businessId: business.id, isActive: true }, `${business.businessName} activated.`)}
                      >
                        Activate
                      </Button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBusy}
                      onClick={() => void mutateBusiness(
                        marketplaceKey,
                        { businessId: business.id, isMarketplaceVisible: !business.isMarketplaceVisible },
                        business.isMarketplaceVisible ? `${business.businessName} hidden from marketplace.` : `${business.businessName} visible in marketplace.`
                      )}
                    >
                      {business.isMarketplaceVisible ? "Hide Marketplace" : "Show Marketplace"}
                    </Button>

                    {business.verificationStatus !== "approved" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() => void mutateBusiness(verifyKey, { businessId: business.id, verify: true }, `${business.businessName} verified.`)}
                      >
                        Verify
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
