import { Home } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs
}: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}) {
  return (
    <div className="space-y-3">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href={"/app/dashboard" as Route} className="flex items-center gap-1 transition-colors hover:text-foreground">
            <Home className="size-3.5" />
          </Link>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="mx-1">/</span>
              {crumb.href ? (
                <Link href={crumb.href as Route} className="transition-colors hover:text-foreground">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="max-w-2xl text-muted-foreground">{description}</p>
        </div>
        {actions}
      </div>
    </div>
  );
}
