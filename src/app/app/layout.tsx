import { AppShell } from "@/components/app-shell";
import { requireAppSession } from "@/lib/auth/guards";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAppSession();
  return (
    <AppShell
      role={session.user.role}
      businessName={session.user.business?.businessName ?? "Business"}
      userName={session.user.fullName}
    >
      {children}
    </AppShell>
  );
}
