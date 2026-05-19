# TODO

- [ ] Create a permission hardening plan for P0 role gating (vendor listing mutations + bulk import endpoints only)
- [ ] Identify exact route handlers for listing create/update/delete/publish/archive and bulk import template/preview/ZIP/image preview/execute
- [ ] Implement backend role checks (owner/admin allowed; staff/agent rejected with 403) using `result.context.membership.role`
- [ ] Ensure property mutations can’t target other vendors by verifying `created_by` belongs to current workspace memberIds
- [ ] Ensure staff/agent can still access listing detail read-only endpoints
- [ ] Keep changes minimal; avoid public profile/org settings/branding uploads/P1 areas
- [ ] Record: files changed, exact routes hardened, role behavior per route, routes that couldn’t be fully hardened + why
- [ ] Add manual QA checklist

