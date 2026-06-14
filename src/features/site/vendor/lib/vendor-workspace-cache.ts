type WorkspaceCacheValue<T> = {
  cachedAt: number;
  data: T;
};

const WORKSPACE_CACHE_PREFIX = "ecm_vendor_workspace_v1";
const WORKSPACE_CACHE_TTL_MS = 5 * 60 * 1000;

function getWorkspaceCacheKey(userId: string, variant: string, vendorId?: string | null) {
  const safeVendorId = vendorId ? String(vendorId) : "none";
  return `${WORKSPACE_CACHE_PREFIX}:${variant}:${userId}:${safeVendorId}`;
}

export function readWorkspaceCache<T>(userId: string, variant: string, vendorId?: string | null): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getWorkspaceCacheKey(userId, variant));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceCacheValue<T>;
    if (typeof parsed?.cachedAt !== "number") return null;
    if (Date.now() - parsed.cachedAt > WORKSPACE_CACHE_TTL_MS) return null;
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

export function writeWorkspaceCache<T>(userId: string, variant: string, data: T, vendorId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getWorkspaceCacheKey(userId, variant),
      JSON.stringify({ cachedAt: Date.now(), data } satisfies WorkspaceCacheValue<T>)
    );
  } catch {
    // Ignore localStorage failures.
  }
}
