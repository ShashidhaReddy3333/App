import Link from "next/link";

import { EmptyState } from "@/components/state-card";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <EmptyState
      title="Access restricted"
      description="Your current role does not allow this action. Return to the dashboard or sign in with an account that has the required permission."
      action={
        <Button asChild>
          <Link href="/app/dashboard">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
