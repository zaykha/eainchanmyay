import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

type PropertyRow = {
  id: string;
  title: string | null;
  deal_type: string | null;
  property_type: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  district: string | null;
  township: string | null;
  city: string | null;
  created_at: string | null;
  verification_status: string | null;
};

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, memberIds } = result.context;
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const status = (searchParams.get("status") ?? "").trim();
  const dealType = (searchParams.get("deal") ?? "").trim();
  const propertyType = (searchParams.get("type") ?? "").trim();

  if (!memberIds.length) {
    return NextResponse.json({ items: [] });
  }

  let queryBuilder = supabase
    .from("properties")
    .select("id,title,deal_type,property_type,price,currency,status,district,township,city,created_at,verification_status")
    .in("created_by", memberIds)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (status) {
    queryBuilder = queryBuilder.eq("status", status);
  }
  if (dealType) {
    queryBuilder = queryBuilder.eq("deal_type", dealType);
  }
  if (propertyType) {
    queryBuilder = queryBuilder.eq("property_type", propertyType);
  }
  if (query) {
    const escaped = query.replace(/%/g, "");
    queryBuilder = queryBuilder.or(
      `title.ilike.%${escaped}%,district.ilike.%${escaped}%,township.ilike.%${escaped}%,city.ilike.%${escaped}%`
    );
  }

  const { data: properties, error } = await queryBuilder;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (properties ?? []) as PropertyRow[];
  const propertyIds = rows.map((property) => property.id).filter(Boolean);
  const appointmentCountMap = new Map<string, number>();

  if (propertyIds.length) {
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("property_id")
      .in("property_id", propertyIds);

    if (appointmentsError) {
      return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
    }

    for (const appointment of appointments ?? []) {
      const propertyId = String(appointment.property_id ?? "");
      if (!propertyId) continue;
      appointmentCountMap.set(propertyId, (appointmentCountMap.get(propertyId) ?? 0) + 1);
    }
  }

  return NextResponse.json({
    items: rows.map((property) => ({
      ...property,
      appointments_count: appointmentCountMap.get(property.id) ?? 0,
    })),
  });
}
