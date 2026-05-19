import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { canTransitionLeadStatus, normalizeLeadStatus } from "@/lib/lifecycle";

function isFreePlan(plan: string | null | undefined) {
  return (plan ?? "").trim().toLowerCase() === "free";
}

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request, { requireExplicitVendorSelection: true });
  if (!result.ok) {
    return result.response;
  }

  if (isFreePlan(result.context.vendor.plan)) {
    return NextResponse.json(
      {
        error: "Appointment management requires a Pro plan or higher.",
        code: "appointments_upgrade_required",
      },
      { status: 403 }
    );
  }

  const { supabase, memberIds, membership, user } = result.context;
  const isOwnerOrAdmin = ["owner", "admin"].includes(membership.role);

  if (!memberIds.length) {
    return NextResponse.json({ items: [] });
  }

  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("id,title,district,township")
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
        city: (property.district as string | null) ?? null,
      },
    ])
  );

  const viewingRequestQuery = supabase
    .from("viewing_requests")
    .select("id,property_id,name,phone,preferred_date,preferred_time_window,notes,lead_status,assigned_staff_id,created_at,updated_at,last_activity_at")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  const { data, error } = await (isOwnerOrAdmin
    ? viewingRequestQuery
    : viewingRequestQuery.eq("assigned_staff_id", user.id));

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
  const result = await getVendorRequestContext(request, { requireExplicitVendorSelection: true });
  if (!result.ok) {
    return result.response;
  }

  if (isFreePlan(result.context.vendor.plan)) {
    return NextResponse.json(
      {
        error: "Appointment management requires a Pro plan or higher.",
        code: "appointments_upgrade_required",
      },
      { status: 403 }
    );
  }

  const { supabase, memberIds, membership, user } = result.context;
  const isOwnerOrAdmin = ["owner", "admin"].includes(membership.role);
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
    .select("id,property_id,lead_status,assigned_staff_id")
    .eq("id", requestId)
    .eq(isOwnerOrAdmin ? "id" : "assigned_staff_id", isOwnerOrAdmin ? requestId : user.id)
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

  const isAssignedToCurrentUser = String(requestRow.assigned_staff_id ?? "") === user.id;
  if (!isOwnerOrAdmin) {
    if (!isAssignedToCurrentUser) {
      return NextResponse.json({ error: "Viewing request not found." }, { status: 404 });
    }
    if (assignedStaffId !== undefined) {
      return NextResponse.json({ error: "Staff cannot reassign viewing requests." }, { status: 403 });
    }
  }

  if (assignedStaffId !== undefined && assignedStaffId !== null && !memberIds.includes(assignedStaffId)) {
    return NextResponse.json({ error: "Assigned staff must belong to this vendor workspace." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
  };

  const currentLeadStatus = normalizeLeadStatus(requestRow.lead_status) ?? "new";
  const nextLeadStatus = leadStatus ?? currentLeadStatus;
  if (leadStatus && !canTransitionLeadStatus(currentLeadStatus, nextLeadStatus)) {
    return NextResponse.json({ error: `Lead status cannot transition from ${currentLeadStatus} to ${nextLeadStatus}.` }, { status: 400 });
  }

  if (leadStatus !== undefined) {
    updatePayload.lead_status = nextLeadStatus;
  }

  if (assignedStaffId !== undefined) {
    updatePayload.assigned_staff_id = assignedStaffId;
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from("viewing_requests")
    .update(updatePayload)
    .eq("id", requestId)
    .select("id,lead_status,assigned_staff_id,updated_at,last_activity_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    item: {
      id: String(updatedRow?.id ?? requestId),
      lead_status: String(normalizeLeadStatus(updatedRow?.lead_status) ?? nextLeadStatus),
      assigned_staff_id:
        updatedRow?.assigned_staff_id === null
          ? null
          : String(updatedRow?.assigned_staff_id ?? assignedStaffId ?? ""),
      updated_at: updatedRow?.updated_at ?? null,
      last_activity_at: updatedRow?.last_activity_at ?? null,
    },
  });
}
