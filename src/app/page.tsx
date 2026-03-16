import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";

import { getPostSignInPath } from "@/lib/auth/guards";
import { getCurrentSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const session = await getCurrentSession();

  if (session) {
    redirect(getPostSignInPath(session.user.role));
  }

  return (
    <main className="page-shell flex min-h-screen items-center">
      <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
            Commerce Operating System
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Customer ordering, POS, inventory, supplier procurement, and owner analytics in one platform.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              A unified Phase 1 release for retailers, cashiers, managers, suppliers, owners, and customers running on the same operational data.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/sign-up">Create Business</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={"/shop" as Route}>Browse Store</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={"/supplier/sign-up" as Route}>Become a Supplier</Link>
            </Button>
          </div>
        </section>

        <Card className="gradient-panel">
          <CardHeader>
            <CardTitle>Included in Phase 1</CardTitle>
            <CardDescription>
              Customer ordering, supplier portal, POS checkout, procurement, inventory balances, refunds, reorder logic, and owner dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <div>Customer, cashier, manager, supplier, owner, and legacy inventory staff role permissions.</div>
            <div>Shared inventory ledger across online ordering and in-store checkout.</div>
            <div>Wholesale supplier catalog, purchase orders, and goods receiving.</div>
            <div>PostgreSQL + Prisma backend with Next.js App Router frontend.</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
