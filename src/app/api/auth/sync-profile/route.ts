import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ProfileRole } from "@/features/site/shared/lib/data";

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

function normalizeRole(value: unknown): ProfileRole | null {
  if (
    value === "user" ||
    value === "vendor_user" ||
    value === "staff" ||
    value === "admin" ||
    value === "master_admin"
  ) {
    return value;
  }
  return null;
}

export async function POST(request: Request) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        full_name?: unknown;
        phone?: unknown;
        email?: unknown;
        role?: unknown;
      }
    | null;

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  const user = userData.user;

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const metadataFullName = normalizeString(user.user_metadata?.full_name) ?? normalizeString(user.user_metadata?.name);
  const metadataPhone = normalizeString(user.user_metadata?.contact_number) ?? normalizeString(user.user_metadata?.phone);
  const metadataRole = normalizeRole(user.user_metadata?.role);
  const requestedFullName = normalizeString(body?.full_name);
  const requestedPhone = normalizeString(body?.phone);
  const requestedEmail = normalizeString(body?.email);
  const requestedRole = normalizeRole(body?.role);

  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id,email,full_name,phone,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const payload = {
    id: user.id,
    email:
      requestedEmail ??
      ((existingProfile?.email as string | null | undefined) ?? null) ??
      user.email ??
      null,
    full_name:
      requestedFullName ??
      ((existingProfile?.full_name as string | null | undefined) ?? null) ??
      metadataFullName ??
      null,
    phone:
      requestedPhone ??
      ((existingProfile?.phone as string | null | undefined) ?? null) ??
      metadataPhone ??
      null,
    role:
      requestedRole ??
      metadataRole ??
      normalizeRole(existingProfile?.role) ??
      "user",
  };

  const { error: upsertError } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    profile: {
      id: user.id,
      email: payload.email,
      full_name: payload.full_name,
      phone: payload.phone,
      role: payload.role,
    },
  });
}
