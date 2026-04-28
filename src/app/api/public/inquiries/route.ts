import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getInquiryDealAsPropertyDeal, pickVendorForInquiry, type RoutedVendorCandidate } from "@/lib/inquiry-routing";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

type Payload = {
  dealType?: "buy" | "rent";
  propertyType?: string;
  stateRegion?: string;
  district?: string | null;
  township?: string | null;
  budgetRange?: string;
  timeline?: "asap" | "1-3" | "3-6" | "browsing" | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqft?: number | null;
  needParking?: boolean;
  needLift?: boolean;
  needSolar?: boolean;
  needGenerator?: boolean;
};

function toNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: Request) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const token = getBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
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
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Payload = {};
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.dealType || !body.propertyType || !body.stateRegion) {
    return NextResponse.json({ error: "Missing required inquiry fields." }, { status: 400 });
  }

  const inquiryPayload = {
    user_id: user.id,
    deal_type: body.dealType,
    property_type: body.propertyType,
    state_region: body.stateRegion.trim(),
    district: toNullableString(body.district),
    township: toNullableString(body.township),
    budget_range: toNullableString(body.budgetRange),
    timeline: body.timeline ?? null,
    bedrooms: toNullableNumber(body.bedrooms),
    bathrooms: toNullableNumber(body.bathrooms),
    area_sqft: toNullableNumber(body.areaSqft),
    need_parking: Boolean(body.needParking),
    need_lift: Boolean(body.needLift),
    need_solar: Boolean(body.needSolar),
    need_generator: Boolean(body.needGenerator),
  };

  const { data: inquiryRow, error: inquiryError } = await supabase
    .from("inquiries")
    .insert(inquiryPayload)
    .select("id")
    .maybeSingle();

  if (inquiryError || !inquiryRow?.id) {
    return NextResponse.json({ error: inquiryError?.message ?? "Unable to create inquiry." }, { status: 500 });
  }

  const { data: membershipRows, error: membershipError } = await supabase
    .from("vendor_members")
    .select("vendor_id,user_id,vendor:vendors(id,name,plan,billing_status)")
    .eq("status", "active");

  if (membershipError) {
    return NextResponse.json({ ok: true, inquiryId: String(inquiryRow.id), routed: false });
  }

  const vendorMap = new Map<string, RoutedVendorCandidate>();
  for (const row of membershipRows ?? []) {
    const vendorRaw = Array.isArray(row.vendor) ? row.vendor[0] : row.vendor;
    if (!vendorRaw?.id || !vendorRaw.name) continue;

    const plan = (vendorRaw.plan as string | null) ?? null;
    const billingStatus = (vendorRaw.billing_status as string | null) ?? null;
    const requiresActiveBilling = plan && plan !== "free";
    if (requiresActiveBilling && billingStatus !== "active") continue;

    const vendorId = String(vendorRaw.id);
    const current = vendorMap.get(vendorId);
    if (current) {
      current.memberIds.push(String(row.user_id ?? ""));
      continue;
    }

    vendorMap.set(vendorId, {
      vendorId,
      vendorName: String(vendorRaw.name),
      plan,
      billingStatus,
      memberIds: [String(row.user_id ?? "")].filter(Boolean),
    });
  }

  const memberIds = Array.from(new Set(Array.from(vendorMap.values()).flatMap((vendor) => vendor.memberIds)));
  if (!memberIds.length) {
    return NextResponse.json({ ok: true, inquiryId: String(inquiryRow.id), routed: false });
  }

  const { data: propertyRows, error: propertyError } = await supabase
    .from("properties")
    .select("created_by,state_region,district,township")
    .in("created_by", memberIds)
    .eq("is_deleted", false)
    .eq("status", "published")
    .eq("deal_type", getInquiryDealAsPropertyDeal(body.dealType))
    .eq("property_type", body.propertyType);

  if (propertyError) {
    return NextResponse.json({ ok: true, inquiryId: String(inquiryRow.id), routed: false });
  }

  const selected = pickVendorForInquiry(
    {
      dealType: body.dealType,
      propertyType: body.propertyType,
      stateRegion: body.stateRegion,
      district: toNullableString(body.district),
      township: toNullableString(body.township),
    },
    Array.from(vendorMap.values()),
    (propertyRows ?? []) as Array<{
      created_by: string | null;
      state_region: string | null;
      district: string | null;
      township: string | null;
    }>
  );

  if (!selected) {
    return NextResponse.json({ ok: true, inquiryId: String(inquiryRow.id), routed: false });
  }

  await supabase.from("vendor_inquiry_leads").insert({
    vendor_id: selected.vendor.vendorId,
    inquiry_id: inquiryRow.id,
    status: "new",
    source: "marketplace_routed",
    routing_score: selected.routingScore,
  });

  return NextResponse.json({
    ok: true,
    inquiryId: String(inquiryRow.id),
    routed: true,
    vendorId: selected.vendor.vendorId,
  });
}
