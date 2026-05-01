import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/app/api/_lib/rate-limit";

type Payload = {
  propertyId?: string;
  reason?: string;
  details?: string | null;
};

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

const toNullableString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export async function POST(request: Request) {
  const limit = rateLimit(request, {
    windowMs: 60_000,
    max: 8,
    minIntervalMs: 2000,
    keyPrefix: "listing-reports",
  });
  if (limit.limited) {
    return NextResponse.json({ ok: false, message: "Too many report attempts. Please try again shortly." }, { status: 429 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ ok: false, message: "Supabase is not configured." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as Payload | null;
  const propertyId = body?.propertyId?.trim();
  const reason = body?.reason?.trim();
  const details = toNullableString(body?.details);
  if (!propertyId || !reason) {
    return NextResponse.json({ ok: false, message: "Property and reason are required." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const token = getBearerToken(request);
  let reportedByUserId: string | null = null;
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    reportedByUserId = data.user?.id ?? null;
  }

  const { data: propertyRow, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .eq("is_deleted", false)
    .eq("status", "published")
    .maybeSingle();

  if (propertyError || !propertyRow?.id) {
    return NextResponse.json({ ok: false, message: "That listing could not be found." }, { status: 404 });
  }

  const { error } = await supabase.from("listing_reports").insert({
    property_id: propertyId,
    reported_by_user_id: reportedByUserId,
    reason,
    details,
    status: "open",
  });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
