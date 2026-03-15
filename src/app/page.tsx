import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/app/dashboard");
  }

  return (
    <main className="page-shell flex min-h-screen items-center">
      <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            Business Management App
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Inventory, sales, payments, and reorder planning for small shops.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              A production-ready MVP built for retail owners, cashiers, and managers who need clean operations without enterprise overhead.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Create Business</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </section>

        <Card className="gradient-panel">
          <CardHeader>
            <CardTitle>Included in the MVP</CardTitle>
            <CardDescription>
              Auth, onboarding, inventory balances, checkout, split payments, refunds, reorder logic, dashboard metrics, and reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div>Owner, manager, cashier, and inventory staff role permissions.</div>
            <div>Inventory ledger and balance model with optimistic stock protection.</div>
            <div>Receipts, audit logs, and idempotent critical write flows.</div>
            <div>PostgreSQL + Prisma backend with Next.js App Router frontend.</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
