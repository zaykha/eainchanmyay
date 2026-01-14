import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/app/api/_lib/rate-limit";

type Payload = {
  user_id?: string | null;
  title: string;
  description?: string | null;
  deal_type: "sale" | "rent";
  property_type:
    | "land"
    | "house"
    | "apartment"
    | "mini_condo"
    | "condo"
    | "serviced_apartment"
    | "shop_office"
    | "hotel_restaurant"
    | "warehouse";
  price: number;
  currency: "MMK" | "USD" | "CNY" | "THB";
  state_region: string;
  district: string;
  city?: string | null;
  township: string;
  address_text?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
  commission_percent?: number | null;
  has_lift: boolean;
  has_backup_power: boolean;
  backup_power_type?: "solar" | "generator" | "solar_generator" | null;
  has_parking: boolean;
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

export async function POST(req: Request) {
  const limit = rateLimit(req, {
    windowMs: 60_000,
    max: 10,
    minIntervalMs: 1500,
    keyPrefix: "sales-requests",
  });
  if (limit.limited) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
          "X-RateLimit-Reset": String(limit.resetAt),
        },
      }
    );
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { ok: false, message: "Supabase is not configured." },
      { status: 500 }
    );
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  if (!body.title || !body.deal_type || !body.property_type || !body.price) {
    return NextResponse.json({ ok: false, message: "Missing required fields." }, { status: 400 });
  }

  const isLand = body.property_type === "land";
  const hasBackupPower = Boolean(body.has_backup_power);
  const backupType = body.backup_power_type ?? null;

  if (hasBackupPower && !backupType) {
    return NextResponse.json(
      { ok: false, message: "Backup power type is required." },
      { status: 400 }
    );
  }

  const payload = {
    user_id: body.user_id ?? null,
    title: body.title.trim(),
    description: toNullableString(body.description),
    deal_type: body.deal_type,
    property_type: body.property_type,
    price: Number(body.price),
    currency: body.currency ?? "MMK",
    state_region: body.state_region?.trim(),
    district: body.district?.trim(),
    city: toNullableString(body.city),
    township: body.township?.trim(),
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
    owner_name: toNullableString(body.owner_name),
    owner_phone: toNullableString(body.owner_phone),
    owner_phone_secondary: toNullableString(body.owner_phone_secondary),
  };

  const supabase = createClient(supabaseUrl, supabaseAnon);
  const { error } = await supabase.from("sales_requests").insert(payload);

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
