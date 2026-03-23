"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError } from "@/lib/client/api";
import { csrfFetch } from "@/lib/client/csrf-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

type DisputeRow = {
  id: string;
  title: string;
  description: string;
  type: string;
  businessName: string | null;
  customerName: string | null;
  status: string;
  assignedAdminName: string | null;
  resolution: string | null;
  createdAtLabel: string;
};

function getStatusVariant(status: string) {
  if (status === "open") return "destructive" as const;
  if (status === "in_review") return "secondary" as const;
  if (status === "resolved") return "default" as const;
  return "outline" as const;
}

export function AdminDisputesTable({ disputes }: { disputes: DisputeRow[] }) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [resolutionValues, setResolutionValues] = useState<Record<string, string>>({});

  async function mutateDispute(
    key: string,
    payload: Record<string, unknown>,
    successMessage: string
  ) {
    setPendingKey(key);
    try {
      await csrfFetch<{ dispute: { id: string } }>("/api/admin/disputes", {
        method: "PATCH",
        body: payload,
      });
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      const message = error instanceof ApiClientError ? error.message : "Unable to update dispute.";
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
            <th className="px-4 py-3 text-left font-medium">Title</th>
            <th className="px-4 py-3 text-left font-medium">Type</th>
            <th className="px-4 py-3 text-left font-medium">Business</th>
            <th className="px-4 py-3 text-left font-medium">Customer</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Assigned To</th>
            <th className="px-4 py-3 text-left font-medium">Resolution</th>
            <th className="px-4 py-3 text-left font-medium">Created</th>
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {disputes.map((dispute) => {
            const assignKey = `assign-${dispute.id}`;
            const resolveKey = `resolve-${dispute.id}`;
            const isBusy = [assignKey, resolveKey].includes(pendingKey ?? "");
            const resolutionValue = resolutionValues[dispute.id] ?? dispute.resolution ?? "";

            return (
              <tr key={dispute.id} className="border-b align-top hover:bg-muted/30">
                <td className="px-4 py-3">
                  <p className="font-medium line-clamp-1">{dispute.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {dispute.description}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">
                    {dispute.type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{dispute.businessName ?? "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{dispute.customerName ?? "-"}</td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusVariant(dispute.status)}>
                    {dispute.status.replaceAll("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {dispute.assignedAdminName ?? "Unassigned"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {dispute.resolution ?? "Pending"}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {dispute.createdAtLabel}
                </td>
                <td className="px-4 py-3">
                  <div className="min-w-[240px] space-y-2">
                    <Button asChild type="button" size="sm" variant="secondary">
                      <Link href={`/admin/disputes/${dispute.id}`}>Open case</Link>
                    </Button>
                    {!dispute.assignedAdminName ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isBusy}
                        onClick={() =>
                          void mutateDispute(
                            assignKey,
                            { disputeId: dispute.id, assignToMe: true },
                            "Dispute assigned."
                          )
                        }
                      >
                        Assign to me
                      </Button>
                    ) : null}

                    {dispute.status !== "resolved" ? (
                      <div className="space-y-2">
                        <Input
                          value={resolutionValue}
                          disabled={isBusy}
                          placeholder="Resolution notes"
                          onChange={(event) =>
                            setResolutionValues((current) => ({
                              ...current,
                              [dispute.id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={isBusy || !resolutionValue.trim()}
                          onClick={() =>
                            void mutateDispute(
                              resolveKey,
                              {
                                disputeId: dispute.id,
                                status: "resolved",
                                resolution: resolutionValue.trim(),
                              },
                              "Dispute resolved."
                            )
                          }
                        >
                          Resolve
                        </Button>
                      </div>
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
