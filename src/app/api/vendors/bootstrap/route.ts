import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

type BootstrapPayload = {
  name?: string;
  vendorType?: "solo_agent" | "agency" | "developer";
  plan?: string | null;
};

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

function getFallbackVendorName(email: string | null | undefined) {
  if (!email) return "My Vendor Workspace";
  const localPart = email.split("@")[0]?.trim() ?? "";
  return localPart ? `${localPart} Workspace` : "My Vendor Workspace";
}

export async function POST(request: Request) {
  if (!isConfigured) {
    return NextResponse.json({ ok: false, message: "Supabase is not configured." }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ ok: false, message: "Missing authorization token." }, { status: 401 });
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
    return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });
  }

  const { data: existingMembership, error: membershipError } = await supabase
    .from("vendor_members")
    .select("vendor_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json({ ok: false, message: membershipError.message }, { status: 500 });
  }

  if (existingMembership?.vendor_id) {
    return NextResponse.json({ ok: true, vendorId: String(existingMembership.vendor_id), created: false });
  }

  let body: BootstrapPayload = {};
  try {
    body = (await request.json()) as BootstrapPayload;
  } catch {
    body = {};
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name,email,role")
    .eq("id", user.id)
    .maybeSingle();

  if ((profileData?.role as string | null) !== "vendor_user") {
    return NextResponse.json(
      { ok: false, message: "Only vendor accounts can bootstrap a vendor workspace." },
      { status: 403 }
    );
  }

  const vendorName =
    body.name?.trim() ||
    (typeof profileData?.full_name === "string" && profileData.full_name.trim()) ||
    getFallbackVendorName((profileData?.email as string | null | undefined) ?? user.email);
  const vendorType = body.vendorType ?? "solo_agent";
  const plan = body.plan?.trim() ? body.plan.trim() : null;

  const { data: vendorData, error: vendorError } = await supabase
    .from("vendors")
    .insert({
      name: vendorName,
      vendor_type: vendorType,
      plan,
    })
    .select("id")
    .single();

  if (vendorError || !vendorData?.id) {
    return NextResponse.json({ ok: false, message: vendorError?.message ?? "Unable to create vendor." }, { status: 500 });
  }

  const vendorId = String(vendorData.id);

  const { error: memberError } = await supabase.from("vendor_members").insert({
    vendor_id: vendorId,
    user_id: user.id,
    role: "owner",
    status: "active",
  });

  if (memberError) {
    await supabase.from("vendors").delete().eq("id", vendorId);
    return NextResponse.json({ ok: false, message: memberError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, vendorId, created: true });
}
