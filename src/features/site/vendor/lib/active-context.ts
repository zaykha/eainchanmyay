export type ActiveContext = "personal" | "vendor";

const ACTIVE_CONTEXT_KEY = "ecm_active_context_v1";
const ACTIVE_VENDOR_WORKSPACE_PREFIX = "ecm_active_vendor_workspace_v1";

export function readActiveContext(): ActiveContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_CONTEXT_KEY);
    return raw === "personal" || raw === "vendor" ? raw : null;
  } catch {
    return null;
  }
}

export function writeActiveContext(context: ActiveContext) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_CONTEXT_KEY, context);
  } catch {
    // Ignore storage failures.
  }
}

export function deriveActiveContextFromPath(pathname: string | null | undefined): ActiveContext | null {
  if (pathname === "/hub") return "vendor";
  if (pathname === "/account") return "personal";
  return null;
}

function getActiveVendorWorkspaceKey(userId: string) {
  return `${ACTIVE_VENDOR_WORKSPACE_PREFIX}:${userId}`;
}

export function readActiveVendorWorkspace(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(getActiveVendorWorkspaceKey(userId)) || null;
  } catch {
    return null;
  }
}

export function writeActiveVendorWorkspace(userId: string, vendorId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getActiveVendorWorkspaceKey(userId), vendorId);
  } catch {
    // Ignore storage failures.
  }
}

export function clearActiveVendorWorkspace(userId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(getActiveVendorWorkspaceKey(userId));
  } catch {
    // Ignore storage failures.
  }
}

export function withActiveVendorHeaders(headers: HeadersInit | undefined, vendorId: string | null | undefined): HeadersInit {
  if (!vendorId) return headers ?? {};
  return {
    ...(headers ?? {}),
    "x-vendor-id": vendorId,
  };
}
