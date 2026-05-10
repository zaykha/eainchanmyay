import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const resolvedParams = await params;
  const inviteToken = resolvedParams.token?.trim();
  if (!inviteToken) {
    return NextResponse.json({ error: "Invite token is required." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: invite, error } = await supabase
    .from("vendor_member_invites")
    .select("id,email,role,status,has_existing_account,expires_at,vendor:vendors(name,slug,logo_url)")
    .eq("invite_token", inviteToken)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!invite?.id) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  const expiresAt = typeof invite.expires_at === "string" ? invite.expires_at : null;
  const isExpired = expiresAt ? new Date(expiresAt).getTime() <= Date.now() : false;
  const vendor = Array.isArray(invite.vendor) ? invite.vendor[0] : invite.vendor;

  return NextResponse.json({
    invite: {
      id: String(invite.id),
      email: String(invite.email ?? ""),
      role: String(invite.role ?? "agent"),
      status: String(invite.status ?? "pending"),
      has_existing_account: Boolean(invite.has_existing_account),
      expires_at: expiresAt,
      is_expired: isExpired,
      vendor: {
        name: vendor?.name ? String(vendor.name) : "Agency workspace",
        slug: (vendor?.slug as string | null) ?? null,
        logo_url: (vendor?.logo_url as string | null) ?? null,
      },
    },
  });
}
