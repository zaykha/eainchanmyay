import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

type Payload = {
  email?: string;
};

function toOptionalEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed || null;
}

export async function POST(request: Request) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  let body: Payload = {};
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = toOptionalEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,role")
    .ilike("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let effectiveRole = (profile?.role as string | null) ?? null;
  let hasActiveVendorMembership = false;

  if (profile?.id && effectiveRole !== "vendor_user") {
    const { data: membership, error: membershipError } = await supabase
      .from("vendor_members")
      .select("vendor_id")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    if (membership?.vendor_id) {
      hasActiveVendorMembership = true;
      effectiveRole = "vendor_user";
    }
  }

  if (profile?.id && effectiveRole === "vendor_user" && !hasActiveVendorMembership) {
    const { data: membership, error: membershipError } = await supabase
      .from("vendor_members")
      .select("vendor_id")
      .eq("user_id", profile.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (membershipError) {
      return NextResponse.json({ error: membershipError.message }, { status: 500 });
    }

    hasActiveVendorMembership = Boolean(membership?.vendor_id);
  }

  return NextResponse.json({
    role: effectiveRole,
    found: Boolean(profile?.id),
    ...(process.env.NODE_ENV !== "production"
      ? {
          debug: {
            profileId: profile?.id ?? null,
            profileRole: (profile?.role as string | null) ?? null,
            effectiveRole,
            hasActiveVendorMembership,
          },
        }
      : {}),
  });
}
