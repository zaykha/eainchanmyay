import { describe, expect, it } from "vitest";

import {
  evaluateVendorBillingAccess,
  getBearerTokenFromHeaders,
  getRequestedVendorIdFromRequest,
  resolveRequestedVendorMembership,
  unwrapVendorMembershipVendor,
} from "@/lib/vendor-context-rules";

function createHeaders(entries: Record<string, string>) {
  const headers = new Headers();
  for (const [key, value] of Object.entries(entries)) {
    headers.set(key, value);
  }
  return headers;
}

describe("vendor context rules", () => {
  it("extracts bearer tokens from request headers", () => {
    expect(getBearerTokenFromHeaders(createHeaders({ authorization: "Bearer token-123" }))).toBe("token-123");
    expect(getBearerTokenFromHeaders(createHeaders({ Authorization: "Bearer token-456" }))).toBe("token-456");
    expect(getBearerTokenFromHeaders(createHeaders({ authorization: "Basic abc" }))).toBeNull();
    expect(getBearerTokenFromHeaders(createHeaders({ authorization: "Bearer   " }))).toBeNull();
  });

  it("prefers vendor header selection over query string", () => {
    expect(
      getRequestedVendorIdFromRequest({
        headers: createHeaders({ "x-vendor-id": "vendor-header" }),
        url: "https://example.com/api/test?vendorId=vendor-query",
      })
    ).toBe("vendor-header");

    expect(
      getRequestedVendorIdFromRequest({
        headers: createHeaders({}),
        url: "https://example.com/api/test?vendorId=vendor-query",
      })
    ).toBe("vendor-query");
  });

  it("unwraps joined vendor objects and arrays consistently", () => {
    expect(unwrapVendorMembershipVendor({ id: "vendor-1" })?.id).toBe("vendor-1");
    expect(unwrapVendorMembershipVendor([{ id: "vendor-2" }])?.id).toBe("vendor-2");
    expect(unwrapVendorMembershipVendor(null)).toBeNull();
  });

  it("enforces explicit workspace selection and resolves requested memberships", () => {
    const memberships = [
      { role: "owner", vendor: { id: "vendor-1", name: "One", vendor_type: "agency" } },
      { role: "admin", vendor: { id: "vendor-2", name: "Two", vendor_type: "agency" } },
    ];

    expect(
      resolveRequestedVendorMembership({
        memberships,
        requestedVendorId: null,
        requireExplicitVendorSelection: true,
      })
    ).toEqual({
      ok: false,
      status: 400,
      error: "Select an active vendor workspace before accessing this endpoint.",
    });

    expect(
      resolveRequestedVendorMembership({
        memberships,
        requestedVendorId: "vendor-2",
      })
    ).toEqual({
      ok: true,
      membership: memberships[1],
      vendor: memberships[1].vendor,
    });

    expect(
      resolveRequestedVendorMembership({
        memberships,
        requestedVendorId: "missing-vendor",
      })
    ).toEqual({
      ok: false,
      status: 403,
      error: "Vendor membership not found.",
    });
  });

  it("applies paid workspace billing gating", () => {
    expect(
      evaluateVendorBillingAccess({
        plan: "free",
        billingStatus: "inactive",
      })
    ).toEqual({ ok: true });

    expect(
      evaluateVendorBillingAccess({
        plan: "pro",
        billingStatus: "active",
      })
    ).toEqual({ ok: true });

    expect(
      evaluateVendorBillingAccess({
        plan: "growth",
        billingStatus: "pending",
      })
    ).toEqual({
      ok: false,
      status: 402,
      error: "Billing activation required before accessing the paid vendor workspace.",
    });

    expect(
      evaluateVendorBillingAccess({
        plan: "growth",
        billingStatus: "pending",
        allowPendingBilling: true,
      })
    ).toEqual({ ok: true });
  });
});
