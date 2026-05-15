import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveListingImage } from "@/app/living-site/lib/images";
import { rateLimit } from "@/app/api/_lib/rate-limit";
import { publicListingQueryStatuses } from "@/lib/lifecycle";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && (supabaseServiceRoleKey || supabaseAnonKey));

const getString = (value: unknown) => (typeof value === "string" ? value : "");
const getNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const isValidCoordinate = (value: number | undefined, kind: "latitude" | "longitude") => {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  return kind === "latitude" ? value >= -90 && value <= 90 : value >= -180 && value <= 180;
};

const isMissingColumnError = (message: string) => {
  const normalized = message.toLowerCase();
  return normalized.includes("schema cache") || normalized.includes("could not find the") || normalized.includes("column");
};

const propertyImageSelect = "property_id,public_url,r2_key,is_cover,sort_order";

export async function GET(request: Request) {
  const isLocalRequest =
    request.headers.get("host")?.includes("localhost") ||
    request.headers.get("host")?.includes("127.0.0.1");
  const limit =
    process.env.NODE_ENV === "production" && !isLocalRequest
      ? rateLimit(request, {
          windowMs: 60_000,
          max: 120,
          minIntervalMs: 200,
          keyPrefix: "listings",
        })
      : {
          limited: false,
          remaining: Number.POSITIVE_INFINITY,
          resetAt: Date.now() + 60_000,
        };
  if (limit.limited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
          "X-RateLimit-Reset": String(limit.resetAt),
        },
      }
    );
  }
  if (!isConfigured) {
    return NextResponse.json({
      data: [],
      page: 1,
      pageSize: 6,
      total: 0,
      hasMore: false,
    });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.max(1, Math.min(120, Number(searchParams.get("pageSize") ?? "6")));
  const query = searchParams.get("q") ?? "";
  const view = searchParams.get("view") ?? "";
  const dealType = searchParams.get("deal") ?? "";
  const propertyType = searchParams.get("type") ?? "";
  const stateRegion = searchParams.get("state") ?? "";
  const district = searchParams.get("district") ?? "";
  const township = searchParams.get("township") ?? "";
  const minPrice = getNumber(searchParams.get("minPrice"));
  const maxPrice = getNumber(searchParams.get("maxPrice"));
  const bedrooms = getNumber(searchParams.get("beds"));
  const bathrooms = getNumber(searchParams.get("baths"));
  const minArea = getNumber(searchParams.get("minArea"));
  const maxArea = getNumber(searchParams.get("maxArea"));
  const south = getNumber(searchParams.get("south"));
  const north = getNumber(searchParams.get("north"));
  const west = getNumber(searchParams.get("west"));
  const east = getNumber(searchParams.get("east"));
  const hasBounds =
    typeof south === "number" &&
    typeof north === "number" &&
    typeof west === "number" &&
    typeof east === "number";
  const statusScope = view === "map" ? ["active", "published"] : [...publicListingQueryStatuses];

  const supabase = createClient(
    supabaseUrl,
    supabaseServiceRoleKey || supabaseAnonKey,
    supabaseServiceRoleKey
      ? {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      : undefined
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const buildQuery = (selectColumns: string, withBounds: boolean) => {
    let queryBuilder = supabase
      .from("properties")
      .select(selectColumns, { count: "exact" })
      .in("status", statusScope)
      .eq("is_deleted", false);

    if (dealType.trim()) {
      queryBuilder = queryBuilder.eq("deal_type", dealType.trim());
    }
    if (propertyType.trim()) {
      queryBuilder = queryBuilder.eq("property_type", propertyType.trim());
    }
    if (stateRegion.trim()) {
      queryBuilder = queryBuilder.ilike("state_region", `%${stateRegion.trim()}%`);
    }
    if (district.trim()) {
      queryBuilder = queryBuilder.ilike("district", `%${district.trim()}%`);
    }
    if (township.trim()) {
      queryBuilder = queryBuilder.ilike("township", `%${township.trim()}%`);
    }
    if (typeof minPrice === "number") {
      queryBuilder = queryBuilder.gte("price", minPrice);
    }
    if (typeof maxPrice === "number") {
      queryBuilder = queryBuilder.lte("price", maxPrice);
    }
    if (typeof bedrooms === "number") {
      queryBuilder = queryBuilder.gte("bedrooms", bedrooms);
    }
    if (typeof bathrooms === "number") {
      queryBuilder = queryBuilder.gte("bathrooms", bathrooms);
    }
    if (typeof minArea === "number") {
      queryBuilder = queryBuilder.gte("area_sqft", minArea);
    }
    if (typeof maxArea === "number") {
      queryBuilder = queryBuilder.lte("area_sqft", maxArea);
    }
    if (withBounds && hasBounds) {
      queryBuilder = queryBuilder
        .gte("latitude", south)
        .lte("latitude", north)
        .gte("longitude", west)
        .lte("longitude", east);
    }
    if (query.trim()) {
      const escaped = query.trim().replace(/%/g, "");
      queryBuilder = queryBuilder.or(
        `title.ilike.%${escaped}%,state_region.ilike.%${escaped}%,district.ilike.%${escaped}%,township.ilike.%${escaped}%`
      );
    }

    return queryBuilder.range(from, to);
  };

  let { data: properties, error, count } = await buildQuery(
    "id,title,deal_type,property_type,price,currency,state_region,district,township,bedrooms,bathrooms,area_sqft,latitude,longitude",
    true
  );

  if (error && isMissingColumnError(error.message)) {
    ({ data: properties, error, count } = await buildQuery(
      "id,title,deal_type,property_type,price,currency,state_region,district,township,bedrooms,bathrooms,area_sqft",
      false
    ));
  }

  if (error || !properties) {
    console.warn("Failed to load listings", error);
    return NextResponse.json({
      data: [],
      page,
      pageSize,
      total: 0,
      hasMore: false,
    });
  }

  const ids = properties.map((property) => property.id).filter(Boolean);
  let photosByProperty = new Map<string, Record<string, unknown>[]>();

  if (ids.length) {
    const { data: photos, error: photoError } = await supabase
      .from("property_images")
      .select(propertyImageSelect)
      .in("property_id", ids)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });

    if (photoError) {
      console.warn("Failed to load listing images", photoError);
    } else if (photos) {
      photosByProperty = photos.reduce((map, photo) => {
        const propertyId = String(photo.property_id ?? "");
        if (!propertyId) return map;
        const bucket = map.get(propertyId) ?? [];
        bucket.push(photo);
        map.set(propertyId, bucket);
        return map;
      }, new Map<string, Record<string, unknown>[]>());
    }
  }

  const listings = properties.map((property) => {
    const id = String(property.id ?? "");
    const photos = photosByProperty.get(id) ?? [];
    return {
      id,
      title: getString(property.title) || "",
      location:
        [property.township, property.district, property.state_region]
          .filter(Boolean)
          .join(", ") || "",
      price: getNumber(property.price),
      currency: getString(property.currency) || "MMK",
      dealType: getString(property.deal_type),
      propertyType: getString(property.property_type),
      stateRegion: getString(property.state_region),
      city: getString(property.district),
      township: getString(property.township),
      district: getString(property.district),
      areaSqft: getNumber(property.area_sqft),
      bedrooms: getNumber(property.bedrooms),
      bathrooms: getNumber(property.bathrooms),
      latitude: isValidCoordinate(getNumber(property.latitude), "latitude")
        ? getNumber(property.latitude)
        : undefined,
      longitude: isValidCoordinate(getNumber(property.longitude), "longitude")
        ? getNumber(property.longitude)
        : undefined,
      imageUrl: resolveListingImage(property as Record<string, unknown>, photos),
      raw: property as Record<string, unknown>,
    };
  });

  const total = count ?? listings.length;
  const hasMore = from + listings.length < total;

  return NextResponse.json(
    {
      data: listings,
      page,
      pageSize,
      total,
      hasMore,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        "X-RateLimit-Remaining": String(limit.remaining),
        "X-RateLimit-Reset": String(limit.resetAt),
      },
    }
  );
}
