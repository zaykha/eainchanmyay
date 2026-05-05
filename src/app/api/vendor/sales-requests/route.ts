import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { getVendorPlanUsage } from "@/app/api/vendor/_lib/plan-limits";
import { deletePropertyImages, uploadPropertyImages } from "@/app/api/_lib/property-image-upload";
import type { PropertyType } from "@/lib/property-types";
import { moderateListingText } from "@/lib/moderation-rules";
import { getVendorPlan } from "@/lib/vendor-plans";

export const runtime = "nodejs";

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
  floor_count?: number | null;
  room_count?: number | null;
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

function getUnknownErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

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

  const contentType = request.headers.get("content-type") ?? "";
  let body: Payload = {};
  let imageFiles: File[] = [];
  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const payloadRaw = formData.get("payload");
      body = JSON.parse(typeof payloadRaw === "string" ? payloadRaw : "{}") as Payload;
      imageFiles = formData
        .getAll("images")
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    } else {
      body = (await request.json()) as Payload;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
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

  const moderationResult = moderateListingText({
    title: body.title,
    description: body.description,
  });
  if (moderationResult.blocked) {
    return NextResponse.json(
      { error: moderationResult.message, reasons: moderationResult.reasons },
      { status: 400 }
    );
  }

  if (imageFiles.length === 0) {
    return NextResponse.json({ error: "At least 1 property image is required." }, { status: 400 });
  }

  const imageLimit = getVendorPlan(result.context.vendor.plan).imageLimit;
  if (imageFiles.length > imageLimit) {
    return NextResponse.json(
      { error: `You can upload up to ${imageLimit} property image${imageLimit > 1 ? "s" : ""}.` },
      { status: 400 }
    );
  }

  const payload = {
    vendor_id: result.context.vendor.id,
    created_by: user.id,
    is_deleted: false,
    status: "published",
    city: body.district?.trim() || body.township?.trim() || body.state_region?.trim() || "Myanmar",
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
    floor_count: toNullableNumber(body.floor_count),
    room_count: toNullableNumber(body.room_count),
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

  const { data: propertyRow, error } = await supabase
    .from("properties")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (error || !propertyRow?.id) {
    return NextResponse.json({ error: error?.message ?? "Unable to create listing." }, { status: 500 });
  }

  try {
    const { rows: imageRows, storagePaths } = await uploadPropertyImages({
      supabase,
      folder: `vendor-listings/${result.context.vendor.id}`,
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
      { error: getUnknownErrorMessage(uploadError, "Unable to upload property images.") },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, propertyId: String(propertyRow.id) });
}
