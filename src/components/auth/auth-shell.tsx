import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-primary/5 via-white/80 to-accent/20 p-10 shadow-panel backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Zap className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold tracking-tight">Human Pulse</span>
            </Link>

            <div className="space-y-3 pt-2">
              <div className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                Commerce Operating System
              </div>
              <h1 className="text-3xl font-semibold tracking-tight xl:text-4xl">{title}</h1>
              <p className="max-w-md text-base text-muted-foreground">{description}</p>
            </div>

            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-xl bg-white/50 px-4 py-3">
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                Inventory balances are authoritative and updated transactionally.
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-white/50 px-4 py-3">
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                Cashiers can complete split payments without leaving the checkout flow.
              </div>
              <div className="flex items-start gap-3 rounded-xl bg-white/50 px-4 py-3">
                <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                Owners can track low stock, reorder gaps, and session security in one dashboard.
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to homepage
          </Link>
        </section>

        <div className="flex flex-col justify-center">
          <div className="mb-6 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Human Pulse</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
