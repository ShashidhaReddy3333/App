import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentSession } from "@/lib/auth/session";
import {
  LayoutDashboard,
  Building2,
  Users,
  AlertTriangle,
  Megaphone,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/businesses", label: "Businesses", icon: Building2 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session || session.user.role !== "platform_admin") {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-56 bg-background border-r flex flex-col shrink-0">
        <div className="h-14 flex items-center gap-2 px-4 border-b">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Platform Admin</span>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t text-xs text-muted-foreground">
          Signed in as <br />
          <span className="font-medium text-foreground truncate">{session.user.email}</span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
