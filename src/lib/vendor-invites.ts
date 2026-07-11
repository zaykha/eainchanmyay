import { normalizeWorkspaceRole } from "@/lib/vendor-permissions";

type InviteAcceptanceInput = {
  invite:
    | {
        id?: string | null;
        vendor_id?: string | null;
        email?: string | null;
        role?: string | null;
        status?: string | null;
        expires_at?: string | null;
      }
    | null
    | undefined;
  authenticatedEmail: string | null | undefined;
  nowMs?: number;
};

export function normalizeEmailAddress(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

export function isVendorInviteExpired(expiresAt: string | null | undefined, nowMs = Date.now()) {
  if (typeof expiresAt !== "string") return false;
  const expiresAtMs = new Date(expiresAt).getTime();
  return Number.isFinite(expiresAtMs) && expiresAtMs <= nowMs;
}

export function resolveAcceptedInviteRole(role: string | null | undefined) {
  return normalizeWorkspaceRole(role) || "agent";
}

export function evaluateVendorInviteAcceptance(input: InviteAcceptanceInput) {
  const invite = input.invite;
  if (!invite?.id || !invite.vendor_id) {
    return { ok: false as const, status: 404, error: "Invite not found." };
  }

  if (String(invite.status ?? "pending") !== "pending") {
    return { ok: false as const, status: 400, error: "This invite is no longer available." };
  }

  if (isVendorInviteExpired(invite.expires_at, input.nowMs)) {
    return { ok: false as const, status: 400, error: "This invite has expired." };
  }

  if (normalizeEmailAddress(invite.email) !== normalizeEmailAddress(input.authenticatedEmail)) {
    return { ok: false as const, status: 403, error: "This invite was sent to a different email address." };
  }

  return {
    ok: true as const,
    acceptedRole: resolveAcceptedInviteRole(invite.role),
    vendorId: String(invite.vendor_id),
    inviteId: String(invite.id),
  };
}
