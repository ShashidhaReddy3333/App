"use client";

import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-secondary text-foreground">
          <WifiOff className="size-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">You're offline</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Check your internet connection and try loading the page again.
        </p>
        <Button type="button" className="mt-6" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </main>
  );
}
