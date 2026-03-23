import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { AcceptInviteForm } from "@/components/forms/accept-invite-form";
import { withNoIndex } from "@/lib/public-metadata";

export const metadata: Metadata = withNoIndex({
  title: "Accept Invite | Human Pulse",
  description: "Accept a Human Pulse staff invitation and activate your account.",
});

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell
      title="Accept staff invite"
      description="Activate the invited staff account and sign in immediately."
    >
      <AcceptInviteForm token={params.token ?? ""} />
    </AuthShell>
  );
}
