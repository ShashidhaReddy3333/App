import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { conflictError, notFoundError } from "@/lib/errors";

export async function listStaff(businessId: string) {
  return db.user.findMany({
    where: {
      businessId
    },
    orderBy: { createdAt: "asc" }
  });
}

export async function listBusinessSessions(businessId: string) {
  return db.session.findMany({
    where: {
      revokedAt: null,
      user: {
        businessId
      }
    },
    include: {
      user: true
    },
    orderBy: {
      lastSeenAt: "desc"
    }
  });
}

export async function listPendingInvites(businessId: string) {
  return db.staffInviteToken.findMany({
    where: {
      businessId,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function revokeSessionRecord(actorUserId: string, businessId: string, sessionId: string) {
  return db.$transaction(async (tx) => {
    const session = await tx.session.findFirst({
      where: {
        id: sessionId,
        user: {
          businessId
        }
      }
    });

    if (!session) {
      throw notFoundError("Session not found for this business.");
    }

    if (session.revokedAt) {
      throw conflictError("This session has already been revoked.");
    }

    const revokedSession = await tx.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() }
    });

    await logAudit({
      tx,
      businessId,
      actorUserId,
      action: "session_revoked",
      resourceType: "session",
      resourceId: revokedSession.id,
      metadata: {}
    });

    return revokedSession;
  });
}
