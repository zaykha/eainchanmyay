import { normalizeWorkspaceRole, type WorkspaceRole } from "@/lib/vendor-permissions";

export type TeamSeatRole = "owner" | "admin" | "agent";
export type TeamSeatStatus = "active" | "inactive";

export function normalizeTeamSeatRoleInput(input: unknown): TeamSeatRole | null {
  const normalized = normalizeWorkspaceRole(input as WorkspaceRole | null | undefined);
  return normalized || null;
}

export function normalizeTeamSeatStatusInput(input: unknown): TeamSeatStatus | null {
  return input === "active" || input === "inactive" ? input : null;
}

export function canActorInviteSeat(actorRole: WorkspaceRole | null | undefined, targetRole: TeamSeatRole) {
  const actor = normalizeWorkspaceRole(actorRole);
  if (actor === "owner") return true;
  if (actor === "admin") return targetRole === "agent";
  return false;
}

export function canActorManageSeatChange(input: {
  actorRole: WorkspaceRole | null | undefined;
  actorUserId: string | null | undefined;
  targetUserId: string | null | undefined;
  currentRole: WorkspaceRole | null | undefined;
  nextRole: TeamSeatRole;
}) {
  const actor = normalizeWorkspaceRole(input.actorRole);
  const current = normalizeWorkspaceRole(input.currentRole);
  const actorUserId = String(input.actorUserId ?? "").trim();
  const targetUserId = String(input.targetUserId ?? "").trim();

  if (!actorUserId || !targetUserId) {
    return { ok: false as const, status: 400, error: "User, role, and status are required." };
  }

  if (actorUserId === targetUserId) {
    return { ok: false as const, status: 400, error: "You cannot edit your own seat from this screen." };
  }

  if (actor === "owner") {
    return { ok: true as const };
  }

  if (actor === "admin") {
    if (current !== "agent") {
      return { ok: false as const, status: 403, error: "Admins can only manage staff seats." };
    }
    if (input.nextRole !== "agent") {
      return { ok: false as const, status: 403, error: "Admins cannot promote staff to admin or owner." };
    }
    return { ok: true as const };
  }

  return { ok: false as const, status: 403, error: "Only owner or admin members can manage seats." };
}

export function isRemovingActiveOwnerSeat(input: {
  currentRole: WorkspaceRole | null | undefined;
  currentStatus: string | null | undefined;
  nextRole: TeamSeatRole;
  nextStatus: TeamSeatStatus;
}) {
  return (
    normalizeWorkspaceRole(input.currentRole) === "owner" &&
    String(input.currentStatus ?? "active") === "active" &&
    !(input.nextRole === "owner" && input.nextStatus === "active")
  );
}
