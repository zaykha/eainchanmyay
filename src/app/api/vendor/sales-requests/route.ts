import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { getVendorPlanUsage } from "@/app/api/vendor/_lib/plan-limits";
import type { PropertyType } from "@/lib/property-types";

type Payload = {
  title?: string;
  description?: string | null;
  deal_type?: "sale" | "rent";
  property_type?: PropertyType;
  price?: number;
  currency?: "MMK" | "USD" | "CNY" | "THB";
  state_region?: string;
  district?: string | null;
  city?: string | null;
  township?: string;
  address_text?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
  commission_percent?: number | null;
  has_lift?: boolean;
  has_backup_power?: boolean;
  backup_power_type?: "solar" | "generator" | "solar_generator" | null;
  has_parking?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_phone_secondary?: string | null;
};

const toNullableString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toNullableNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, memberIds } = result.context;

  if (!memberIds.length) {
    return NextResponse.json({ items: [] });
  }

  const { data, error } = await supabase
    .from("sales_requests")
    .select(
      "id,title,deal_type,property_type,price,currency,state_region,district,township,city,status,created_at,user_id"
    )
    .in("user_id", memberIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, user, profile } = result.context;
  const { planUsage } = await getVendorPlanUsage(result.context);

  if (planUsage.listingUsage >= planUsage.listingLimit) {
    return NextResponse.json(
      {
        error: `Your ${planUsage.plan.name} plan allows up to ${planUsage.listingLimit} active listing records. Upgrade to continue submitting new listings.`,
        code: "LISTING_LIMIT_REACHED",
      },
      { status: 403 }
    );
  }

  let body: Payload = {};
  try {
    body = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  if (!body.title || !body.deal_type || !body.property_type || !body.price || !body.state_region || !body.township) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const isLand = body.property_type === "land";
  const hasBackupPower = Boolean(body.has_backup_power);
  const backupType = body.backup_power_type ?? null;

  if (hasBackupPower && !backupType) {
    return NextResponse.json({ error: "Backup power type is required." }, { status: 400 });
  }

  const payload = {
    user_id: user.id,
    title: body.title.trim(),
    description: toNullableString(body.description),
    deal_type: body.deal_type,
    property_type: body.property_type,
    price: Number(body.price),
    currency: body.currency ?? "MMK",
    state_region: body.state_region.trim(),
    district: toNullableString(body.district),
    city: toNullableString(body.city),
    township: body.township.trim(),
    address_text: toNullableString(body.address_text),
    bedrooms: isLand ? null : toNullableNumber(body.bedrooms),
    bathrooms: isLand ? null : toNullableNumber(body.bathrooms),
    area_sqft: toNullableNumber(body.area_sqft),
    commission_percent: toNullableNumber(body.commission_percent),
    has_lift: isLand ? false : Boolean(body.has_lift),
    has_backup_power: isLand ? false : hasBackupPower,
    backup_power_type: isLand ? null : backupType,
    has_parking: isLand ? false : Boolean(body.has_parking),
    latitude: toNullableNumber(body.latitude),
    longitude: toNullableNumber(body.longitude),
    owner_name: toNullableString(body.owner_name) ?? profile.full_name ?? null,
    owner_phone: toNullableString(body.owner_phone),
    owner_phone_secondary: toNullableString(body.owner_phone_secondary),
  };

  const { error } = await supabase.from("sales_requests").insert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
