import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveListingImage } from "@/app/living-site/lib/images";
import { publicListingQueryStatuses } from "@/lib/lifecycle";
import { getVendorPlan } from "@/lib/vendor-plans";
import { getVendorStorefrontBadges } from "@/lib/vendor-storefront";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { slug } = await context.params;
  const storefrontSlug = slug.trim().toLowerCase();
  if (!storefrontSlug) {
    return NextResponse.json({ error: "Storefront slug is required." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: vendorRow, error: vendorError } = await supabase
    .from("vendors")
    .select(
      "id,name,vendor_type,plan,verified_status:verification_status,slug,tagline,description,contact_phone,contact_email,logo_url,facebook_url,telegram_url,viber_phone,tiktok_url,website_url,cover_image_url,strengths,public_storefront_enabled"
    )
    .eq("slug", storefrontSlug)
    .eq("public_storefront_enabled", true)
    .maybeSingle();

  if (vendorError) {
    return NextResponse.json({ error: vendorError.message }, { status: 500 });
  }

  if (!vendorRow?.id || !vendorRow.name) {
    return NextResponse.json({ error: "Agency profile not found." }, { status: 404 });
  }

  const { data: membershipRows, error: membershipError } = await supabase
    .from("vendor_members")
    .select("user_id")
    .eq("vendor_id", vendorRow.id)
    .eq("status", "active");

  if (membershipError) {
    return NextResponse.json({ error: membershipError.message }, { status: 500 });
  }

  const memberIds = (membershipRows ?? [])
    .map((row) => String(row.user_id ?? ""))
    .filter(Boolean);

  let listingRows: Array<Record<string, unknown>> = [];
  let photosByProperty = new Map<string, Record<string, unknown>[]>();

  if (memberIds.length) {
    const { data: properties, error: propertiesError } = await supabase
      .from("properties")
      .select(
        "id,title,deal_type,property_type,price,currency,state_region,district,township,bedrooms,bathrooms,area_sqft,created_at"
      )
      .in("created_by", memberIds)
      .in("status", publicListingQueryStatuses)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(24);

    if (propertiesError) {
      return NextResponse.json({ error: propertiesError.message }, { status: 500 });
    }

    listingRows = (properties ?? []) as Array<Record<string, unknown>>;
    const propertyIds = listingRows.map((row) => String(row.id ?? "")).filter(Boolean);

    if (propertyIds.length) {
      const { data: photos, error: photoError } = await supabase
        .from("property_images")
        .select("*")
        .in("property_id", propertyIds)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true });

      if (photoError) {
        return NextResponse.json({ error: photoError.message }, { status: 500 });
      }

      photosByProperty = (photos ?? []).reduce((map, photo) => {
        const propertyId = String(photo.property_id ?? "");
        if (!propertyId) return map;
        const bucket = map.get(propertyId) ?? [];
        bucket.push(photo as Record<string, unknown>);
        map.set(propertyId, bucket);
        return map;
      }, new Map<string, Record<string, unknown>[]>());
    }
  }

  return NextResponse.json({
    agency: {
      id: String(vendorRow.id),
      name: String(vendorRow.name),
      vendor_type: (vendorRow.vendor_type as string | null) ?? null,
      plan: (vendorRow.plan as string | null) ?? null,
      plan_name: getVendorPlan((vendorRow.plan as string | null) ?? null).name,
      verified_status: (vendorRow.verified_status as string | null) ?? null,
      slug: (vendorRow.slug as string | null) ?? null,
      tagline: (vendorRow.tagline as string | null) ?? null,
      description: (vendorRow.description as string | null) ?? null,
      contact_phone: (vendorRow.contact_phone as string | null) ?? null,
      contact_email: (vendorRow.contact_email as string | null) ?? null,
      logo_url: (vendorRow.logo_url as string | null) ?? null,
      facebook_url: (vendorRow.facebook_url as string | null) ?? null,
      telegram_url: (vendorRow.telegram_url as string | null) ?? null,
      viber_phone: (vendorRow.viber_phone as string | null) ?? null,
      tiktok_url: (vendorRow.tiktok_url as string | null) ?? null,
      website_url: (vendorRow.website_url as string | null) ?? null,
      cover_image_url: (vendorRow.cover_image_url as string | null) ?? null,
      strengths: Array.isArray(vendorRow.strengths)
        ? vendorRow.strengths.map((item) => String(item)).filter(Boolean)
        : [],
      badges: getVendorStorefrontBadges({
        plan: (vendorRow.plan as string | null) ?? null,
        verifiedStatus: (vendorRow.verified_status as string | null) ?? null,
        vendorType: (vendorRow.vendor_type as string | null) ?? null,
      }),
    },
    listings: listingRows.map((row) => {
      const id = String(row.id ?? "");
      const photos = photosByProperty.get(id) ?? [];
      return {
        id,
        title: String(row.title ?? "Property"),
        deal_type: (row.deal_type as string | null) ?? null,
        property_type: (row.property_type as string | null) ?? null,
        price: typeof row.price === "number" ? row.price : row.price ? Number(row.price) : null,
        currency: (row.currency as string | null) ?? "MMK",
        state_region: (row.state_region as string | null) ?? null,
        district: (row.district as string | null) ?? null,
        township: (row.township as string | null) ?? null,
        city: (row.district as string | null) ?? null,
        bedrooms: typeof row.bedrooms === "number" ? row.bedrooms : row.bedrooms ? Number(row.bedrooms) : null,
        bathrooms:
          typeof row.bathrooms === "number" ? row.bathrooms : row.bathrooms ? Number(row.bathrooms) : null,
        area_sqft: typeof row.area_sqft === "number" ? row.area_sqft : row.area_sqft ? Number(row.area_sqft) : null,
        image_url: resolveListingImage(row, photos),
      };
    }),
  });
}
