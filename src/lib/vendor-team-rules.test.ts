import { describe, expect, it } from "vitest";

import {
  canActorInviteSeat,
  canActorManageSeatChange,
  isRemovingActiveOwnerSeat,
  normalizeTeamSeatRoleInput,
  normalizeTeamSeatStatusInput,
} from "@/lib/vendor-team-rules";

describe("vendor team rules", () => {
  it("normalizes team seat role and status inputs", () => {
    expect(normalizeTeamSeatRoleInput("staff")).toBe("agent");
    expect(normalizeTeamSeatRoleInput("owner")).toBe("owner");
    expect(normalizeTeamSeatRoleInput("unknown")).toBeNull();
    expect(normalizeTeamSeatStatusInput("active")).toBe("active");
    expect(normalizeTeamSeatStatusInput("inactive")).toBe("inactive");
    expect(normalizeTeamSeatStatusInput("disabled")).toBeNull();
  });

  it("applies invite role restrictions by actor role", () => {
    expect(canActorInviteSeat("owner", "owner")).toBe(true);
    expect(canActorInviteSeat("owner", "admin")).toBe(true);
    expect(canActorInviteSeat("admin", "agent")).toBe(true);
    expect(canActorInviteSeat("admin", "admin")).toBe(false);
    expect(canActorInviteSeat("agent", "agent")).toBe(false);
  });

  it("blocks self-editing and restricts admin seat management", () => {
    expect(
      canActorManageSeatChange({
        actorRole: "owner",
        actorUserId: "u1",
        targetUserId: "u1",
        currentRole: "admin",
        nextRole: "admin",
      })
    ).toEqual({ ok: false, status: 400, error: "You cannot edit your own seat from this screen." });

    expect(
      canActorManageSeatChange({
        actorRole: "admin",
        actorUserId: "u1",
        targetUserId: "u2",
        currentRole: "owner",
        nextRole: "agent",
      })
    ).toEqual({ ok: false, status: 403, error: "Admins can only manage staff seats." });

    expect(
      canActorManageSeatChange({
        actorRole: "admin",
        actorUserId: "u1",
        targetUserId: "u2",
        currentRole: "agent",
        nextRole: "admin",
      })
    ).toEqual({ ok: false, status: 403, error: "Admins cannot promote staff to admin or owner." });

    expect(
      canActorManageSeatChange({
        actorRole: "admin",
        actorUserId: "u1",
        targetUserId: "u2",
        currentRole: "staff",
        nextRole: "agent",
      })
    ).toEqual({ ok: true });
  });

  it("detects when a seat change would remove the last active owner shape", () => {
    expect(
      isRemovingActiveOwnerSeat({
        currentRole: "owner",
        currentStatus: "active",
        nextRole: "admin",
        nextStatus: "active",
      })
    ).toBe(true);
    expect(
      isRemovingActiveOwnerSeat({
        currentRole: "owner",
        currentStatus: "active",
        nextRole: "owner",
        nextStatus: "active",
      })
    ).toBe(false);
  });
});
