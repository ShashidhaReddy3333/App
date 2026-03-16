"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { requestJson } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";

type FailedNotificationCard = {
  id: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  status: string;
  userName: string;
  userEmail: string;
  createdAtLabel: string;
};

export function FailedNotificationsList({ notifications }: { notifications: FailedNotificationCard[] }) {
  const router = useRouter();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  return (
    <div className="grid gap-4">
      {notifications.map((notification) => (
        <Card key={notification.id} className="gradient-panel">
          <CardHeader>
            <CardTitle>{notification.title}</CardTitle>
            <CardDescription>
              {notification.userName} - {notification.userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{notification.message}</p>
            <div>Type: {notification.type}</div>
            <div>Channel: {notification.channel}</div>
            <div>Status: {notification.status}</div>
            <div>Created: {notification.createdAtLabel}</div>
            <Button
              type="button"
              variant="outline"
              disabled={retryingId === notification.id}
              onClick={async () => {
                setRetryingId(notification.id);
                try {
                  await requestJson(`/api/notifications/${notification.id}/retry`, {
                    method: "POST"
                  });
                  toast.success("Notification requeued.");
                  router.refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to retry notification.");
                } finally {
                  setRetryingId(null);
                }
              }}
            >
              {retryingId === notification.id ? "Requeueing..." : "Retry delivery"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
