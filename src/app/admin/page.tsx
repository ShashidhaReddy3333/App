import type { Metadata } from "next";

import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ShoppingCart, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Platform Dashboard | Human Pulse",
  description: "Monitor platform-wide business, user, order, and revenue activity."
};

export const dynamic = "force-dynamic";

async function getDashboardMetrics() {
  const [totalBusinesses, activeBusinesses, totalUsers, totalOrders] = await Promise.all([
    db.business.count(),
    db.business.count({ where: { isActive: true } }),
    db.user.count(),
    db.order.count(),
  ]);

  const revenueResult = await db.order.aggregate({
    where: { status: "completed" },
    _sum: { totalAmount: true },
  });

  return {
    totalBusinesses,
    activeBusinesses,
    totalUsers,
    totalOrders,
    gmv: Number(revenueResult._sum.totalAmount ?? 0),
  };
}

export default async function AdminDashboard() {
  const metrics = await getDashboardMetrics();

  const stats = [
    {
      label: "Total Businesses",
      value: metrics.totalBusinesses,
      sub: `${metrics.activeBusinesses} active`,
      icon: Building2,
      color: "text-blue-500",
    },
    {
      label: "Total Users",
      value: metrics.totalUsers,
      sub: "across all roles",
      icon: Users,
      color: "text-green-500",
    },
    {
      label: "Total Orders",
      value: metrics.totalOrders,
      sub: "all time",
      icon: ShoppingCart,
      color: "text-purple-500",
    },
    {
      label: "Platform GMV",
      value: `$${metrics.gmv.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: "completed orders",
      icon: TrendingUp,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Platform Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">System overview and key metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>System Health</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: "Database", status: "healthy" },
                { label: "API Server", status: "healthy" },
                { label: "Job Queue", status: "healthy" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm">{item.label}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    item.status === "healthy"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { href: "/admin/businesses", label: "Manage Businesses" },
                { href: "/admin/users", label: "Manage Users" },
                { href: "/admin/disputes", label: "Open Disputes" },
                { href: "/admin/announcements", label: "Announcements" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-primary hover:underline"
                >
                  → {link.label}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
