"use client";

import { useState } from "react";

import { RevokeSessionButton } from "@/components/revoke-session-button";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SessionCard = {
  id: string;
  userName: string;
  deviceName: string;
  lastSeenLabel: string;
};

export function SessionsList({ sessions }: { sessions: SessionCard[] }) {
  const [items, setItems] = useState(sessions);

  if (items.length === 0) {
    return <EmptyState title="No active sessions" description="Device sessions will appear here after users sign in." />;
  }

  return (
    <div className="grid gap-4">
      {items.map((deviceSession) => (
        <Card key={deviceSession.id} className="">
          <CardHeader>
            <CardTitle>{deviceSession.userName}</CardTitle>
            <CardDescription>{deviceSession.deviceName}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>Last seen: {deviceSession.lastSeenLabel}</div>
            <RevokeSessionButton sessionId={deviceSession.id} onRevoked={(sessionId) => setItems((current) => current.filter((session) => session.id !== sessionId))} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
