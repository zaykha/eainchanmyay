# Phase 1 Feature Inventory

This Phase 1 inventory is intentionally limited to the surfaces required to design the initial regression safety net. It complements:

- `docs/qa/ROUTE-INVENTORY.md`
- `docs/qa/ROLE-PERMISSION-MATRIX.md`
- `docs/qa/PROPERTY-LIFECYCLE.md`
- `docs/qa/RISK-REGISTER.md`

## Core Product Areas Confirmed in Repository

| Feature area | Confirmed repository evidence |
| --- | --- |
| Public listing discovery | `src/app/page.tsx`, `src/app/search/page.tsx`, `src/app/properties/map/page.tsx`, `src/app/api/listings/route.ts` |
| Listing detail / report / viewing | `src/features/site/public/listing/[propertyId]/ListingPage.tsx`, `src/app/api/public/listings/[propertyId]/route.ts`, `src/app/api/public/listing-reports/route.ts`, `src/app/api/public/listings/[propertyId]/view/route.ts` |
| Customer inquiries | `src/features/site/public/inquiries/new/NewInquiryPage.tsx`, `src/app/api/public/inquiries/route.ts` |
| Customer sales requests | `src/features/site/public/request-sale/RequestSalePage.tsx`, `src/app/api/public/sales-requests/route.ts` |
| Auth and role split | `src/features/site/public/auth/AuthPage.tsx`, `src/features/site/shared/components/AuthScreen.tsx`, `src/app/api/auth/check-role/route.ts` |
| Vendor onboarding and billing | `src/app/vendor-setup/page.tsx`, `src/app/api/vendor/billing/checkout/route.ts`, `src/app/api/vendors/bootstrap/route.ts` |
| Agency storefront setup | `src/app/agency-setup/page.tsx`, `src/app/api/vendor/workspace/route.ts` |
| Vendor hub / workspace | `src/features/site/public/account/AccountPage.tsx`, `src/app/hub/page.tsx`, `src/app/api/vendor/overview/route.ts` |
| Team invites and role management | `src/app/api/vendor/team/route.ts`, `src/app/api/public/vendor-invites/accept/route.ts` |
| Vendor property management | `src/app/api/vendor/properties/route.ts`, `src/app/api/vendor/properties/[propertyId]/route.ts` |
| Bulk property import | `src/app/vendor/import/page.tsx`, `src/app/api/vendor/import/*.ts`, `src/lib/vendor-import.ts` |
| Verification workflow | `src/app/api/vendor/verification/route.ts`, `src/app/api/admin/vendor-verifications/route.ts`, `supabase/vendor_verification_ops.sql` |
| Lead inbox / reminders / notes | `src/app/api/vendor/inquiries*.ts`, `src/app/api/vendor/inquiry-notes/route.ts`, `src/app/api/vendor/inquiry-reminders/route.ts` |
| Viewing requests and appointments | `src/app/api/vendor/viewing-requests*.ts`, `src/app/api/vendor/appointments/*.ts`, `src/lib/lifecycle.ts` |
| Analytics | `src/app/hub/analytics/page.tsx`, `src/app/api/vendor/analytics/full/route.ts` |
| Promotions / boosting | `src/features/site/vendor/components/VendorPromotionsView.tsx`, `src/app/api/vendor/promotions*.ts`, `supabase/vendor_promotions.sql` |
| Articles and partners | `src/features/site/public/articles/**`, `src/features/site/public/partners/**`, `data/eainchanmyay_myanmar_market_articles_seed.json` |

## Supabase Artifact Inventory

This section is repository-scoped. It reflects SQL artifacts checked into `supabase/` during Phase 1 and should not be treated as a complete live-environment schema dump.

### SQL Artifacts Present

- `supabase/listing_lead_appointment_lifecycle.sql`
- `supabase/listing_reports.sql`
- `supabase/performance_read_indexes.sql`
- `supabase/properties_owner_and_structure_fields.sql`
- `supabase/properties_vendor_nullable.sql`
- `supabase/property_images_storage_bucket.sql`
- `supabase/sales_request_images.sql`
- `supabase/sales_request_images_storage_bucket.sql`
- `supabase/sales_requests_floor_room_counts.sql`
- `supabase/sales_requests_review_status_default.sql`
- `supabase/sales_requests_vendor_nullable.sql`
- `supabase/vendor_analytics_expansion.sql`
- `supabase/vendor_assigned_staff_viewing_requests.sql`
- `supabase/vendor_billing_and_backfill.sql`
- `supabase/vendor_brand_assets_storage_bucket.sql`
- `supabase/vendor_crm_layer.sql`
- `supabase/vendor_inquiry_leads.sql`
- `supabase/vendor_inquiry_leads_direct_agency.sql`
- `supabase/vendor_inquiry_leads_snapshot.sql`
- `supabase/vendor_lead_status_viewing_requests.sql`
- `supabase/vendor_member_invites.sql`
- `supabase/vendor_promotions.sql`
- `supabase/vendor_social_links.sql`
- `supabase/vendor_storefront.sql`
- `supabase/vendor_verification_documents_storage_bucket.sql`
- `supabase/vendor_verification_ops.sql`
- `supabase/viewing_requests_realtime.sql`

### Tables Created in Repository SQL

| Table | Status in repo | Evidence |
| --- | --- | --- |
| `public.listing_reports` | Created here | `supabase/listing_reports.sql` |
| `public.vendor_inquiry_leads` | Created here | `supabase/vendor_inquiry_leads.sql` |
| `public.vendor_lead_notes` | Created here | `supabase/vendor_crm_layer.sql` |
| `public.vendor_lead_reminders` | Created here | `supabase/vendor_crm_layer.sql` |
| `public.vendor_message_templates` | Created here | `supabase/vendor_crm_layer.sql` |
| `public.vendor_member_invites` | Created here | `supabase/vendor_member_invites.sql` |
| `public.vendor_promotions` | Created here | `supabase/vendor_promotions.sql` |
| `public.vendor_verification_requests` | Created here | `supabase/vendor_verification_ops.sql` |
| `public.vendor_verification_documents` | Created here | `supabase/vendor_verification_ops.sql` |
| `public.vendor_verification_request_properties` | Created here | `supabase/vendor_verification_ops.sql` |
| `public.sales_request_images` | Created here | `supabase/sales_request_images.sql` |
| `public.property_view_events` | Created here | `supabase/vendor_analytics_expansion.sql` |
| `public.vendor_payments` | Created here | `supabase/vendor_billing_and_backfill.sql` |
| `public.vendor_viewing_request_reads` | Created here | `supabase/viewing_requests_realtime.sql` |

### Existing Tables Altered in Repository SQL

| Table | Nature of changes | Evidence |
| --- | --- | --- |
| `public.properties` | Status lifecycle, ownership, structure, verification columns | `supabase/listing_lead_appointment_lifecycle.sql`, `supabase/properties_owner_and_structure_fields.sql`, `supabase/properties_vendor_nullable.sql`, `supabase/vendor_verification_ops.sql` |
| `public.sales_requests` | Review status, vendor nullability, floor/room counts | `supabase/sales_requests_review_status_default.sql`, `supabase/sales_requests_vendor_nullable.sql`, `supabase/sales_requests_floor_room_counts.sql` |
| `public.viewing_requests` | Lead linkage, assignment, status, realtime support | `supabase/vendor_assigned_staff_viewing_requests.sql`, `supabase/vendor_lead_status_viewing_requests.sql`, `supabase/viewing_requests_realtime.sql`, `supabase/listing_lead_appointment_lifecycle.sql` |
| `public.appointments` | Appointment lifecycle columns and constraints | `supabase/listing_lead_appointment_lifecycle.sql` |
| `public.vendors` | Storefront, social links, billing, verification fields | `supabase/vendor_storefront.sql`, `supabase/vendor_social_links.sql`, `supabase/vendor_billing_and_backfill.sql` |
| `public.vendor_members` | Role normalization / backfill constraints | `supabase/vendor_billing_and_backfill.sql` |
| `public.vendor_inquiry_leads` | Snapshot, direct-agency routing, CRM extensions, lifecycle updates | `supabase/vendor_inquiry_leads.sql`, `supabase/vendor_inquiry_leads_snapshot.sql`, `supabase/vendor_inquiry_leads_direct_agency.sql`, `supabase/vendor_crm_layer.sql`, `supabase/listing_lead_appointment_lifecycle.sql` |

### Storage Buckets Declared in Repository SQL

| Bucket | Purpose | Evidence |
| --- | --- | --- |
| `property_images` | Listing image storage | `supabase/property_images_storage_bucket.sql` |
| `sales_request_images` | Sales request uploads | `supabase/sales_request_images_storage_bucket.sql` |
| `vendor_brand_assets` | Agency logo and cover assets | `supabase/vendor_brand_assets_storage_bucket.sql` |
| `vendor_verification_documents` | Verification document uploads | `supabase/vendor_verification_documents_storage_bucket.sql` |

### RPCs, Functions, Views, and RLS Policies

- No SQL RPC definitions were found from `create function` or `create or replace function` matches in checked-in `supabase/*.sql`.
- No SQL views were found from `create view` matches in checked-in `supabase/*.sql`.
- No row-level-security enablement or `create policy` statements were found in checked-in `supabase/*.sql`.
- Performance indexes exist, but they do not document authorization boundaries. Evidence: `supabase/performance_read_indexes.sql`.

## Phase 1 Boundary

This phase created documentation only. No application code, migrations, config, or dependencies were modified.
