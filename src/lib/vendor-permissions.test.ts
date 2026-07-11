import { describe, expect, it } from "vitest";

import {
  canAssignAppointments,
  canAssignLeads,
  canBulkImportListings,
  canCreateListings,
  canManageBilling,
  canManageOrganizationIdentity,
  canManagePublicProfile,
  canManageStaff,
  canManageTeam,
  canMutateListings,
  canPurchasePromotions,
  canSubmitVerification,
  canViewFullAnalytics,
  isAdminOrOwner,
  isOwner,
  isStaff,
  normalizeWorkspaceRole,
} from "@/lib/vendor-permissions";

describe("vendor permission helpers", () => {
  it("normalizes workspace roles and maps staff to agent", () => {
    expect(normalizeWorkspaceRole(" owner ")).toBe("owner");
    expect(normalizeWorkspaceRole("ADMIN")).toBe("admin");
    expect(normalizeWorkspaceRole("staff")).toBe("agent");
    expect(normalizeWorkspaceRole("unknown")).toBe("");
  });

  it("detects owner, admin, and staff capabilities correctly", () => {
    expect(isOwner("owner")).toBe(true);
    expect(isOwner("admin")).toBe(false);
    expect(isAdminOrOwner("admin")).toBe(true);
    expect(isAdminOrOwner("agent")).toBe(false);
    expect(isStaff("staff")).toBe(true);
    expect(isStaff("agent")).toBe(true);
    expect(isStaff("owner")).toBe(false);
  });

  it("keeps billing, promotions, and verification owner-only", () => {
    expect(canManageBilling("owner")).toBe(true);
    expect(canPurchasePromotions("owner")).toBe(true);
    expect(canSubmitVerification("owner")).toBe(true);

    expect(canManageBilling("admin")).toBe(false);
    expect(canPurchasePromotions("agent")).toBe(false);
    expect(canSubmitVerification("staff")).toBe(false);
  });

  it("allows admin or owner for operational workspace management", () => {
    const adminAllowedChecks = [
      canManageOrganizationIdentity,
      canManagePublicProfile,
      canManageTeam,
      canManageStaff,
      canAssignAppointments,
      canAssignLeads,
      canCreateListings,
      canBulkImportListings,
      canMutateListings,
      canViewFullAnalytics,
    ];

    for (const check of adminAllowedChecks) {
      expect(check("owner")).toBe(true);
      expect(check("admin")).toBe(true);
      expect(check("agent")).toBe(false);
      expect(check("staff")).toBe(false);
    }
  });
});
