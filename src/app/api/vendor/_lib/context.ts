import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

export type VendorRequestContext = {
  supabase: ReturnType<typeof createClient>;
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
  };
  membership: {
    role: string;
    status: string;
  };
  memberIds: string[];
};

export async function getVendorRequestContext(request: Request): Promise<
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
    .select("role,status,vendor:vendors(id,name,vendor_type,plan),created_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError) {
    return {
      ok: false,
      response: NextResponse.json({ error: membershipError.message }, { status: 500 }),
    };
  }

  const membershipRow = membershipRows?.[0] as
    | {
        role?: string | null;
        status?: string | null;
        vendor?:
          | {
              id?: string | null;
              name?: string | null;
              vendor_type?: string | null;
              plan?: string | null;
            }
          | Array<{
              id?: string | null;
              name?: string | null;
              vendor_type?: string | null;
              plan?: string | null;
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
      },
      membership: {
        role: String(membershipRow.role),
        status: String(membershipRow.status ?? "active"),
      },
      memberIds,
    },
  };
}
