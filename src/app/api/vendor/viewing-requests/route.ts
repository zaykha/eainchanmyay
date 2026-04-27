import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, memberIds } = result.context;

  if (!memberIds.length) {
    return NextResponse.json({ items: [] });
  }

  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("id,title,district,township,city")
    .in("created_by", memberIds)
    .eq("is_deleted", false);

  if (propertiesError) {
    return NextResponse.json({ error: propertiesError.message }, { status: 500 });
  }

  const propertyIds = (properties ?? []).map((property) => String(property.id ?? "")).filter(Boolean);
  if (!propertyIds.length) {
    return NextResponse.json({ items: [] });
  }

  const propertyMap = new Map(
    (properties ?? []).map((property) => [
      String(property.id ?? ""),
      {
        title: (property.title as string | null) ?? null,
        district: (property.district as string | null) ?? null,
        township: (property.township as string | null) ?? null,
        city: (property.city as string | null) ?? null,
      },
    ])
  );

  const { data, error } = await supabase
    .from("viewing_requests")
    .select("id,property_id,name,phone,preferred_date,preferred_time_window,notes,created_at,updated_at")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map((item) => {
    const property = propertyMap.get(String(item.property_id ?? ""));
    return {
      ...item,
      property,
    };
  });

  return NextResponse.json({ items });
}
