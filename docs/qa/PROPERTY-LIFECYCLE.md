# Property and Workflow Lifecycle

Scope: confirmed lifecycle/state inventory for Phase 1 QA planning. This document covers listings plus adjacent workflow states that directly affect regression testing.

## Listing Statuses

Canonical status source: `src/lib/lifecycle.ts`, reinforced by `supabase/listing_lead_appointment_lifecycle.sql`.

| Status | Meaning | Publicly visible | Evidence |
| --- | --- | --- | --- |
| `draft` | Not published | No | `src/lib/lifecycle.ts`, `supabase/listing_lead_appointment_lifecycle.sql` |
| `active` | Live listing | Yes | `src/lib/lifecycle.ts: publicListingStatuses`, `src/features/site/shared/lib/data.ts` |
| `paused` | Temporarily hidden | No | `src/lib/lifecycle.ts` |
| `reserved` | Reserved but still queryable publicly | Yes | `src/lib/lifecycle.ts: publicListingStatuses`, `supabase/listing_lead_appointment_lifecycle.sql` |
| `sold` | Closed sold outcome | No | `src/lib/lifecycle.ts` |
| `rented` | Closed rented outcome | No | `src/lib/lifecycle.ts` |
| `expired` | Timed out / expired | No | `src/lib/lifecycle.ts` |
| `archived` | Archived record | No | `src/lib/lifecycle.ts` |
| `rejected` | Rejected state | No | `src/lib/lifecycle.ts`, `src/app/api/vendor/properties/[propertyId]/route.ts: PATCH` |

Legacy mapping:
- `published` is normalized to `active`.
- Public query helper still accepts `published` for compatibility.

Evidence:
- `src/lib/lifecycle.ts: legacyListingStatusMap`
- `src/lib/lifecycle.ts: publicListingQueryStatuses`
- `supabase/listing_lead_appointment_lifecycle.sql`

## Confirmed Listing Transitions

Source: `src/lib/lifecycle.ts: listingTransitions`.

| From | Allowed next statuses |
| --- | --- |
| `draft` | `active`, `archived` |
| `active` | `paused`, `reserved`, `sold`, `rented`, `expired`, `archived` |
| `paused` | `active`, `archived` |
| `reserved` | `active`, `sold`, `rented`, `archived` |
| `sold` | `archived` |
| `rented` | `archived` |
| `expired` | `active`, `archived` |
| `archived` | `draft` |
| `rejected` | `draft`, `archived` |

Important QA finding:
- The route helper `canTransitionListingStatus()` exists, but `src/app/api/vendor/properties/[propertyId]/route.ts: PATCH` normalizes status without enforcing the transition map. This is a P1 integrity risk.

## Listing Mutation Rules

| Rule | Evidence |
| --- | --- |
| Only vendor `owner` or `admin` can update listing fields or status | `src/app/api/vendor/properties/[propertyId]/route.ts: PATCH` |
| Only vendor `owner` or `admin` can delete listings | `src/app/api/vendor/properties/[propertyId]/route.ts: DELETE` |
| Listing ownership is workspace-scoped by `created_by in memberIds` | `src/app/api/vendor/properties/route.ts: GET`, `src/app/api/vendor/properties/[propertyId]/route.ts: GET/PATCH/DELETE` |
| `published_at`, `reserved_at`, `closed_at`, `archived_at` are set opportunistically on status change | `src/app/api/vendor/properties/[propertyId]/route.ts: PATCH` |
| `rejection_reason` only persists when next status is `rejected`; cleared when leaving rejected state | `src/app/api/vendor/properties/[propertyId]/route.ts: PATCH` |
| Delete path permanently deletes `property_images` rows and then `properties` row | `src/app/api/vendor/properties/[propertyId]/route.ts: DELETE` |

## Verification States

### Vendor Verification Status

Source:
- `supabase/vendor_billing_and_backfill.sql`
- `supabase/vendor_verification_ops.sql`
- `src/app/api/vendor/verification/route.ts`
- `src/app/api/admin/vendor-verifications/route.ts`

Canonical vendor verification status values:
- `not_requested`
- `pending`
- `approved`
- `rejected`

### Verification Request Status

Evidence: `supabase/vendor_verification_ops.sql`, `src/app/api/admin/vendor-verifications/route.ts`.

Confirmed request status values:
- `pending`
- `approved`
- `rejected`
- `changes_requested`

### Verification Submission Rules

| Rule | Evidence |
| --- | --- |
| Only workspace owners can submit verification | `src/lib/vendor-permissions.ts: canSubmitVerification`, `src/app/api/vendor/verification/route.ts: POST` |
| Owners and admins can read verification payload | `src/app/api/vendor/verification/route.ts: GET` |
| Platform admins can review/approve/reject verification requests | `src/app/api/admin/vendor-verifications/route.ts: PATCH`, `src/app/api/admin/_lib/context.ts` |
| Promotion checkout requires vendor verification `approved` | `src/app/api/vendor/promotions/checkout/route.ts: POST` |
| Verified agencies cannot change name or slug | `src/app/api/vendor/workspace/route.ts: PATCH` |

## Agency Onboarding Stages

Confirmed route-level onboarding stages:

1. Customer/agent registration split and email confirmation
   Evidence: `src/features/site/public/auth/AuthPage.tsx`, `src/features/site/shared/components/AuthScreen.tsx`, `src/app/auth/confirm/AuthConfirmPageClient.tsx`
2. Promote profile to `vendor_user`
   Evidence: `src/app/api/auth/ensure-vendor-role/route.ts`
3. Vendor plan selection / billing bootstrap
   Evidence: `src/app/vendor-setup/page.tsx`, `src/features/site/vendor/components/VendorPlanSelection.tsx`, `src/app/api/vendor/billing/checkout/route.ts`, `src/app/api/vendors/bootstrap/route.ts`
4. Agency storefront setup
   Evidence: `src/app/agency-setup/page.tsx`, `src/app/api/vendor/workspace/route.ts`
5. Hub entry once storefront is complete and billing state allows it
   Evidence: `src/app/vendor-setup/page.tsx`, `src/lib/vendor-storefront.ts`

Persisted onboarding hints:
- `kaiten_vendor_onboarding_pending`
- `kaiten_agent_registering`
- `kaiten_skip_agency_setup_on_hub`

Evidence:
- `src/app/vendor-setup/page.tsx`
- `src/features/site/shared/components/AuthScreen.tsx`
- `src/app/auth/accept-invite/AcceptInvitePageClient.tsx`

## Invitation States

Confirmed invite table states:
- `pending`
- `accepted`
- `expired`
- `revoked`

Evidence: `supabase/vendor_member_invites.sql`

Operational invite rules:
- Invite email must match authenticated user email at accept time.
- Invite expires after 7 days from issuance.
- Accepting invite upserts profile role to `vendor_user`.
- Existing membership is reactivated/updated; otherwise inserted.

Evidence:
- `src/app/api/vendor/team/route.ts: POST`
- `src/app/api/public/vendor-invites/accept/route.ts: POST`

## Lead and Inquiry States

Canonical lead statuses:
- `new`
- `assigned`
- `contacted`
- `qualified`
- `appointment_scheduled`
- `viewed`
- `negotiation`
- `closed_won`
- `closed_lost`
- `unresponsive`
- `spam`

Evidence:
- `src/lib/lifecycle.ts`
- `supabase/listing_lead_appointment_lifecycle.sql`

Important compatibility notes:
- Legacy values such as `scheduled`, `closed`, `lost`, `new_lead`, `negotiating`, `won` are normalized in code.
- Older SQL artifacts still reference older lead states (`new/contacted/qualified/closed/lost` and `scheduled`). Treat migration drift as a regression risk.

Evidence:
- `src/lib/lifecycle.ts: legacyLeadStatusMap`
- `supabase/vendor_inquiry_leads.sql`
- `supabase/vendor_lead_status_viewing_requests.sql`

## Viewing Request and Appointment States

### Appointment statuses

Canonical statuses:
- `requested`
- `confirmed`
- `completed`
- `cancelled`
- `no_show`

Evidence:
- `src/lib/lifecycle.ts`
- `supabase/listing_lead_appointment_lifecycle.sql`

Allowed transitions:
- `requested -> confirmed | cancelled`
- `confirmed -> completed | cancelled | no_show`
- terminal: `completed`, `cancelled`, `no_show`

Evidence: `src/lib/lifecycle.ts: appointmentTransitions`

### Viewing request-related workflow

Vendor viewing request queue supports read/unread and status mutation surfaces.

Evidence:
- `src/app/api/vendor/viewing-requests/route.ts`
- `src/app/api/vendor/viewing-requests/read/route.ts`
- `src/app/api/vendor/viewing-requests/unread/route.ts`
- `src/features/site/vendor/components/VendorViewingRequestsView.tsx`

## Billing, Subscription, and Promotion States

### Vendor plan values

- `free`
- `pro`
- `growth`
- `verified`

Evidence: `supabase/vendor_billing_and_backfill.sql`, `src/lib/vendor-plans.ts`

### Vendor billing status values

- `inactive`
- `pending`
- `active`
- `past_due`
- `canceled`

Evidence: `supabase/vendor_billing_and_backfill.sql`

### Vendor payment status values

- `pending`
- `paid`
- `failed`
- `canceled`
- `refunded`

Evidence: `supabase/vendor_billing_and_backfill.sql`, `src/app/api/vendor/billing/dinger/callback/route.ts`

### Promotion types

- `hero_ad`
- `search_ranking`
- `listing_boost`

Evidence: `supabase/vendor_promotions.sql`, `src/lib/vendor-promotions.ts`

### Promotion statuses

- `draft`
- `pending_payment`
- `pending_activation`
- `active`
- `paused`
- `expired`
- `cancelled`

Evidence: `supabase/vendor_promotions.sql`, `src/lib/vendor-promotions.ts`

Promotion checkout behavior:
- Owner only
- Vendor must be verified
- In dev-bypass mode, checkout can activate a promotion immediately
- Real Dinger checkout only when `ENABLE_PROMOTION_DINGER_CHECKOUT=true` and Dinger env vars are present

Evidence:
- `src/app/api/vendor/promotions/checkout/route.ts`
- `src/app/api/vendor/promotions/route.ts`

## Bulk Import and File Upload Paths

| Flow | Path | Rules | Evidence |
| --- | --- | --- | --- |
| Property image upload | `property_images` + property image bucket | Used for listing media and import image persistence | `src/app/api/_lib/property-image-upload.ts`, `supabase/property_images_storage_bucket.sql` |
| Sales request images | sales request image bucket | Customer sales request uploads | `src/app/api/_lib/request-image-upload.ts`, `supabase/sales_request_images_storage_bucket.sql` |
| Vendor brand assets | vendor brand bucket | Logo/cover/storefront assets | `src/app/api/_lib/vendor-brand-upload.ts`, `supabase/vendor_brand_assets_storage_bucket.sql` |
| Verification documents | verification document bucket | Agency verification docs | `src/app/api/_lib/vendor-verification-upload.ts`, `supabase/vendor_verification_documents_storage_bucket.sql` |
| Bulk spreadsheet import | `/api/vendor/import/template`, `/preview`, `/images/preview`, `/execute` | Owner/admin only, free-plan blocked, row and ZIP size limits | `src/app/api/vendor/import/*.ts`, `src/lib/vendor-import.ts` |

## Lifecycle QA Priorities

### P0
- Cross-workspace listing access and mutation isolation
- Delete behavior and image/data loss
- Billing and promotion activation paths

### P1
- Listing status transitions and enforcement mismatch
- Invite acceptance and seat-role conversion
- Verification request, approval, rejection, and changes-request loops
- Bulk import partial failure/rollback behavior
