import { supabase, isSupabaseConfigured } from "@/app/living-site/lib/supabase";
import { resolveListingImage } from "@/app/living-site/lib/images";

export type Listing = {
  id: string;
  title: string;
  location: string;
  price?: number;
  currency?: string;
  dealType?: string;
  propertyType?: string;
  township?: string;
  district?: string;
  imageUrl?: string;
  raw: Record<string, unknown>;
};

export type ListingDetail = {
  property: Record<string, unknown>;
  images: Record<string, unknown>[];
};

export type ListingFilters = {
  query?: string;
  dealType?: string;
  propertyType?: string;
  stateRegion?: string;
  district?: string;
  township?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minAreaSqft?: number;
  maxAreaSqft?: number;
};

export type ViewingRequestInput = {
  propertyId: string;
  name: string;
  phone: string;
  preferredDate: string;
  preferredTimeWindow: string;
  notes?: string;
};

export type CustomerProfile = {
  id: string;
  email: string | null;
  name: string | null;
  contact_number: string | null;
};

export async function getCustomerProfile(userId: string) {
  if (!isSupabaseConfigured) {
    return { profile: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,phone")
    .eq("id", userId)
    .maybeSingle();

  return {
    profile: data
      ? {
          id: String(data.id),
          email: (data.email as string | null) ?? null,
          name: (data.full_name as string | null) ?? null,
          contact_number: (data.phone as string | null) ?? null,
        }
      : null,
    error: error?.message,
  };
}

export async function upsertCustomerProfile(input: {
  id: string;
  email?: string | null;
  name?: string | null;
  contactNumber?: string | null;
}) {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const payload: Record<string, unknown> = {
    id: input.id,
    role: "user",
  };

  if (input.email !== undefined) {
    payload.email = input.email;
  }
  if (input.name !== undefined) {
    payload.full_name = input.name;
  }
  if (input.contactNumber !== undefined) {
    payload.phone = input.contactNumber;
  }

  const { error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" });

  return error ? { ok: false, message: error.message } : { ok: true };
}

const fallbackString = "";

function getString(value: unknown) {
  return typeof value === "string" ? value : fallbackString;
}

function getNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function getListingTitle(property: Record<string, unknown>) {
  return (
    getString(property.title) ||
    "Property"
  );
}

function getListingLocation(property: Record<string, unknown>) {
  const pieces = [
    getString(property.township),
    getString(property.district),
    getString(property.state_region),
  ].filter(Boolean);

  if (pieces.length) {
    return pieces.join(", ");
  }

  return getString(property.city) || "Location TBD";
}

function getListingPrice(property: Record<string, unknown>) {
  return getNumber(property.price);
}

function applyLocationQuery(
  listings: Record<string, unknown>[],
  query: string
) {
  if (!query.trim()) return listings;
  const lowered = query.toLowerCase();

  return listings.filter((listing) => {
    const fields = [
      listing.title,
      listing.city,
      listing.state_region,
      listing.district,
      listing.township,
    ]
      .map((value) => (typeof value === "string" ? value.toLowerCase() : ""))
      .filter(Boolean);

    return fields.some((field) => field.includes(lowered));
  });
}

export async function getListings(filters?: string | ListingFilters) {
  if (!isSupabaseConfigured) {
    return [] as Listing[];
  }

  const query = typeof filters === "string" ? filters : filters?.query ?? "";
  const dealType = typeof filters === "string" ? undefined : filters?.dealType;
  const propertyType = typeof filters === "string" ? undefined : filters?.propertyType;
  const stateRegion = typeof filters === "string" ? undefined : filters?.stateRegion;
  const district = typeof filters === "string" ? undefined : filters?.district;
  const township = typeof filters === "string" ? undefined : filters?.township;
  const minPrice = typeof filters === "string" ? undefined : filters?.minPrice;
  const maxPrice = typeof filters === "string" ? undefined : filters?.maxPrice;
  const bedrooms = typeof filters === "string" ? undefined : filters?.bedrooms;
  const bathrooms = typeof filters === "string" ? undefined : filters?.bathrooms;
  const minAreaSqft = typeof filters === "string" ? undefined : filters?.minAreaSqft;
  const maxAreaSqft = typeof filters === "string" ? undefined : filters?.maxAreaSqft;

  let queryBuilder = supabase
    .from("properties")
    .select(
      "id,title,deal_type,property_type,price,currency,state_region,district,township,city,bedrooms,bathrooms,area_sqft"
    )
    .eq("status", "published")
    .eq("is_deleted", false);

  if (dealType) {
    queryBuilder = queryBuilder.eq("deal_type", dealType);
  }
  if (propertyType) {
    queryBuilder = queryBuilder.eq("property_type", propertyType);
  }
  if (stateRegion?.trim()) {
    queryBuilder = queryBuilder.ilike("state_region", `%${stateRegion.trim()}%`);
  }
  if (district?.trim()) {
    queryBuilder = queryBuilder.ilike("district", `%${district.trim()}%`);
  }
  if (township?.trim()) {
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
  if (typeof minAreaSqft === "number") {
    queryBuilder = queryBuilder.gte("area_sqft", minAreaSqft);
  }
  if (typeof maxAreaSqft === "number") {
    queryBuilder = queryBuilder.lte("area_sqft", maxAreaSqft);
  }
  if (query.trim()) {
    const escaped = query.trim().replace(/%/g, "");
    queryBuilder = queryBuilder.or(
      `title.ilike.%${escaped}%,state_region.ilike.%${escaped}%,district.ilike.%${escaped}%,township.ilike.%${escaped}%,city.ilike.%${escaped}%`
    );
  }

  const { data: properties, error } = await queryBuilder;

  if (error || !properties) {
    console.warn("Failed to load listings", error);
    return [] as Listing[];
  }

  let filtered = applyLocationQuery(properties, query ?? "");

  const ids = filtered.map((property) => property.id).filter(Boolean);
  let photosByProperty = new Map<string, Record<string, unknown>[]>();

  if (ids.length) {
    const { data: photos, error: photoError } = await supabase
      .from("property_images")
      .select("*")
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

  return filtered.map((property) => {
    const id = String(property.id ?? "");
    const photos = photosByProperty.get(id) ?? [];

    return {
      id,
      title: getListingTitle(property),
      location: getListingLocation(property),
      price: getListingPrice(property),
      currency: getString(property.currency) || "MMK",
      dealType: getString(property.deal_type),
      propertyType: getString(property.property_type),
      township: getString(property.township),
      district: getString(property.district),
      imageUrl: resolveListingImage(property, photos),
      raw: property,
    } as Listing;
  });
}

export async function getListingDetail(propertyId: string) {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data: property, error } = await supabase
    .from("properties")
    .select(
      "id,title,description,deal_type,property_type,price,currency,state_region,district,township,city,address_text,bedrooms,bathrooms,area_sqft"
    )
    .eq("id", propertyId)
    .eq("status", "published")
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !property) {
    console.warn("Failed to load listing", error);
    return null;
  }

  const { data: images } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("sort_order", { ascending: true });

  return {
    property,
    images: images ?? [],
  } as ListingDetail;
}

export async function createViewingRequest(input: ViewingRequestInput) {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const payload = {
    property_id: input.propertyId,
    name: input.name,
    phone: input.phone,
    preferred_date: input.preferredDate,
    preferred_time_window: input.preferredTimeWindow,
    notes: input.notes ?? null,
  };

  const { error } = await supabase.from("viewing_requests").insert(payload);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
