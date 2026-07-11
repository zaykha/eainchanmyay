# Risk Register

Scope: Phase 1 risk inventory to drive the smallest high-value automated suite.

## P0 Risks

| ID | Risk | Why it matters | Evidence |
| --- | --- | --- | --- |
| P0-01 | Cross-workspace data isolation depends on application filtering rather than documented RLS policies in repo | A missed `memberIds` or vendor-selection check can expose or mutate another agency’s listings, leads, appointments, or billing state | `src/app/api/vendor/_lib/context.ts`, `src/app/api/vendor/properties/route.ts`, `src/app/api/vendor/properties/[propertyId]/route.ts`, no `create policy` / RLS SQL found in `supabase/*.sql` during Phase 1 scan |
| P0-02 | Destructive listing delete permanently removes images and DB records | A mistaken delete is data loss, and no soft-delete/archive fallback is used in the route | `src/app/api/vendor/properties/[propertyId]/route.ts: DELETE`, `src/app/api/_lib/property-image-upload.ts` |
| P0-03 | Billing and promotion checkout include dev-bypass behavior | Non-production bypasses can mask real payment-state bugs and webhook reconciliation defects | `src/app/api/vendor/billing/checkout/route.ts`, `src/app/api/vendor/promotions/checkout/route.ts` |
| P0-04 | Promotion checkout is owner-only and verification-gated, but activation can happen immediately in bypass mode | Incorrect environment/config handling could activate paid features without verified/payment guarantees | `src/app/api/vendor/promotions/checkout/route.ts` |
| P0-05 | Invite acceptance force-upserts `profiles.role = vendor_user` before membership completion finishes | Partial failure during invite acceptance can leave profile role promoted without clean workspace state | `src/app/api/public/vendor-invites/accept/route.ts` |

## P1 Risks

| ID | Risk | Why it matters | Evidence |
| --- | --- | --- | --- |
| P1-01 | Listing lifecycle integrity depends on route-level enforcement rather than database constraints | Invalid lifecycle jumps can still regress if route logic drifts or alternative write paths bypass the helper | `src/lib/lifecycle.ts: canTransitionListingStatus`, `src/lib/vendor-property-rules.ts`, `src/app/api/vendor/properties/[propertyId]/route.ts: PATCH` |
| P1-02 | Bulk import runs row-by-row without a visible DB transaction wrapper | Partial imports can create mixed success/failure states that are costly to reconcile | `src/app/api/vendor/import/execute/route.ts: POST` |
| P1-03 | Team management is blocked on free plan and split between owner/admin route checks | Seat-limit and plan-gating regressions will break onboarding and staff workflows | `src/app/api/vendor/team/route.ts`, `src/app/api/vendor/_lib/plan-limits.ts` |
| P1-04 | Admins can invite only agent seats, but role editing rules are route-specific | Role escalation or accidental downgrade bugs are likely around invite/update flows | `src/app/api/vendor/team/route.ts: POST/PATCH` |
| P1-05 | Verified agencies cannot change name/slug, but admins can still edit other storefront fields | Identity-lock behavior needs regression coverage to avoid public-profile inconsistency | `src/app/api/vendor/workspace/route.ts: PATCH` |
| P1-06 | Verification has multiple state layers: vendor status, verification request status, document review status | Bugs can leave requests/documents/vendor flags out of sync | `src/app/api/vendor/verification/route.ts`, `src/app/api/admin/vendor-verifications/route.ts`, `supabase/vendor_verification_ops.sql` |

## P2 Risks

| ID | Risk | Why it matters | Evidence |
| --- | --- | --- | --- |
| P2-01 | Analytics contains explicit TODO/instrumentation gaps | Reported numbers may be incomplete or misleading | `src/features/site/shared/lib/i18n.ts: analytics.todoCardClicks`, `analytics.todoContactClicks` |
| P2-02 | Promotions data model exists, but public boost wiring is still TODO | Agencies may purchase a boost that is not fully reflected in discovery ranking/hero placement | `src/app/api/vendor/promotions/route.ts` |
| P2-03 | Articles are seeded temporary content, not production editorial workflow | Localization and content trust can regress independently from app logic | `data/eainchanmyay_myanmar_market_articles_seed.json`, `src/lib/articles.ts` |
| P2-04 | Map view still has a TODO for marker clustering | Large result sets can create performance and usability issues | `src/app/properties/map/PropertyMapView.tsx` |

## P3 Risks

| ID | Risk | Why it matters | Evidence |
| --- | --- | --- | --- |
| P3-01 | Duplicate vendor surfaces (`/hub/*` and `/vendor/*`) raise UX and route-drift risk | Users can see inconsistent behavior between old/new shells | `src/app/hub/**`, `src/app/vendor/**` |
| P3-02 | Listing detail contains “coming soon” location copy | Public UX can appear incomplete even when data exists | `src/features/site/shared/lib/i18n.ts: listing.locationDetailsSoon` |
| P3-03 | Several vendor preview UI areas are disabled/read-only placeholders | UI may suggest capability that is not interactive yet | `src/features/site/vendor/components/VendorInquiriesView.tsx` |

## External Integrations

| Integration | Usage | Evidence |
| --- | --- | --- |
| Supabase Auth / Database / Storage | Auth, profiles, vendor/workspace data, file storage | `src/features/site/shared/lib/supabaseClient.ts`, `src/app/api/vendor/_lib/context.ts`, `supabase/*.sql` |
| Dinger | Billing checkout, promotion checkout, callback reconciliation | `src/app/api/vendor/billing/checkout/route.ts`, `src/app/api/vendor/billing/dinger/callback/route.ts`, `src/app/api/vendor/promotions/checkout/route.ts`, `src/lib/dinger.ts` |
| JSZip | Bulk import image ZIP parsing | `src/app/api/vendor/import/execute/route.ts` |
| XLSX | Bulk import spreadsheet parsing | `src/app/api/vendor/import/execute/route.ts`, `src/app/api/vendor/import/template/route.ts` |
| Leaflet / react-leaflet | Public map experience | `src/app/properties/map/PropertyMapLeaflet.tsx`, `package.json` |
| Supabase OTP invite email | Team invite sending | `src/app/api/vendor/team/route.ts: POST` |

## Environment Variable Inventory

Names only, no values.

| Variable | Feature area | Evidence |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client/server access | multiple files, e.g. `src/app/api/vendor/_lib/context.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public/authenticated Supabase client | `src/features/site/shared/lib/supabaseClient.ts`, `src/app/api/listings/route.ts`, `src/app/api/vendor/team/route.ts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side privileged Supabase access | `src/app/api/vendor/_lib/context.ts`, many API routes |
| `SUPABASE_PROPERTY_IMAGE_BUCKET` | Listing media bucket override | `src/app/api/_lib/property-image-upload.ts` |
| `SUPABASE_REQUEST_IMAGE_BUCKET` | Sales request image bucket override | `src/app/api/_lib/request-image-upload.ts` |
| `SUPABASE_VENDOR_BRAND_BUCKET` | Vendor logo/cover bucket override | `src/app/api/_lib/vendor-brand-upload.ts` |
| `SUPABASE_VENDOR_VERIFICATION_BUCKET` | Verification docs bucket override | `src/app/api/_lib/vendor-verification-upload.ts` |
| `NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGE_BUCKET` | Public listing image URL resolution | `src/features/site/shared/lib/images.ts` |
| `NEXT_PUBLIC_SUPABASE_REQUEST_IMAGE_BUCKET` | Public request image URL resolution | `src/features/site/shared/lib/images.ts` |
| `DINGER_CLIENT_ID` | Dinger checkout | `src/app/api/vendor/billing/checkout/route.ts`, `src/app/api/vendor/promotions/checkout/route.ts` |
| `DINGER_PUBLIC_KEY` | Dinger checkout | same as above |
| `DINGER_MERCHANT_KEY` | Dinger checkout | same as above |
| `DINGER_PROJECT_NAME` | Dinger checkout | same as above |
| `DINGER_MERCHANT_NAME` | Dinger checkout | same as above |
| `DINGER_ENV` | Dinger production vs non-production | `src/app/api/vendor/billing/checkout/route.ts`, `src/app/api/vendor/promotions/checkout/route.ts` |
| `DINGER_CALLBACK_SECRET_KEY` | Billing callback verification | `src/app/api/vendor/billing/dinger/callback/route.ts` |
| `ENABLE_PROMOTION_DINGER_CHECKOUT` | Promotion real checkout switch | `src/app/api/vendor/promotions/checkout/route.ts` |
| `NEXT_PUBLIC_EAIN_CONTACT_PHONE` | Shared contact constant | `src/features/site/shared/lib/constants.ts` |
| `NODE_ENV` | Dev bypass and debug branches | multiple files, e.g. billing/promotions/auth UI |

## Incomplete / Placeholder / Mocked Areas

| Area | Finding | Evidence |
| --- | --- | --- |
| Articles | Seeded temporary editorial data, explicitly marked for rewrite/verification | `data/eainchanmyay_myanmar_market_articles_seed.json`, `src/lib/articles.ts` |
| Promotions | Public ranking/hero/boost TODO wiring still pending | `src/app/api/vendor/promotions/route.ts` |
| Analytics | TODO placeholders for click instrumentation | `src/features/site/shared/lib/i18n.ts` |
| Map | Marker clustering TODO | `src/app/properties/map/PropertyMapView.tsx` |
| Listing detail | “More location details coming soon” copy | `src/features/site/shared/lib/i18n.ts` |
| Promotion checkout | Dev bypass path intentionally activates promotions without real payment | `src/app/api/vendor/promotions/checkout/route.ts` |

## Existing Test Coverage and Gaps

Confirmed current state:
- A first Vitest unit suite now exists for pure business logic under `src/lib/*.test.ts`.
- Lint and TypeScript checks remain part of the local gate, and `check` now includes `vitest run`.

Primary gaps:
1. Cross-agency isolation still lacks broader Supabase-backed handler coverage beyond the first vendor context and property PATCH tests.
2. No automated route-level or persistence-level tests for invites, billing, verification, bulk import, or destructive listing mutations.
3. No route-handler tests for team invites, verification review, billing callback, or bulk import.
4. No E2E flow coverage for onboarding, publish, appointment assignment, or payment/boost workflows.

## Recommended First Automated Slice

1. Vendor context and role checks
   Evidence targets: `src/app/api/vendor/_lib/context.ts`, `src/lib/vendor-permissions.ts`
2. Listing mutation and unauthorized access checks
   Evidence targets: `src/app/api/vendor/properties/[propertyId]/route.ts`
3. Invite accept / team invite flow
   Evidence targets: `src/app/api/vendor/team/route.ts`, `src/app/api/public/vendor-invites/accept/route.ts`
4. Billing and promotion gate tests
   Evidence targets: `src/app/api/vendor/billing/checkout/route.ts`, `src/app/api/vendor/promotions/checkout/route.ts`
5. Bulk import validation smoke tests
   Evidence targets: `src/app/api/vendor/import/execute/route.ts`, `src/lib/vendor-import.ts`
