import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { EmptyState } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { withNoIndex } from "@/lib/public-metadata";

export const metadata: Metadata = withNoIndex({
  title: "Retail Access Restricted | Human Pulse",
});

export default function ForbiddenPage() {
  return (
    <EmptyState
      title="Access restricted"
      description="Your current role does not allow this action. Return to the dashboard or sign in with an account that has the required permission."
      action={
        <Button asChild>
          <Link href={"/dashboard" as Route}>Back to dashboard</Link>
        </Button>
      }
    />
  );
}
