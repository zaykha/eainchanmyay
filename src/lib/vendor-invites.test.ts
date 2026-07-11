import { describe, expect, it } from "vitest";

import {
  evaluateVendorInviteAcceptance,
  isVendorInviteExpired,
  normalizeEmailAddress,
  resolveAcceptedInviteRole,
} from "@/lib/vendor-invites";

describe("vendor invite rules", () => {
  it("normalizes email and accepted role values", () => {
    expect(normalizeEmailAddress(" Test@Example.com ")).toBe("test@example.com");
    expect(resolveAcceptedInviteRole("staff")).toBe("agent");
    expect(resolveAcceptedInviteRole("owner")).toBe("owner");
    expect(resolveAcceptedInviteRole("unknown")).toBe("agent");
  });

  it("detects invite expiry from a timestamp", () => {
    expect(isVendorInviteExpired("2026-01-01T00:00:00.000Z", Date.parse("2026-01-02T00:00:00.000Z"))).toBe(true);
    expect(isVendorInviteExpired("2026-01-03T00:00:00.000Z", Date.parse("2026-01-02T00:00:00.000Z"))).toBe(false);
    expect(isVendorInviteExpired(null, Date.now())).toBe(false);
  });

  it("accepts only pending, unexpired invites for the matching user email", () => {
    expect(
      evaluateVendorInviteAcceptance({
        invite: {
          id: "invite-1",
          vendor_id: "vendor-1",
          email: "agent@example.com",
          role: "staff",
          status: "pending",
          expires_at: "2026-02-01T00:00:00.000Z",
        },
        authenticatedEmail: "AGENT@example.com",
        nowMs: Date.parse("2026-01-20T00:00:00.000Z"),
      })
    ).toEqual({
      ok: true,
      acceptedRole: "agent",
      vendorId: "vendor-1",
      inviteId: "invite-1",
    });

    expect(
      evaluateVendorInviteAcceptance({
        invite: null,
        authenticatedEmail: "agent@example.com",
      })
    ).toEqual({ ok: false, status: 404, error: "Invite not found." });

    expect(
      evaluateVendorInviteAcceptance({
        invite: {
          id: "invite-1",
          vendor_id: "vendor-1",
          email: "agent@example.com",
          status: "accepted",
        },
        authenticatedEmail: "agent@example.com",
      })
    ).toEqual({ ok: false, status: 400, error: "This invite is no longer available." });

    expect(
      evaluateVendorInviteAcceptance({
        invite: {
          id: "invite-1",
          vendor_id: "vendor-1",
          email: "agent@example.com",
          status: "pending",
          expires_at: "2026-01-01T00:00:00.000Z",
        },
        authenticatedEmail: "agent@example.com",
        nowMs: Date.parse("2026-01-02T00:00:00.000Z"),
      })
    ).toEqual({ ok: false, status: 400, error: "This invite has expired." });

    expect(
      evaluateVendorInviteAcceptance({
        invite: {
          id: "invite-1",
          vendor_id: "vendor-1",
          email: "other@example.com",
          status: "pending",
        },
        authenticatedEmail: "agent@example.com",
      })
    ).toEqual({ ok: false, status: 403, error: "This invite was sent to a different email address." });
  });
});
