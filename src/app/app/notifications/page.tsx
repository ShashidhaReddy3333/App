import { Bell, Mail, MessageSquare, Smartphone, Monitor } from "lucide-react";
import { isToday, isYesterday, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state-card";
import { PageHeader } from "@/components/page-header";
import { requireAppSession } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import type { NotificationChannel, NotificationStatus } from "@prisma/client";

const channelIcons: Record<NotificationChannel, typeof Mail> = {
  email: Mail,
  sms: MessageSquare,
  push: Smartphone,
  in_app: Monitor,
};

const channelLabels: Record<NotificationChannel, string> = {
  email: "Email",
  sms: "SMS",
  push: "Push",
  in_app: "In-App",
};

const statusVariants: Record<NotificationStatus, "default" | "secondary" | "destructive" | "outline"> = {
  queued: "secondary",
  sent: "outline",
  failed: "destructive",
  read: "default",
};

function groupLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return "Earlier";
}

type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
};

export default async function NotificationsPage() {
  const session = await requireAppSession();

  const notifications: NotificationRow[] = await db.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const grouped = notifications.reduce<Record<string, NotificationRow[]>>((acc, n) => {
    const label = groupLabel(n.createdAt);
    if (!acc[label]) acc[label] = [];
    acc[label]!.push(n);
    return acc;
  }, {});

  const groupOrder = ["Today", "Yesterday", "Earlier"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="View your recent notifications and alerts."
        breadcrumbs={[{ label: "Notifications" }]}
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon="inbox"
          title="No notifications"
          description="You have no notifications yet. Notifications will appear here when there are updates relevant to you."
        />
      ) : (
        <div className="space-y-6">
          {groupOrder.map((group) => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group} className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70 px-1">
                  {group}
                </h2>
                <div className="space-y-2">
                  {items.map((notification) => {
                    const ChannelIcon = channelIcons[notification.channel];
                    const isUnread = notification.status !== "read";
                    return (
                      <Card
                        key={notification.id}
                        className={`gradient-panel transition-colors ${
                          isUnread
                            ? "border-primary/20 bg-primary/[0.02]"
                            : ""
                        }`}
                      >
                        <CardHeader className="flex flex-row items-start gap-3 pb-2">
                          <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${
                            isUnread ? "bg-primary/10" : "bg-muted"
                          }`}>
                            <ChannelIcon className={`size-4 ${isUnread ? "text-primary" : "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="text-sm font-medium leading-tight">
                                {notification.title}
                                {isUnread && (
                                  <span className="ml-2 inline-block size-2 rounded-full bg-primary" />
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge variant={statusVariants[notification.status]}>
                                  {notification.status}
                                </Badge>
                                <Badge variant="outline">
                                  {channelLabels[notification.channel]}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                              {format(notification.createdAt, "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
