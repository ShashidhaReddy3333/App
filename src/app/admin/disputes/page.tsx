import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  const disputes = await db.platformDispute.findMany({
    include: {
      business: { select: { businessName: true } },
      customer: { select: { fullName: true, email: true } },
      assignedAdmin: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statusColor: Record<string, string> = {
    open: "destructive",
    in_review: "secondary",
    resolved: "default",
    closed: "outline",
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Disputes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {disputes.filter((d) => d.status === "open").length} open ·{" "}
          {disputes.length} total
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Business</th>
                  <th className="text-left px-4 py-3 font-medium">Customer</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Assigned To</th>
                  <th className="text-left px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr key={d.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{d.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{d.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{d.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.business?.businessName ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.customer ? `${d.customer.fullName}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={(statusColor[d.status] ?? "secondary") as "destructive" | "secondary" | "default" | "outline"}>
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.assignedAdmin?.fullName ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {disputes.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">No disputes found.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
