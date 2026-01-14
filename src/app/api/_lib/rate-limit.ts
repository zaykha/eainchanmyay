type RateLimitConfig = {
  windowMs: number;
  max: number;
  minIntervalMs?: number;
  keyPrefix?: string;
};

type RateLimitResult = {
  limited: boolean;
  remaining: number;
  resetAt: number;
};

type Entry = {
  count: number;
  resetAt: number;
  lastSeen: number;
};

const store = new Map<string, Entry>();

const getClientId = (req: Request) => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
};

export const rateLimit = (req: Request, config: RateLimitConfig): RateLimitResult => {
  const now = Date.now();
  const key = `${config.keyPrefix ?? "rl"}:${getClientId(req)}`;
  const windowMs = Math.max(1000, config.windowMs);
  let entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs, lastSeen: 0 };
  }

  if (config.minIntervalMs && entry.lastSeen) {
    if (now - entry.lastSeen < config.minIntervalMs) {
      return { limited: true, remaining: 0, resetAt: entry.resetAt };
    }
  }

  entry.count += 1;
  entry.lastSeen = now;
  store.set(key, entry);

  const remaining = Math.max(0, config.max - entry.count);
  return {
    limited: entry.count > config.max,
    remaining,
    resetAt: entry.resetAt,
  };
};
