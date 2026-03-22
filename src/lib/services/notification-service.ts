import type { Prisma } from "@prisma/client";
import { NotificationChannel, NotificationStatus } from "@prisma/client";

import { sendTransactionalEmail } from "@/lib/auth/mailer";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { logError, logEvent } from "@/lib/observability";

type NotificationClient = Prisma.TransactionClient | typeof db;

export async function enqueueNotification(
  client: NotificationClient,
  input: {
    userId: string;
    type: string;
    title: string;
    message: string;
    channel?: NotificationChannel;
  }
) {
  return client.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      channel: input.channel ?? NotificationChannel.in_app,
      status: NotificationStatus.queued
    }
  });
}

export async function enqueueRoleNotifications(
  client: NotificationClient,
  input: {
    businessId: string;
    roles: string[];
    type: string;
    title: string;
    message: string;
    channel?: NotificationChannel;
  }
) {
  const users = await client.user.findMany({
    where: {
      businessId: input.businessId,
      role: { in: input.roles as never[] },
      status: "active"
    },
    select: { id: true },
    take: 100
  });

  if (users.length === 0) {
    return [];
  }

  return Promise.all(
    users.map((user) =>
      enqueueNotification(client, {
        userId: user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        channel: input.channel
      })
    )
  );
}

export async function dispatchQueuedNotifications(limit = 50) {
  const notifications = await db.notification.findMany({
    where: { status: NotificationStatus.queued },
    include: {
      user: {
        include: {
          notificationPreference: true
        }
      }
    },
    orderBy: { createdAt: "asc" },
    take: limit
  });

  let sentCount = 0;
  let failedCount = 0;
  for (const notification of notifications) {
    try {
      if (notification.channel === NotificationChannel.in_app) {
        await db.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.sent,
            sentAt: new Date()
          }
        });
        sentCount += 1;
        continue;
      }

      if (notification.channel === NotificationChannel.email) {
        if (notification.user.notificationPreference && !notification.user.notificationPreference.emailEnabled) {
          await db.notification.update({
            where: { id: notification.id },
            data: {
              status: NotificationStatus.failed
            }
          });
          failedCount += 1;
          continue;
        }

        if (env.DEMO_MODE !== "true") {
          await sendTransactionalEmail({
            to: notification.user.email,
            subject: notification.title,
            html: `<p>${notification.message}</p>`,
            text: notification.message
          });
        }

        await db.notification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.sent,
            sentAt: new Date()
          }
        });
        sentCount += 1;
      }
    } catch (error) {
      await db.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.failed
        }
      });
      failedCount += 1;
      logError("notification_dispatch_failed", error, {
        notificationId: notification.id,
        channel: notification.channel,
        userId: notification.userId
      });
    }
  }

  logEvent("info", "notification_dispatch_completed", {
    processedCount: notifications.length,
    sentCount,
    failedCount
  });

  return {
    processedCount: notifications.length,
    sentCount,
    failedCount
  };
}
