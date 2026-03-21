import { cookies, headers } from "next/headers";

import { unauthorizedError } from "@/lib/errors";
import { db } from "@/lib/db";
import { createOpaqueToken, hashToken } from "@/lib/auth/token";
import { getSessionCookieDomain, shouldUseSecureSessionCookie } from "@/lib/auth/session-cookie";

const SESSION_COOKIE = "bma_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_SLIDING_WINDOW_MS = 1000 * 60 * 60 * 24;

function getSessionCookieOptions(expires: Date) {
  const domain = getSessionCookieDomain();

  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureSessionCookie(),
    path: "/",
    expires,
    ...(domain ? { domain } : {}),
  };
}

export async function createSession(userId: string) {
  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  const headerStore = await headers();
  const cookieStore = await cookies();
  const userAgent = headerStore.get("user-agent");
  const forwardedFor = headerStore.get("x-forwarded-for");

  const session = await db.session.create({
    data: {
      userId,
      deviceName: userAgent?.slice(0, 120) ?? "Unknown device",
      ipAddressLastSeen: forwardedFor?.split(",")[0]?.trim() ?? null,
      userAgentLastSeen: userAgent ?? null,
      refreshTokenHash: tokenHash,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
      lastSeenAt: new Date()
    }
  });

  cookieStore.set(SESSION_COOKIE, `${session.id}.${token}`, getSessionCookieOptions(session.expiresAt));

  return session;
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  const [sessionId, token] = cookie.split(".");
  if (!sessionId || !token) return null;

  const now = new Date();

  const session = await db.session.findFirst({
    where: {
      id: sessionId,
      refreshTokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { gt: now }
    },
    include: {
      user: {
        include: {
          business: true
        }
      }
    }
  });

  if (!session) return null;

  const lastActivityAt = session.lastSeenAt ?? session.createdAt;
  const shouldExtendSession = now.getTime() - lastActivityAt.getTime() > SESSION_SLIDING_WINDOW_MS;
  const updatedSession = await db.session.update({
    where: { id: session.id },
    data: {
      lastSeenAt: now,
      ...(shouldExtendSession ? { expiresAt: new Date(now.getTime() + SESSION_DURATION_MS) } : {}),
    },
    include: {
      user: {
        include: {
          business: true
        }
      }
    }
  });

  if (shouldExtendSession) {
    try {
      cookieStore.set(SESSION_COOKIE, cookie, getSessionCookieOptions(updatedSession.expiresAt));
    } catch {
      // Read-only render contexts cannot mutate cookies; route handlers still refresh the cookie when allowed.
    }
  }

  return updatedSession;
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) {
    throw unauthorizedError();
  }
  return session;
}

export async function clearSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (cookie) {
    const [sessionId, token] = cookie.split(".");
    if (sessionId && token) {
      await db.session.updateMany({
        where: {
          id: sessionId,
          refreshTokenHash: hashToken(token),
          revokedAt: null
        },
        data: {
          revokedAt: new Date()
        }
      });
    }
  }

  cookieStore.set(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(new Date(0)),
    maxAge: 0
  });
}
