import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveListingImage } from "@/app/living-site/lib/images";
import { publicListingQueryStatuses } from "@/lib/lifecycle";
import { normalizePromotionTargetType, selectActiveHeroPromotions } from "@/lib/vendor-promotions";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

type PromotionRow = {
  id: string | null;
  vendor_id: string | null;
  listing_id: string | null;
  promotion_type: string | null;
  target_type: string | null;
  status: string | null;
  title: string | null;
  description: string | null;
  target_url: string | null;
  price_per_24h: number | null;
  starts_at: string | null;
  ends_at: string | null;
};

type VendorRow = {
  id: string | null;
  name: string | null;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  plan: string | null;
  verified_status: string | null;
  public_storefront_enabled: boolean | null;
};

type ListingRow = {
  id: string | null;
  title: string | null;
  description: string | null;
  deal_type: string | null;
  property_type: string | null;
  price: number | string | null;
  currency: string | null;
  state_region: string | null;
  district: string | null;
  township: string | null;
  bedrooms: number | string | null;
  bathrooms: number | string | null;
  area_sqft: number | string | null;
};

type PropertyImageRow = {
  property_id: string | null;
  public_url: string | null;
  r2_key: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

const propertyImageSelect = "property_id,public_url,r2_key,is_cover,sort_order";

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toTitleCase(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return "";
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toLogoText(value: string | null | undefined) {
  const parts = String(value ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase());
  return parts.join("") || "AG";
}

function getLocation(row: {
  township?: string | null;
  district?: string | null;
  state_region?: string | null;
}) {
  return [row.township, row.district, row.state_region].filter(Boolean).join(" • ");
}

function isMissingRelationError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("schema cache") || normalized.includes("could not find the table") || normalized.includes("relation");
}

export async function GET() {
  if (!isConfigured) {
    return NextResponse.json({ slides: [] });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const promotionsResult = await supabase
    .from("vendor_promotions")
    .select("id,vendor_id,listing_id,promotion_type,target_type,status,title,description,target_url,price_per_24h,starts_at,ends_at")
    .order("created_at", { ascending: false });

  if (promotionsResult.error) {
    if (isMissingRelationError(promotionsResult.error.message)) {
      return NextResponse.json({ slides: [] });
    }
    return NextResponse.json({ error: promotionsResult.error.message }, { status: 500 });
  }

  const promotions = ((promotionsResult.data ?? []) as PromotionRow[]).map((item) => ({
    id: String(item.id ?? ""),
    vendor_id: typeof item.vendor_id === "string" ? item.vendor_id : null,
    listing_id: typeof item.listing_id === "string" ? item.listing_id : null,
    promotion_type: item.promotion_type,
    target_type: item.target_type,
    status: item.status,
    title: item.title,
    description: item.description,
    target_url: item.target_url,
    price_per_24h: item.price_per_24h,
    starts_at: item.starts_at,
    ends_at: item.ends_at,
  }));

  const activeHeroPromotions = selectActiveHeroPromotions(promotions, new Date(), 4).filter(
    (item) => item.id && item.vendor_id
  );

  if (!activeHeroPromotions.length) {
    return NextResponse.json(
      { slides: [] },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  }

  const vendorIds = Array.from(new Set(activeHeroPromotions.map((item) => item.vendor_id).filter(Boolean))) as string[];
  const listingIds = Array.from(new Set(activeHeroPromotions.map((item) => item.listing_id).filter(Boolean))) as string[];

  const [vendorsResult, listingsResult] = await Promise.all([
    supabase
      .from("vendors")
      .select("id,name,slug,tagline,description,logo_url,cover_image_url,plan,verified_status:verification_status,public_storefront_enabled")
      .in("id", vendorIds),
    listingIds.length
      ? supabase
          .from("properties")
          .select("id,title,description,deal_type,property_type,price,currency,state_region,district,township,bedrooms,bathrooms,area_sqft")
          .in("id", listingIds)
          .in("status", publicListingQueryStatuses)
          .eq("is_deleted", false)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (vendorsResult.error) {
    return NextResponse.json({ error: vendorsResult.error.message }, { status: 500 });
  }
  if (listingsResult.error) {
    return NextResponse.json({ error: listingsResult.error.message }, { status: 500 });
  }

  const vendors = new Map(
    ((vendorsResult.data ?? []) as VendorRow[]).map((vendor) => [String(vendor.id ?? ""), vendor])
  );
  const listings = new Map(
    ((listingsResult.data ?? []) as ListingRow[]).map((listing) => [String(listing.id ?? ""), listing])
  );

  let photosByProperty = new Map<string, Record<string, unknown>[]>();
  if (listingIds.length) {
    const { data: photos, error: photoError } = await supabase
      .from("property_images")
      .select(propertyImageSelect)
      .in("property_id", listingIds)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });

    if (photoError) {
      return NextResponse.json({ error: photoError.message }, { status: 500 });
    }

    photosByProperty = ((photos ?? []) as PropertyImageRow[]).reduce((map, photo) => {
      const propertyId = String(photo.property_id ?? "");
      if (!propertyId) return map;
      const bucket = map.get(propertyId) ?? [];
      bucket.push(photo as unknown as Record<string, unknown>);
      map.set(propertyId, bucket);
      return map;
    }, new Map<string, Record<string, unknown>[]>());
  }

  const memberRowsResult = await supabase
    .from("vendor_members")
    .select("vendor_id,user_id")
    .in("vendor_id", vendorIds)
    .eq("status", "active");

  if (memberRowsResult.error) {
    return NextResponse.json({ error: memberRowsResult.error.message }, { status: 500 });
  }

  const memberIdsByVendor = new Map<string, string[]>();
  for (const row of memberRowsResult.data ?? []) {
    const vendorId = String(row.vendor_id ?? "");
    const userId = String(row.user_id ?? "");
    if (!vendorId || !userId) continue;
    const bucket = memberIdsByVendor.get(vendorId) ?? [];
    bucket.push(userId);
    memberIdsByVendor.set(vendorId, bucket);
  }

  let vendorStatsEntries: ReadonlyArray<readonly [string, { activeListingsCount: number; areaFocus: string }]>;
  try {
    vendorStatsEntries = await Promise.all(
      vendorIds.map(async (vendorId) => {
        const memberIds = memberIdsByVendor.get(vendorId) ?? [];
        if (!memberIds.length) {
          return [vendorId, { activeListingsCount: 0, areaFocus: "" }] as const;
        }

        const { data, count, error } = await supabase
          .from("properties")
          .select("id,state_region,district,township", { count: "exact" })
          .in("created_by", memberIds)
          .in("status", publicListingQueryStatuses)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .range(0, 11);

        if (error) {
          throw error;
        }

        const firstLocation = (data?.[0] ?? null) as
          | { township?: string | null; district?: string | null; state_region?: string | null }
          | null;

        return [
          vendorId,
          {
            activeListingsCount: count ?? data?.length ?? 0,
            areaFocus: firstLocation ? getLocation(firstLocation) : "",
          },
        ] as const;
      })
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load vendor hero stats." },
      { status: 500 }
    );
  }

  const vendorStats = new Map(vendorStatsEntries);

  const slides = activeHeroPromotions
    .map((promotion) => {
      const vendor = vendors.get(String(promotion.vendor_id ?? ""));
      if (!vendor?.id || !vendor.name) return null;
      const targetType = normalizePromotionTargetType(promotion.target_type);

      if (targetType === "agency_profile") {
        const stats = vendorStats.get(String(vendor.id ?? "")) ?? { activeListingsCount: 0, areaFocus: "" };
        const targetUrl =
          promotion.target_url ||
          (vendor.slug && vendor.public_storefront_enabled ? `/agency/${vendor.slug}` : null);
        return {
          id: String(promotion.id ?? ""),
          kind: "agency",
          name: vendor.name,
          tagline: promotion.title || vendor.tagline || "Verified agency spotlight",
          summary: promotion.description || vendor.description || "Promote your agency profile in the homepage hero rotation.",
          logoText: toLogoText(vendor.name),
          logoUrl: vendor.logo_url,
          coverImageUrl: vendor.cover_image_url,
          areaFocus: stats.areaFocus || "Myanmar",
          activeListingsLabel: String(stats.activeListingsCount || 0),
          planLabel: toTitleCase(vendor.plan) || "Agency",
          verifiedLabel: vendor.verified_status === "approved" ? "Verified" : "Agency",
          targetUrl,
        };
      }

      const listing = listings.get(String(promotion.listing_id ?? ""));
      if (!listing?.id) return null;

      return {
        id: String(promotion.id ?? ""),
        kind: "listing",
        title: promotion.title || listing.title || "Featured listing",
        listingTitle: listing.title || promotion.title || "Featured listing",
        location: getLocation(listing),
        price: toNumber(listing.price),
        currency: listing.currency || "MMK",
        summary:
          promotion.description ||
          listing.description ||
          "A featured hero placement designed to drive buyers into the property detail and contact flow.",
        propertyType: listing.property_type || "property",
        bedrooms: toNumber(listing.bedrooms),
        bathrooms: toNumber(listing.bathrooms),
        areaSqft: toNumber(listing.area_sqft),
        imageUrl: resolveListingImage(listing as unknown as Record<string, unknown>, photosByProperty.get(String(listing.id ?? "")) ?? []),
        listingId: String(listing.id ?? ""),
        dealType: listing.deal_type || "sale",
        targetUrl: promotion.target_url || `/listing/${listing.id}`,
        vendorName: vendor.name,
      };
    })
    .filter(Boolean);

  return NextResponse.json(
    { slides },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
