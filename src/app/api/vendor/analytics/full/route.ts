import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { resolveListingImage } from "@/app/living-site/lib/images";
import { normalizeAppointmentStatus, normalizeLeadStatus, normalizeListingStatus } from "@/lib/lifecycle";

type PropertyRow = {
  id: string;
  title: string | null;
  property_type: string | null;
  township: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string | null;
};

type PropertyImageRow = {
  property_id: string | null;
  public_url: string | null;
  r2_key: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

type ProfileRow = {
  id: string | null;
  full_name: string | null;
  email: string | null;
};

type ViewEventRow = {
  property_id: string | null;
  source: string | null;
  viewed_at: string | null;
};

type AppointmentRow = {
  id: string;
  property_id: string | null;
  assigned_staff_id: string | null;
  status: string | null;
  start_at: string | null;
};

type ViewingRequestRow = {
  id: string;
  property_id: string | null;
  assigned_staff_id: string | null;
  lead_status: string | null;
  created_at: string | null;
  preferred_date: string | null;
};

type LeadRow = {
  id: string;
  status: string | null;
  pipeline_stage: string | null;
  assigned_member_user_id: string | null;
  created_at: string | null;
  property_type: string | null;
  township: string | null;
};

type SavedPropertyRow = {
  property_id: string | null;
  created_at: string | null;
};

type PromotionRow = {
  id: string;
  listing_id: string | null;
  promotion_type: string | null;
  target_type: string | null;
  status: string | null;
  title: string | null;
  price_per_24h: number | null;
  starts_at: string | null;
  ends_at: string | null;
};

function normalizePlan(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function toIsoDateKey(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function labelFromProfile(profile: ProfileRow | undefined) {
  return profile?.full_name || profile?.email || "Agent";
}

function isMissingRelationError(message: string | null | undefined) {
  const normalized = (message ?? "").toLowerCase();
  return normalized.includes("could not find the table") || normalized.includes("relation") && normalized.includes("does not exist");
}

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, memberIds, membership } = result.context;
  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can access analytics." }, { status: 403 });
  }
  const plan = normalizePlan(vendor.plan);

  if (!["growth", "verified"].includes(plan)) {
    return NextResponse.json(
      {
        error: "Full analytics require a Growth plan or higher.",
        code: "analytics_upgrade_required",
      },
      { status: 403 }
    );
  }

  const [propertiesResult, profilesResult, leadsResult] = await Promise.all([
    memberIds.length
      ? supabase
          .from("properties")
          .select("id,title,property_type,township,status,created_by,created_at")
          .in("created_by", memberIds)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    memberIds.length
      ? supabase.from("profiles").select("id,full_name,email").in("id", memberIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("vendor_inquiry_leads")
      .select("id,status,pipeline_stage,assigned_member_user_id,created_at,property_type,township")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
  ]);

  if (propertiesResult.error) {
    return NextResponse.json({ error: propertiesResult.error.message }, { status: 500 });
  }
  if (profilesResult.error) {
    return NextResponse.json({ error: profilesResult.error.message }, { status: 500 });
  }
  if (leadsResult.error) {
    return NextResponse.json({ error: leadsResult.error.message }, { status: 500 });
  }

  const properties = (propertiesResult.data ?? []) as PropertyRow[];
  const profiles = (profilesResult.data ?? []) as ProfileRow[];
  const leads = (leadsResult.data ?? []) as LeadRow[];
  const propertyIds = properties.map((property) => property.id).filter(Boolean);

  const [viewsResult, appointmentsResult, viewingRequestsResult, savedPropertiesResult, propertyImagesResult, promotionsResult] = await Promise.all([
    propertyIds.length
      ? supabase
          .from("property_view_events")
          .select("property_id,source,viewed_at")
          .in("property_id", propertyIds)
      : Promise.resolve({ data: [], error: null }),
    propertyIds.length
      ? supabase
          .from("appointments")
          .select("id,property_id,assigned_staff_id,status,start_at")
          .in("property_id", propertyIds)
      : Promise.resolve({ data: [], error: null }),
    propertyIds.length
      ? supabase
          .from("viewing_requests")
          .select("id,property_id,assigned_staff_id,lead_status,created_at,preferred_date")
          .in("property_id", propertyIds)
      : Promise.resolve({ data: [], error: null }),
    propertyIds.length
      ? supabase
          .from("saved_properties")
          .select("property_id,created_at")
          .in("property_id", propertyIds)
      : Promise.resolve({ data: [], error: null }),
    propertyIds.length
      ? supabase
          .from("property_images")
          .select("property_id,public_url,r2_key,is_cover,sort_order")
          .in("property_id", propertyIds)
          .order("is_cover", { ascending: false })
          .order("sort_order", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("vendor_promotions")
      .select("id,listing_id,promotion_type,target_type,status,title,price_per_24h,starts_at,ends_at")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
  ]);

  if (viewsResult.error) {
    return NextResponse.json({ error: viewsResult.error.message }, { status: 500 });
  }
  if (appointmentsResult.error) {
    return NextResponse.json({ error: appointmentsResult.error.message }, { status: 500 });
  }
  if (viewingRequestsResult.error) {
    return NextResponse.json({ error: viewingRequestsResult.error.message }, { status: 500 });
  }
  if (savedPropertiesResult.error) {
    return NextResponse.json({ error: savedPropertiesResult.error.message }, { status: 500 });
  }
  if (propertyImagesResult.error) {
    return NextResponse.json({ error: propertyImagesResult.error.message }, { status: 500 });
  }
  if (promotionsResult.error && !isMissingRelationError(promotionsResult.error.message)) {
    return NextResponse.json({ error: promotionsResult.error.message }, { status: 500 });
  }

  const viewEvents = (viewsResult.data ?? []) as ViewEventRow[];
  const appointments = (appointmentsResult.data ?? []) as AppointmentRow[];
  const viewingRequests = (viewingRequestsResult.data ?? []) as ViewingRequestRow[];
  const savedProperties = (savedPropertiesResult.data ?? []) as SavedPropertyRow[];
  const propertyImages = (propertyImagesResult.data ?? []) as PropertyImageRow[];
  const promotions = promotionsResult.error ? [] : ((promotionsResult.data ?? []) as PromotionRow[]);

  const profileMap = new Map(profiles.map((profile) => [String(profile.id ?? ""), profile]));
  const propertyMap = new Map(properties.map((property) => [property.id, property]));
  const propertyPhotosMap = new Map<string, PropertyImageRow[]>();

  for (const image of propertyImages) {
    const propertyId = String(image.property_id ?? "");
    if (!propertyId) continue;
    const existing = propertyPhotosMap.get(propertyId) ?? [];
    existing.push(image);
    propertyPhotosMap.set(propertyId, existing);
  }

  return NextResponse.json({
    workspace: {
      vendorId: vendor.id,
      vendorName: vendor.name,
      plan,
    },
    generatedAt: new Date().toISOString(),
    filterOptions: {
      propertyTypes: Array.from(
        new Set(
          [
            ...properties.map((property) => (property.property_type ?? "").trim()).filter(Boolean),
            ...leads.map((lead) => (lead.property_type ?? "").trim()).filter(Boolean),
          ].map((value) => value.toLowerCase())
        )
      ).sort(),
      agents: memberIds.map((memberId) => ({
        id: memberId,
        name: labelFromProfile(profileMap.get(memberId)),
      })),
      townships: Array.from(
        new Set(
          [
            ...properties.map((property) => (property.township ?? "").trim()).filter(Boolean),
            ...leads.map((lead) => (lead.township ?? "").trim()).filter(Boolean),
          ]
        )
      ).sort((left, right) => left.localeCompare(right)),
      listingStatuses: Array.from(new Set(properties.map((property) => normalizeListingStatus(property.status)))).sort(),
    },
    liveDataFlags: {
      searchImpressionsTracked: false,
      listingCardClicksTracked: false,
      contactClicksTracked: false,
      promotionPerformanceTracked: false,
      appointmentNoShowsTracked: false,
      listingInquiryAttributionTracked: false,
    },
    items: {
      properties: properties.map((property) => ({
        id: property.id,
        title: property.title ?? "Untitled property",
        propertyType: (property.property_type ?? "unknown").trim().toLowerCase() || "unknown",
        township: property.township ?? null,
        status: normalizeListingStatus(property.status),
        createdAt: property.created_at,
        agentId: property.created_by,
        agentName: labelFromProfile(profileMap.get(String(property.created_by ?? ""))),
        coverImageUrl: resolveListingImage(
          property as unknown as Record<string, unknown>,
          (propertyPhotosMap.get(property.id) ?? []) as unknown as Record<string, unknown>[]
        ) ?? null,
      })),
      viewEvents: viewEvents.map((event) => {
        const property = propertyMap.get(String(event.property_id ?? ""));
        return {
          propertyId: String(event.property_id ?? ""),
          viewedAt: event.viewed_at,
          source: (event.source ?? "listing_detail").trim().toLowerCase() || "listing_detail",
          propertyType: (property?.property_type ?? "unknown").trim().toLowerCase() || "unknown",
          township: property?.township ?? null,
          status: normalizeListingStatus(property?.status),
          agentId: property?.created_by ?? null,
        };
      }),
      leads: leads.map((lead) => ({
        id: lead.id,
        createdAt: lead.created_at,
        status: normalizeLeadStatus(lead.status) ?? normalizeLeadStatus(lead.pipeline_stage) ?? "new",
        pipelineStage: normalizeLeadStatus(lead.pipeline_stage) ?? normalizeLeadStatus(lead.status) ?? "new",
        propertyType: (lead.property_type ?? "unknown").trim().toLowerCase() || "unknown",
        township: lead.township ?? null,
        agentId: lead.assigned_member_user_id ?? null,
        agentName: labelFromProfile(profileMap.get(String(lead.assigned_member_user_id ?? ""))),
      })),
      appointmentRequests: viewingRequests.map((request) => {
        const property = propertyMap.get(String(request.property_id ?? ""));
        const agentId = request.assigned_staff_id ?? property?.created_by ?? null;
        return {
          id: request.id,
          propertyId: String(request.property_id ?? ""),
          createdAt: request.created_at,
          preferredDate: toIsoDateKey(request.preferred_date),
          status: normalizeLeadStatus(request.lead_status) ?? "new",
          propertyType: (property?.property_type ?? "unknown").trim().toLowerCase() || "unknown",
          township: property?.township ?? null,
          listingStatus: normalizeListingStatus(property?.status),
          agentId,
          agentName: labelFromProfile(profileMap.get(String(agentId ?? ""))),
        };
      }),
      appointments: appointments.map((appointment) => {
        const property = propertyMap.get(String(appointment.property_id ?? ""));
        const agentId = appointment.assigned_staff_id ?? property?.created_by ?? null;
        return {
          id: appointment.id,
          propertyId: String(appointment.property_id ?? ""),
          startAt: appointment.start_at,
          status: normalizeAppointmentStatus(appointment.status) ?? "requested",
          propertyType: (property?.property_type ?? "unknown").trim().toLowerCase() || "unknown",
          township: property?.township ?? null,
          listingStatus: normalizeListingStatus(property?.status),
          agentId,
          agentName: labelFromProfile(profileMap.get(String(agentId ?? ""))),
        };
      }),
      savedProperties: savedProperties.map((item) => {
        const property = propertyMap.get(String(item.property_id ?? ""));
        return {
          propertyId: String(item.property_id ?? ""),
          createdAt: item.created_at,
          propertyType: (property?.property_type ?? "unknown").trim().toLowerCase() || "unknown",
          township: property?.township ?? null,
          listingStatus: normalizeListingStatus(property?.status),
          agentId: property?.created_by ?? null,
        };
      }),
      promotions: promotions.map((item) => {
        const property = item.listing_id ? propertyMap.get(String(item.listing_id)) : null;
        return {
          id: item.id,
          listingId: item.listing_id ? String(item.listing_id) : null,
          promotionType: (item.promotion_type ?? "").trim().toLowerCase() || "unknown",
          targetType: (item.target_type ?? "").trim().toLowerCase() || "listing",
          status: (item.status ?? "").trim().toLowerCase() || "draft",
          title:
            item.title?.trim() ||
            property?.title ||
            ((item.promotion_type ?? "").trim().toLowerCase() === "hero_ad" ? "Hero Section Ad" : "Promotion"),
          pricePer24h: item.price_per_24h,
          startsAt: item.starts_at,
          endsAt: item.ends_at,
        };
      }),
    },
  });
}
