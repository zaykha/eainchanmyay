import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

type RouteContext = {
  params: Promise<{
    propertyId: string;
  }>;
};

const propertyImageSelect =
  "id,property_id,public_url,r2_key,is_cover,sort_order,created_at";

export async function GET(_request: Request, context: RouteContext) {
  if (!isConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
  }

  const { propertyId } = await context.params;
  const id = propertyId.trim();
  if (!id) {
    return NextResponse.json({ error: "Property id is required." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select(
      "id,title,description,deal_type,property_type,price,currency,state_region,district,township,city,address_text,bedrooms,bathrooms,area_sqft,latitude,longitude,created_by,vendor_id,verification_status,owner_name,owner_phone,owner_phone_secondary"
    )
    .eq("id", id)
    .eq("status", "published")
    .eq("is_deleted", false)
    .maybeSingle();

  if (propertyError) {
    return NextResponse.json({ error: propertyError.message }, { status: 500 });
  }

  if (!property) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const vendorId = typeof property.vendor_id === "string" ? property.vendor_id : "";
  const createdBy = typeof property.created_by === "string" ? property.created_by : "";

  const [imagesResult, agencyResult] = await Promise.all([
    supabase
      .from("property_images")
      .select(propertyImageSelect)
      .eq("property_id", id)
      .order("sort_order", { ascending: true }),
    vendorId
      ? supabase
          .from("vendors")
          .select("id,name,slug,tagline,contact_phone,contact_email,logo_url,plan,verification_status,public_storefront_enabled")
          .eq("id", vendorId)
          .maybeSingle()
      : createdBy
      ? supabase
          .from("vendor_members")
          .select(
            "vendor:vendors(id,name,slug,tagline,contact_phone,contact_email,logo_url,plan,verification_status,public_storefront_enabled)"
          )
          .eq("user_id", createdBy)
          .eq("status", "active")
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (imagesResult.error) {
    return NextResponse.json({ error: imagesResult.error.message }, { status: 500 });
  }

  if (agencyResult.error) {
    return NextResponse.json({ error: agencyResult.error.message }, { status: 500 });
  }

  const agencySource = vendorId
    ? agencyResult.data
    : Array.isArray(agencyResult.data?.vendor)
    ? agencyResult.data?.vendor[0]
    : agencyResult.data?.vendor;

  const agency =
    agencySource?.id && agencySource?.name
      ? {
          id: String(agencySource.id),
          name: String(agencySource.name),
          slug: (agencySource.slug as string | null) ?? null,
          tagline: (agencySource.tagline as string | null) ?? null,
          contact_phone: (agencySource.contact_phone as string | null) ?? null,
          contact_email: (agencySource.contact_email as string | null) ?? null,
          logo_url: (agencySource.logo_url as string | null) ?? null,
          plan: (agencySource.plan as string | null) ?? null,
          verification_status: (agencySource.verification_status as string | null) ?? null,
          public_storefront_enabled: agencySource.public_storefront_enabled !== false,
        }
      : null;

  return NextResponse.json({
    property,
    images: imagesResult.data ?? [],
    agency,
  });
}
