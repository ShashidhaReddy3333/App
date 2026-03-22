import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="bg-black px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-white">Human Pulse</span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl rounded-3xl border border-border bg-background p-10 text-center shadow-sm">
          <div className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            404
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            The page you requested does not exist or may have been moved.
          </p>
          <div className="mt-8">
            <Button asChild>
              <Link href="/">Go to homepage</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
