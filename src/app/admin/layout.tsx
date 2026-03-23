import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { AdminShell } from "@/components/admin/admin-shell";
import { withNoIndex } from "@/lib/public-metadata";

export const metadata: Metadata = withNoIndex({
  title: "Admin Portal | Human Pulse",
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/sign-in");
  }
  if (session.user.role !== "platform_admin") {
    redirect("/admin/forbidden");
  }

  return <AdminShell email={session.user.email}>{children}</AdminShell>;
}
