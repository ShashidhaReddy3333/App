import { cookies, headers } from "next/headers";

import { unauthorizedError } from "@/lib/errors";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { createOpaqueToken, hashToken } from "@/lib/auth/token";

const SESSION_COOKIE = "bma_session";

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
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      lastSeenAt: new Date()
    }
  });

  cookieStore.set(SESSION_COOKIE, `${session.id}.${token}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.APP_URL.startsWith("https://"),
    path: "/",
    expires: session.expiresAt
  });

  return session;
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  const [sessionId, token] = cookie.split(".");
  if (!sessionId || !token) return null;

  const session = await db.session.findFirst({
    where: {
      id: sessionId,
      refreshTokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { gt: new Date() }
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
  return session;
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

  cookieStore.delete(SESSION_COOKIE);
}
