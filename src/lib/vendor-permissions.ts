export type WorkspaceRole = "owner" | "admin" | "agent" | "staff" | string;

function normalizeRoleString(role: unknown): string {
  if (typeof role !== "string") return "";
  return role.trim().toLowerCase();
}

// Normalize the workspace seat/role into the canonical role names used by the codebase.
// - staff -> agent
// - owner/admin/agent pass through
// - unknown -> ""
export function normalizeWorkspaceRole(role: WorkspaceRole | null | undefined):
  | "owner"
  | "admin"
  | "agent"
  | "" {
  const normalized = normalizeRoleString(role);
  if (!normalized) return "";
  if (normalized === "staff") return "agent";
  if (normalized === "owner") return "owner";
  if (normalized === "admin") return "admin";
  if (normalized === "agent") return "agent";
  return "";
}

export function isOwner(role: WorkspaceRole | null | undefined): boolean {
  return normalizeWorkspaceRole(role) === "owner";
}

export function isAdminOrOwner(role: WorkspaceRole | null | undefined): boolean {
  const r = normalizeWorkspaceRole(role);
  return r === "owner" || r === "admin";
}

export function isStaff(role: WorkspaceRole | null | undefined): boolean {
  return normalizeRoleString(role) === "staff" || normalizeWorkspaceRole(role) === "agent";
}

// Centralized permission rules inferred from existing behavior in routes.
// NOTE: these are intentionally minimal and match current checks.
export function canManageBilling(role: WorkspaceRole | null | undefined): boolean {
  // Billing checkout is currently restricted to workspace owners.
  return isOwner(role);
}

export function canPurchasePromotions(role: WorkspaceRole | null | undefined): boolean {
  // Promotion checkout is currently restricted to workspace owners.
  return isOwner(role);
}

export function canSubmitVerification(role: WorkspaceRole | null | undefined): boolean {
  // Verification submission is currently restricted to workspace owners.
  return isOwner(role);
}

export function canManageOrganizationIdentity(role: WorkspaceRole | null | undefined): boolean {
  // Identity changes are currently restricted to owner/admin in API.
  return isAdminOrOwner(role);
}

export function canManagePublicProfile(role: WorkspaceRole | null | undefined): boolean {
  // Public profile management is not consistently implemented in the backend.
  // Keep conservative behavior: owner/admin only.
  return isAdminOrOwner(role);
}

export function canManageTeam(role: WorkspaceRole | null | undefined): boolean {
  return isAdminOrOwner(role);
}

export function canManageStaff(role: WorkspaceRole | null | undefined): boolean {
  // Staff seat management is owner/admin only. (Admins are limited further in team routes.)
  return isAdminOrOwner(role);
}

export function canAssignAppointments(role: WorkspaceRole | null | undefined): boolean {
  // Appointment management endpoints are currently owner/admin only.
  return isAdminOrOwner(role);
}

export function canAssignLeads(role: WorkspaceRole | null | undefined): boolean {
  // Lead assignment is currently owner/admin only in inquiry-reminders and similar routes.
  return isAdminOrOwner(role);
}

export function canCreateListings(role: WorkspaceRole | null | undefined): boolean {
  // Listing creation via sales-requests/vendor-listings is currently owner/admin.
  return isAdminOrOwner(role);
}

export function canBulkImportListings(role: WorkspaceRole | null | undefined): boolean {
  // Bulk imports are currently owner/admin only.
  return isAdminOrOwner(role);
}

export function canMutateListings(role: WorkspaceRole | null | undefined): boolean {
  // Listing update/delete endpoints are currently owner/admin only.
  return isAdminOrOwner(role);
}

export function canViewFullAnalytics(role: WorkspaceRole | null | undefined): boolean {
  // Analytics full endpoint is currently owner/admin only.
  return isAdminOrOwner(role);
}

