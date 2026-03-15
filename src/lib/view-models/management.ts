export function toSessionCards(
  sessions: Array<{
    id: string;
    deviceName: string;
    lastSeenAt: Date | null;
    user: { fullName: string };
  }>
) {
  return sessions.map((session) => ({
    id: session.id,
    title: session.user.fullName,
    subtitle: session.deviceName,
    lastSeenLabel: session.lastSeenAt ? new Date(session.lastSeenAt).toLocaleString() : "Never"
  }));
}
