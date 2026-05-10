import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
  }

  let body: { invite_token?: string; full_name?: string; phone?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const inviteToken = normalizeString(body.invite_token);
  const fullName = normalizeString(body.full_name);
  const phone = normalizeString(body.phone);

  if (!inviteToken) {
    return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (authError || !user?.id || !user.email) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: invite, error: inviteError } = await supabase
    .from("vendor_member_invites")
    .select("id,vendor_id,email,role,status,expires_at")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  if (!invite?.id || !invite.vendor_id) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  if (String(invite.status ?? "pending") !== "pending") {
    return NextResponse.json({ error: "This invite is no longer available." }, { status: 400 });
  }

  if (typeof invite.expires_at === "string" && new Date(invite.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "This invite has expired." }, { status: 400 });
  }

  if (String(invite.email ?? "").trim().toLowerCase() !== user.email.trim().toLowerCase()) {
    return NextResponse.json({ error: "This invite was sent to a different email address." }, { status: 403 });
  }

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,phone")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: profileUpsertError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: (existingProfile?.email as string | null | undefined) ?? user.email,
      full_name: fullName ?? ((existingProfile?.full_name as string | null | undefined) ?? null),
      phone: phone ?? ((existingProfile?.phone as string | null | undefined) ?? null),
      role: "vendor_user",
    },
    { onConflict: "id" }
  );

  if (profileUpsertError) {
    return NextResponse.json({ error: profileUpsertError.message }, { status: 500 });
  }

  const { data: existingMember, error: existingMemberError } = await supabase
    .from("vendor_members")
    .select("user_id")
    .eq("vendor_id", invite.vendor_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingMemberError) {
    return NextResponse.json({ error: existingMemberError.message }, { status: 500 });
  }

  if (existingMember?.user_id) {
    const { error: memberUpdateError } = await supabase
      .from("vendor_members")
      .update({
        role: String(invite.role ?? "agent"),
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("vendor_id", invite.vendor_id)
      .eq("user_id", user.id);

    if (memberUpdateError) {
      return NextResponse.json({ error: memberUpdateError.message }, { status: 500 });
    }
  } else {
    const { error: memberInsertError } = await supabase.from("vendor_members").insert({
      vendor_id: invite.vendor_id,
      user_id: user.id,
      role: String(invite.role ?? "agent"),
      status: "active",
    });

    if (memberInsertError) {
      return NextResponse.json({ error: memberInsertError.message }, { status: 500 });
    }
  }

  const now = new Date().toISOString();

  const { error: inviteUpdateError } = await supabase
    .from("vendor_member_invites")
    .update({
      status: "accepted",
      accepted_by_user_id: user.id,
      accepted_at: now,
      updated_at: now,
    })
    .eq("id", invite.id);

  if (inviteUpdateError) {
    return NextResponse.json({ error: inviteUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role: "vendor_user", vendor_id: invite.vendor_id });
}
