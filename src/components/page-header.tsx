import { Home } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="space-y-4">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="flex items-center gap-1 text-[0.72rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
          <Link
            href={"/app/dashboard" as Route}
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Home className="size-3.5" />
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="mx-1 opacity-50">/</span>
              {crumb.href ? (
                <Link
                  href={crumb.href as Route}
                  className="transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="section-label">Operational View</div>
          <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        {actions}
      </div>
    </div>
  );
}
