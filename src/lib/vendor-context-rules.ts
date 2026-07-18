export type VendorContextVendorRecord = {
  id?: string | null;
  name?: string | null;
  is_suspended?: boolean | null;
  vendor_type?: string | null;
  plan?: string | null;
  billing_status?: string | null;
  billing_provider?: string | null;
  slug?: string | null;
  tagline?: string | null;
  description?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  logo_url?: string | null;
  facebook_url?: string | null;
  telegram_url?: string | null;
  viber_phone?: string | null;
  tiktok_url?: string | null;
  website_url?: string | null;
  cover_image_url?: string | null;
  strengths?: unknown;
  public_storefront_enabled?: boolean | null;
  verified_status?: string | null;
  verified_at?: string | null;
  verification_expires_at?: string | null;
  verification_level?: string | null;
  verification_score?: number | null;
  verification_rejection_reason_code?: string | null;
  verification_last_reviewed_by?: string | null;
  verification_last_reviewed_at?: string | null;
  verification_rank_bonus?: number | null;
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
