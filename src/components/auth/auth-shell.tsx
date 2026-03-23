export function AuthShell({
  title,
  description,
  eyebrow,
  homeHref = "/",
  homeLabel = "Human Pulse",
  homeTagline = "Connected Commerce",
  highlights = [
    {
      title: "Purpose-built portals",
      description:
        "Customer, retailer, and supplier journeys stay isolated while the backend stays shared.",
    },
    {
      title: "Shared commerce data",
      description:
        "Catalog, orders, fulfillment, and operational status stay aligned across the ecosystem.",
    },
  ],
  children,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  homeHref?: string;
  homeLabel?: string;
  homeTagline?: string;
  highlights?: Array<{ title: string; description: string }>;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background">
      <header className="px-4 py-5 sm:px-6 lg:px-10">
        <a href={homeHref} className="inline-flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-strong)))] text-sm font-bold text-white shadow-panel">
            HP
          </span>
          <div>
            <div className="text-lg font-semibold tracking-[-0.02em] text-foreground">
              {homeLabel}
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {homeTagline}
            </div>
          </div>
        </a>
      </header>

      <div className="page-shell grid flex-1 gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-12">
        <section className="space-y-6">
          <div className="section-label">{eyebrow ?? "Secure access"}</div>
          <div className="space-y-3">
            <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground">{description}</p>
          </div>
          <div className="surface-shell max-w-xl rounded-[28px] p-6">
            <div className="section-label">Why Human Pulse</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {highlights.map((highlight) => (
                <div key={highlight.title} className="data-row">
                  <div className="text-sm font-semibold text-foreground">{highlight.title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{highlight.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="surface-shell w-full max-w-xl justify-self-end rounded-[30px] p-6 sm:p-8">
          <div className="space-y-5">
            <div className="section-label">Continue</div>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
