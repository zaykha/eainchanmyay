import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

type PropertyRow = {
  id: string;
  title: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  property_type: string | null;
  deal_type: string | null;
  created_at: string | null;
  created_by: string | null;
};

type AppointmentRow = {
  id: string;
  title: string | null;
  start_at: string | null;
  status: string | null;
  client_name: string | null;
  property_id: string | null;
};

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, membership, memberIds } = result.context;

  let properties: PropertyRow[] = [];

  if (memberIds.length) {
    const { data, error } = await supabase
      .from("properties")
      .select("id,title,price,currency,status,property_type,deal_type,created_at,created_by")
      .in("created_by", memberIds)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    properties = (data ?? []) as PropertyRow[];
  }

  const propertyIds = properties.map((property) => property.id).filter(Boolean);

  let appointments: AppointmentRow[] = [];
  if (propertyIds.length) {
    const { data, error } = await supabase
      .from("appointments")
      .select("id,title,start_at,status,client_name,property_id")
      .in("property_id", propertyIds)
      .order("start_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    appointments = (data ?? []) as AppointmentRow[];
  }

  let salesRequestsCount = 0;
  if (memberIds.length) {
    const { count, error } = await supabase
      .from("sales_requests")
      .select("id", { count: "exact", head: true })
      .in("user_id", memberIds);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    salesRequestsCount = count ?? 0;
  }

  const totalValue = properties.reduce((sum, property) => sum + (Number(property.price ?? 0) || 0), 0);
  const publishedValue = properties
    .filter((property) => property.status === "published")
    .reduce((sum, property) => sum + (Number(property.price ?? 0) || 0), 0);

  const statusCounts = properties.reduce<Record<string, number>>((acc, property) => {
    const key = property.status || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const typeCounts = properties.reduce<Record<string, number>>((acc, property) => {
    const key = property.property_type || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const upcomingAppointments = appointments
    .filter((appointment) => appointment.start_at && new Date(appointment.start_at).getTime() >= Date.now())
    .sort((a, b) => new Date(a.start_at ?? 0).getTime() - new Date(b.start_at ?? 0).getTime());

  const nextAppointment = upcomingAppointments[0] ?? null;

  return NextResponse.json({
    workspace: {
      vendor,
      membership,
      teamSize: memberIds.length,
    },
    metrics: {
      totalProperties: properties.length,
      publishedProperties: statusCounts.published ?? 0,
      draftProperties: statusCounts.draft ?? 0,
      soldProperties: statusCounts.sold ?? 0,
      rentedProperties: statusCounts.rented ?? 0,
      archivedProperties: statusCounts.archived ?? 0,
      totalValue,
      publishedValue,
      salesRequestsCount,
      appointmentsCount: appointments.length,
    },
    nextAppointment,
    statusMix: Object.entries(statusCounts).map(([key, count]) => ({ key, count })),
    listingTypes: Object.entries(typeCounts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count),
    recentProperties: properties.slice(0, 5),
  });
}
