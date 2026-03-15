import Link from "next/link";

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="page-shell flex min-h-screen items-center justify-center">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden rounded-[32px] border border-white/60 bg-white/70 p-10 shadow-panel lg:block">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
              Retail operations in one place
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
              <p className="max-w-md text-base text-muted-foreground">{description}</p>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div>Inventory balances are authoritative and updated transactionally.</div>
              <div>Cashiers can complete split payments without leaving the checkout flow.</div>
              <div>Owners can track low stock, reorder gaps, and session security in one dashboard.</div>
            </div>
            <Link href="/" className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline">
              Back to product overview
            </Link>
          </div>
        </section>
        <div>{children}</div>
      </div>
    </main>
  );
}
