import type { Metadata } from "next";

import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Admin Announcements | Human Pulse",
  description: "Publish and review platform announcements for Human Pulse users."
};

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  const announcements = await db.platformAnnouncement.findMany({
    include: {
      author: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">{announcements.length} announcements</p>
        </div>
      </div>

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              No announcements yet.
            </CardContent>
          </Card>
        ) : (
          announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{a.title}</h3>
                      <Badge variant={a.type === "warning" ? "destructive" : a.type === "info" ? "secondary" : "default"}>
                        {a.type}
                      </Badge>
                      <Badge variant="outline">{a.audience}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{a.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>By: {a.author?.fullName ?? "System"}</span>
                      <span>Created: {new Date(a.createdAt).toLocaleDateString()}</span>
                      {a.expiresAt && <span>Expires: {new Date(a.expiresAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <Badge variant={a.isPublished ? "default" : "outline"}>
                    {a.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
