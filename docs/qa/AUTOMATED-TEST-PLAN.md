# Automated Test Plan

Scope: initial local regression pipeline added in Phase 2. This is intentionally the smallest high-value suite.

## Current Automated Baseline

Runner and scripts:

- `vitest` via [package.json](/Users/thihanaing/eainchanmyay/package.json)
- config in [vitest.config.ts](/Users/thihanaing/eainchanmyay/vitest.config.ts)
- full local gate in `check`: `eslint . && tsc --noEmit && vitest run`

Current test files:

- [src/app/api/vendor/_lib/context.test.ts](/Users/thihanaing/eainchanmyay/src/app/api/vendor/_lib/context.test.ts)
- [src/app/api/vendor/properties/[propertyId]/route.test.ts](/Users/thihanaing/eainchanmyay/src/app/api/vendor/properties/%5BpropertyId%5D/route.test.ts)
- [src/lib/lifecycle.test.ts](/Users/thihanaing/eainchanmyay/src/lib/lifecycle.test.ts)
- [src/lib/vendor-permissions.test.ts](/Users/thihanaing/eainchanmyay/src/lib/vendor-permissions.test.ts)
- [src/lib/vendor-promotions.test.ts](/Users/thihanaing/eainchanmyay/src/lib/vendor-promotions.test.ts)
- [src/lib/vendor-team-rules.test.ts](/Users/thihanaing/eainchanmyay/src/lib/vendor-team-rules.test.ts)
- [src/lib/vendor-invites.test.ts](/Users/thihanaing/eainchanmyay/src/lib/vendor-invites.test.ts)
- [src/lib/vendor-property-rules.test.ts](/Users/thihanaing/eainchanmyay/src/lib/vendor-property-rules.test.ts)
- [src/lib/vendor-context-rules.test.ts](/Users/thihanaing/eainchanmyay/src/lib/vendor-context-rules.test.ts)

## Why This Slice First

These modules are pure business logic with high regression value and low setup cost:

- lifecycle normalization and transition rules
- vendor workspace role permissions
- promotion eligibility and active-window logic
- team invite and seat-management guards
- invite acceptance validation
- property ownership and listing status mutation rules
- vendor workspace selection and billing-access gating

This gives immediate protection for status handling, paid visibility behavior, and authorization assumptions without requiring Next.js route mocks or a test database.

Phase 5 adds mocked handler-level coverage for the first server composition paths:

- vendor auth-context assembly with mocked Supabase responses
- vendor property PATCH authorization and lifecycle validation

## Current Coverage

### Covered now

- Listing, lead, and appointment status normalization
- Allowed and disallowed lifecycle transitions
- Public listing visibility helpers
- Workspace role normalization
- Owner-only versus owner/admin capabilities
- Promotion type/target/status normalization
- Promotion eligibility by listing status
- Promotion active-window evaluation
- Hero and boosted promotion selection ordering
- Search-ranking bonus behavior
- Team seat role/status normalization
- Owner versus admin invite restrictions
- Seat management restrictions, including self-edit blocking
- Invite acceptance checks for status, expiry, email match, and accepted role normalization
- Vendor property creator-ownership checks
- Listing status mutation validation before route persistence
- Bearer token parsing and requested workspace selection
- Explicit workspace-selection enforcement for multi-agency users
- Paid-plan billing gate decisions before vendor workspace access
- `getVendorRequestContext()` response behavior for missing token, multi-workspace selection, billing gating, and successful workspace resolution
- Vendor property PATCH handler behavior for unauthorized roles, cross-workspace property access, invalid status transitions, and successful updates

### Not covered yet

- Most route handlers under `src/app/api/**`
- Broader Supabase-backed authorization and cross-agency isolation
- Invite acceptance and team mutation flows at handler level
- Bulk import parsing and execution paths
- Billing checkout and webhook reconciliation
- Verification review workflows
- UI rendering and mobile behavior

## Recommended Next Slices

1. Integration tests for the next authorization-critical handlers
   Target: team invite acceptance, admin verification review, and one billing/promotion gate handler.

2. Vitest route-adjacent business logic for remaining areas
   Target: extract testable validation/helpers from import, billing, and verification routes.

3. Playwright smoke flows
   Target: auth, onboarding, listing edit/publish, lead inbox, appointment management, and promotion purchase gating.

## Execution Notes

- This phase adds test code and scripts only.
- Lockfile refresh and local execution depend on a working Node package manager in the developer environment.
