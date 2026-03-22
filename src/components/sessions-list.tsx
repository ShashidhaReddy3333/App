"use client";

import { useState } from "react";

import { RevokeSessionButton } from "@/components/revoke-session-button";
import { RevokeOtherSessionsButton } from "@/components/revoke-other-sessions-button";
import { EmptyState } from "@/components/state-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SessionCard = {
  id: string;
  userId: string;
  userName: string;
  deviceName: string;
  lastSeenLabel: string;
  isCurrentSession: boolean;
  isCurrentUser: boolean;
};

export function SessionsList({ sessions }: { sessions: SessionCard[] }) {
  const [items, setItems] = useState(sessions);
  const hasOtherCurrentUserSessions = items.some(
    (session) => session.isCurrentUser && !session.isCurrentSession
  );

  if (items.length === 0) {
    return (
      <EmptyState
        title="No active sessions"
        description="Device sessions will appear here after users sign in."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {hasOtherCurrentUserSessions ? (
        <div className="flex justify-end">
          <RevokeOtherSessionsButton
            onRevoked={(revokedSessionIds) =>
              setItems((current) =>
                current.filter((session) => !revokedSessionIds.includes(session.id))
              )
            }
          />
        </div>
      ) : null}
      {items.map((deviceSession) => (
        <Card key={deviceSession.id} className="">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{deviceSession.userName}</span>
              {deviceSession.isCurrentSession ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Current session
                </span>
              ) : null}
            </CardTitle>
            <CardDescription>{deviceSession.deviceName}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>Last seen: {deviceSession.lastSeenLabel}</div>
            <RevokeSessionButton
              sessionId={deviceSession.id}
              onRevoked={(sessionId) =>
                setItems((current) => current.filter((session) => session.id !== sessionId))
              }
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
