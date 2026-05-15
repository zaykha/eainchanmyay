import { supabase, isSupabaseConfigured } from "@/app/living-site/lib/supabase";
import { resolveListingImage } from "@/app/living-site/lib/images";
import { publicListingQueryStatuses } from "@/lib/lifecycle";
import type { PropertyType } from "@/lib/property-types";

export type Listing = {
  id: string;
  title: string;
  location: string;
  price?: number;
  currency?: string;
  dealType?: string;
  propertyType?: string;
  city?: string;
  township?: string;
  district?: string;
  stateRegion?: string;
  areaSqft?: number;
  bedrooms?: number;
  bathrooms?: number;
  latitude?: number;
  longitude?: number;
  verificationStatus?: string;
  imageUrl?: string;
  raw: Record<string, unknown>;
};

export type ListingDetail = {
  property: Record<string, unknown>;
  images: Record<string, unknown>[];
  agency?: Record<string, unknown> | null;
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
  userId?: string;
  name: string;
  phone: string;
  preferredDate: string;
  preferredTimeWindow: string;
  notes?: string;
};

export type ViewingRequestUpdateInput = {
  id: string;
  preferredDate: string;
  preferredTimeWindow: string;
  notes?: string;
};

export type InquiryInput = {
  userId: string;
  dealType: "buy" | "rent";
  propertyType: PropertyType;
  stateRegion: string;
  district: string;
  township: string;
  budgetRange: string;
  timeline?: "asap" | "1-3" | "3-6" | "browsing" | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  needParking: boolean;
  needLift: boolean;
  needSolar: boolean;
  needGenerator: boolean;
};

export type CustomerProfile = {
  id: string;
  email: string | null;
  name: string | null;
  contact_number: string | null;
};

export type ProfileRole = "user" | "vendor_user" | "staff" | "admin" | "master_admin";

export type ProfileSummary = {
  id: string;
  email: string | null;
  name: string | null;
  contact_number: string | null;
  role: ProfileRole | null;
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

export async function getProfileSummary(userId: string) {
  if (!isSupabaseConfigured) {
    return { profile: null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,phone,role")
    .eq("id", userId)
    .maybeSingle();

  return {
    profile: data
      ? {
          id: String(data.id),
          email: (data.email as string | null) ?? null,
          name: (data.full_name as string | null) ?? null,
          contact_number: (data.phone as string | null) ?? null,
          role: (data.role as ProfileRole | null) ?? null,
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
  role?: ProfileRole;
}) {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const payload: Record<string, unknown> = {
    id: input.id,
  };

  if (input.role !== undefined) {
    payload.role = input.role;
  }

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

const propertyImageSelect = "property_id,public_url,r2_key,is_cover,sort_order";

function getListingTitle(property: Record<string, unknown>) {
  return getString(property.title) || "";
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

  return "";
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
      "id,title,deal_type,property_type,price,currency,state_region,district,township,bedrooms,bathrooms,area_sqft"
    )
    .in("status", publicListingQueryStatuses)
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
      `title.ilike.%${escaped}%,state_region.ilike.%${escaped}%,district.ilike.%${escaped}%,township.ilike.%${escaped}%`
    );
  }

  const { data: properties, error } = await queryBuilder;

  if (error || !properties) {
    console.warn("Failed to load listings", error);
    return [] as Listing[];
  }

  const filtered = applyLocationQuery(properties, query ?? "");

  const ids = filtered.map((property) => property.id).filter(Boolean);
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
      city: getString(property.district),
      township: getString(property.township),
      district: getString(property.district),
      areaSqft: getNumber(property.area_sqft),
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
      "id,title,description,deal_type,property_type,price,currency,state_region,district,township,address_text,bedrooms,bathrooms,area_sqft,latitude,longitude,created_by,vendor_id,verification_status,owner_name,owner_phone,owner_phone_secondary"
    )
    .eq("id", propertyId)
    .in("status", publicListingQueryStatuses)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error || !property) {
    console.warn("Failed to load listing", error);
    return null;
  }

  const createdBy = typeof property.created_by === "string" ? property.created_by : "";
  const vendorId = typeof property.vendor_id === "string" ? property.vendor_id : "";
  const [imagesResult, membershipResult] = await Promise.all([
    supabase
      .from("property_images")
      .select(propertyImageSelect)
      .eq("property_id", propertyId)
      .order("sort_order", { ascending: true }),
    vendorId
      ? supabase
          .from("vendors")
          .select("id,name,slug,tagline,contact_phone,contact_email,plan,verification_status,public_storefront_enabled")
          .eq("id", vendorId)
          .maybeSingle()
      : createdBy
      ? supabase
          .from("vendor_members")
          .select(
            "vendor:vendors(id,name,slug,tagline,contact_phone,contact_email,plan,verification_status,public_storefront_enabled)"
          )
          .eq("user_id", createdBy)
          .eq("status", "active")
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  let agency: Record<string, unknown> | null = null;
  const membership = membershipResult.data;
  const vendorRaw = vendorId
    ? membership
    : Array.isArray(membership?.vendor)
      ? membership?.vendor[0]
      : membership?.vendor;
  if (vendorRaw?.id && vendorRaw.name) {
    agency = {
      id: String(vendorRaw.id),
      name: String(vendorRaw.name),
      slug: (vendorRaw.slug as string | null) ?? null,
      tagline: (vendorRaw.tagline as string | null) ?? null,
      contact_phone: (vendorRaw.contact_phone as string | null) ?? null,
      contact_email: (vendorRaw.contact_email as string | null) ?? null,
      plan: (vendorRaw.plan as string | null) ?? null,
      verification_status: (vendorRaw.verification_status as string | null) ?? null,
      public_storefront_enabled: vendorRaw.public_storefront_enabled !== false,
    };
  }

  return {
    property,
    images: imagesResult.data ?? [],
    agency,
  } as ListingDetail;
}

export async function createViewingRequest(input: ViewingRequestInput) {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const payload = {
    property_id: input.propertyId,
    user_id: input.userId ?? null,
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

export async function getViewingRequestsForUser(userId: string) {
  if (!isSupabaseConfigured) {
    return { data: [] as Array<Record<string, unknown>>, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("viewing_requests")
    .select(
      "id,property_id,preferred_date,preferred_time_window,created_at,updated_at,property:properties(id,title,township,district,price,currency,deal_type,property_type,bedrooms,bathrooms,area_sqft)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Failed to load viewing requests", error);
    return {
      data: [] as Array<Record<string, unknown>>,
      error: error?.message ?? "Failed to load viewing requests.",
    };
  }

  const rows = data as Array<Record<string, unknown>>;
  const propertyIds = rows
    .map((row) => String(row.property_id ?? ""))
    .filter(Boolean);
  let photosByProperty = new Map<string, Record<string, unknown>[]>();

  if (propertyIds.length) {
    const { data: photos, error: photoError } = await supabase
      .from("property_images")
      .select(propertyImageSelect)
      .in("property_id", propertyIds)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });

    if (photoError) {
      console.warn("Failed to load viewing request images", photoError);
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

  const enriched = rows.map((row) => {
    const property = (row.property as Record<string, unknown>) ?? {};
    const propertyId = String(row.property_id ?? property.id ?? "");
    const photos = photosByProperty.get(propertyId) ?? [];
    const imageUrl = resolveListingImage(property, photos);
    return {
      ...row,
      property: {
        ...property,
        imageUrl,
      },
    } as Record<string, unknown>;
  });

  return { data: enriched as Array<Record<string, unknown>>, error: null };
}

export async function getViewingRequestForUserProperty(userId: string, propertyId: string) {
  if (!isSupabaseConfigured) {
    return { request: null as Record<string, unknown> | null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("viewing_requests")
    .select("id,property_id,preferred_date,preferred_time_window,notes,created_at")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to load viewing request", error);
    return { request: null, error: error.message };
  }

  return { request: (data as Record<string, unknown> | null) ?? null, error: null };
}

export async function updateViewingRequest(input: ViewingRequestUpdateInput) {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const { error } = await supabase
    .from("viewing_requests")
    .update({
      preferred_date: input.preferredDate,
      preferred_time_window: input.preferredTimeWindow,
      notes: input.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function getSavedPropertiesForUser(userId: string) {
  if (!isSupabaseConfigured) {
    return { data: [] as Array<Record<string, unknown>>, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("saved_properties")
    .select(
      "id,property_id,created_at,property:properties(id,title,township,district,price,currency,deal_type,property_type,bedrooms,bathrooms,area_sqft)"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Failed to load saved properties", error);
    return {
      data: [] as Array<Record<string, unknown>>,
      error: error?.message ?? "Failed to load saved properties.",
    };
  }

  const rows = data as Array<Record<string, unknown>>;
  const propertyIds = rows
    .map((row) => String(row.property_id ?? ""))
    .filter(Boolean);
  let photosByProperty = new Map<string, Record<string, unknown>[]>();

  if (propertyIds.length) {
    const { data: photos, error: photoError } = await supabase
      .from("property_images")
      .select(propertyImageSelect)
      .in("property_id", propertyIds)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });

    if (photoError) {
      console.warn("Failed to load saved property images", photoError);
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

  const enriched = rows.map((row) => {
    const property = (row.property as Record<string, unknown>) ?? {};
    const propertyId = String(row.property_id ?? property.id ?? "");
    const photos = photosByProperty.get(propertyId) ?? [];
    const imageUrl = resolveListingImage(property, photos);
    return {
      ...row,
      property: {
        ...property,
        imageUrl,
      },
    } as Record<string, unknown>;
  });

  return { data: enriched as Array<Record<string, unknown>>, error: null };
}

export async function getInquiriesForUser(userId: string) {
  if (!isSupabaseConfigured) {
    return { data: [] as Array<Record<string, unknown>>, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select(
      "id,deal_type,property_type,state_region,district,township,budget_range,timeline,bedrooms,bathrooms,area_sqft,need_parking,need_lift,need_solar,need_generator,created_at,updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Failed to load inquiries", error);
    return {
      data: [] as Array<Record<string, unknown>>,
      error: error?.message ?? "Failed to load inquiries.",
    };
  }

  return { data: data as Array<Record<string, unknown>>, error: null };
}

export async function getInquiryById(userId: string, inquiryId: string) {
  if (!isSupabaseConfigured) {
    return { inquiry: null as Record<string, unknown> | null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select(
      "id,deal_type,property_type,state_region,district,township,budget_range,timeline,bedrooms,bathrooms,area_sqft,need_parking,need_lift,need_solar,need_generator,created_at,updated_at"
    )
    .eq("id", inquiryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to load inquiry", error);
    return { inquiry: null, error: error.message };
  }

  return { inquiry: (data as Record<string, unknown> | null) ?? null, error: null };
}

export async function updateInquiry(input: InquiryInput & { id: string }) {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const payload = {
    deal_type: input.dealType,
    property_type: input.propertyType,
    state_region: input.stateRegion,
    district: input.district,
    township: input.township,
    budget_range: input.budgetRange,
    timeline: input.timeline ?? null,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area_sqft: input.areaSqft,
    need_parking: input.needParking,
    need_lift: input.needLift,
    need_solar: input.needSolar,
    need_generator: input.needGenerator,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("inquiries")
    .update(payload)
    .eq("id", input.id)
    .eq("user_id", input.userId);

  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function getSalesRequestsForUser(userId: string) {
  if (!isSupabaseConfigured) {
    return { data: [] as Array<Record<string, unknown>>, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("sales_requests")
    .select(
      "id,title,description,deal_type,property_type,price,currency,state_region,district,township,city,address_text,bedrooms,bathrooms,area_sqft,floor_count,room_count,has_lift,has_backup_power,backup_power_type,has_parking,review_status,created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Failed to load sales requests", error);
    return {
      data: [] as Array<Record<string, unknown>>,
      error: error?.message ?? "Failed to load sales requests.",
    };
  }

  return { data: data as Array<Record<string, unknown>>, error: null };
}

export async function getOwnedPropertiesForUser(userId: string) {
  if (!isSupabaseConfigured) {
    return { data: [] as Array<Record<string, unknown>>, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("properties")
    .select(
      "id,title,description,deal_type,property_type,status,price,currency,state_region,district,township,address_text,bedrooms,bathrooms,area_sqft,floor_count,room_count,has_lift,has_backup_power,backup_power_type,has_parking,created_at"
    )
    .eq("created_by", userId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("Failed to load owned properties", error);
    return {
      data: [] as Array<Record<string, unknown>>,
      error: error?.message ?? "Failed to load owned properties.",
    };
  }

  const ids = data.map((item) => item.id).filter(Boolean);
  let photosByProperty = new Map<string, Record<string, unknown>[]>();

  if (ids.length) {
    const { data: photos, error: photoError } = await supabase
      .from("property_images")
      .select(propertyImageSelect)
      .in("property_id", ids)
      .order("is_cover", { ascending: false })
      .order("sort_order", { ascending: true });

    if (photoError) {
      console.warn("Failed to load owned property images", photoError);
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

  return {
    data: data.map((item) => ({
      ...(item as Record<string, unknown>),
      imageUrl: resolveListingImage(item as Record<string, unknown>, photosByProperty.get(String(item.id ?? "")) ?? []),
    })) as Array<Record<string, unknown>>,
    error: null,
  };
}

export async function getSalesRequestById(userId: string, requestId: string) {
  if (!isSupabaseConfigured) {
    return { request: null as Record<string, unknown> | null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("sales_requests")
    .select(
      "id,title,description,deal_type,property_type,price,currency,state_region,district,township,address_text,bedrooms,bathrooms,area_sqft,floor_count,room_count,has_lift,has_backup_power,backup_power_type,has_parking,latitude,longitude,owner_name,owner_phone,owner_phone_secondary,review_status,created_at"
    )
    .eq("id", requestId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to load sales request", error);
    return { request: null, error: error.message };
  }

  return { request: (data as Record<string, unknown> | null) ?? null, error: null };
}

export async function getOwnedPropertyById(userId: string, propertyId: string) {
  if (!isSupabaseConfigured) {
    return { property: null as Record<string, unknown> | null, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase
    .from("properties")
    .select(
      "id,title,description,deal_type,property_type,status,price,currency,state_region,district,township,address_text,bedrooms,bathrooms,area_sqft,floor_count,room_count,has_lift,has_backup_power,backup_power_type,has_parking,latitude,longitude,owner_name,owner_phone,owner_phone_secondary,created_at"
    )
    .eq("id", propertyId)
    .eq("created_by", userId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (error) {
    console.warn("Failed to load owned property", error);
    return { property: null, error: error.message };
  }

  return { property: (data as Record<string, unknown> | null) ?? null, error: null };
}

export async function updateSalesRequest(input: {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dealType: string;
  propertyType: string;
  price: number;
  currency: string;
  stateRegion: string;
  district: string | null;
  city: string | null;
  township: string;
  addressText: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  floorCount: number | null;
  roomCount: number | null;
  hasLift: boolean;
  hasBackupPower: boolean;
  backupPowerType: string | null;
  hasParking: boolean;
  latitude: number | null;
  longitude: number | null;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerPhoneSecondary: string | null;
}) {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const payload = {
    title: input.title,
    description: input.description,
    deal_type: input.dealType,
    property_type: input.propertyType,
    price: input.price,
    currency: input.currency,
    state_region: input.stateRegion,
    district: input.district,
    city: input.district ?? input.township ?? input.stateRegion,
    township: input.township,
    address_text: input.addressText,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area_sqft: input.areaSqft,
    floor_count: input.floorCount,
    room_count: input.roomCount,
    has_lift: input.hasLift,
    has_backup_power: input.hasBackupPower,
    backup_power_type: input.backupPowerType,
    has_parking: input.hasParking,
    latitude: input.latitude,
    longitude: input.longitude,
    owner_name: input.ownerName,
    owner_phone: input.ownerPhone,
    owner_phone_secondary: input.ownerPhoneSecondary,
  };

  const { error } = await supabase
    .from("sales_requests")
    .update(payload)
    .eq("id", input.id)
    .eq("user_id", input.userId);

  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function updateOwnedProperty(input: {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dealType: string;
  propertyType: string;
  price: number;
  currency: string;
  stateRegion: string;
  district: string | null;
  city: string | null;
  township: string;
  addressText: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqft: number | null;
  floorCount: number | null;
  roomCount: number | null;
  hasLift: boolean;
  hasBackupPower: boolean;
  backupPowerType: string | null;
  hasParking: boolean;
  latitude: number | null;
  longitude: number | null;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerPhoneSecondary: string | null;
}) {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const payload = {
    title: input.title,
    description: input.description,
    deal_type: input.dealType,
    property_type: input.propertyType,
    price: input.price,
    currency: input.currency,
    state_region: input.stateRegion,
    district: input.district,
    city: input.city,
    township: input.township,
    address_text: input.addressText,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area_sqft: input.areaSqft,
    floor_count: input.floorCount,
    room_count: input.roomCount,
    has_lift: input.hasLift,
    has_backup_power: input.hasBackupPower,
    backup_power_type: input.backupPowerType,
    has_parking: input.hasParking,
    latitude: input.latitude,
    longitude: input.longitude,
    owner_name: input.ownerName,
    owner_phone: input.ownerPhone,
    owner_phone_secondary: input.ownerPhoneSecondary,
  };

  const { error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", input.id)
    .eq("created_by", input.userId)
    .eq("is_deleted", false);

  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function createInquiry(input: InquiryInput) {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const payload = {
    user_id: input.userId,
    deal_type: input.dealType,
    property_type: input.propertyType,
    state_region: input.stateRegion,
    district: input.district,
    township: input.township,
    budget_range: input.budgetRange,
    timeline: input.timeline ?? null,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    area_sqft: input.areaSqft,
    need_parking: input.needParking,
    need_lift: input.needLift,
    need_solar: input.needSolar,
    need_generator: input.needGenerator,
  };

  const { error } = await supabase.from("inquiries").insert(payload);
  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function toggleSavedProperty(input: {
  userId: string;
  propertyId: string;
  shouldSave: boolean;
}) {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase is not configured." };
  }

  if (input.shouldSave) {
    const { error } = await supabase
      .from("saved_properties")
      .upsert(
        { user_id: input.userId, property_id: input.propertyId },
        { onConflict: "user_id,property_id" }
      );
    return error ? { ok: false, message: error.message } : { ok: true };
  }

  const { error } = await supabase
    .from("saved_properties")
    .delete()
    .eq("user_id", input.userId)
    .eq("property_id", input.propertyId);

  return error ? { ok: false, message: error.message } : { ok: true };
}

export async function isPropertySaved(userId: string, propertyId: string) {
  if (!isSupabaseConfigured) {
    return false;
  }

  const { data, error } = await supabase
    .from("saved_properties")
    .select("id")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) {
    console.warn("Failed to check saved property", error);
    return false;
  }

  return Boolean(data);
}
