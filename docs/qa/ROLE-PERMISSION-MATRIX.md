# Role Permission Matrix

Scope: confirmed repository-only role and authorization model for Phase 1 QA planning.

## Role Model

### Platform Profile Roles

| Role | Meaning | Evidence |
| --- | --- | --- |
| `user` | Customer account | `src/features/site/shared/lib/data.ts: ProfileRole` |
| `vendor_user` | Vendor/agency-capable account | `src/features/site/shared/lib/data.ts: ProfileRole`, `src/app/api/vendor/_lib/context.ts` |
| `staff` | Legacy profile role still present in type union | `src/features/site/shared/lib/data.ts: ProfileRole` |
| `admin` | Platform administrator | `src/features/site/shared/lib/data.ts: ProfileRole`, `src/app/api/admin/_lib/context.ts` |
| `master_admin` | Elevated platform administrator | `src/features/site/shared/lib/data.ts: ProfileRole`, `src/app/api/admin/_lib/context.ts` |

### Vendor Workspace Roles

| Workspace role | Meaning | Notes | Evidence |
| --- | --- | --- | --- |
| `owner` | Full workspace owner | Billing, promotions, verification submission restricted here | `src/lib/vendor-permissions.ts`, `supabase/vendor_member_invites.sql` |
| `admin` | Elevated workspace manager | Can manage listings/team/storefront; cannot invite owner/admin seats | `src/lib/vendor-permissions.ts`, `src/app/api/vendor/team/route.ts: POST` |
| `agent` | Standard staff seat | Normalized target role for legacy `staff` | `src/lib/vendor-permissions.ts`, `supabase/vendor_member_invites.sql` |
| `staff` | Legacy alias | Normalized to `agent` in code | `src/lib/vendor-permissions.ts: normalizeWorkspaceRole`, `supabase/vendor_billing_and_backfill.sql` |

## Central Authorization Sources

| Source | What it enforces | Evidence |
| --- | --- | --- |
| `getVendorRequestContext()` | Bearer auth, `profiles.role === vendor_user`, active `vendor_members` membership, workspace selection, billing restrictions | `src/app/api/vendor/_lib/context.ts` |
| `getAdminRequestContext()` | Bearer auth, `profiles.role in ('admin','master_admin')` | `src/app/api/admin/_lib/context.ts` |
| `vendor-permissions.ts` | Reusable permission helpers for owner/admin/agent behavior | `src/lib/vendor-permissions.ts` |

## Permission Matrix

Legend:
- `Y`: confirmed allowed
- `N`: confirmed denied
- `Conditional`: allowed only with extra state checks
- `UI-only`: surfaced in UI but backend consistency should be tested

| Capability | Customer `user` | Vendor `owner` | Vendor `admin` | Vendor `agent` | Platform `admin` / `master_admin` | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Access vendor APIs | N | Y | Y | Y | N unless also vendor member | `src/app/api/vendor/_lib/context.ts` |
| Access admin verification APIs | N | N | N | N | Y | `src/app/api/admin/_lib/context.ts` |
| Create free workspace | N | Conditional via profile promotion | Conditional via profile promotion | Conditional via profile promotion | N | `src/app/api/vendors/bootstrap/route.ts`, `src/app/api/auth/ensure-vendor-role/route.ts` |
| Start paid vendor billing checkout | N | Y | N | N | N | `src/lib/vendor-permissions.ts: canManageBilling`, `src/app/api/vendor/billing/checkout/route.ts` |
| Purchase promotion checkout | N | Y and vendor must be verified | N | N | N | `src/app/api/vendor/promotions/checkout/route.ts` |
| Submit verification request | N | Y | N | N | N | `src/lib/vendor-permissions.ts: canSubmitVerification`, `src/app/api/vendor/verification/route.ts: POST` |
| Read verification state | N | Y | Y | N | Y (admin console) | `src/app/api/vendor/verification/route.ts: GET`, `src/app/api/admin/vendor-verifications/route.ts: GET` |
| Update storefront public copy | N | Y | Y | N | N | `src/app/api/vendor/workspace/route.ts: PATCH` |
| Update agency name / slug / storefront visibility | N | Y | N | N | N | `src/app/api/vendor/workspace/route.ts: PATCH` |
| Mutate listings | N | Y | Y | N | N | `src/lib/vendor-permissions.ts: canMutateListings`, `src/app/api/vendor/properties/[propertyId]/route.ts` |
| Bulk import listings | N | Y if plan not free | Y if plan not free | N | N | `src/lib/vendor-permissions.ts: canBulkImportListings`, `src/app/api/vendor/import/execute/route.ts` |
| Create/convert sales requests into listings | N | Y | Y | N | N | `src/lib/vendor-permissions.ts: canCreateListings`, `src/app/api/vendor/sales-requests/route.ts` |
| Manage team | N | Y | Y | N | N | `src/lib/vendor-permissions.ts: canManageTeam`, `src/app/api/vendor/team/route.ts` |
| Invite admin/owner seats | N | Y | N | N | N | `src/app/api/vendor/team/route.ts: POST` |
| Invite agent seats | N | Y | Y | N | N | `src/app/api/vendor/team/route.ts: POST` |
| Change team member role/status | N | Y | Conditional; limited further in route | N | N | `src/app/api/vendor/team/route.ts: PATCH` |
| Assign appointments | N | Y | Y | N | N | `src/lib/vendor-permissions.ts: canAssignAppointments`, `src/app/api/vendor/appointments/manage/route.ts` |
| Assign leads/reminders | N | Y | Y | N | N | `src/lib/vendor-permissions.ts: canAssignLeads`, `src/app/api/vendor/inquiry-reminders/route.ts` |
| View full analytics | N | Y | Y | N | N | `src/lib/vendor-permissions.ts: canViewFullAnalytics`, `src/app/api/vendor/analytics/full/route.ts` |
| Accept workspace invite | Conditional; authenticated user matching invited email | Conditional | Conditional | Conditional | Conditional | `src/app/api/public/vendor-invites/accept/route.ts` |

## Authorization Checks Worth Testing First

### P0

1. Cross-workspace isolation depends on `memberIds` and selected vendor context rather than documented RLS in repo.
   Evidence: `src/app/api/vendor/_lib/context.ts`, `src/app/api/vendor/properties/route.ts`, `src/app/api/vendor/properties/[propertyId]/route.ts`.

2. Admin versus owner restrictions are route-specific and not fully centralized.
   Evidence: `src/app/api/vendor/team/route.ts`, `src/app/api/vendor/workspace/route.ts`, `src/app/api/vendor/promotions/checkout/route.ts`.

3. Platform admin and vendor access are separate systems; a single user could theoretically occupy both surfaces if memberships/profile role combinations are inconsistent.
   Evidence: `src/app/api/admin/_lib/context.ts`, `src/app/api/vendor/_lib/context.ts`.

## Open Questions / Inferred Areas

- `canManagePublicProfile()` exists, but the comment says backend consistency is not complete. Treat storefront/public-profile edit rules as high-risk until route-level tests confirm them. Evidence: `src/lib/vendor-permissions.ts`.
- `staff` remains in profile-role typing but workspace-level normalization collapses `staff` to `agent`. This should be regression-tested during invite acceptance and any role migration/backfill paths. Evidence: `src/features/site/shared/lib/data.ts`, `src/lib/vendor-permissions.ts`, `supabase/vendor_billing_and_backfill.sql`.
