"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ApiClientError, requestJson } from "@/lib/client/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

type DisputeDetail = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  resolution: string | null;
  resolvedAt: string | Date | null;
  business: { id: string; businessName: string } | null;
  customer: { id: string; fullName: string; email: string } | null;
  assignedAdmin: { id: string; fullName: string; email: string } | null;
  events: Array<{
    id: string;
    eventType: string;
    visibility: string;
    body: string;
    createdAt: string | Date;
    authorUser: { id: string; fullName: string; email: string } | null;
  }>;
};

function formatDateTime(value: string | Date | null) {
  if (!value) {
    return "Not resolved";
  }
  return new Date(value).toLocaleString();
}

export function AdminDisputeDetail({ dispute }: { dispute: DisputeDetail }) {
  const router = useRouter();
  const [status, setStatus] = useState(dispute.status);
  const [resolution, setResolution] = useState(dispute.resolution ?? "");
  const [timelineBody, setTimelineBody] = useState("");
  const [timelineVisibility, setTimelineVisibility] = useState("internal");
  const [timelineEventType, setTimelineEventType] = useState("note");
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function updateDispute(payload: Record<string, unknown>, successMessage: string) {
    setBusyKey("update");
    try {
      await requestJson<{ dispute: { id: string } }>("/api/admin/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId: dispute.id,
          ...payload,
        }),
      });
      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to update dispute.");
    } finally {
      setBusyKey(null);
    }
  }

  async function createTimelineEntry() {
    setBusyKey("timeline");
    try {
      await requestJson<{ event: { id: string } }>(`/api/admin/disputes/${dispute.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: timelineBody,
          visibility: timelineVisibility,
          eventType: timelineEventType,
        }),
      });
      toast.success("Dispute note added.");
      setTimelineBody("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to add dispute note.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{dispute.title}</CardTitle>
            <CardDescription>{dispute.description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Type</div>
              <div className="mt-1 font-medium text-foreground">{dispute.type}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="mt-1">
                <Badge variant={status === "resolved" ? "success" : "secondary"}>
                  {status.replaceAll("_", " ")}
                </Badge>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Business</div>
              <div className="mt-1 font-medium text-foreground">
                {dispute.business?.businessName ?? "Not linked"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Customer</div>
              <div className="mt-1 font-medium text-foreground">
                {dispute.customer?.fullName ?? "Not linked"}
              </div>
              {dispute.customer?.email ? (
                <div className="text-muted-foreground">{dispute.customer.email}</div>
              ) : null}
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Assigned admin
              </div>
              <div className="mt-1 font-medium text-foreground">
                {dispute.assignedAdmin?.fullName ?? "Unassigned"}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Resolved at
              </div>
              <div className="mt-1 font-medium text-foreground">
                {formatDateTime(dispute.resolvedAt)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolution workflow</CardTitle>
            <CardDescription>
              Assign the dispute, move it through review, and record the final resolution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!dispute.assignedAdmin ? (
              <Button
                variant="outline"
                disabled={busyKey !== null}
                onClick={() => void updateDispute({ assignToMe: true }, "Dispute assigned.")}
              >
                Assign to me
              </Button>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="dispute-status">Status</Label>
              <Select
                id="dispute-status"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="open">Open</option>
                <option value="in_review">In review</option>
                <option value="resolved">Resolved</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dispute-resolution">Resolution</Label>
              <Textarea
                id="dispute-resolution"
                value={resolution}
                onChange={(event) => setResolution(event.target.value)}
                placeholder="Internal resolution summary or external response template"
              />
            </div>
            <Button
              className="w-full"
              disabled={busyKey !== null}
              onClick={() =>
                void updateDispute(
                  {
                    status,
                    resolution,
                  },
                  "Dispute updated."
                )
              }
            >
              {busyKey === "update" ? "Saving..." : "Save dispute changes"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Case timeline</CardTitle>
            <CardDescription>
              Internal notes and external customer or business messages are tracked here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dispute.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No timeline entries yet.</p>
            ) : (
              dispute.events.map((event) => (
                <div key={event.id} className="rounded-2xl border border-border/50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={event.visibility === "external" ? "default" : "outline"}>
                      {event.visibility}
                    </Badge>
                    <Badge variant="secondary">{event.eventType.replaceAll("_", " ")}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{event.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {event.authorUser?.fullName ?? "System"}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add timeline entry</CardTitle>
            <CardDescription>
              Use internal notes for staff-only context or external messages for business and
              customer-facing updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timeline-type">Entry type</Label>
                <Select
                  id="timeline-type"
                  value={timelineEventType}
                  onChange={(event) => setTimelineEventType(event.target.value)}
                >
                  <option value="note">Note</option>
                  <option value="message">Message</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline-visibility">Visibility</Label>
                <Select
                  id="timeline-visibility"
                  value={timelineVisibility}
                  onChange={(event) => setTimelineVisibility(event.target.value)}
                >
                  <option value="internal">Internal</option>
                  <option value="external">External</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeline-body">Message</Label>
              <Textarea
                id="timeline-body"
                value={timelineBody}
                onChange={(event) => setTimelineBody(event.target.value)}
                placeholder="Add investigation notes, next steps, or a customer-facing update."
              />
            </div>
            <Button
              className="w-full"
              disabled={busyKey !== null || timelineBody.trim().length < 2}
              onClick={() => void createTimelineEntry()}
            >
              {busyKey === "timeline" ? "Posting..." : "Add timeline entry"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
