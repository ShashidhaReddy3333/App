import type { Metadata } from "next";

import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Admin Businesses | Human Pulse",
  description: "Review registered businesses, verification status, and marketplace visibility."
};

export const dynamic = "force-dynamic";

export default async function AdminBusinessesPage() {
  const businesses = await db.business.findMany({
    include: {
      owner: { select: { email: true, fullName: true } },
      businessProfile: { select: { slug: true, isFeatured: true, averageRating: true } },
      businessVerification: { select: { status: true } },
      stripeAccount: { select: { onboardingStatus: true, chargesEnabled: true } },
      _count: { select: { orders: true, users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Businesses</h1>
        <p className="text-muted-foreground text-sm mt-1">{businesses.length} businesses on the platform</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Business</th>
                  <th className="text-left px-4 py-3 font-medium">Owner</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Verification</th>
                  <th className="text-left px-4 py-3 font-medium">Stripe</th>
                  <th className="text-left px-4 py-3 font-medium">Orders</th>
                  <th className="text-left px-4 py-3 font-medium">Marketplace</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz) => (
                  <tr key={biz.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{biz.businessName}</p>
                        <p className="text-xs text-muted-foreground">{biz.currency} · {biz.primaryCountry}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p>{biz.owner.fullName}</p>
                        <p className="text-xs text-muted-foreground">{biz.owner.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{biz.businessType.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      <Badge variant={biz.isActive ? "default" : "secondary"}>
                        {biz.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {biz.businessVerification ? (
                        <Badge variant={
                          biz.businessVerification.status === "approved" ? "default" :
                          biz.businessVerification.status === "rejected" ? "destructive" : "secondary"
                        }>
                          {biz.businessVerification.status}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not submitted</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {biz.stripeAccount ? (
                        <Badge variant={biz.stripeAccount.chargesEnabled ? "default" : "secondary"}>
                          {biz.stripeAccount.chargesEnabled ? "Connected" : biz.stripeAccount.onboardingStatus}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Not connected</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{biz._count.orders}</td>
                    <td className="px-4 py-3">
                      {biz.isMarketplaceVisible ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">Visible</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Hidden</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {businesses.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No businesses registered yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
