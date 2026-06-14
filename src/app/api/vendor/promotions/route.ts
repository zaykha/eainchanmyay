import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { resolveListingImage } from "@/features/site/shared/lib/images";
import { calculatePromotionEndsAt, isPromotionListingStatusEligible, normalizePromotionTargetType, normalizePromotionType, selectActiveBoostedListingPromotions, selectActiveHeroPromotions } from "@/lib/vendor-promotions";
import { isAdminOrOwner, isOwner } from "@/lib/vendor-permissions";


type PropertyRow = {
  id: string;
  title: string | null;
  property_type: string | null;
  deal_type: string | null;
  price: number | null;
  currency: string | null;
  township: string | null;
  status: string | null;
};

type PropertyImageRow = {
  property_id: string | null;
  public_url: string | null;
  r2_key: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

type PromotionRow = {
  id: string;
  vendor_id: string;
  listing_id: string | null;
  promotion_type: string | null;
  target_type: string | null;
  status: string | null;
  title: string | null;
  description: string | null;
  banner_image_url: string | null;
  target_url: string | null;
  price_per_24h: number | null;
  price_paid: number | null;
  duration_hours: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CreatePromotionBody = {
  promotion_type?: string;
  target_type?: string;
  listing_id?: string | null;
  title?: string | null;
  description?: string | null;
  duration_hours?: number | string | null;
  price_per_24h?: number | string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  target_url?: string | null;
  banner_image_url?: string | null;
};

function toNullableTrimmedString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request, { requireExplicitVendorSelection: true });
  if (!result.ok) return result.response;

  const { supabase, vendor, memberIds, membership } = result.context;
  if (!isAdminOrOwner(membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can access promotions." }, { status: 403 });
  }
  if (vendor.verified_status !== "approved") {
    return NextResponse.json(
      {
        error: "Verification required to boost listings or agency profile.",
        code: "verification_required",
      },
      { status: 403 }
    );
  }

  const [promotionsResult, listingsResult] = await Promise.all([
    supabase
      .from("vendor_promotions")
      .select("id,vendor_id,listing_id,promotion_type,target_type,status,title,description,banner_image_url,target_url,price_per_24h,price_paid,duration_hours,starts_at,ends_at,created_by,created_at,updated_at")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
    memberIds.length
      ? supabase
          .from("properties")
          .select("id,title,property_type,deal_type,price,currency,township,status")
          .in("created_by", memberIds)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (promotionsResult.error) {
    return NextResponse.json({ error: promotionsResult.error.message }, { status: 500 });
  }
  if (listingsResult.error) {
    return NextResponse.json({ error: listingsResult.error.message }, { status: 500 });
  }

  const listings = ((listingsResult.data ?? []) as PropertyRow[]).filter((item) => isPromotionListingStatusEligible(item.status));
  const listingIds = listings.map((item) => item.id);
  let propertyImages: PropertyImageRow[] = [];

  if (listingIds.length) {
    const { data, error } = await supabase
      .from("property_images")
      .select("property_id,public_url,r2_key,is_cover,sort_order")
      .in("property_id", listingIds)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    propertyImages = (data ?? []) as PropertyImageRow[];
  }

  const propertyPhotosMap = new Map<string, PropertyImageRow[]>();
  for (const image of propertyImages) {
    const propertyId = String(image.property_id ?? "");
    if (!propertyId) continue;
    const existing = propertyPhotosMap.get(propertyId) ?? [];
    existing.push(image);
    propertyPhotosMap.set(propertyId, existing);
  }

  const promotions = (promotionsResult.data ?? []) as PromotionRow[];
  const now = new Date();

  return NextResponse.json({
    workspace: {
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorSlug: vendor.slug,
      verifiedStatus: vendor.verified_status,
      membershipRole: membership.role,
    },
    eligibleListings: listings.map((item) => ({
      ...item,
      cover_image_url: resolveListingImage(
        item as unknown as Record<string, unknown>,
        (propertyPhotosMap.get(item.id) ?? []) as unknown as Record<string, unknown>[]
      ),
    })),
    items: promotions,
    helperPreview: {
      activeHeroIds: selectActiveHeroPromotions(promotions, now).map((item) => item.id),
      activeBoostIds: selectActiveBoostedListingPromotions(promotions, now).map((item) => item.id),
      searchRankingTodo: "TODO: wire search ranking bonus into listing search ordering helpers.",
      heroRotationTodo: "TODO: wire hero ordering helper into homepage hero rotation with fallback filler slots.",
      listingBoostTodo: "TODO: wire boosted listing helper into public featured/boosted listing slots.",
    },
  });
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request, { requireExplicitVendorSelection: true });
  if (!result.ok) return result.response;

  const { supabase, user, vendor, memberIds, membership } = result.context;
  if (!isOwner(membership.role)) {
    return NextResponse.json({ error: "Only workspace owners can create promotions." }, { status: 403 });
  }
  if (vendor.verified_status !== "approved") {
    return NextResponse.json({ error: "Only verified agencies can create promotions." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as CreatePromotionBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const promotionType = normalizePromotionType(body.promotion_type);
  if (!promotionType) {
    return NextResponse.json({ error: "promotion_type is required." }, { status: 400 });
  }

  const targetType = normalizePromotionTargetType(body.target_type ?? (promotionType === "hero_ad" ? "agency_profile" : "listing"));
  if (!targetType) {
    return NextResponse.json({ error: "target_type is required." }, { status: 400 });
  }

  if ((promotionType === "search_ranking" || promotionType === "listing_boost") && targetType !== "listing") {
    return NextResponse.json({ error: "Search ranking and listing boost must target a listing." }, { status: 400 });
  }

  const durationHours = toNumber(body.duration_hours);
  if (durationHours === null || durationHours <= 0) {
    return NextResponse.json({ error: "duration_hours must be positive." }, { status: 400 });
  }

  const pricePer24h = toNumber(body.price_per_24h);
  if (pricePer24h === null || pricePer24h < 0) {
    return NextResponse.json({ error: "price_per_24h must be numeric and greater than or equal to 0." }, { status: 400 });
  }

  const startsAtInput = toNullableTrimmedString(body.starts_at);
  if (!startsAtInput || !Number.isFinite(new Date(startsAtInput).getTime())) {
    return NextResponse.json({ error: "starts_at is required and must be valid." }, { status: 400 });
  }

  const computedEndsAt = calculatePromotionEndsAt(startsAtInput, durationHours);
  if (!computedEndsAt) {
    return NextResponse.json({ error: "Unable to calculate ends_at." }, { status: 400 });
  }

  let listing: PropertyRow | null = null;
  const requestedListingId = toNullableTrimmedString(body.listing_id);
  if (targetType === "listing") {
    if (!requestedListingId) {
      return NextResponse.json({ error: "listing_id is required for this promotion." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("properties")
      .select("id,title,property_type,deal_type,price,currency,township,status")
      .eq("id", requestedListingId)
      .in("created_by", memberIds)
      .eq("is_deleted", false)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    listing = (data as PropertyRow | null) ?? null;
    if (!listing) {
      return NextResponse.json({ error: "Selected listing was not found in this workspace." }, { status: 404 });
    }
    if (!isPromotionListingStatusEligible(listing.status)) {
      return NextResponse.json({ error: "Selected listing must be active before it can be promoted." }, { status: 400 });
    }
  }

  if (promotionType === "hero_ad" && targetType === "agency_profile" && requestedListingId) {
    return NextResponse.json({ error: "Agency profile hero promotions cannot include a listing_id." }, { status: 400 });
  }

  const targetUrl =
    toNullableTrimmedString(body.target_url) ??
    (targetType === "agency_profile" ? (vendor.slug ? `/agency/${vendor.slug}` : null) : listing ? `/listing/${listing.id}` : null);

  const insertPayload = {
    vendor_id: vendor.id,
    listing_id: targetType === "listing" ? listing?.id ?? requestedListingId : null,
    promotion_type: promotionType,
    target_type: targetType,
    status: "draft",
    title:
      toNullableTrimmedString(body.title) ??
      (targetType === "agency_profile"
        ? `${vendor.name} hero placement`
        : listing?.title
          ? `${listing.title} ${promotionType.replace(/_/g, " ")}`
          : null),
    description: toNullableTrimmedString(body.description),
    banner_image_url: toNullableTrimmedString(body.banner_image_url),
    target_url: targetUrl,
    price_per_24h: pricePer24h,
    duration_hours: durationHours,
    starts_at: startsAtInput,
    ends_at: computedEndsAt,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("vendor_promotions")
    .insert(insertPayload)
    .select("id,vendor_id,listing_id,promotion_type,target_type,status,title,description,banner_image_url,target_url,price_per_24h,price_paid,duration_hours,starts_at,ends_at,created_by,created_at,updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    item: data,
    message: "Promotion saved as draft. Payment and activation are still pending implementation.",
  });
}
