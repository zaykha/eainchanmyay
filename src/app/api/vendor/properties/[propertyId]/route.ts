import { NextResponse } from "next/server";
import { getVendorRequestContext, type VendorRequestContext } from "@/app/api/vendor/_lib/context";
import { resolveImage, resolveListingImage, resolvePhotoUrl } from "@/app/living-site/lib/images";
import { propertyTypeValues } from "@/lib/property-types";

const allowedStatuses = new Set(["draft", "published", "sold", "rented", "archived"]);
const allowedDeals = new Set(["sale", "rent"]);
const allowedPropertyTypes = new Set(propertyTypeValues);
const allowedBackupPowerTypes = new Set(["solar", "generator", "solar_generator"]);

function toNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toBoolean(value: unknown) {
  return value === true;
}

async function getScopedProperty(context: VendorRequestContext, propertyId: string) {
  const { supabase, memberIds } = context;

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      "id,title,description,deal_type,property_type,status,price,currency,state_region,district,township,city,address_text,bedrooms,bathrooms,area_sqft,has_lift,has_backup_power,backup_power_type,has_parking,latitude,longitude,created_at,updated_at,created_by,is_deleted,verification_status,verified_at,verification_notes"
    )
    .eq("id", propertyId)
    .in("created_by", memberIds)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    return { property: null, response: NextResponse.json({ error: error.message }, { status: 500 }) };
  }

  if (!property) {
    return { property: null, response: NextResponse.json({ error: "Property not found in this vendor workspace." }, { status: 404 }) };
  }

  return { property, response: null };
}

export async function GET(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { propertyId } = await params;
  const scoped = await getScopedProperty(result.context, propertyId);
  if (!scoped.property) {
    return scoped.response!;
  }

  const { supabase } = result.context;
  const { data: images, error: imageError } = await supabase
    .from("property_images")
    .select("id,property_id,public_url,r2_key,is_cover,sort_order")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true });

  if (imageError) {
    return NextResponse.json({ error: imageError.message }, { status: 500 });
  }

  const photos = images ?? [];

  return NextResponse.json({
    property: {
      ...scoped.property,
      cover_image_url: resolveListingImage(scoped.property as Record<string, unknown>, photos as Record<string, unknown>[]),
    },
    images: photos.map((image) => ({
      ...image,
      resolved_url:
        resolvePhotoUrl(image as Record<string, unknown>) ||
        resolveImage(typeof image.r2_key === "string" ? image.r2_key : undefined) ||
        null,
    })),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { propertyId } = await params;
  const scoped = await getScopedProperty(result.context, propertyId);
  if (!scoped.property) {
    return scoped.response!;
  }

  const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!raw) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const dealType = toNullableString(raw.deal_type);
  const propertyType = toNullableString(raw.property_type);
  const status = toNullableString(raw.status);
  const backupPowerType = toNullableString(raw.backup_power_type);

  if (!dealType || !allowedDeals.has(dealType)) {
    return NextResponse.json({ error: "Invalid deal type." }, { status: 400 });
  }
  if (!propertyType || !allowedPropertyTypes.has(propertyType)) {
    return NextResponse.json({ error: "Invalid property type." }, { status: 400 });
  }
  if (!status || !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Invalid property status." }, { status: 400 });
  }
  if (backupPowerType && !allowedBackupPowerTypes.has(backupPowerType)) {
    return NextResponse.json({ error: "Invalid backup power type." }, { status: 400 });
  }
  if (!toNullableString(raw.title)) {
    return NextResponse.json({ error: "Property title is required." }, { status: 400 });
  }
  if (!toNullableString(raw.state_region) || !toNullableString(raw.township)) {
    return NextResponse.json({ error: "State / region and township are required." }, { status: 400 });
  }

  const isLand = propertyType === "land";
  const payload = {
    title: toNullableString(raw.title),
    description: toNullableString(raw.description),
    deal_type: dealType,
    property_type: propertyType,
    status,
    price: toNullableNumber(raw.price),
    currency: toNullableString(raw.currency) ?? "MMK",
    state_region: toNullableString(raw.state_region),
    district: toNullableString(raw.district),
    township: toNullableString(raw.township),
    city: toNullableString(raw.city),
    address_text: toNullableString(raw.address_text),
    bedrooms: isLand ? null : toNullableNumber(raw.bedrooms),
    bathrooms: isLand ? null : toNullableNumber(raw.bathrooms),
    area_sqft: toNullableNumber(raw.area_sqft),
    has_lift: isLand ? false : toBoolean(raw.has_lift),
    has_backup_power: isLand ? false : toBoolean(raw.has_backup_power),
    backup_power_type: isLand ? null : backupPowerType,
    has_parking: isLand ? false : toBoolean(raw.has_parking),
    latitude: toNullableNumber(raw.latitude),
    longitude: toNullableNumber(raw.longitude),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await result.context.supabase
    .from("properties")
    .update(payload)
    .eq("id", propertyId)
    .select(
      "id,title,description,deal_type,property_type,status,price,currency,state_region,district,township,city,address_text,bedrooms,bathrooms,area_sqft,has_lift,has_backup_power,backup_power_type,has_parking,latitude,longitude,created_at,updated_at,verification_status,verified_at,verification_notes"
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ property: data });
}
