import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

const allowedLeadStatuses = new Set(["new", "contacted", "scheduled", "closed", "lost"]);

function normalizeLeadStatus(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return allowedLeadStatuses.has(normalized) ? normalized : null;
}

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
    .select("id,property_id,name,phone,preferred_date,preferred_time_window,notes,lead_status,assigned_staff_id,created_at,updated_at")
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

export async function PATCH(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, memberIds } = result.context;
  const raw = (await request.json().catch(() => null)) as {
    id?: unknown;
    lead_status?: unknown;
    assigned_staff_id?: unknown;
  } | null;

  const requestId = typeof raw?.id === "string" ? raw.id.trim() : "";
  const leadStatus =
    raw && "lead_status" in raw ? normalizeLeadStatus(raw?.lead_status) : undefined;
  const assignedStaffId =
    raw && "assigned_staff_id" in raw
      ? typeof raw?.assigned_staff_id === "string" && raw.assigned_staff_id.trim()
        ? raw.assigned_staff_id.trim()
        : raw?.assigned_staff_id === null
          ? null
          : undefined
      : undefined;

  if (!requestId) {
    return NextResponse.json({ error: "Viewing request id is required." }, { status: 400 });
  }

  if (leadStatus === undefined && assignedStaffId === undefined) {
    return NextResponse.json({ error: "At least one change is required." }, { status: 400 });
  }

  if (leadStatus === null) {
    return NextResponse.json({ error: "Invalid lead status." }, { status: 400 });
  }

  const { data: requestRow, error: requestLookupError } = await supabase
    .from("viewing_requests")
    .select("id,property_id,lead_status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestLookupError) {
    return NextResponse.json({ error: requestLookupError.message }, { status: 500 });
  }

  if (!requestRow?.id || !requestRow.property_id) {
    return NextResponse.json({ error: "Viewing request not found." }, { status: 404 });
  }

  const { data: propertyRow, error: propertyLookupError } = await supabase
    .from("properties")
    .select("id,created_by")
    .eq("id", requestRow.property_id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (propertyLookupError) {
    return NextResponse.json({ error: propertyLookupError.message }, { status: 500 });
  }

  if (!propertyRow?.id || !memberIds.includes(String(propertyRow.created_by ?? ""))) {
    return NextResponse.json({ error: "Viewing request not found in this vendor workspace." }, { status: 404 });
  }

  if (assignedStaffId !== undefined && assignedStaffId !== null && !memberIds.includes(assignedStaffId)) {
    return NextResponse.json({ error: "Assigned staff must belong to this vendor workspace." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (leadStatus !== undefined) {
    updatePayload.lead_status = leadStatus;
  }

  if (assignedStaffId !== undefined) {
    updatePayload.assigned_staff_id = assignedStaffId;
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from("viewing_requests")
    .update(updatePayload)
    .eq("id", requestId)
    .select("id,lead_status,assigned_staff_id,updated_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    item: {
      id: String(updatedRow?.id ?? requestId),
      lead_status: String(updatedRow?.lead_status ?? leadStatus ?? requestRow.lead_status ?? "new"),
      assigned_staff_id:
        updatedRow?.assigned_staff_id === null
          ? null
          : String(updatedRow?.assigned_staff_id ?? assignedStaffId ?? ""),
      updated_at: updatedRow?.updated_at ?? null,
    },
  });
}
