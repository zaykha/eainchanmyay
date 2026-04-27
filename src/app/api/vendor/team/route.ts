import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

function normalizeRole(input: unknown) {
  return input === "owner" || input === "admin" || input === "staff" ? input : null;
}

function normalizeStatus(input: unknown) {
  return input === "active" || input === "inactive" ? input : null;
}

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor } = result.context;

  const { data, error } = await supabase
    .from("vendor_members")
    .select("user_id,role,status,created_at,profiles:profiles(full_name,email,phone)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const members = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      user_id: String(row.user_id ?? ""),
      role: String(row.role ?? "staff"),
      status: String(row.status ?? "active"),
      created_at: row.created_at ?? null,
      full_name: (profile?.full_name as string | null) ?? null,
      email: (profile?.email as string | null) ?? null,
      phone: (profile?.phone as string | null) ?? null,
    };
  });

  return NextResponse.json({ members });
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, membership, vendor } = result.context;

  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owner or admin members can invite team seats." }, { status: 403 });
  }

  let body: { email?: string; role?: string } = {};
  try {
    body = (await request.json()) as { email?: string; role?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const role = normalizeRole(body.role);

  if (!email || !role) {
    return NextResponse.json({ error: "Email and role are required." }, { status: 400 });
  }

  if (membership.role === "admin" && role === "owner") {
    return NextResponse.json({ error: "Admins cannot assign owner seats." }, { status: 403 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,full_name,email,phone")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profile?.id) {
    return NextResponse.json(
      { error: "No existing vendor account was found for that email yet." },
      { status: 404 }
    );
  }

  if (profile.role !== "vendor_user") {
    return NextResponse.json(
      { error: "That user exists, but is not a vendor workspace account." },
      { status: 400 }
    );
  }

  const { error: insertError } = await supabase.from("vendor_members").insert({
    vendor_id: vendor.id,
    user_id: profile.id,
    role,
    status: "active",
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    member: {
      user_id: String(profile.id),
      role,
      status: "active",
      full_name: (profile.full_name as string | null) ?? null,
      email: (profile.email as string | null) ?? null,
      phone: (profile.phone as string | null) ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, membership, vendor, user } = result.context;

  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owner or admin members can manage seats." }, { status: 403 });
  }

  let body: { user_id?: string; role?: string; status?: string } = {};
  try {
    body = (await request.json()) as { user_id?: string; role?: string; status?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const targetUserId = body.user_id?.trim();
  const role = normalizeRole(body.role);
  const status = normalizeStatus(body.status);

  if (!targetUserId || !role || !status) {
    return NextResponse.json({ error: "User, role, and status are required." }, { status: 400 });
  }

  if (targetUserId === user.id) {
    return NextResponse.json({ error: "You cannot edit your own seat from this screen." }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("vendor_members")
    .select("role,status")
    .eq("vendor_id", vendor.id)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing?.role) {
    return NextResponse.json({ error: "Team member not found." }, { status: 404 });
  }

  if (membership.role === "admin" && (existing.role === "owner" || role === "owner")) {
    return NextResponse.json({ error: "Admins cannot manage owner seats." }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from("vendor_members")
    .update({
      role,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("vendor_id", vendor.id)
    .eq("user_id", targetUserId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
