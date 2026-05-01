# Implementation Checklist

## Recommendation First

Do **not** put a hard paid gate first.

The current repo already has enough vendor workspace basics to support a `Free` tier, but many of the features that justify `Pro`, `Growth`, and `Verified` are still missing or only partial. If you gate too early, paid tiers will sell a promise instead of a finished product.

Recommended rollout order:

- [x] Keep `Free` available first.
- [x] Add the plan chooser right after vendor signup.
- [x] Let `Free` continue immediately.
- [-] Show paid tiers in the chooser, but only enable checkout when the matching value is actually implemented.
  Paid tiers are live in the chooser. `Pro` and `Growth` now have their core product value in place; `Verified` still has remaining compliance and insight depth gaps.
- [x] Implement plan storage and limits before Dinger checkout.
- [x] Implement `Pro`-level real lead inbox and basic analytics before charging for `Pro`.
- [x] Implement `Growth` CRM features before charging for `Growth`.
- [-] Implement manual verification, compliance, and branding before charging for `Verified`.
  Manual verification and branding are built, but compliance tooling and richer market insight depth are still partial.

Short version:

- `Gate first`: only for plan selection and future tier positioning.
- `Charge first`: no.
- `Capability first`: yes.

## Status Legend

- `[x] Done`
- `[-] Partial`
- `[ ] Not done`

## Current Repo Status vs Planned Feature Matrix

### Monetization / Gating

- [x] Plan chooser after vendor signup
  Vendor users now land in `/vendor-setup`, select a plan, and only enter the vendor workspace when the workspace is free or the paid billing state is active.
- [-] Billing and payment integration
  Dinger checkout creation and callback handling now exist in the repo, but the integration still depends on merchant-side Dinger callback/return configuration and has not been end-to-end verified in production.
- [ ] Monthly subscription management
  No subscription lifecycle, renewal, billing status, or invoice history.
- [ ] Pay-per-listing logic
  No listing charges or exposure charges implemented.
- [-] Plan enforcement
  Listing and seat usage are now surfaced in the vendor workspace, and some API paths enforce limits, but enforcement is not yet complete across every listing creation and feature-access path.

### Listings

- [x] Property listings
  Vendor property workspace exists with list/detail/edit flows and vendor-scoped APIs.
- [x] Listing status: active / sold / rented / archived / draft
  Statuses are implemented in vendor property editing and dashboard metrics.
- [-] Draft / preview before publish
  Draft status exists. Dedicated preview flow is not present.
- [ ] Scheduled publishing
  No scheduled publish date, job, or automation.
- [x] Bulk upload
  CSV/XLSX template download, spreadsheet preview parsing, zip filename matching, missing-image validation, R2 image upload, and property import execution now exist.
- [-] Multi-language listings (MM / EN / ZH / TH)
  The app UI has multilingual support, but listing content itself is not modeled as translated per-language fields.

### Lead Capture

- [x] Property inquiries
  Public inquiry creation and user inquiry history exist.
- [x] Buyer request / looking-for-property flow
  Inquiry submission flow exists and can be edited by the user.
- [x] Viewing request
  Public viewing requests and vendor viewing request inbox exist.
- [x] Central lead inbox
  Vendor inquiries are now stored as direct vendor-linked leads and shown in a real inbox instead of the old best-fit matching feed.
- [x] Lead routing to agent
  Inquiry leads can now be assigned to active vendor members, with owner/admin assignment controls in the inbox.
- [x] Inquiry status tracking
  Vendor inquiry leads now support statuses (`new`, `contacted`, `qualified`, `closed`, `lost`) and viewing requests already support their own lead statuses.

### Agency Ops

- [x] Agency profile page
  Vendors can now publish a public agency storefront with branding, strengths, contact points, and a public listing feed.
- [x] Team management
  Vendor team screen and API exist for adding and updating members.
- [x] Roles (owner / admin / agent)
  The DB backfill normalizes `staff` to `agent`, and the current vendor team flow now uses `owner`, `admin`, and `agent`.
- [x] Listing ownership by agent
  Properties are scoped by `created_by`, so ownership exists at a basic level.
- [x] Internal notes
  Vendor inquiry leads now support internal notes in the CRM inbox.
- [x] Follow-up reminders
  Vendor inquiry leads now support reminder scheduling and reminder status tracking.
- [-] Appointment calendar
  Appointments are counted and surfaced in dashboard data, but there is no actual calendar UI or calendar management workflow.

### CRM / Sales

- [x] Lead pipeline stages
  Vendor inquiry leads now support pipeline stages from `new_lead` through `won` and `lost`.
- [ ] Auto-assignment rules
  No assignment engine.
- [x] SLA / response time tracking
  Vendor inquiry leads now carry an SLA due time and overdue visibility in the CRM inbox, though advanced alerting/reporting is still not built.
- [-] Commission tracking
  `commission_percent` appears in public sales request submission, but there is no vendor-facing commission tracking workflow.
- [x] Templates
  Vendor CRM now supports saved message templates for inquiry follow-up.

### Analytics

- [x] Listing views
  Public listing detail pages now write view events, and the vendor dashboard surfaces listing view totals and top viewed listings.
- [x] Inquiry and conversion analytics
  Vendor dashboard now includes routed lead counts, qualified/closed/lost counts, lead conversion, and view-to-lead rate.
- [x] Per-agent performance
  Vendor dashboard now includes per-agent listing, view, appointment, and lead performance summaries.
- [-] Demand heatmap (township / price)
  Market insight coverage now includes top demand townships and property demand mix, but not a map visualization or true budget-band analytics yet.
- [x] Basic vendor dashboard
  Dashboard now includes listing mix, value, team size, listing views, lead funnel metrics, agent performance, and market insight summaries.

### Trust / Compliance

- [x] Agency verification
  Vendors can now submit verification requests, and platform admins can approve, reject, or request changes from an admin review queue.
- [x] Verified listings
  Properties can now be submitted for verification review and approved into a real verified listing state.
- [-] Document storage (titles, authority docs)
  Verification document collection now exists through stored document URLs on the review request. Managed file upload/storage is still left.
- [ ] KYC (agency / agent)
  No KYC flow found.
- [ ] Audit log (who changed what / when)
  No audit log system found.

### Buyer Experience

- [x] Save / shortlist
  Saved properties flow exists on listing pages and account page.
- [x] Inquiry history
  Logged-in users can view their inquiries, viewing requests, saved properties, and sales requests in account history.

### Myanmar-Specific

- [ ] Low-bandwidth mode
  No explicit low-data or lite mode found.
- [ ] Offline draft saving
  No offline draft persistence found.
- [ ] WhatsApp contact
  No WhatsApp integration found.
- [ ] Viber / Telegram support
  No Viber or Telegram integration found.

## What You Can Realistically Sell Right Now

### Safe to Position Now

- [x] Free tier
- [x] Agency workspace
- [x] Team seats at a basic level
- [x] Listing management
- [x] Viewing requests
- [x] Buyer inquiry intake
- [x] Basic dashboard
- [x] Agency branding page
- [x] Basic analytics

### Not Safe to Sell Yet as Tier Drivers

- [x] CRM pipeline
- [ ] Auto assignment
- [x] SLA tracking
- [-] Verified badge and verified listings
  The manual review workflow and verified flags are implemented, but richer compliance operations and field validation still need to mature.
- [ ] Compliance tools
- [-] Market insights
- [-] Billing and paid subscription flow
  Paid checkout and callback handling now exist, but merchant callback configuration and end-to-end payment verification are still pending.

## Suggested Tier Rollout Based on Current State

### Phase 1: Free + Plan Selection

- [x] Add post-signup plan chooser for vendor users.
- [x] Default new vendors to `Free`.
- [x] Store selected plan on `vendors`.
  New workspaces default to `free`, paid checkout writes pending paid plans, and DB backfill has normalized old vendor plan data.
- [x] Rename workspace role model to match business use:
  - `owner`: full control
  - `admin`: manager who assigns and operates
  - `agent`: field agent who handles listings and showings
  DB backfill normalizes `staff` to `agent`, and the vendor team UI/API now use the agent language consistently.
- [-] Add soft limits only:
  - [x] listing count warning
  - [x] seat count warning
  - [x] upgrade prompts
  - [-] no hard enforcement yet
    API enforcement now blocks new seat creation and vendor listing requests over plan limits, but older listing creation paths still need cleanup.
- [x] `Free` continues without payment.
- [x] Paid tiers must pay before using paid features.
  Paid checkout now creates a pending billing state, vendor shell access is blocked until billing becomes `active`, and failed/canceled callbacks downgrade the workspace back to `free`.

### Phase 2: Real Pro

- [x] Convert vendor inquiries into a true lead inbox linked to vendor.
- [x] Add lead status tracking.
- [-] Add seat and listing limit enforcement.
- [x] Add basic analytics that justify `Pro`.
- [x] Then enable Dinger checkout for `Pro`.

### Phase 3: Real Growth

- [x] CRM pipeline stages
- [-] Manual and auto lead assignment
  Manual assignment exists in the inquiry inbox. Auto-assignment rules are still missing.
- [x] SLA response tracking
- [x] Templates
- [-] Then enable `Growth` sales positioning.
  The core Growth workflow is present, but auto-assignment is still missing.

### Phase 4: Real Verified

- [x] Manual verification workflow
- [x] Verified agency badge
- [x] Verified listing status
- [x] Public agency storefront / branding page
- [-] Compliance and document review
- [-] Market insight features
- [-] Then enable `Verified` tier positioning and payment.
  The package is mostly present, but deeper compliance tooling and richer insight depth are still pending.

## Build Order Status

### Phase 1: Vendor Onboarding Gate

- [x] Route vendor signups to plan selection
- [x] Keep Free as immediate workspace access
- [x] Stop silent vendor auto-bootstrap in vendor routes

### Phase 2: Plan Persistence and Access Rules

- [x] Normalize plan values in DB
- [x] Normalize `staff` to `agent` in DB
- [x] Shared vendor plan config
- [x] Workspace/dashboard plan usage summaries
- [x] Seat-limit soft gating in UI
- [x] Listing-limit soft gating in UI
- [x] API enforcement for team seats
- [-] API enforcement for all listing creation paths

### Phase 3: Dinger Billing

- [x] Paid checkout creation endpoint
- [x] Dinger callback endpoint
- [x] Pending paid workspace state
- [x] Paid workspace access blocked until billing is active
- [x] Failed/canceled payment fallback to Free
- [ ] Merchant callback URL configured in Dinger dashboard
- [ ] End-to-end payment verification in staging/production

### Phase 4: Lead Operations

- [x] Vendor viewing requests now act as a real lead queue with status tracking
- [x] Direct vendor linkage for general buyer inquiries
- [ ] Shared lead inbox across inquiries and viewing requests
- [-] Lead assignment to owner/admin/agent
  Inquiry leads support owner/admin assignment to agents. Viewing requests do not yet share the same assignment surface.

## Verified Package Rule

- [x] Verification must stay a separate manual workflow from tier activation.
- [ ] Lower paid tiers can purchase verification as an add-on.
- [x] Highest paid tier includes verification in-package, but still requires manual approval.
- [x] Payment alone must never auto-grant verified status.
- [x] Verification should require:
  - agency review
  - document review
  - manual admin approval

## Confirmed Business Rules

- [x] Team roles should map to real estate operations:
  - `owner`: hires team, full jurisdiction
  - `admin`: manager who assigns agents
  - `agent`: field staff who show properties and handle leads
- [x] Agency profile page means a public storefront page.
- [x] Verification is manual.
- [x] Verification is separate from the tier itself for lower tiers.
- [x] Highest paid tier includes verification as part of the package, but still needs manual approval.
- [x] Agencies on paid tiers should pay before using paid-tier features.
- [x] Bulk upload is desired for both CSV and Excel if feasible.
- [x] Platform admin groundwork exists separately, but vendor-facing admin tools are not built yet.

## Open Questions To Confirm

- [x] For bulk upload images, do you want import by public image URLs first, or do you also need zip-based local image upload in phase 1?
- [x] Are paid agencies blocked completely until payment succeeds, or should they be able to enter the workspace but only see a billing/paywall screen?

## Final Decisions Captured

- [x] Paid agencies are fully blocked from workspace access until payment succeeds.
- [x] If paid checkout is canceled or abandoned, the vendor falls back to `Free` and can upgrade later.
- [x] Bulk upload should support spreadsheet data plus local image mapping, not public image URLs.
- [x] Image import should target folder/zip style upload and platform-side mapping/reformatting.

## Bulk Upload Recommendation

For Myanmar agency usability, the right import model is:

- [x] Upload `CSV` or `Excel`
- [-] Upload one image folder or zip in the same flow
  Zip upload exists. Direct folder upload is not built yet.
- [x] Match images by file name from spreadsheet columns such as:
  - `cover_image`
  - `image_2`
  - `image_3`
- [x] Platform validates missing files before import
- [x] Platform uploads and rehosts images internally
- [x] Vendor never needs to provide public image URLs

Recommended phase split:

- [x] Phase 1: Excel + CSV + zip upload with filename matching
- [ ] Phase 2: drag-and-drop folder support in browser if needed
- [ ] Phase 3: saved import templates and error re-upload flow

## Practical Next Step

The best next implementation sequence is:

- [x] Add `plan chooser` after vendor signup
- [x] Add `Free` plan persistence on vendor
- [x] Add soft limit checks and upgrade prompts
- [x] Rebuild vendor inquiries into a true lead inbox
- [x] Add lead status tracking
- [x] Only then wire Dinger for paid tiers

## Build Order

This build order is aligned to the current repo, where auth, vendor shell, workspace bootstrap, team, listings, and dashboard already exist in partial or usable form.

### 1. Vendor Onboarding Gate

- [x] Stop automatic vendor workspace bootstrap from auth redirect
- [x] Stop automatic vendor workspace bootstrap from vendor shell fallback
- [x] Add a dedicated vendor setup page outside the vendor shell
- [x] Show plan selection there
- [x] Let `Free` create workspace immediately
- [x] Keep paid plans blocked until billing is implemented

Why first:

- This changes the control point for the whole monetization system.
- It is low-risk because it reuses existing auth and bootstrap logic.
- It prevents the app from granting paid-style access before billing exists.

### 2. Plan Persistence and Access Rules

- [x] Normalize vendor plan values on `vendors.plan`
- [x] Add shared plan config in code
- [x] Add helpers for plan checks
- [-] Add soft gating in:
  - [x] team seats
  - [x] listing creation
  - [x] settings
  - [x] dashboard upgrade prompts
  - [x] API-side seat enforcement for team invites
  - [x] API-side listing enforcement for vendor listing submissions
  - [ ] broader enforcement and old-flow cleanup still pending

Why second:

- You need a stable plan model before Dinger, verification, or feature gating.

### 3. Dinger Billing Flow

- [x] Add checkout creation endpoint
- [x] Add Dinger return / callback handling
- [x] Add webhook verification
- [x] Activate paid plan only after verified success
- [x] Keep canceled or failed checkout on `Free`

Why third:

- Paid agencies must pay before access.
- This is the first point where `Pro`, `Growth`, and `Verified` become usable.

### 4. Paid Access Blocking

- [x] If a vendor selected a paid plan but has no successful payment, block workspace access
- [-] Show upgrade or payment recovery screen
- [x] Allow downgrade or fallback to `Free`

Why fourth:

- This is the enforcement layer that makes billing real in production.

### 5. Bulk Upload Foundation

- [x] Add import template for CSV and Excel
- [x] Add spreadsheet parser
- [x] Add zip image upload
- [x] Map spreadsheet filename fields to uploaded images
- [x] Validate missing images before import
- [x] Store and rehost imported images

Why fifth:

- It is a major operational feature, especially for agencies.
- It should land before pushing hard on paid acquisition.

### 6. Real Lead Inbox

- [x] Replace best-fit inquiry matching with direct vendor-linked leads
- [x] Add inbox statuses
- [x] Add assignment targets by `agent`
- [x] Add owner/admin assignment controls

Why sixth:

- This is the actual `Pro` value, not just access control.

### 7. CRM Layer

- [x] Pipeline stages
- [x] notes
- [x] reminders
- [x] templates
- [x] SLA tracking

Why seventh:

- This is what differentiates `Growth`.

### 8. Agency Storefront

- [x] Public agency profile page
- [x] Branding fields
- [x] Agency strengths / badges / contact points
- [x] Public agency listing feed

Why eighth:

- This supports both trust and premium positioning.

### 9. Verification Ops

- [x] Verification request flow
- [x] Document collection
- [x] Admin review states
- [x] Verified agency badge
- [x] Verified listing flag

Why ninth:

- `Verified` is a separate manual operational system, not just billing.

### 10. Analytics Expansion

- [x] listing views
- [x] inquiry conversion
- [x] per-agent performance
- [-] market insights

Why last:

- Useful, but not the first blocker for paid onboarding.

## What Is Left

### Ops / Deployment

- [ ] Run remaining Supabase SQL files if not already applied:
  - `supabase/vendor_inquiry_leads.sql`
  - `supabase/vendor_crm_layer.sql`
  - `supabase/vendor_storefront.sql`
  - `supabase/vendor_verification_ops.sql`
  - `supabase/vendor_analytics_expansion.sql`
- [ ] Configure the Dinger merchant callback URL in the Dinger dashboard.
- [ ] Verify all required Dinger env vars in the deployed app.
- [ ] Run end-to-end payment testing for:
  - successful payment
  - canceled checkout
  - failed payment

### Product Gaps Still Left

- [ ] Monthly subscription lifecycle and renewal handling.
- [ ] Pay-per-listing or exposure billing logic, if you still want it.
- [ ] Auto-assignment rules for leads.
- [ ] Shared inbox that combines inquiry leads and viewing requests.
- [ ] Deeper compliance tooling beyond document URLs.
- [ ] KYC for agencies and agents.
- [ ] Audit log for vendor/admin actions.
- [ ] Heatmap-style market insights and budget-band demand analytics.

### UX / Workflow Polish

- [ ] Payment recovery / retry screen for interrupted paid onboarding.
- [ ] Complete plan enforcement across every remaining legacy listing path.
- [ ] Direct folder upload for bulk import, if you want it instead of zip-only.
- [ ] Saved import templates and better re-upload / error recovery for bulk import.
- [ ] Real appointment calendar UI instead of appointment counts only.

https://eainchanmyay.vercel.app