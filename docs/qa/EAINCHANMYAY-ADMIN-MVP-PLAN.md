# Eain Chan Myay Admin MVP Plan

This note is intended for the `eainchanmyay_admin` repository.

## Goal

Reframe `eainchanmyay_admin` into a clean internal platform-operations dashboard for beta.

It should no longer be centered around internal property CRUD, appointment management, or staff workflow as the main product story.

It should become an internal ops and customer-service dashboard focused on:

- agencies and vendors
- subscriptions and beta access
- verification and moderation
- support resolution
- high-level platform usage

## Scope Decision

Keep `eainchanmyay_admin` focused on:

- platform overview
- agencies
- subscriptions
- moderation
- support

Deprioritize or remove as primary navigation concepts:

- property creation/edit as the main purpose of the admin
- staff appointment calendar as the main dashboard story
- sales-request conversion as a primary workflow

The marketplace app already contains the operational vendor experience. This app should be platform ops only.

## Product Rules Confirmed

### User counting

- `total users` = all unique accounts
- do not duplicate agents across multiple vendors
- `total customer accounts` = non-vendor / non-agency accounts

Recommended implementation:

- base counts from `profiles`
- define customer accounts with a stable rule from profile role and vendor membership usage

### Suspension behavior

For suspended agencies:

- block hub/vendor workspace access
- keep personal account access available
- do not let the agency operate in the vendor workspace

Recommended MVP rule:

- suspended agency => no hub access

Optional later rule:

- also hide public storefront and public listings

### Manual plan changes

Recommended MVP approach:

- keep `vendors` as the source of truth for current plan/billing fields
- allow direct plan/billing updates for support operations
- require an audit row for every manual override

This is the best MVP tradeoff between speed and control.

### Platform health

Do not build deep technical monitoring first.

For beta, platform health should mean business and support health:

- are users able to use the app
- are agencies active
- are subscriptions working
- are verification and moderation queues moving
- can support resolve agency/payment issues

## Current Repo Assessment

The current `eainchanmyay_admin` repo already has useful foundations:

- Next.js admin shell
- auth gating for `staff`, `admin`, `master_admin`
- Supabase server/service client structure
- admin layout and navigation
- route and API patterns for CRUD-style pages
- internal user-management patterns

But it is not yet a platform-ops dashboard.

Current repo emphasis is mostly:

- properties
- appointments
- viewing requests
- inquiries
- sales requests
- internal staff user management

The largest gap is domain coverage.

The repo currently has little to no real platform-ops handling for:

- `vendors`
- `vendor_members`
- `vendor_payments`
- `vendor_promotions`
- `vendor_verification_requests`
- `listing_reports`
- agency suspension/reactivation
- subscription overrides
- beta/premium extensions

## Recommended Information Architecture

Primary navigation for beta:

1. Overview
2. Agencies
3. Subscriptions
4. Moderation
5. Support

Optional later:

6. Audit Log
7. Platform Health

## Beta v1 Sections

### 1. Overview

Show:

- total agencies
- active agencies
- suspended agencies
- total users
- total customer accounts
- total listings
- active listings
- total inquiries
- inquiries last 7 days
- inquiries last 30 days
- pending verifications
- reported listings count
- active paid agencies

This page should be quick, operational, and readable rather than chart-heavy.

### 2. Agencies

Agency list should support:

- search by agency name or slug
- filter by plan
- filter by billing status
- filter by verification status
- filter by suspended status

Show per row:

- agency name
- slug
- plan
- billing status
- verification status
- listing count
- last activity
- suspended status

Agency detail page should show:

- organization details
- plan and billing state
- verification state
- member count
- listing count
- inquiry count
- recent activity
- support/admin notes if added

Actions:

- suspend agency
- reactivate agency
- approve verification
- reject or request changes
- change plan
- extend beta/premium period
- inspect agency listings

### 3. Subscriptions

Show:

- count of Free
- count of Pro
- count of Growth
- count of Verified
- active subscriptions
- pending subscriptions
- expired/inactive subscriptions
- manually granted premium access
- beta extensions
- support-needed payment cases

This does not need revenue analytics yet.

The purpose is:

- plan visibility
- support handling
- manual correction capability

### 4. Moderation

Show:

- reported listings
- hidden listings
- verification queue
- rejected verification cases
- agencies needing attention

Actions:

- view reported listing
- hide listing
- remove listing
- approve verification
- reject verification
- request changes

### 5. Support

Purpose:

- customer-service and agency-support resolution

Show:

- payment issue cases
- agency access issues
- verification help cases
- failed onboarding cases if detectable

Actions:

- search user
- search agency
- inspect account state
- fix plan access
- reactivate agency
- extend access manually
- write resolution notes or audit notes

## Minimal Admin Controls for Beta

Build these first:

- search users
- search agencies
- view agency details
- suspend/reactivate agency
- approve verification
- change plan manually
- extend beta or premium period
- hide or remove listing
- view reported listings

These controls are more important than advanced visual analytics.

## Recommended MVP Data Model Additions

### Manual override audit table

Recommended table: `admin_plan_overrides`

Suggested fields:

- `id`
- `vendor_id`
- `action_type`
- `previous_plan`
- `new_plan`
- `previous_billing_status`
- `new_billing_status`
- `effective_until`
- `reason`
- `performed_by`
- `created_at`

Suggested `action_type` values:

- `manual_upgrade`
- `manual_downgrade`
- `beta_extension`
- `premium_extension`
- `payment_fix`
- `reactivation`
- `suspension`

This is the minimum safe audit layer for plan/support actions.

### Optional second table

If support notes are needed separately from billing overrides:

- `admin_support_notes`

Suggested fields:

- `id`
- `target_type` (`vendor`, `user`, `listing`, `payment`)
- `target_id`
- `note`
- `status`
- `created_by`
- `created_at`

For beta, this can wait if the override audit trail is enough.

## Recommended Queries / Data Sources

The new dashboard should be built around these marketplace-side entities:

- `profiles`
- `vendors`
- `vendor_members`
- `properties`
- `vendor_payments`
- `vendor_promotions`
- `vendor_verification_requests`
- `vendor_verification_documents`
- `listing_reports`
- `inquiries`
- `viewing_requests`
- `appointments`

Key missing work in `eainchanmyay_admin` is adding these agency/vendor-centric queries and actions.

## What to Remove or Deprioritize in Navigation

Reduce or remove as top-level nav items:

- Properties
- Viewing Requests
- Sales Requests
- Inquiries

These can still exist as linked drill-down tools if useful, but they should not define the admin product.

Replace them with:

- Overview
- Agencies
- Subscriptions
- Moderation
- Support

## Recommended Build Phases

### Phase 1

Refactor app structure and navigation:

- rename the dashboard concept around platform ops
- simplify top-level navigation
- keep existing auth and layout shell

### Phase 2

Add platform overview data:

- overview page
- top-line metrics
- basic active/inactive agency summaries

### Phase 3

Add agencies module:

- agencies list
- agency detail page
- vendor/member/listing summary

### Phase 4

Add subscription operations:

- plan counts
- billing states
- manual plan change
- beta/premium extension
- audit logging

### Phase 5

Add moderation:

- listing reports
- verification queue
- hide/remove listing

### Phase 6

Add support workflows:

- issue lookup
- access problems
- payment issue handling
- support notes or audit resolution history

## Beta v1 Build Order

1. Overview
2. Agencies list
3. Agency detail
4. Subscriptions
5. Moderation
6. Admin actions
7. Audit log

## MVP Plan Handling

Source of truth:

- current plan and billing state remain on `vendors`

Admin actions allowed:

- change plan manually
- activate premium manually
- extend beta/premium end date
- reactivate suspended paid access
- record payment support resolution

Required safeguard:

- every manual change must write an audit record

Reason:

- simple to build
- safe enough for beta
- support-friendly
- avoids silent state changes

## Suggested First Implementation Cut

If only the highest-value MVP slice is built first, do this:

1. Overview page
2. Agencies page
3. Agency detail page
4. Subscriptions page
5. Moderation page
6. Actions:
   - suspend/reactivate agency
   - approve verification
   - change plan
   - extend beta/premium
   - hide/remove listing
7. Audit log

That is the cleanest beta version of an internal platform dashboard for Eain Chan Myay.
