const CLEANUP_INTERVAL_MS = 60_000;
const MAX_WINDOW_MS = 5 * 60_000;

type WindowEntry = {
  timestamps: number[];
};

const store = new Map<string, WindowEntry>();
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function cleanupExpiredEntries(): void {
  const cutoff = Date.now() - MAX_WINDOW_MS;
  for (const [key, entry] of store.entries()) {
    const filtered = entry.timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      store.delete(key);
    } else {
      entry.timestamps = filtered;
    }
  }
}

function ensureCleanupStarted(): void {
  if (cleanupTimer !== null) return;
  cleanupTimer = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);
  // Don't prevent Node.js from exiting (important for tests)
  if (typeof cleanupTimer === "object" && cleanupTimer !== null && "unref" in cleanupTimer) {
    (cleanupTimer as NodeJS.Timeout).unref();
  }
}

export function rateLimit(
  identifier: string,
  options: { limit: number; windowMs: number }
): { success: boolean; remaining: number; resetAt: Date } {
  const { limit, windowMs } = options;
  const now = Date.now();
  const windowStart = now - windowMs;

  ensureCleanupStarted();

  let entry = store.get(identifier);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(identifier, entry);
  }

  // Prune timestamps outside the sliding window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  const count = entry.timestamps.length;
  const success = count < limit;
  if (success) {
    entry.timestamps.push(now);
  }

  const remaining = Math.max(0, limit - entry.timestamps.length);
  // resetAt: when the oldest in-window timestamp expires
  const oldest = entry.timestamps[0];
  const resetAt = new Date(oldest !== undefined ? oldest + windowMs : now + windowMs);

  return { success, remaining, resetAt };
}

/** Only for use in tests — resets all state. */
export function _resetStoreForTesting(): void {
  store.clear();
  if (cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}
