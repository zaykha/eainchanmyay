import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

type AppointmentRow = {
  id: string;
  title: string | null;
  start_at: string | null;
  status: string | null;
  client_name: string | null;
  client_phone: string | null;
  notes: string | null;
  property_id: string | null;
  assigned_staff_id: string | null;
};

type ViewingRequestRow = {
  id: string;
  property_id: string | null;
  name: string | null;
  phone: string | null;
  preferred_date: string | null;
  preferred_time_window: string | null;
  lead_status: string | null;
  notes: string | null;
  assigned_staff_id: string | null;
  last_activity_at: string | null;
};

type PropertyRow = {
  id: string;
  title: string | null;
  district: string | null;
  township: string | null;
  city: string | null;
};

type MemberProfileRow = {
  id: string | null;
  full_name: string | null;
  email: string | null;
};

type MemberRow = {
  user_id: string | null;
  role: string | null;
};

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, memberIds, user } = result.context;

  const { data: propertiesData, error: propertiesLookupError } = await supabase
    .from("properties")
    .select("id,title,district,township,city,created_by")
    .in("created_by", memberIds)
    .eq("is_deleted", false);

  if (propertiesLookupError) {
    return NextResponse.json({ error: propertiesLookupError.message }, { status: 500 });
  }

  const properties = (propertiesData ?? []) as Array<PropertyRow & { created_by?: string | null }>;
  const propertyIds = properties.map((property) => String(property.id ?? "")).filter(Boolean);

  const [appointmentResult, viewingRequestResult] = await Promise.all([
    supabase
      .from("appointments")
      .select("id,title,start_at,status,client_name,client_phone,notes,property_id,assigned_staff_id")
      .eq("vendor_id", vendor.id)
      .order("start_at", { ascending: true }),
    propertyIds.length
        ? supabase
          .from("viewing_requests")
          .select("id,property_id,name,phone,preferred_date,preferred_time_window,lead_status,notes,assigned_staff_id,last_activity_at,created_at")
          .in("property_id", propertyIds)
          .order("preferred_date", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (appointmentResult.error) {
    return NextResponse.json({ error: appointmentResult.error.message }, { status: 500 });
  }

  if (viewingRequestResult.error) {
    return NextResponse.json({ error: viewingRequestResult.error.message }, { status: 500 });
  }

  const appointments = (appointmentResult.data ?? []) as AppointmentRow[];
  const viewingRequests = (viewingRequestResult.data ?? []) as ViewingRequestRow[];
  const propertyIdsWithActivity = Array.from(
    new Set(
      [...appointments, ...viewingRequests]
        .map((item) => String(item.property_id ?? ""))
        .filter(Boolean)
    )
  );
  const viewingRequestIds = viewingRequests.map((request) => String(request.id ?? "")).filter(Boolean);
  const [propertiesResult, profilesResult, membersResult, viewingReadResult] = await Promise.all([
    propertyIdsWithActivity.length
      ? Promise.resolve({ data: properties.filter((property) => propertyIdsWithActivity.includes(String(property.id ?? ""))), error: null })
      : Promise.resolve({ data: [], error: null }),
    memberIds.length
      ? supabase.from("profiles").select("id,full_name,email").in("id", memberIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("vendor_members").select("user_id,role").eq("vendor_id", vendor.id).eq("status", "active"),
    viewingRequestIds.length
      ? supabase.from("vendor_viewing_request_reads").select("request_id,last_read_at").eq("user_id", user.id).in("request_id", viewingRequestIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (propertiesResult.error) {
    return NextResponse.json({ error: propertiesResult.error.message }, { status: 500 });
  }

  if (profilesResult.error) {
    return NextResponse.json({ error: profilesResult.error.message }, { status: 500 });
  }

  if (membersResult.error) {
    return NextResponse.json({ error: membersResult.error.message }, { status: 500 });
  }

  if (viewingReadResult.error) {
    return NextResponse.json({ error: viewingReadResult.error.message }, { status: 500 });
  }

  const activeProperties = (propertiesResult.data ?? []) as PropertyRow[];
  const profiles = (profilesResult.data ?? []) as MemberProfileRow[];
  const members = (membersResult.data ?? []) as MemberRow[];
  const viewingReads = (viewingReadResult.data ?? []) as Array<{ request_id: string | null; last_read_at: string | null }>;

  const propertyMap = new Map(
    activeProperties.map((property) => [
      property.id,
      {
        title: property.title ?? "Untitled property",
        location: [property.district, property.township, property.city].filter(Boolean).join(" / ") || "Unspecified",
      },
    ])
  );

  const profileMap = new Map(
    profiles.map((profile) => [
      String(profile.id ?? ""),
      {
        name: profile.full_name || profile.email || "Team member",
      },
    ])
  );

  const memberRoleMap = new Map(
    members.map((member) => [String(member.user_id ?? ""), String(member.role ?? "agent")])
  );

  const viewingReadMap = new Map(
    viewingReads.map((row) => [String(row.request_id ?? ""), row.last_read_at ?? null])
  );

  const assignmentCounts = [...appointments, ...viewingRequests].reduce<Record<string, number>>((acc, item) => {
    const assignedId = String(item.assigned_staff_id ?? "");
    if (!assignedId) return acc;
    acc[assignedId] = (acc[assignedId] ?? 0) + 1;
    return acc;
  }, {});

  const windowStartHour: Record<string, number> = {
    "9-12": 9,
    "12-3": 12,
    "3-6": 15,
    "6-9": 18,
  };

  const derivedViewingRequests = viewingRequests.map((request) => {
    const propertyId = String(request.property_id ?? "");
    const property = propertyMap.get(propertyId);
    const startHour = windowStartHour[String(request.preferred_time_window ?? "")] ?? 9;
    const startAt = request.preferred_date
      ? `${request.preferred_date}T${String(startHour).padStart(2, "0")}:00:00`
      : null;
    const assignedId = String(request.assigned_staff_id ?? "");
    const assignee = assignedId ? profileMap.get(assignedId) : null;

    return {
      id: request.id,
      title: property?.title ?? "Viewing request",
      start_at: startAt,
      status: request.lead_status ?? "new",
      client_name: request.name ?? "Buyer",
      client_phone: request.phone ?? null,
      notes: request.notes ?? null,
      property_id: propertyId || null,
      property_title: property?.title ?? "Untitled property",
      property_location: property?.location ?? "Unspecified",
      assigned_staff_id: assignedId || null,
      assigned_staff_name: assignee?.name ?? null,
      source: "viewing_request" as const,
      is_unread: (() => {
        const requestId = String(request.id ?? "");
        const lastActivityAt = request.last_activity_at ?? startAt;
        const lastReadAt = viewingReadMap.get(requestId) ?? null;
        if (!lastActivityAt) return false;
        if (!lastReadAt) return true;
        return new Date(lastActivityAt).getTime() > new Date(lastReadAt).getTime();
      })(),
    };
  });

  const appointmentEntries = appointments.map((appointment) => {
    const propertyId = String(appointment.property_id ?? "");
    const assignedId = String(appointment.assigned_staff_id ?? "");
    const property = propertyMap.get(propertyId);
    const assignee = assignedId ? profileMap.get(assignedId) : null;

    return {
      id: appointment.id,
      title: appointment.title ?? property?.title ?? "Appointment",
      start_at: appointment.start_at,
      status: appointment.status ?? "scheduled",
      client_name: appointment.client_name ?? "Buyer",
      client_phone: appointment.client_phone ?? null,
      notes: appointment.notes ?? null,
      property_id: propertyId || null,
      property_title: property?.title ?? "Untitled property",
      property_location: property?.location ?? "Unspecified",
      assigned_staff_id: assignedId || null,
      assigned_staff_name: assignee?.name ?? null,
      source: "appointment" as const,
      is_unread: false,
    };
  });

  const timelineItems = [...appointmentEntries, ...derivedViewingRequests].sort(
    (left, right) => new Date(left.start_at ?? 0).getTime() - new Date(right.start_at ?? 0).getTime()
  );

  const mergedStats = (() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();

    let today = 0;
    let unassigned = 0;
    let upcoming = 0;

    for (const item of timelineItems) {
      if (!item.start_at) continue;
      const timestamp = new Date(item.start_at).getTime();
      if (!Number.isFinite(timestamp)) continue;
      if (timestamp >= startOfToday && timestamp < endOfToday) {
        today += 1;
      }
      if (timestamp >= now.getTime()) {
        upcoming += 1;
        if (!item.assigned_staff_id) {
          unassigned += 1;
        }
      }
    }

    return { today, unassigned, upcoming };
  })();

  return NextResponse.json({
    stats: mergedStats,
    assignments: members.map((member) => {
      const userId = String(member.user_id ?? "");
      const profile = profileMap.get(userId);
      return {
        id: userId,
        name: profile?.name || "Team member",
        role: memberRoleMap.get(userId) ?? "agent",
        assigned_count: assignmentCounts[userId] ?? 0,
      };
    }),
    appointments: timelineItems,
  });
}
