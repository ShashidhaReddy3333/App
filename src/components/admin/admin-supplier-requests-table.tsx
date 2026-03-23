"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError } from "@/lib/client/api";
import { csrfFetch } from "@/lib/client/csrf-fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";

type SupplierRequestRow = {
  id: string;
  fullName: string;
  businessName: string;
  email: string;
  phone: string | null;
  notes: string | null;
  status: string;
  createdAtLabel: string;
  reviewedAtLabel: string | null;
  approvedBusinessId: string | null;
  approvedBusinessName: string | null;
  rejectionReason: string | null;
};

type ApprovalBusinessOption = {
  id: string;
  label: string;
};

function getStatusVariant(status: string) {
  if (status === "approved") return "default" as const;
  if (status === "rejected") return "destructive" as const;
  return "secondary" as const;
}

export function AdminSupplierRequestsTable({
  requests,
  businesses,
}: {
  requests: SupplierRequestRow[];
  businesses: ApprovalBusinessOption[];
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [selectedBusinesses, setSelectedBusinesses] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      requests
        .filter((request) => request.approvedBusinessId)
        .map((request) => [request.id, request.approvedBusinessId!])
    )
  );
  const [rejectionDrafts, setRejectionDrafts] = useState<Record<string, string>>({});

  async function reviewRequest(
    key: string,
    payload: Record<string, unknown>,
    successMessage: string
  ) {
    setPendingKey(key);
    try {
      await csrfFetch("/api/admin/supplier-requests", {
        method: "PATCH",
        body: payload,
      });
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to review supplier request.";
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
            <th className="px-4 py-3 text-left font-medium">Supplier</th>
            <th className="px-4 py-3 text-left font-medium">Contact</th>
            <th className="px-4 py-3 text-left font-medium">Submitted</th>
            <th className="px-4 py-3 text-left font-medium">Status</th>
            <th className="px-4 py-3 text-left font-medium">Assigned business</th>
            <th className="px-4 py-3 text-left font-medium">Review notes</th>
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const approveKey = `approve-${request.id}`;
            const rejectKey = `reject-${request.id}`;
            const selectedBusinessId = selectedBusinesses[request.id] ?? "";
            const rejectionReason = rejectionDrafts[request.id] ?? request.rejectionReason ?? "";
            const isBusy = pendingKey === approveKey || pendingKey === rejectKey;
            const isPending = request.status === "pending";

            return (
              <tr key={request.id} className="border-b align-top hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p className="font-medium">{request.businessName}</p>
                    <p className="text-xs text-muted-foreground">{request.fullName}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p>{request.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.phone || "No phone provided"}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <p>{request.createdAtLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.reviewedAtLabel
                        ? `Reviewed ${request.reviewedAtLabel}`
                        : "Awaiting review"}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  {isPending ? (
                    <div className="min-w-[240px] space-y-2">
                      <Label htmlFor={`approval-business-${request.id}`} className="sr-only">
                        Assign business for {request.email}
                      </Label>
                      <Select
                        id={`approval-business-${request.id}`}
                        aria-label={`Assign business for ${request.email}`}
                        value={selectedBusinessId}
                        onChange={(event) =>
                          setSelectedBusinesses((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                        disabled={isBusy}
                      >
                        <option value="">Choose retailer business</option>
                        {businesses.map((business) => (
                          <option key={business.id} value={business.id}>
                            {business.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p>{request.approvedBusinessName ?? "No business assigned"}</p>
                      {request.rejectionReason ? (
                        <p className="text-xs text-muted-foreground">{request.rejectionReason}</p>
                      ) : null}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-sm space-y-1">
                    <p className="text-muted-foreground">
                      {request.notes || "No business notes submitted."}
                    </p>
                    {request.rejectionReason && isPending === false ? (
                      <p className="text-xs text-destructive">{request.rejectionReason}</p>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {isPending ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={isBusy || !selectedBusinessId}
                        aria-label={`Approve request for ${request.email}`}
                        onClick={() =>
                          void reviewRequest(
                            approveKey,
                            {
                              requestId: request.id,
                              action: "approve",
                              businessId: selectedBusinessId,
                            },
                            "Supplier request approved."
                          )
                        }
                      >
                        Approve
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            disabled={isBusy}
                            aria-label={`Reject request for ${request.email}`}
                          >
                            Reject
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject supplier request</AlertDialogTitle>
                            <AlertDialogDescription>
                              Reject the supplier access request for {request.email}? The user can
                              submit a new request later if needed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="space-y-2">
                            <Label htmlFor={`rejection-reason-${request.id}`}>
                              Rejection reason
                            </Label>
                            <Textarea
                              id={`rejection-reason-${request.id}`}
                              value={rejectionReason}
                              onChange={(event) =>
                                setRejectionDrafts((current) => ({
                                  ...current,
                                  [request.id]: event.target.value,
                                }))
                              }
                              placeholder="Explain what the supplier should fix before requesting access again."
                              disabled={isBusy}
                            />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isBusy}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() =>
                                void reviewRequest(
                                  rejectKey,
                                  {
                                    requestId: request.id,
                                    action: "reject",
                                    rejectionReason,
                                  },
                                  "Supplier request rejected."
                                )
                              }
                              disabled={isBusy}
                            >
                              Reject request
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Reviewed</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
