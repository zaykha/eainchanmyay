import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAdminOrOwner } from "@/lib/vendor-permissions";

import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { getVendorPlanUsage } from "@/app/api/vendor/_lib/plan-limits";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

const isInviteConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function normalizeRole(input: unknown) {
  if (input === "staff") return "agent";
  return input === "owner" || input === "admin" || input === "agent" ? input : null;
}

function normalizeStatus(input: unknown) {
  return input === "active" || input === "inactive" ? input : null;
}

function isFreePlan(plan: string | null | undefined) {
  return (plan ?? "").trim().toLowerCase() === "free";
}

function teamUpgradeRequiredResponse() {
  return NextResponse.json(
    {
      error: "Team management requires a Pro plan or higher.",
      code: "team_upgrade_required",
    },
    { status: 403 }
  );
}

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, membership } = result.context;
  if (isFreePlan(vendor.plan)) {
    return teamUpgradeRequiredResponse();
  }
  if (!isAdminOrOwner(membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can access team management." }, { status: 403 });
  }

  const [membersResult, invitesResult] = await Promise.all([
    supabase
    .from("vendor_members")
    .select("user_id,role,status,created_at,profiles:profiles(full_name,email,phone)")
    .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("vendor_member_invites")
      .select("id,email,role,status,has_existing_account,created_at,expires_at,last_sent_at,accepted_at")
      .eq("vendor_id", vendor.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  if (membersResult.error || invitesResult.error) {
    return NextResponse.json({ error: membersResult.error?.message || invitesResult.error?.message }, { status: 500 });
  }

  const members = (membersResult.data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      user_id: String(row.user_id ?? ""),
      role: String(row.role === "staff" ? "agent" : row.role ?? "agent"),
      status: String(row.status ?? "active"),
      created_at: row.created_at ?? null,
      full_name: (profile?.full_name as string | null) ?? null,
      email: (profile?.email as string | null) ?? null,
      phone: (profile?.phone as string | null) ?? null,
    };
  });

  const invites = (invitesResult.data ?? []).map((row) => ({
    id: String(row.id ?? ""),
    email: String(row.email ?? ""),
    role: String(row.role ?? "agent"),
    status: String(row.status ?? "pending"),
    has_existing_account: Boolean(row.has_existing_account),
    created_at: (row.created_at as string | null) ?? null,
    expires_at: (row.expires_at as string | null) ?? null,
    last_sent_at: (row.last_sent_at as string | null) ?? null,
    accepted_at: (row.accepted_at as string | null) ?? null,
  }));

  return NextResponse.json({ members, invites });
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, membership, vendor, user } = result.context;
  if (isFreePlan(vendor.plan)) {
    return teamUpgradeRequiredResponse();
  }
  const { planUsage } = await getVendorPlanUsage(result.context);

  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owner or admin members can invite team seats." }, { status: 403 });
  }

  if (planUsage.agentUsage >= planUsage.agentLimit) {
    return NextResponse.json(
      {
        error: `Your ${planUsage.plan.name} plan allows up to ${planUsage.agentLimit} active seats. Upgrade to add more agents.`,
        code: "SEAT_LIMIT_REACHED",
      },
      { status: 403 }
    );
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

  if (membership.role === "admin" && role !== "agent") {
    return NextResponse.json({ error: "Admins can only invite staff seats." }, { status: 403 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id,role,full_name,email,phone")
    .eq("email", email)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data: existingInvite } = await supabase
    .from("vendor_member_invites")
    .select("id")
    .eq("vendor_id", vendor.id)
    .eq("email", email)
    .eq("status", "pending")
    .maybeSingle();

  if (profile?.id) {
    const { data: existingMember, error: existingMemberError } = await supabase
      .from("vendor_members")
      .select("user_id")
      .eq("vendor_id", vendor.id)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existingMemberError) {
      return NextResponse.json({ error: existingMemberError.message }, { status: 500 });
    }

    if (existingMember?.user_id) {
      return NextResponse.json({ error: "That user is already part of this workspace." }, { status: 400 });
    }
  }

  if (!isInviteConfigured) {
    return NextResponse.json({ error: "Supabase invite email is not configured." }, { status: 500 });
  }

  const inviteToken = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const redirectTo = `${new URL(request.url).origin}/auth/accept-invite?invite=${encodeURIComponent(inviteToken)}`;

  const emailClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { error: otpError } = await emailClient.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: redirectTo,
    },
  });

  if (otpError) {
    return NextResponse.json(
      { error: otpError.message || "Unable to send the invite email right now." },
      { status: 500 }
    );
  }

  const invitePayload = {
    vendor_id: vendor.id,
    email,
    role,
    status: "pending",
    invite_token: inviteToken,
    invited_by_user_id: user.id,
    target_profile_id: profile?.id ?? null,
    has_existing_account: Boolean(profile?.id),
    expires_at: expiresAt,
    last_sent_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  if (existingInvite?.id) {
    const { error: updateInviteError } = await supabase
      .from("vendor_member_invites")
      .update(invitePayload)
      .eq("id", existingInvite.id);

    if (updateInviteError) {
      return NextResponse.json({ error: updateInviteError.message }, { status: 500 });
    }
  } else {
    const { error: createInviteError } = await supabase.from("vendor_member_invites").insert({
      ...invitePayload,
      created_at: now.toISOString(),
    });

    if (createInviteError) {
      return NextResponse.json({ error: createInviteError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    invite: {
      email,
      role,
      status: "pending",
      has_existing_account: Boolean(profile?.id),
      expires_at: expiresAt,
    },
  });
}

export async function PATCH(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, membership, vendor, user } = result.context;
  if (isFreePlan(vendor.plan)) {
    return teamUpgradeRequiredResponse();
  }

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

  const existingRole = existing.role === "staff" ? "agent" : existing.role;
  const existingStatus = existing.status ?? "active";

  if (membership.role === "admin") {
    if (existingRole !== "agent") {
      return NextResponse.json({ error: "Admins can only manage staff seats." }, { status: 403 });
    }
    if (role !== "agent") {
      return NextResponse.json({ error: "Admins cannot promote staff to admin or owner." }, { status: 403 });
    }
  }

  const removingActiveOwner =
    existingRole === "owner" &&
    existingStatus === "active" &&
    !(role === "owner" && status === "active");

  if (removingActiveOwner) {
    const { count, error: ownerCountError } = await supabase
      .from("vendor_members")
      .select("user_id", { count: "exact", head: true })
      .eq("vendor_id", vendor.id)
      .eq("role", "owner")
      .eq("status", "active");

    if (ownerCountError) {
      return NextResponse.json({ error: ownerCountError.message }, { status: 500 });
    }

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "This workspace must always keep at least one active owner." },
        { status: 403 }
      );
    }
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
