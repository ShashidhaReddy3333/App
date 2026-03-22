import Link from "next/link";

import { EmptyState } from "@/components/state-card";
import { Button } from "@/components/ui/button";

export default function AdminForbiddenPage() {
  return (
    <div className="p-6">
      <EmptyState
        title="Administrator access required"
        description="This portal is limited to platform administrators. Sign in with an administrator account to continue."
        action={
          <Button asChild>
            <Link href="/sign-in">Back to admin sign in</Link>
          </Button>
        }
      />
    </div>
  );
}
