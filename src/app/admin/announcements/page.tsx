import type { Metadata } from "next";

import { AdminAnnouncementsPanel } from "@/components/admin/admin-announcements-panel";
import { Pagination } from "@/components/pagination";
import { listPlatformAnnouncements } from "@/lib/services/platform-service";

export const metadata: Metadata = {
  title: "Admin Announcements | Human Pulse",
  description: "Publish and review platform announcements for Human Pulse users.",
};

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const { announcements, total, totalPages } = await listPlatformAnnouncements({
    page,
    limit: 10,
  });

  const rows = announcements.map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    type: announcement.type,
    audience: announcement.audience,
    isPublished: announcement.isPublished,
    authorName: announcement.author?.fullName ?? null,
    createdAtLabel: new Date(announcement.createdAt).toLocaleDateString(),
    expiresAtLabel: announcement.expiresAt
      ? new Date(announcement.expiresAt).toLocaleDateString()
      : null,
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} announcements</p>
      </div>

      <AdminAnnouncementsPanel announcements={rows} />

      <div className="mt-4">
        <Pagination
          basePath="/admin/announcements"
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
        />
      </div>
    </div>
  );
}
