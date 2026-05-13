import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { getVendorPlanUsage } from "@/app/api/vendor/_lib/plan-limits";

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
  township: string | null;
};

type AppointmentRow = {
  id: string;
  title: string | null;
  start_at: string | null;
  status: string | null;
  client_name: string | null;
  property_id: string | null;
};

type InquiryLeadRow = {
  id: string;
  status: string | null;
  assigned_member_user_id: string | null;
  pipeline_stage: string | null;
  created_at: string | null;
  state_region: string | null;
  district: string | null;
  township: string | null;
  property_type: string | null;
  deal_type: string | null;
};

type ViewRow = {
  property_id: string | null;
  viewed_at: string | null;
  viewer_user_id: string | null;
  session_id: string | null;
};

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, membership, memberIds } = result.context;

  if ((vendor.plan ?? "").trim().toLowerCase() === "free") {
    return NextResponse.json(
      {
        error: "Analytics require a paid vendor plan.",
        code: "analytics_upgrade_required",
      },
      { status: 403 }
    );
  }

  let properties: PropertyRow[] = [];

  if (memberIds.length) {
    const { data, error } = await supabase
      .from("properties")
      .select("id,title,price,currency,status,property_type,deal_type,created_at,created_by,township")
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

  const [viewEventsResult, inquiryLeadsResult, memberProfilesResult] = await Promise.all([
    propertyIds.length
      ? supabase
          .from("property_view_events")
          .select("property_id,viewed_at,viewer_user_id,session_id")
          .in("property_id", propertyIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("vendor_inquiry_leads")
      .select("id,status,assigned_member_user_id,pipeline_stage,created_at,state_region,district,township,property_type,deal_type")
      .eq("vendor_id", vendor.id),
    memberIds.length
      ? supabase.from("profiles").select("id,full_name,email").in("id", memberIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (viewEventsResult.error) {
    return NextResponse.json({ error: viewEventsResult.error.message }, { status: 500 });
  }

  if (inquiryLeadsResult.error) {
    return NextResponse.json({ error: inquiryLeadsResult.error.message }, { status: 500 });
  }

  if (memberProfilesResult.error) {
    return NextResponse.json({ error: memberProfilesResult.error.message }, { status: 500 });
  }

  const { salesRequestCount, planUsage } = await getVendorPlanUsage(result.context);
  const viewEvents = (viewEventsResult.data ?? []) as ViewRow[];
  const inquiryLeads = (inquiryLeadsResult.data ?? []) as InquiryLeadRow[];
  const memberProfiles = (memberProfilesResult.data ?? []) as Array<{ id: string | null; full_name: string | null; email: string | null }>;

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
  const totalListingViews = viewEvents.length;
  const uniqueListingViewers = new Set(
    viewEvents
      .map((item) => item.viewer_user_id || item.session_id || "")
      .filter(Boolean)
  ).size;
  const inquiryLeadCount = inquiryLeads.length;
  const qualifiedLeadCount = inquiryLeads.filter(
    (lead) => lead.status === "qualified" || lead.pipeline_stage === "qualified" || lead.pipeline_stage === "negotiating"
  ).length;
  const closedLeadCount = inquiryLeads.filter(
    (lead) => lead.status === "closed" || lead.pipeline_stage === "won"
  ).length;
  const lostLeadCount = inquiryLeads.filter(
    (lead) => lead.status === "lost" || lead.pipeline_stage === "lost"
  ).length;
  const leadConversionRate = inquiryLeadCount ? Math.round((closedLeadCount / inquiryLeadCount) * 100) : 0;
  const viewToLeadRate = totalListingViews ? Math.round((inquiryLeadCount / totalListingViews) * 100) : 0;

  const propertyViewsById = viewEvents.reduce<Record<string, number>>((acc, event) => {
    const propertyId = String(event.property_id ?? "");
    if (!propertyId) return acc;
    acc[propertyId] = (acc[propertyId] ?? 0) + 1;
    return acc;
  }, {});

  const profileMap = new Map(
    memberProfiles.map((profile) => [
      String(profile.id ?? ""),
      {
        full_name: (profile.full_name as string | null) ?? null,
        email: (profile.email as string | null) ?? null,
      },
    ])
  );

  const appointmentsByProperty = appointments.reduce<Record<string, number>>((acc, appointment) => {
    const propertyId = String(appointment.property_id ?? "");
    if (!propertyId) return acc;
    acc[propertyId] = (acc[propertyId] ?? 0) + 1;
    return acc;
  }, {});

  const leadsByAssignee = inquiryLeads.reduce<Record<string, { total: number; closed: number; qualified: number }>>((acc, lead) => {
    const assigneeId = String(lead.assigned_member_user_id ?? "");
    if (!assigneeId) return acc;
    const bucket = acc[assigneeId] ?? { total: 0, closed: 0, qualified: 0 };
    bucket.total += 1;
    if (lead.status === "closed" || lead.pipeline_stage === "won") {
      bucket.closed += 1;
    }
    if (lead.status === "qualified" || lead.pipeline_stage === "qualified" || lead.pipeline_stage === "negotiating") {
      bucket.qualified += 1;
    }
    acc[assigneeId] = bucket;
    return acc;
  }, {});

  const agentPerformance = memberIds.map((memberId) => {
    const memberProperties = properties.filter((property) => property.created_by === memberId);
    const totalViews = memberProperties.reduce((sum, property) => sum + (propertyViewsById[property.id] ?? 0), 0);
    const appointmentsCount = memberProperties.reduce((sum, property) => sum + (appointmentsByProperty[property.id] ?? 0), 0);
    const profile = profileMap.get(memberId);
    const assignedLeads = leadsByAssignee[memberId] ?? { total: 0, closed: 0, qualified: 0 };

    return {
      user_id: memberId,
      name: profile?.full_name || profile?.email || "Agent",
      listings_count: memberProperties.length,
      published_count: memberProperties.filter((property) => property.status === "published").length,
      total_views: totalViews,
      appointments_count: appointmentsCount,
      assigned_leads: assignedLeads.total,
      qualified_leads: assignedLeads.qualified,
      closed_leads: assignedLeads.closed,
    };
  });

  const townshipDemandCounts = inquiryLeads.reduce<Record<string, number>>((acc, lead) => {
    const township = String(lead.township ?? "").trim();
    const district = String(lead.district ?? "").trim();
    const stateRegion = String(lead.state_region ?? "").trim();
    const label = [township, district, stateRegion].filter(Boolean).join(", ");
    if (!label) return acc;
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  const propertyDemandCounts = inquiryLeads.reduce<Record<string, number>>((acc, lead) => {
    const key = String(lead.property_type ?? "unknown");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const topViewedListings = properties
    .map((property) => ({
      property_id: property.id,
      title: property.title ?? "Untitled property",
      township: property.township ?? null,
      status: property.status ?? null,
      views: propertyViewsById[property.id] ?? 0,
    }))
    .sort((left, right) => right.views - left.views)
    .slice(0, 5);

  const salesByTypeCounts = properties.reduce<Record<string, number>>((acc, property) => {
    if (property.status !== "sold" && property.status !== "rented") return acc;
    const key = String(property.property_type ?? "unknown");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const priceBucketsByType = properties.reduce<
    Record<string, { min: number; max: number; count: number; currency: string }>
  >((acc, property) => {
    const typeKey = String(property.property_type ?? "unknown");
    const price = Number(property.price ?? 0);
    if (!price) return acc;
    const existing = acc[typeKey];
    if (!existing) {
      acc[typeKey] = {
        min: price,
        max: price,
        count: 1,
        currency: String(property.currency ?? "MMK"),
      };
      return acc;
    }
    existing.min = Math.min(existing.min, price);
    existing.max = Math.max(existing.max, price);
    existing.count += 1;
    return acc;
  }, {});

  const propertyTypeById = new Map(properties.map((property) => [property.id, String(property.property_type ?? "unknown")]));
  const appointmentsByTypeCounts = appointments.reduce<Record<string, number>>((acc, appointment) => {
    const propertyId = String(appointment.property_id ?? "");
    if (!propertyId) return acc;
    const typeKey = propertyTypeById.get(propertyId) ?? "unknown";
    acc[typeKey] = (acc[typeKey] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    workspace: {
      vendor,
      membership,
      teamSize: memberIds.length,
      limits: {
        currentPlan: planUsage.plan,
        listingCount: planUsage.listingUsage,
        listingLimit: planUsage.listingLimit,
        listingNearLimit: planUsage.listingNearLimit,
        listingOverLimit: planUsage.listingOverLimit,
        agentCount: planUsage.agentUsage,
        agentLimit: planUsage.agentLimit,
        agentNearLimit: planUsage.agentNearLimit,
        agentOverLimit: planUsage.agentOverLimit,
        suggestedUpgrade: planUsage.suggestedUpgrade,
      },
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
      salesRequestsCount: salesRequestCount,
      appointmentsCount: appointments.length,
      listingViewsCount: totalListingViews,
      uniqueListingViewers,
      inquiryLeadCount,
      qualifiedLeadCount,
      closedLeadCount,
      lostLeadCount,
      leadConversionRate,
      viewToLeadRate,
    },
    nextAppointment,
    statusMix: Object.entries(statusCounts).map(([key, count]) => ({ key, count })),
    listingTypes: Object.entries(typeCounts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count),
    salesByType: Object.entries(salesByTypeCounts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count),
    priceRangesByType: Object.entries(priceBucketsByType)
      .map(([key, bucket]) => ({
        key,
        min: bucket.min,
        max: bucket.max,
        count: bucket.count,
        currency: bucket.currency,
      }))
      .sort((a, b) => b.count - a.count),
    appointmentsByType: Object.entries(appointmentsByTypeCounts)
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count),
    agentPerformance: agentPerformance.sort((left, right) => right.closed_leads - left.closed_leads || right.total_views - left.total_views),
    marketInsights: {
      topDemandTownships: Object.entries(townshipDemandCounts)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topPropertyDemand: Object.entries(propertyDemandCounts)
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topViewedListings,
    },
    recentProperties: properties.slice(0, 5),
  });
}
