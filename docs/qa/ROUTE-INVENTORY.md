# Route Inventory

Scope: repository-only Phase 1 inventory for QA planning. This file documents confirmed application routes and API endpoints from `src/app/**`. It does not assume any undocumented runtime routes.

## Application Routes

| Route | Access | Purpose | Evidence |
| --- | --- | --- | --- |
| `/` | Public | Marketplace home / search entry | `src/app/page.tsx`, `src/features/site/public/HomePage.tsx` |
| `/search` | Public | Search results surface | `src/app/search/page.tsx` |
| `/properties/map` | Public | Map-based property discovery | `src/app/properties/map/page.tsx`, `src/app/properties/map/PropertyMapView.tsx` |
| `/listing/[propertyId]` | Public | Listing detail, gallery, report, save, viewing CTA | `src/app/listing/[propertyId]/page.tsx`, `src/features/site/public/listing/[propertyId]/ListingPage.tsx` |
| `/booking/[propertyId]` | Public | Direct booking/viewing request flow | `src/app/booking/[propertyId]/page.tsx`, `src/features/site/public/booking/[propertyId]/BookingPage.tsx` |
| `/inquiries/new` | Authenticated customer | New or edit customer inquiry | `src/app/inquiries/new/page.tsx`, `src/features/site/public/inquiries/new/NewInquiryPage.tsx` |
| `/request-sale` | Authenticated customer | Sales request submission | `src/app/request-sale/page.tsx`, `src/features/site/public/request-sale/RequestSalePage.tsx` |
| `/articles` | Public | Article index / filter UI | `src/app/articles/page.tsx`, `src/features/site/public/articles/ArticlesPage.tsx`, `src/features/site/public/articles/ArticlesIndexView.tsx` |
| `/articles/[slug]` | Public | Article detail shell around seeded article content | `src/app/articles/[slug]/page.tsx`, `src/features/site/public/articles/[slug]/ArticlePage.tsx`, `src/features/site/public/articles/[slug]/ArticleDetailViewClient.tsx` |
| `/partners` | Public | Partner agency directory | `src/app/partners/page.tsx`, `src/features/site/public/partners/PartnersPage.tsx`, `src/features/site/public/partners/PartnersIndexView.tsx` |
| `/agency/[slug]` | Public | Public agency storefront/profile | `src/app/agency/[slug]/page.tsx` |
| `/faq` | Public | Support/FAQ page | `src/app/faq/page.tsx` |
| `/terms` | Public | Terms page | `src/app/terms/page.tsx` |
| `/privacy` | Public | Privacy page | `src/app/privacy/page.tsx` |
| `/auth` | Public / authenticated redirect | Sign-in and registration split by customer vs agent path | `src/app/auth/page.tsx`, `src/features/site/public/auth/AuthPage.tsx`, `src/features/site/shared/components/AuthScreen.tsx` |
| `/auth/confirm` | Auth flow callback | Email confirmation / role bootstrap redirect | `src/app/auth/confirm/page.tsx`, `src/app/auth/confirm/AuthConfirmPageClient.tsx` |
| `/auth/accept-invite` | Invite flow callback | Accept team invitation and add user to vendor workspace | `src/app/auth/accept-invite/page.tsx`, `src/app/auth/accept-invite/AcceptInvitePageClient.tsx` |
| `/account` | Authenticated customer or vendor redirect shell | Personal account plus hub entry | `src/app/account/page.tsx`, `src/features/site/public/account/AccountPage.tsx` |
| `/activities` | Authenticated user | Activities shell reusing account-related state | `src/app/activities/page.tsx`, `src/features/site/public/activities/ActivitiesPage.tsx` |
| `/settings` | Authenticated user | Account/app settings | `src/app/settings/page.tsx`, `src/features/site/public/settings/SettingsPage.tsx` |
| `/bookings` | Authenticated user | Customer bookings page | `src/app/bookings/page.tsx`, `src/features/site/public/bookings/BookingsPage.tsx` |
| `/vendor` | Vendor-facing public shell | Legacy vendor landing | `src/app/vendor/page.tsx` |
| `/vendor-setup` | Authenticated vendor onboarding | Plan selection and billing bootstrap | `src/app/vendor-setup/page.tsx` |
| `/agency-setup` | Authenticated vendor onboarding | Agency storefront setup before hub entry | `src/app/agency-setup/page.tsx` |
| `/hub` | Authenticated vendor workspace | Main hub shell | `src/app/hub/page.tsx`, `src/features/site/public/account/AccountPage.tsx` |
| `/hub/[propertyId]/edit` | Owner/admin vendor | Hub listing edit route | `src/app/hub/[propertyId]/edit/page.tsx` |
| `/hub/settings` | Vendor workspace | Organization settings shortcut | `src/app/hub/settings/page.tsx` |
| `/hub/upgrade` | Vendor workspace | Upgrade path | `src/app/hub/upgrade/page.tsx` |
| `/hub/analytics` | Vendor workspace | Analytics dashboard | `src/app/hub/analytics/page.tsx` |
| `/hub/analytics/[slug]` | Vendor workspace | Analytics detail variant | `src/app/hub/analytics/[slug]/page.tsx` |
| `/vendor/properties` | Vendor workspace | Legacy vendor listings route | `src/app/vendor/properties/page.tsx` |
| `/vendor/properties/[propertyId]` | Vendor workspace | Legacy listing detail route | `src/app/vendor/properties/[propertyId]/page.tsx` |
| `/vendor/properties/[propertyId]/edit` | Vendor workspace | Legacy listing edit route | `src/app/vendor/properties/[propertyId]/edit/page.tsx` |
| `/vendor/import` | Vendor workspace | Bulk import UI | `src/app/vendor/import/page.tsx`, `src/features/site/vendor/components/VendorImportView.tsx` |
| `/vendor/inquiries` | Vendor workspace | Lead inbox / inquiries | `src/app/vendor/inquiries/page.tsx`, `src/features/site/vendor/components/VendorInquiriesView.tsx` |
| `/vendor/viewing-requests` | Vendor workspace | Viewing request management | `src/app/vendor/viewing-requests/page.tsx`, `src/features/site/vendor/components/VendorViewingRequestsView.tsx` |
| `/vendor/sales-requests` | Vendor workspace | Sales request intake / conversion | `src/app/vendor/sales-requests/page.tsx` |
| `/vendor/settings` | Vendor workspace | Vendor storefront settings | `src/app/vendor/settings/page.tsx`, `src/features/site/vendor/components/VendorSettingsView.tsx` |
| `/vendor/team` | Vendor workspace | Team management | `src/app/vendor/team/page.tsx`, `src/features/site/vendor/components/VendorTeamView.tsx` |
| `/vendor/verification` | Vendor workspace | Verification request submission/review state | `src/app/vendor/verification/page.tsx`, `src/features/site/vendor/components/VendorVerificationView.tsx` |
| `/admin/vendor-verifications` | Admin / master admin | Verification operations console | `src/app/admin/vendor-verifications/page.tsx` |

## API Endpoints

### Public and Auth APIs

| Endpoint | Methods | Auth | Purpose | Evidence |
| --- | --- | --- | --- | --- |
| `/api/auth/check-role` | `POST` | Bearer token | Read profile role and set cookies/debug output | `src/app/api/auth/check-role/route.ts: POST` |
| `/api/auth/ensure-vendor-role` | `POST` | Bearer token | Promote authenticated user profile to `vendor_user` | `src/app/api/auth/ensure-vendor-role/route.ts: POST` |
| `/api/auth/sync-profile` | `POST` | Bearer token | Sync auth/profile data into `profiles` | `src/app/api/auth/sync-profile/route.ts: POST` |
| `/api/listings` | `GET` | Public, local-dev relaxed | Public listing feed with promotion enrichment | `src/app/api/listings/route.ts: GET` |
| `/api/public/listings/[propertyId]` | `GET` | Public | Public listing detail and agency payload | `src/app/api/public/listings/[propertyId]/route.ts: GET` |
| `/api/public/listings/[propertyId]/view` | `POST` | Public | Increment listing view count | `src/app/api/public/listings/[propertyId]/view/route.ts: POST` |
| `/api/public/agencies/[slug]` | `GET` | Public | Public agency details by slug | `src/app/api/public/agencies/[slug]/route.ts: GET` |
| `/api/public/hero-promotions` | `GET` | Public | Public hero promotion feed | `src/app/api/public/hero-promotions/route.ts: GET` |
| `/api/public/inquiries` | `POST` | Mixed; validates requester and routes lead | Customer inquiry creation and agency routing | `src/app/api/public/inquiries/route.ts: POST` |
| `/api/public/sales-requests` | `POST` | Public/authenticated customer | Customer sales request submission with image upload | `src/app/api/public/sales-requests/route.ts: POST` |
| `/api/public/listing-reports` | `POST` | Public | Report a listing | `src/app/api/public/listing-reports/route.ts: POST` |
| `/api/public/vendor-invites/[token]` | `GET` | Public | Read invite metadata by token | `src/app/api/public/vendor-invites/[token]/route.ts: GET` |
| `/api/public/vendor-invites/accept` | `POST` | Bearer token | Accept invite, upsert profile, add membership, mark invite accepted | `src/app/api/public/vendor-invites/accept/route.ts: POST` |
| `/api/vendors/bootstrap` | `POST` | Bearer token | Create free vendor workspace and owner membership | `src/app/api/vendors/bootstrap/route.ts: POST` |

### Vendor Workspace APIs

| Endpoint | Methods | Auth | Purpose | Evidence |
| --- | --- | --- | --- | --- |
| `/api/vendor/workspace` | `GET`, `PATCH` | Vendor bearer token via `getVendorRequestContext` | Read/update vendor storefront and limits | `src/app/api/vendor/workspace/route.ts: GET/PATCH` |
| `/api/vendor/overview` | `GET` | Vendor | Hub overview metrics | `src/app/api/vendor/overview/route.ts: GET` |
| `/api/vendor/properties` | `GET` | Vendor | Listing collection scoped by workspace member IDs | `src/app/api/vendor/properties/route.ts: GET` |
| `/api/vendor/properties/[propertyId]` | `GET`, `PATCH`, `DELETE` | Vendor; owner/admin mutation only | Listing detail, update, delete | `src/app/api/vendor/properties/[propertyId]/route.ts: GET/PATCH/DELETE` |
| `/api/vendor/import/template` | `GET` | Vendor | Download bulk import template | `src/app/api/vendor/import/template/route.ts: GET` |
| `/api/vendor/import/preview` | `POST` | Vendor | Preview CSV/XLSX import rows | `src/app/api/vendor/import/preview/route.ts: POST` |
| `/api/vendor/import/images/preview` | `POST` | Vendor | Preview import image ZIP | `src/app/api/vendor/import/images/preview/route.ts: POST` |
| `/api/vendor/import/execute` | `POST` | Vendor; owner/admin only, non-free plan | Execute bulk property import | `src/app/api/vendor/import/execute/route.ts: POST` |
| `/api/vendor/logo-upload` | `POST` | Vendor | Upload logo into vendor brand bucket | `src/app/api/vendor/logo-upload/route.ts: POST` |
| `/api/vendor/cover-upload` | `POST` | Vendor | Upload storefront cover image | `src/app/api/vendor/cover-upload/route.ts: POST` |
| `/api/vendor/verification-document-upload` | `POST` | Vendor | Upload verification docs | `src/app/api/vendor/verification-document-upload/route.ts: POST` |
| `/api/vendor/verification` | `GET`, `POST` | Vendor; owner submit, owner/admin read | Verification state read and submission | `src/app/api/vendor/verification/route.ts: GET/POST` |
| `/api/vendor/team` | `GET`, `POST`, `PATCH` | Vendor; owner/admin, free-plan blocked | Team members, invites, role/status changes | `src/app/api/vendor/team/route.ts: GET/POST/PATCH` |
| `/api/vendor/inquiries` | `GET`, `PATCH` | Vendor | Lead inbox read and lead status mutation | `src/app/api/vendor/inquiries/route.ts: GET/PATCH` |
| `/api/vendor/inquiries/read` | `POST` | Vendor | Mark inquiries read | `src/app/api/vendor/inquiries/read/route.ts: POST` |
| `/api/vendor/inquiries/unread` | `GET` | Vendor | Inquiry unread count | `src/app/api/vendor/inquiries/unread/route.ts: GET` |
| `/api/vendor/inquiry-notes` | `POST`, `DELETE` | Vendor | Lead note create/delete | `src/app/api/vendor/inquiry-notes/route.ts: POST/DELETE` |
| `/api/vendor/inquiry-reminders` | `POST`, `PATCH`, `DELETE` | Vendor; owner/admin assignment path | Lead reminders / assignment helpers | `src/app/api/vendor/inquiry-reminders/route.ts: POST/PATCH/DELETE` |
| `/api/vendor/message-templates` | `POST` | Vendor | Saved message template create/update path | `src/app/api/vendor/message-templates/route.ts: POST` |
| `/api/vendor/viewing-requests` | `GET`, `PATCH` | Vendor | Viewing request queue and status updates | `src/app/api/vendor/viewing-requests/route.ts: GET/PATCH` |
| `/api/vendor/viewing-requests/read` | `POST` | Vendor | Mark viewing requests read | `src/app/api/vendor/viewing-requests/read/route.ts: POST` |
| `/api/vendor/viewing-requests/unread` | `GET` | Vendor | Viewing request unread count | `src/app/api/vendor/viewing-requests/unread/route.ts: GET` |
| `/api/vendor/appointments/dashboard` | `GET` | Vendor | Appointment dashboard and stats | `src/app/api/vendor/appointments/dashboard/route.ts: GET` |
| `/api/vendor/appointments/manage` | `POST`, `PATCH`, `DELETE` | Vendor; owner/admin assignment/edit | Appointment create, mutate, delete | `src/app/api/vendor/appointments/manage/route.ts: POST/PATCH/DELETE` |
| `/api/vendor/analytics/full` | `GET` | Vendor; owner/admin expected | Full analytics dataset | `src/app/api/vendor/analytics/full/route.ts: GET` |
| `/api/vendor/sales-requests` | `GET`, `POST` | Vendor | Sales request review/conversion | `src/app/api/vendor/sales-requests/route.ts: GET/POST` |
| `/api/vendor/promotions` | `GET`, `POST` | Vendor | Promotion drafts/listing and creation | `src/app/api/vendor/promotions/route.ts: GET/POST` |
| `/api/vendor/promotions/checkout` | `POST` | Vendor; owner only, verified vendor | Promotion payment/activation | `src/app/api/vendor/promotions/checkout/route.ts: POST` |
| `/api/vendor/billing/checkout` | `POST` | Vendor; owner for existing workspace | Vendor paid-plan checkout | `src/app/api/vendor/billing/checkout/route.ts: POST` |
| `/api/vendor/billing/dinger/callback` | `POST` | Dinger callback secret | Billing webhook reconciliation | `src/app/api/vendor/billing/dinger/callback/route.ts: POST` |

### Admin APIs

| Endpoint | Methods | Auth | Purpose | Evidence |
| --- | --- | --- | --- | --- |
| `/api/admin/vendor-verifications` | `GET`, `PATCH` | Admin/master admin via `getAdminRequestContext` | Review/approve/reject verification requests and document review state | `src/app/api/admin/vendor-verifications/route.ts: GET/PATCH`, `src/app/api/admin/_lib/context.ts` |

## Route-Level QA Notes

- Vendor API authorization is centralized through `getVendorRequestContext()` and scoped by active `vendor_members` rows plus optional `x-vendor-id` / `vendorId` selection. Evidence: `src/app/api/vendor/_lib/context.ts`.
- Admin API authorization is centralized through `getAdminRequestContext()`. Evidence: `src/app/api/admin/_lib/context.ts`.
- The route tree still contains both `/hub/*` and `/vendor/*` vendor-facing surfaces, which raises regression risk for duplicate functionality and access drift. Evidence: `src/app/hub/**`, `src/app/vendor/**`.
- No first-party automated tests were found under `src/**` during Phase 1 inventory. Evidence: `find src -type f \( -name '*.spec.*' -o -name '*.test.*' \)` returned no matches during audit.
