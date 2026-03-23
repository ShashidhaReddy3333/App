import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { withNoIndex } from "@/lib/public-metadata";

export const metadata: Metadata = withNoIndex({
  title: "Supplier Access Required | Human Pulse",
});

export default function SupplierForbiddenPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-black px-6 py-4">
        <span className="text-lg font-bold tracking-tight text-white">Human Pulse</span>
      </div>
      <div className="page-shell py-8">
        <EmptyState
          title="Supplier access required"
          description="This portal is reserved for supplier accounts. Sign in with a supplier-linked account to continue."
          action={
            <Button asChild>
              <Link href="/sign-in">Back to supplier sign in</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
