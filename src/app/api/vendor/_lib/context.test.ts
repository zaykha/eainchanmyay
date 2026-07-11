import { afterEach, describe, expect, it, vi } from "vitest";

type ContextScenario = {
  authUser?: { id: string; email?: string | null } | null;
  authError?: { message: string } | null;
  profileData?: Record<string, unknown> | null;
  profileError?: { message: string } | null;
  membershipRows?: Array<Record<string, unknown>>;
  membershipError?: { message: string } | null;
  memberRows?: Array<Record<string, unknown>>;
  memberRowsError?: { message: string } | null;
};

function createVendorMembersQueryMock(scenario: ContextScenario) {
  return {
    select(selectValue: string) {
      const isMembershipJoin = selectValue.includes("vendor:vendors(");
      const result = {
        data: isMembershipJoin ? scenario.membershipRows ?? [] : scenario.memberRows ?? [],
        error: isMembershipJoin ? scenario.membershipError ?? null : scenario.memberRowsError ?? null,
      };

      const query = {
        ...result,
        eq: vi.fn(() => query),
        order: vi.fn(async () => result),
        maybeSingle: vi.fn(async () => ({
          data: null,
          error: null,
        })),
      };

      return query;
    },
  };
}

function buildSupabaseMock(scenario: ContextScenario) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: scenario.authUser ?? null },
        error: scenario.authError ?? null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select() {
            return {
              eq() {
                return this;
              },
              maybeSingle: vi.fn(async () => ({
                data: scenario.profileData ?? null,
                error: scenario.profileError ?? null,
              })),
            };
          },
        };
      }

      if (table === "vendor_members") {
        return createVendorMembersQueryMock(scenario);
      }

      throw new Error(`Unexpected table mock request: ${table}`);
    }),
  };
}

async function loadContextModuleWithScenario(scenario: ContextScenario) {
  vi.resetModules();

  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

  const supabaseMock = buildSupabaseMock(scenario);

  vi.doMock("@supabase/supabase-js", () => ({
    createClient: vi.fn(() => supabaseMock),
  }));

  return import("@/app/api/vendor/_lib/context");
}

function createAuthorizedRequest(url = "https://example.com/api/vendor/test") {
  return new Request(url, {
    headers: {
      authorization: "Bearer token-123",
    },
  });
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unmock("@supabase/supabase-js");
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});

describe("getVendorRequestContext", () => {
  it("returns 401 when the bearer token is missing", async () => {
    const { getVendorRequestContext } = await loadContextModuleWithScenario({});
    const result = await getVendorRequestContext(new Request("https://example.com/api/vendor/test"));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(401);
    await expect(result.response.json()).resolves.toEqual({ error: "Missing authorization token." });
  });

  it("requires explicit workspace selection for multi-workspace users when requested", async () => {
    const { getVendorRequestContext } = await loadContextModuleWithScenario({
      authUser: { id: "user-1", email: "agent@example.com" },
      profileData: {
        id: "user-1",
        role: "vendor_user",
        full_name: "Agent",
        email: "agent@example.com",
      },
      membershipRows: [
        { role: "owner", status: "active", vendor: { id: "vendor-1", name: "One", vendor_type: "agency", plan: "free" } },
        { role: "admin", status: "active", vendor: { id: "vendor-2", name: "Two", vendor_type: "agency", plan: "free" } },
      ],
    });

    const result = await getVendorRequestContext(createAuthorizedRequest(), {
      requireExplicitVendorSelection: true,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(400);
    await expect(result.response.json()).resolves.toEqual({
      error: "Select an active vendor workspace before accessing this endpoint.",
    });
  });

  it("blocks paid workspaces without active billing by default", async () => {
    const { getVendorRequestContext } = await loadContextModuleWithScenario({
      authUser: { id: "user-1", email: "agent@example.com" },
      profileData: {
        id: "user-1",
        role: "vendor_user",
        full_name: "Agent",
        email: "agent@example.com",
      },
      membershipRows: [
        {
          role: "owner",
          status: "active",
          vendor: {
            id: "vendor-1",
            name: "Paid Agency",
            vendor_type: "agency",
            plan: "pro",
            billing_status: "pending",
          },
        },
      ],
      memberRows: [{ user_id: "user-1" }],
    });

    const result = await getVendorRequestContext(createAuthorizedRequest("https://example.com/api/vendor/test?vendorId=vendor-1"));

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(402);
    await expect(result.response.json()).resolves.toEqual({
      error: "Billing activation required before accessing the paid vendor workspace.",
    });
  });

  it("returns the requested workspace context when auth, membership, and billing checks pass", async () => {
    const { getVendorRequestContext } = await loadContextModuleWithScenario({
      authUser: { id: "user-1", email: "agent@example.com" },
      profileData: {
        id: "user-1",
        role: "vendor_user",
        full_name: "Agent",
        email: "agent@example.com",
      },
      membershipRows: [
        {
          role: "owner",
          status: "active",
          vendor: {
            id: "vendor-1",
            name: "One Agency",
            vendor_type: "agency",
            plan: "free",
            billing_status: "inactive",
            slug: "one-agency",
            logo_url: null,
            verified_status: "approved",
          },
        },
        {
          role: "admin",
          status: "active",
          vendor: {
            id: "vendor-2",
            name: "Two Agency",
            vendor_type: "agency",
            plan: "growth",
            billing_status: "active",
            slug: "two-agency",
            logo_url: "https://example.com/logo.png",
            verified_status: "pending",
          },
        },
      ],
      memberRows: [{ user_id: "user-1" }, { user_id: "user-2" }],
    });

    const request = new Request("https://example.com/api/vendor/test?vendorId=vendor-2", {
      headers: {
        authorization: "Bearer token-123",
        "x-vendor-id": "vendor-2",
      },
    });

    const result = await getVendorRequestContext(request, {
      requireExplicitVendorSelection: true,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.context.vendor.id).toBe("vendor-2");
    expect(result.context.vendor.name).toBe("Two Agency");
    expect(result.context.vendor.plan).toBe("growth");
    expect(result.context.membership.role).toBe("admin");
    expect(result.context.workspaces).toHaveLength(2);
    expect(result.context.memberIds).toEqual(["user-1", "user-2"]);
  });
});
