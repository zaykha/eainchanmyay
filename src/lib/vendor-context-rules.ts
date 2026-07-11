export type VendorContextVendorRecord = {
  id?: string | null;
  name?: string | null;
  vendor_type?: string | null;
  plan?: string | null;
  billing_status?: string | null;
};

export type VendorContextMembershipEntry = {
  role?: string | null;
  status?: string | null;
  vendor?: VendorContextVendorRecord | VendorContextVendorRecord[] | null;
};

export function getBearerTokenFromHeaders(headers: Headers) {
  const authHeader = headers.get("authorization") ?? headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

export function getRequestedVendorIdFromRequest(input: { headers: Headers; url: string }) {
  const headerValue = input.headers.get("x-vendor-id")?.trim();
  if (headerValue) return headerValue;
  const { searchParams } = new URL(input.url);
  const queryValue = searchParams.get("vendorId")?.trim();
  return queryValue || null;
}

export function unwrapVendorMembershipVendor(vendor: VendorContextMembershipEntry["vendor"]) {
  return Array.isArray(vendor) ? vendor[0] : vendor;
}

export function resolveRequestedVendorMembership(input: {
  memberships: VendorContextMembershipEntry[];
  requestedVendorId: string | null;
  requireExplicitVendorSelection?: boolean;
}) {
  if (input.requireExplicitVendorSelection && input.memberships.length > 1 && !input.requestedVendorId) {
    return {
      ok: false as const,
      status: 400,
      error: "Select an active vendor workspace before accessing this endpoint.",
    };
  }

  const membership = input.requestedVendorId
    ? input.memberships.find((row) => unwrapVendorMembershipVendor(row.vendor)?.id === input.requestedVendorId)
    : input.memberships[0];

  if (!membership) {
    return {
      ok: false as const,
      status: 403,
      error: "Vendor membership not found.",
    };
  }

  return {
    ok: true as const,
    membership,
    vendor: unwrapVendorMembershipVendor(membership.vendor) ?? null,
  };
}

export function evaluateVendorBillingAccess(input: {
  plan: string | null | undefined;
  billingStatus: string | null | undefined;
  allowPendingBilling?: boolean;
}) {
  const plan = String(input.plan ?? "").trim().toLowerCase();
  const billingStatus = String(input.billingStatus ?? "").trim().toLowerCase();
  const requiresActiveBilling = Boolean(plan && plan !== "free");

  if (requiresActiveBilling && billingStatus !== "active" && !input.allowPendingBilling) {
    return {
      ok: false as const,
      status: 402,
      error: "Billing activation required before accessing the paid vendor workspace.",
    };
  }

  return { ok: true as const };
}
