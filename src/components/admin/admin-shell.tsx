"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import {
  AlertTriangle,
  Building2,
  LayoutDashboard,
  Megaphone,
  Menu,
  ShieldCheck,
  Users,
  X
} from "lucide-react";

const navItems = [
  { href: "/admin" as Route, label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/businesses" as Route, label: "Businesses", icon: Building2 },
  { href: "/admin/users" as Route, label: "Users", icon: Users },
  { href: "/admin/disputes" as Route, label: "Disputes", icon: AlertTriangle },
  { href: "/admin/announcements" as Route, label: "Announcements", icon: Megaphone }
] as const;

export function AdminShell({
  email,
  children
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="space-y-1 px-5 pb-4 pt-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-white" />
          <span className="text-lg font-bold tracking-tight text-white">Human Pulse</span>
        </div>
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-white/50">
          Platform Admin
        </div>
      </div>
      <div className="mx-5 border-t border-white/10" />
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mx-5 border-t border-white/10" />
      <div className="px-5 py-4 text-xs text-white/60">
        Signed in as
        <div className="mt-1 truncate font-medium text-white">{email}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-white/10 bg-black text-white lg:block lg:min-h-screen">
        {sidebarContent}
      </aside>

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close navigation menu"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] transform border-r border-white/10 bg-black text-white shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="absolute right-3 top-4 z-10">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="flex size-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close navigation menu"
          >
            <X className="size-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      <div className="min-w-0 bg-muted/30">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-black px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-white" />
            <span className="text-sm font-bold tracking-tight text-white">Platform Admin</span>
          </div>
        </div>
        <main className="min-w-0 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
