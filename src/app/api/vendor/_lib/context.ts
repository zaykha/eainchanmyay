import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

function getRequestedVendorId(request: Request) {
  const headerValue = request.headers.get("x-vendor-id")?.trim();
  if (headerValue) return headerValue;
  const { searchParams } = new URL(request.url);
  const queryValue = searchParams.get("vendorId")?.trim();
  return queryValue || null;
}

export type VendorRequestContext = {
  supabase: SupabaseClient;
  user: { id: string; email?: string | null };
  profile: {
    id: string;
    role: string | null;
    full_name: string | null;
    email: string | null;
  };
  vendor: {
    id: string;
    name: string;
    vendor_type: string;
    plan: string | null;
    billing_status: string | null;
    billing_provider: string | null;
    slug: string | null;
    tagline: string | null;
    description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    logo_url: string | null;
    facebook_url: string | null;
    telegram_url: string | null;
    viber_phone: string | null;
    tiktok_url: string | null;
    website_url: string | null;
    cover_image_url: string | null;
    strengths: string[];
    public_storefront_enabled: boolean;
    verified_status: string | null;
    verified_at: string | null;
    verification_expires_at: string | null;
    verification_level: string | null;
    verification_score: number | null;
    verification_rejection_reason_code: string | null;
    verification_last_reviewed_by: string | null;
    verification_last_reviewed_at: string | null;
    verification_rank_bonus: number;
  };
  membership: {
    role: string;
    status: string;
  };
  workspaces: Array<{
    vendor: {
      id: string;
      name: string;
      slug: string | null;
      logo_url: string | null;
      plan: string | null;
      verified_status: string | null;
    };
    membership: {
      role: string;
      status: string;
    };
  }>;
  memberIds: string[];
};

type VendorRequestContextOptions = {
  allowPendingBilling?: boolean;
  requireExplicitVendorSelection?: boolean;
};

export async function getVendorRequestContext(request: Request): Promise<
  | { ok: true; context: VendorRequestContext }
  | { ok: false; response: NextResponse }
>;
export async function getVendorRequestContext(
  request: Request,
  options: VendorRequestContextOptions
): Promise<
  | { ok: true; context: VendorRequestContext }
  | { ok: false; response: NextResponse }
>;
export async function getVendorRequestContext(
  request: Request,
  options: VendorRequestContextOptions = {}
): Promise<
  | { ok: true; context: VendorRequestContext }
  | { ok: false; response: NextResponse }
> {
  if (!isConfigured) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Supabase is not configured." }, { status: 500 }),
    };
  }

  const token = getBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Missing authorization token." }, { status: 401 }),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,full_name,email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileData) {
    return {
      ok: false,
      response: NextResponse.json({ error: profileError?.message ?? "Profile not found." }, { status: 403 }),
    };
  }

  if (profileData.role !== "vendor_user") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Only vendor accounts can access this workspace." }, { status: 403 }),
    };
  }

  const { data: membershipRows, error: membershipError } = await supabase
    .from("vendor_members")
    .select(
      "role,status,vendor:vendors(id,name,vendor_type,plan,billing_status,billing_provider,slug,tagline,description,contact_phone,contact_email,logo_url,facebook_url,telegram_url,viber_phone,tiktok_url,website_url,cover_image_url,strengths,public_storefront_enabled,verified_status:verification_status,verified_at,verification_expires_at,verification_level,verification_score,verification_rejection_reason_code,verification_last_reviewed_by,verification_last_reviewed_at,verification_rank_bonus),created_at"
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (membershipError) {
    return {
      ok: false,
      response: NextResponse.json({ error: membershipError.message }, { status: 500 }),
    };
  }

  const requestedVendorId = getRequestedVendorId(request);
  const membershipEntries = (membershipRows ?? []) as Array<
    | {
        role?: string | null;
        status?: string | null;
        vendor?:
          | {
              id?: string | null;
              name?: string | null;
              vendor_type?: string | null;
              plan?: string | null;
              billing_status?: string | null;
              billing_provider?: string | null;
              slug?: string | null;
              tagline?: string | null;
              description?: string | null;
              contact_phone?: string | null;
              contact_email?: string | null;
              logo_url?: string | null;
              facebook_url?: string | null;
              telegram_url?: string | null;
              viber_phone?: string | null;
              tiktok_url?: string | null;
              website_url?: string | null;
              cover_image_url?: string | null;
              strengths?: unknown;
              public_storefront_enabled?: boolean | null;
              verified_status?: string | null;
              verified_at?: string | null;
              verification_expires_at?: string | null;
              verification_level?: string | null;
              verification_score?: number | null;
              verification_rejection_reason_code?: string | null;
              verification_last_reviewed_by?: string | null;
              verification_last_reviewed_at?: string | null;
              verification_rank_bonus?: number | null;
            }
          | Array<{
              id?: string | null;
              name?: string | null;
              vendor_type?: string | null;
              plan?: string | null;
              billing_status?: string | null;
              billing_provider?: string | null;
              slug?: string | null;
              tagline?: string | null;
              description?: string | null;
              contact_phone?: string | null;
              contact_email?: string | null;
              logo_url?: string | null;
              facebook_url?: string | null;
              telegram_url?: string | null;
              viber_phone?: string | null;
              tiktok_url?: string | null;
              website_url?: string | null;
              cover_image_url?: string | null;
              strengths?: unknown;
              public_storefront_enabled?: boolean | null;
              verified_status?: string | null;
              verified_at?: string | null;
              verification_expires_at?: string | null;
              verification_level?: string | null;
              verification_score?: number | null;
              verification_rejection_reason_code?: string | null;
              verification_last_reviewed_by?: string | null;
              verification_last_reviewed_at?: string | null;
              verification_rank_bonus?: number | null;
            }>
          | null;
      }
  >;

  if (options.requireExplicitVendorSelection && membershipEntries.length > 1 && !requestedVendorId) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Select an active vendor workspace before accessing this endpoint." },
        { status: 400 }
      ),
    };
  }

  const membershipRow = (
    requestedVendorId
      ? membershipEntries.find((row) => {
          const vendorValue = Array.isArray(row.vendor) ? row.vendor[0] : row.vendor;
          return vendorValue?.id === requestedVendorId;
        })
      : membershipEntries[0]
  ) as
    | {
        role?: string | null;
        status?: string | null;
        vendor?:
          | {
              id?: string | null;
              name?: string | null;
              vendor_type?: string | null;
              plan?: string | null;
              billing_status?: string | null;
              billing_provider?: string | null;
              slug?: string | null;
              tagline?: string | null;
              description?: string | null;
              contact_phone?: string | null;
              contact_email?: string | null;
              logo_url?: string | null;
              facebook_url?: string | null;
              telegram_url?: string | null;
              viber_phone?: string | null;
              tiktok_url?: string | null;
              website_url?: string | null;
              cover_image_url?: string | null;
              strengths?: unknown;
              public_storefront_enabled?: boolean | null;
              verified_status?: string | null;
              verified_at?: string | null;
              verification_expires_at?: string | null;
              verification_level?: string | null;
              verification_score?: number | null;
              verification_rejection_reason_code?: string | null;
              verification_last_reviewed_by?: string | null;
              verification_last_reviewed_at?: string | null;
              verification_rank_bonus?: number | null;
            }
          | Array<{
              id?: string | null;
              name?: string | null;
              vendor_type?: string | null;
              plan?: string | null;
              billing_status?: string | null;
              billing_provider?: string | null;
              slug?: string | null;
              tagline?: string | null;
              description?: string | null;
              contact_phone?: string | null;
              contact_email?: string | null;
              logo_url?: string | null;
              facebook_url?: string | null;
              telegram_url?: string | null;
              viber_phone?: string | null;
              tiktok_url?: string | null;
              website_url?: string | null;
              cover_image_url?: string | null;
              strengths?: unknown;
              public_storefront_enabled?: boolean | null;
              verified_status?: string | null;
              verified_at?: string | null;
              verification_expires_at?: string | null;
              verification_level?: string | null;
              verification_score?: number | null;
              verification_rejection_reason_code?: string | null;
              verification_last_reviewed_by?: string | null;
              verification_last_reviewed_at?: string | null;
              verification_rank_bonus?: number | null;
            }>
          | null;
      }
    | undefined;

  const vendorRaw = Array.isArray(membershipRow?.vendor) ? membershipRow?.vendor[0] : membershipRow?.vendor;

  if (!membershipRow?.role || !vendorRaw?.id || !vendorRaw.name || !vendorRaw.vendor_type) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Vendor membership not found." }, { status: 403 }),
    };
  }

  const { data: memberRows, error: memberRowsError } = await supabase
    .from("vendor_members")
    .select("user_id")
    .eq("vendor_id", vendorRaw.id)
    .eq("status", "active");

  if (memberRowsError) {
    return {
      ok: false,
      response: NextResponse.json({ error: memberRowsError.message }, { status: 500 }),
    };
  }

  const memberIds = (memberRows ?? [])
    .map((row) => String(row.user_id ?? ""))
    .filter(Boolean);

  const workspaces = membershipEntries
    .map((row) => {
      const vendorValue = Array.isArray(row.vendor) ? row.vendor[0] : row.vendor;
      if (!row.role || !vendorValue?.id || !vendorValue.name) return null;
      return {
        vendor: {
          id: String(vendorValue.id),
          name: String(vendorValue.name),
          slug: (vendorValue.slug as string | null) ?? null,
          logo_url: (vendorValue.logo_url as string | null) ?? null,
          plan: (vendorValue.plan as string | null) ?? null,
          verified_status: (vendorValue.verified_status as string | null) ?? null,
        },
        membership: {
          role: String(row.role),
          status: String(row.status ?? "active"),
        },
      };
    })
    .filter(Boolean) as VendorRequestContext["workspaces"];

  const requiresActiveBilling = vendorRaw.plan && vendorRaw.plan !== "free";
  const effectiveBillingStatus = (vendorRaw.billing_status as string | null) ?? null;

  if (requiresActiveBilling && effectiveBillingStatus !== "active" && !options.allowPendingBilling) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Billing activation required before accessing the paid vendor workspace." },
        { status: 402 }
      ),
    };
  }

  return {
    ok: true,
    context: {
      supabase,
      user: {
        id: user.id,
        email: user.email ?? null,
      },
      profile: {
        id: String(profileData.id),
        role: (profileData.role as string | null) ?? null,
        full_name: (profileData.full_name as string | null) ?? null,
        email: (profileData.email as string | null) ?? null,
      },
      vendor: {
        id: String(vendorRaw.id),
        name: String(vendorRaw.name),
        vendor_type: String(vendorRaw.vendor_type),
        plan: (vendorRaw.plan as string | null) ?? null,
        billing_status: effectiveBillingStatus,
        billing_provider: (vendorRaw.billing_provider as string | null) ?? null,
        slug: (vendorRaw.slug as string | null) ?? null,
        tagline: (vendorRaw.tagline as string | null) ?? null,
        description: (vendorRaw.description as string | null) ?? null,
        contact_phone: (vendorRaw.contact_phone as string | null) ?? null,
        contact_email: (vendorRaw.contact_email as string | null) ?? null,
        logo_url: (vendorRaw.logo_url as string | null) ?? null,
        facebook_url: (vendorRaw.facebook_url as string | null) ?? null,
        telegram_url: (vendorRaw.telegram_url as string | null) ?? null,
        viber_phone: (vendorRaw.viber_phone as string | null) ?? null,
        tiktok_url: (vendorRaw.tiktok_url as string | null) ?? null,
        website_url: (vendorRaw.website_url as string | null) ?? null,
        cover_image_url: (vendorRaw.cover_image_url as string | null) ?? null,
        strengths: Array.isArray(vendorRaw.strengths)
          ? vendorRaw.strengths.map((item) => String(item)).filter(Boolean)
          : [],
        public_storefront_enabled: vendorRaw.public_storefront_enabled !== false,
        verified_status: (vendorRaw.verified_status as string | null) ?? null,
        verified_at: (vendorRaw.verified_at as string | null) ?? null,
        verification_expires_at: (vendorRaw.verification_expires_at as string | null) ?? null,
        verification_level: (vendorRaw.verification_level as string | null) ?? null,
        verification_score:
          typeof vendorRaw.verification_score === "number" ? vendorRaw.verification_score : null,
        verification_rejection_reason_code:
          (vendorRaw.verification_rejection_reason_code as string | null) ?? null,
        verification_last_reviewed_by:
          (vendorRaw.verification_last_reviewed_by as string | null) ?? null,
        verification_last_reviewed_at:
          (vendorRaw.verification_last_reviewed_at as string | null) ?? null,
        verification_rank_bonus:
          typeof vendorRaw.verification_rank_bonus === "number" ? vendorRaw.verification_rank_bonus : 0,
      },
      membership: {
        role: String(membershipRow.role),
        status: String(membershipRow.status ?? "active"),
      },
      workspaces,
      memberIds,
    },
  };
}
