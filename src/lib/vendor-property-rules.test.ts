import { describe, expect, it } from "vitest";

import { canAccessVendorProperty, resolvePropertyStatusUpdate } from "@/lib/vendor-property-rules";

describe("vendor property rules", () => {
  it("checks workspace ownership by creator membership", () => {
    expect(canAccessVendorProperty(["user-1", "user-2"], "user-1")).toBe(true);
    expect(canAccessVendorProperty(["user-1", "user-2"], "user-3")).toBe(false);
    expect(canAccessVendorProperty(["user-1"], null)).toBe(false);
  });

  it("validates property status updates against the lifecycle map", () => {
    expect(
      resolvePropertyStatusUpdate({
        currentStatus: "draft",
        nextStatus: "active",
        now: "2026-01-10T00:00:00.000Z",
      })
    ).toEqual({
      ok: true,
      payload: {
        status: "active",
        published_at: "2026-01-10T00:00:00.000Z",
      },
    });

    expect(
      resolvePropertyStatusUpdate({
        currentStatus: "sold",
        nextStatus: "active",
        now: "2026-01-10T00:00:00.000Z",
      })
    ).toEqual({
      ok: false,
      status: 400,
      error: "Cannot change listing status from sold to active.",
    });

    expect(
      resolvePropertyStatusUpdate({
        currentStatus: "reserved",
        nextStatus: "sold",
        now: "2026-01-10T00:00:00.000Z",
      })
    ).toEqual({
      ok: true,
      payload: {
        status: "sold",
        closed_at: "2026-01-10T00:00:00.000Z",
      },
    });
  });

  it("keeps rejection reason handling aligned with rejected transitions", () => {
    expect(
      resolvePropertyStatusUpdate({
        currentStatus: "active",
        nextStatus: "rejected",
        rejectionReason: "Missing documents",
        now: "2026-01-10T00:00:00.000Z",
      })
    ).toEqual({
      ok: false,
      status: 400,
      error: "Cannot change listing status from active to rejected.",
    });

    expect(
      resolvePropertyStatusUpdate({
        currentStatus: "rejected",
        nextStatus: "draft",
        now: "2026-01-10T00:00:00.000Z",
      })
    ).toEqual({
      ok: true,
      payload: {
        status: "draft",
        rejection_reason: null,
      },
    });
  });
});
