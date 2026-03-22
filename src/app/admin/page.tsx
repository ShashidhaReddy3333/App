import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Building2, ShoppingCart, TrendingUp, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformMetrics, getPlatformSystemHealth } from "@/lib/services/platform-service";

export const metadata: Metadata = {
  title: "Platform Dashboard | Human Pulse",
  description: "Monitor platform-wide business, user, order, and revenue activity.",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [metrics, systemHealth] = await Promise.all([
    getPlatformMetrics(),
    getPlatformSystemHealth(),
  ]);

  const stats = [
    {
      label: "Total Businesses",
      value: metrics.totalBusinesses,
      sub: `${metrics.activeBusinesses} active`,
      icon: Building2,
    },
    {
      label: "Total Users",
      value: metrics.totalUsers,
      sub: "across all roles",
      icon: Users,
    },
    {
      label: "Total Orders",
      value: metrics.totalOrders,
      sub: "all time",
      icon: ShoppingCart,
    },
    {
      label: "Platform GMV",
      value: `$${metrics.gmv.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: "completed orders",
      icon: TrendingUp,
    },
  ] as const;

  const quickLinks = [
    { href: "/admin/businesses" as Route, label: "Manage Businesses" },
    { href: "/admin/users" as Route, label: "Manage Users" },
    { href: "/admin/disputes" as Route, label: "Open Disputes" },
    { href: "/admin/announcements" as Route, label: "Announcements" },
  ] as const;

  function getHealthBadgeClass(status: "healthy" | "error" | "degraded") {
    if (status === "healthy") {
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
    if (status === "degraded") {
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    }
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="section-label">Platform oversight</div>
        <h1 className="text-4xl font-semibold tracking-[-0.04em]">Platform Dashboard</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          Monitor network growth, system health, and operational risk across the Human Pulse
          platform.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="flex size-10 items-center justify-center rounded-[18px] bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-semibold tracking-[-0.04em]">{stat.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {systemHealth.map((item) => (
                <div key={item.label} className="data-row flex items-center justify-between">
                  <div>
                    <span className="text-sm">{item.label}</span>
                    <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${getHealthBadgeClass(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="data-row flex items-center justify-between text-sm font-medium text-foreground"
                >
                  <span>{link.label}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
