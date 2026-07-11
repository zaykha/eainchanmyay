import { afterEach, describe, expect, it, vi } from "vitest";

type PropertyRecord = {
  id: string;
  created_by: string | null;
  status: string | null;
};

function createPropertiesSupabaseMock(property: PropertyRecord | null, updateError: { message: string } | null = null) {
  const updateEq = vi.fn().mockResolvedValue({ error: updateError });
  const updateIsDeletedEq = vi.fn(() => ({
    eq: updateEq,
  }));
  const updateMock = vi.fn(() => ({
    eq: updateIsDeletedEq,
  }));

  return {
    updateMock,
    supabase: {
      from: vi.fn((table: string) => {
        if (table !== "properties") {
          throw new Error(`Unexpected table: ${table}`);
        }

        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({
                  data: property,
                  error: null,
                })),
              })),
            })),
          })),
          update: updateMock,
        };
      }),
    },
  };
}

async function loadPatchRouteWithContext(contextResult: Awaited<ReturnType<typeof buildContextResult>>, property: PropertyRecord | null) {
  vi.resetModules();

  const { supabase, updateMock } = createPropertiesSupabaseMock(property);

  vi.doMock("@/app/api/vendor/_lib/context", () => ({
    getVendorRequestContext: vi.fn(async () => {
      if (!contextResult.ok) {
        return contextResult;
      }

      return {
        ok: true as const,
        context: {
          ...contextResult.context,
          supabase,
        },
      };
    }),
  }));

  const routeModule = await import("@/app/api/vendor/properties/[propertyId]/route");
  return { PATCH: routeModule.PATCH, updateMock };
}

function buildContextResult(overrides?: Partial<{
  memberIds: string[];
  membershipRole: string;
}>) {
  return {
    ok: true as const,
    context: {
      supabase: null as never,
      memberIds: overrides?.memberIds ?? ["member-1"],
      membership: {
        role: overrides?.membershipRole ?? "owner",
        status: "active",
      },
      user: { id: "member-1", email: "agent@example.com" },
      profile: {
        id: "member-1",
        role: "vendor_user",
        full_name: "Agent",
        email: "agent@example.com",
      },
      vendor: {
        id: "vendor-1",
        name: "Agency",
        vendor_type: "agency",
        plan: "free",
        billing_status: "inactive",
        billing_provider: null,
        slug: null,
        tagline: null,
        description: null,
        contact_phone: null,
        contact_email: null,
        logo_url: null,
        facebook_url: null,
        telegram_url: null,
        viber_phone: null,
        tiktok_url: null,
        website_url: null,
        cover_image_url: null,
        strengths: [],
        public_storefront_enabled: true,
        verified_status: null,
        verified_at: null,
        verification_expires_at: null,
        verification_level: null,
        verification_score: null,
        verification_rejection_reason_code: null,
        verification_last_reviewed_by: null,
        verification_last_reviewed_at: null,
        verification_rank_bonus: 0,
      },
      workspaces: [],
    },
  };
}

function createPatchRequest(body: Record<string, unknown>) {
  return new Request("https://example.com/api/vendor/properties/property-1", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.unmock("@/app/api/vendor/_lib/context");
});

describe("vendor property PATCH route", () => {
  it("returns 403 for non-owner/admin members before reading the property", async () => {
    const contextResult = buildContextResult({ membershipRole: "agent" });
    const { PATCH, updateMock } = await loadPatchRouteWithContext(contextResult, {
      id: "property-1",
      created_by: "member-1",
      status: "draft",
    });

    const response = await PATCH(createPatchRequest({ status: "active" }), {
      params: Promise.resolve({ propertyId: "property-1" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Only owners and admins can update listings.",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 404 when the property does not belong to the active workspace", async () => {
    const contextResult = buildContextResult({ memberIds: ["member-1"] });
    const { PATCH, updateMock } = await loadPatchRouteWithContext(contextResult, {
      id: "property-1",
      created_by: "member-2",
      status: "draft",
    });

    const response = await PATCH(createPatchRequest({ status: "active" }), {
      params: Promise.resolve({ propertyId: "property-1" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Property not found.",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("returns 400 when the requested status transition is not allowed", async () => {
    const contextResult = buildContextResult();
    const { PATCH, updateMock } = await loadPatchRouteWithContext(contextResult, {
      id: "property-1",
      created_by: "member-1",
      status: "active",
    });

    const response = await PATCH(createPatchRequest({ status: "rejected", rejection_reason: "Missing docs" }), {
      params: Promise.resolve({ propertyId: "property-1" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Cannot change listing status from active to rejected.",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("updates the property when the member is allowed and the transition is valid", async () => {
    const contextResult = buildContextResult({ membershipRole: "admin" });
    const { PATCH, updateMock } = await loadPatchRouteWithContext(contextResult, {
      id: "property-1",
      created_by: "member-1",
      status: "draft",
    });

    const response = await PATCH(createPatchRequest({ status: "active", title: "Updated title" }), {
      params: Promise.resolve({ propertyId: "property-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(updateMock).toHaveBeenCalledTimes(1);
  });
});
