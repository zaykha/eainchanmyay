import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit } from "@/app/api/_lib/rate-limit";
import { deletePropertyImages, uploadPropertyImages } from "@/app/api/_lib/property-image-upload";
import type { PropertyType } from "@/lib/property-types";
import { moderateListingText } from "@/lib/moderation-rules";

export const runtime = "nodejs";

type Payload = {
  user_id?: string | null;
  title: string;
  description?: string | null;
  deal_type: "sale" | "rent";
  property_type: PropertyType;
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
  floor_count?: number | null;
  room_count?: number | null;
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

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

function getUnknownErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const token = getBearerToken(req);

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { ok: false, message: "Supabase is not configured." },
      { status: 500 }
    );
  }

  if (!token) {
    return NextResponse.json({ ok: false, message: "Sign in is required." }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let body: Payload;
  let imageFiles: File[] = [];
  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const payloadRaw = formData.get("payload");
      body = JSON.parse(typeof payloadRaw === "string" ? payloadRaw : "{}") as Payload;
      imageFiles = formData
        .getAll("images")
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    } else {
      body = (await req.json()) as Payload;
    }
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request payload." }, { status: 400 });
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

  const moderationResult = moderateListingText({
    title: body.title,
    description: body.description,
  });
  if (moderationResult.blocked) {
    return NextResponse.json(
      { ok: false, message: moderationResult.message, reasons: moderationResult.reasons },
      { status: 400 }
    );
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

  const { count, error: countError } = await supabase
    .from("properties")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id)
    .eq("is_deleted", false);

  if (countError) {
    return NextResponse.json({ ok: false, message: countError.message }, { status: 500 });
  }

  if ((count ?? 0) >= 1) {
    return NextResponse.json(
      { ok: false, message: "Only 1 published property listing is allowed per account." },
      { status: 409 }
    );
  }

  if (imageFiles.length === 0) {
    return NextResponse.json({ ok: false, message: "At least 1 property image is required." }, { status: 400 });
  }

  if (imageFiles.length > 5) {
    return NextResponse.json({ ok: false, message: "You can upload up to 5 property images." }, { status: 400 });
  }

  const payload = {
    city: body.district?.trim() || body.township?.trim() || body.state_region?.trim() || "Myanmar",
    title: body.title.trim(),
    description: toNullableString(body.description),
    deal_type: body.deal_type,
    property_type: body.property_type,
    status: "published",
    price: Number(body.price),
    currency: body.currency ?? "MMK",
    state_region: body.state_region?.trim(),
    district: body.district?.trim(),
    township: body.township?.trim(),
    address_text: toNullableString(body.address_text),
    bedrooms: isLand ? null : toNullableNumber(body.bedrooms),
    bathrooms: isLand ? null : toNullableNumber(body.bathrooms),
    area_sqft: toNullableNumber(body.area_sqft),
    floor_count: toNullableNumber(body.floor_count),
    room_count: toNullableNumber(body.room_count),
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
    created_by: user.id,
    is_deleted: false,
  };

  const { data: propertyRow, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (error || !propertyRow?.id) {
    return NextResponse.json({ ok: false, message: error?.message ?? "Unable to create listing." }, { status: 500 });
  }

  try {
    const { rows: imageRows, storagePaths } = await uploadPropertyImages({
      supabase,
      folder: `public-listings/${user.id}`,
      propertyId: String(propertyRow.id),
      files: await Promise.all(
        imageFiles.map(async (file) => ({
          filename: file.name,
          buffer: Buffer.from(await file.arrayBuffer()),
        }))
      ),
    });
    if (imageRows.length) {
      const { error: imageInsertError } = await supabase.from("property_images").insert(imageRows);
      if (imageInsertError) {
        await deletePropertyImages({ supabase, storagePaths });
        throw imageInsertError;
      }
    }
  } catch (uploadError) {
    await supabase.from("property_images").delete().eq("property_id", propertyRow.id);
    await supabase.from("properties").delete().eq("id", propertyRow.id);
    return NextResponse.json(
      {
        ok: false,
        message: getUnknownErrorMessage(uploadError, "Unable to upload request images."),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, propertyId: String(propertyRow.id) });
}
