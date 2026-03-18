"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { requestJson } from "@/lib/client/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";

type PendingInviteCard = {
  id: string;
  email: string;
  roleLabel: string;
  statusLabel: string;
  createdAtLabel: string;
  expiresAtLabel: string;
};

export function PendingInvitesList({ invites }: { invites: PendingInviteCard[] }) {
  const router = useRouter();
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [demoTokenInviteId, setDemoTokenInviteId] = useState<string | null>(null);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  return (
    <div className="grid gap-4">
      {invites.map((invite) => (
        <Card key={invite.id} className="">
          <CardHeader>
            <CardTitle>{invite.email}</CardTitle>
            <CardDescription>{invite.roleLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div>Status: {invite.statusLabel}</div>
            <div>Sent: {invite.createdAtLabel}</div>
            <div>Expires: {invite.expiresAtLabel}</div>
            <Button
              type="button"
              variant="outline"
              disabled={resendingId === invite.id}
              onClick={async () => {
                setResendingId(invite.id);
                try {
                  const result = await requestJson<{ invite: { id: string }; token: string | null }>(`/api/staff/invites/${invite.id}/resend`, {
                    method: "POST"
                  });
                  setDemoTokenInviteId(invite.id);
                  setDemoToken(result.token ?? null);
                  toast.success(result.token ? "Invite resent. Demo token is shown below." : "Invite resent.");
                  router.refresh();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Unable to resend invite.");
                } finally {
                  setResendingId(null);
                }
              }}
            >
              {resendingId === invite.id ? "Resending..." : "Resend invite"}
            </Button>
            {demoTokenInviteId === invite.id && demoToken ? (
              <div className="rounded-lg border border-dashed border-border bg-secondary p-3 text-foreground">
                Demo invite token: <span className="font-mono">{demoToken}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
