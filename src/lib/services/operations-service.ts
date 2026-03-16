import { NotificationStatus } from "@prisma/client";

import { logAudit } from "@/lib/audit";
import { createOpaqueToken, hashToken } from "@/lib/auth/token";
import { sendStaffInviteEmail } from "@/lib/auth/mailer";
import { db } from "@/lib/db";
import { env, getRuntimeCheckIssues } from "@/lib/env";
import { conflictError, notFoundError } from "@/lib/errors";

const PASSWORD_RESET_RETENTION_DAYS = 7;
const STAFF_INVITE_RETENTION_DAYS = 30;
const SESSION_RETENTION_DAYS = 30;
const AUTH_THROTTLE_RETENTION_DAYS = 30;
const SENT_NOTIFICATION_RETENTION_DAYS = 90;
const FAILED_NOTIFICATION_RETENTION_DAYS = 30;

function subtractDays(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function getOperationsSnapshot(businessId: string) {
  const now = new Date();
  const runtimeIssues = getRuntimeCheckIssues();

  const [
    activeSessions,
    pendingInvites,
    expiredInvites,
    queuedNotifications,
    failedNotifications,
    expiredResetTokens,
    staleReservations,
    recentFailedNotifications,
    recentAudit
  ] = await Promise.all([
    db.session.count({
      where: {
        revokedAt: null,
        user: { businessId }
      }
    }),
    db.staffInviteToken.count({
      where: {
        businessId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: now }
      }
    }),
    db.staffInviteToken.count({
      where: {
        businessId,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { lte: now }
      }
    }),
    db.notification.count({
      where: {
        status: NotificationStatus.queued,
        user: { businessId }
      }
    }),
    db.notification.count({
      where: {
        status: NotificationStatus.failed,
        user: { businessId }
      }
    }),
    db.passwordResetToken.count({
      where: {
        expiresAt: { lte: now },
        usedAt: null,
        user: { businessId }
      }
    }),
    db.sale.count({
      where: {
        businessId,
        status: "pending_payment",
        reservationExpiresAt: { lte: now }
      }
    }),
    db.notification.findMany({
      where: {
        status: NotificationStatus.failed,
        user: { businessId }
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    db.auditLog.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  return {
    summary: {
      activeSessions,
      pendingInvites,
      expiredInvites,
      queuedNotifications,
      failedNotifications,
      expiredResetTokens,
      staleReservations,
      runtimeErrors: runtimeIssues.filter((issue) => issue.severity === "error").length,
      runtimeWarnings: runtimeIssues.filter((issue) => issue.severity === "warning").length
    },
    runtimeIssues,
    recentFailedNotifications,
    recentAudit
  };
}

export async function cleanupOperationalData() {
  const passwordResetCutoff = subtractDays(PASSWORD_RESET_RETENTION_DAYS);
  const inviteCutoff = subtractDays(STAFF_INVITE_RETENTION_DAYS);
  const sessionCutoff = subtractDays(SESSION_RETENTION_DAYS);
  const authThrottleCutoff = subtractDays(AUTH_THROTTLE_RETENTION_DAYS);
  const sentNotificationCutoff = subtractDays(SENT_NOTIFICATION_RETENTION_DAYS);
  const failedNotificationCutoff = subtractDays(FAILED_NOTIFICATION_RETENTION_DAYS);

  const [passwordResetTokensDeleted, staffInvitesDeleted, sessionsDeleted, authThrottleRowsDeleted, sentNotificationsDeleted, failedNotificationsDeleted] =
    await db.$transaction([
      db.passwordResetToken.deleteMany({
        where: {
          OR: [{ usedAt: { not: null } }, { expiresAt: { lt: passwordResetCutoff } }]
        }
      }),
      db.staffInviteToken.deleteMany({
        where: {
          OR: [
            { acceptedAt: { lt: inviteCutoff } },
            { revokedAt: { lt: inviteCutoff } },
            { expiresAt: { lt: inviteCutoff } }
          ]
        }
      }),
      db.session.deleteMany({
        where: {
          OR: [{ revokedAt: { lt: sessionCutoff } }, { expiresAt: { lt: sessionCutoff } }]
        }
      }),
      db.authThrottle.deleteMany({
        where: {
          updatedAt: { lt: authThrottleCutoff }
        }
      }),
      db.notification.deleteMany({
        where: {
          status: NotificationStatus.sent,
          sentAt: { lt: sentNotificationCutoff }
        }
      }),
      db.notification.deleteMany({
        where: {
          status: NotificationStatus.failed,
          createdAt: { lt: failedNotificationCutoff }
        }
      })
    ]);

  return {
    passwordResetTokensDeleted: passwordResetTokensDeleted.count,
    staffInvitesDeleted: staffInvitesDeleted.count,
    sessionsDeleted: sessionsDeleted.count,
    authThrottleRowsDeleted: authThrottleRowsDeleted.count,
    sentNotificationsDeleted: sentNotificationsDeleted.count,
    failedNotificationsDeleted: failedNotificationsDeleted.count
  };
}

export async function resendPendingInvite(actorUserId: string, businessId: string, inviteId: string, ipAddress: string | null) {
  const existingInvite = await db.staffInviteToken.findFirst({
    where: {
      id: inviteId,
      businessId
    }
  });

  if (!existingInvite) {
    throw notFoundError("Pending invite not found.");
  }

  if (existingInvite.acceptedAt) {
    throw conflictError("This invite has already been accepted.");
  }

  if (existingInvite.revokedAt) {
    throw conflictError("This invite has already been revoked.");
  }

  const token = createOpaqueToken();

  const invite = await db.$transaction(async (tx) => {
    await tx.staffInviteToken.update({
      where: { id: existingInvite.id },
      data: { revokedAt: new Date() }
    });

    return tx.staffInviteToken.create({
      data: {
        businessId,
        email: existingInvite.email,
        role: existingInvite.role,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        invitedByUserId: actorUserId
      }
    });
  });

  if (env.DEMO_MODE !== "true") {
    try {
      await sendStaffInviteEmail(existingInvite.email, token);
    } catch (error) {
      await db.staffInviteToken.update({
        where: { id: invite.id },
        data: { revokedAt: new Date() }
      });
      throw error;
    }
  }

  await logAudit({
    businessId,
    actorUserId,
    action: "invite_resent",
    resourceType: "staff_invite",
    resourceId: invite.id,
    metadata: {
      previousInviteId: existingInvite.id,
      email: existingInvite.email,
      role: existingInvite.role
    },
    ipAddress
  });

  return {
    invite,
    token: env.DEMO_MODE === "true" ? token : null
  };
}

export async function retryFailedNotification(actorUserId: string, businessId: string, notificationId: string) {
  return db.$transaction(async (tx) => {
    const notification = await tx.notification.findFirst({
      where: {
        id: notificationId,
        user: { businessId }
      },
      include: {
        user: {
          select: {
            businessId: true
          }
        }
      }
    });

    if (!notification) {
      throw notFoundError("Notification not found.");
    }

    if (notification.status !== NotificationStatus.failed) {
      throw conflictError("Only failed notifications can be retried.");
    }

    const retried = await tx.notification.update({
      where: { id: notification.id },
      data: {
        status: NotificationStatus.queued,
        sentAt: null
      }
    });

    await logAudit({
      tx,
      businessId,
      actorUserId,
      action: "notification_requeued",
      resourceType: "notification",
      resourceId: notification.id,
      metadata: {
        type: notification.type,
        channel: notification.channel
      }
    });

    return retried;
  });
}
