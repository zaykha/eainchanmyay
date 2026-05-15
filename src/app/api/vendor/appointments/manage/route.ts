import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import {
  canTransitionAppointmentStatus,
  canTransitionLeadStatus,
  normalizeAppointmentStatus,
  normalizeLeadStatus,
} from "@/lib/lifecycle";

function normalizeSource(value: unknown) {
  if (value === "appointment" || value === "viewing_request") return value;
  return null;
}

export async function PATCH(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, memberIds } = result.context;
  const raw = (await request.json().catch(() => null)) as {
    source?: unknown;
    id?: unknown;
    status?: unknown;
    assigned_staff_id?: unknown;
    title?: unknown;
    start_at?: unknown;
    client_name?: unknown;
    client_phone?: unknown;
    notes?: unknown;
  } | null;

  const source = normalizeSource(raw?.source);
  const id = typeof raw?.id === "string" ? raw.id.trim() : "";
  const assignedStaffId =
    raw && "assigned_staff_id" in raw
      ? typeof raw?.assigned_staff_id === "string" && raw.assigned_staff_id.trim()
        ? raw.assigned_staff_id.trim()
        : raw?.assigned_staff_id === null
          ? null
          : undefined
      : undefined;

  if (!source || !id) {
    return NextResponse.json({ error: "Appointment source and id are required." }, { status: 400 });
  }

  if (assignedStaffId !== undefined && assignedStaffId !== null && !memberIds.includes(assignedStaffId)) {
    return NextResponse.json({ error: "Assigned staff must belong to this vendor workspace." }, { status: 400 });
  }

  if (source === "appointment") {
    const status = raw && "status" in raw ? normalizeAppointmentStatus(raw?.status) : undefined;
    const title =
      raw && "title" in raw ? (typeof raw?.title === "string" ? raw.title.trim() : "") : undefined;
    const startAt =
      raw && "start_at" in raw ? (typeof raw?.start_at === "string" && raw.start_at.trim() ? raw.start_at.trim() : null) : undefined;
    const clientName =
      raw && "client_name" in raw ? (typeof raw?.client_name === "string" ? raw.client_name.trim() : "") : undefined;
    const clientPhone =
      raw && "client_phone" in raw ? (typeof raw?.client_phone === "string" ? raw.client_phone.trim() : "") : undefined;
    const notes =
      raw && "notes" in raw ? (typeof raw?.notes === "string" ? raw.notes.trim() : raw?.notes === null ? null : "") : undefined;
    if (
      status === undefined &&
      assignedStaffId === undefined &&
      title === undefined &&
      startAt === undefined &&
      clientName === undefined &&
      clientPhone === undefined &&
      notes === undefined
    ) {
      return NextResponse.json({ error: "At least one change is required." }, { status: 400 });
    }
    if (status === null) {
      return NextResponse.json({ error: "Invalid appointment status." }, { status: 400 });
    }

    const { data: row, error: lookupError } = await supabase
      .from("appointments")
      .select("id,vendor_id,status,assigned_staff_id")
      .eq("id", id)
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (!row?.id) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    const currentStatus = normalizeAppointmentStatus(row.status) ?? "requested";
    if (status && !canTransitionAppointmentStatus(currentStatus, status)) {
      return NextResponse.json({ error: `Appointment status cannot transition from ${currentStatus} to ${status}.` }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (status !== undefined) {
      updatePayload.status = status;
      if (status === "completed") {
        updatePayload.completed_at = new Date().toISOString();
      }
    }
    if (assignedStaffId !== undefined) {
      updatePayload.assigned_staff_id = assignedStaffId;
    }
    if (title !== undefined) {
      updatePayload.title = title || null;
    }
    if (startAt !== undefined) {
      updatePayload.start_at = startAt;
    }
    if (clientName !== undefined) {
      updatePayload.client_name = clientName || null;
    }
    if (clientPhone !== undefined) {
      updatePayload.client_phone = clientPhone || null;
    }
    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from("appointments")
      .update(updatePayload)
      .eq("id", id)
      .select("id,status,assigned_staff_id")
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      item: {
        id,
        source,
        status: String(normalizeAppointmentStatus(updatedRow?.status) ?? status ?? currentStatus),
        assigned_staff_id:
          updatedRow?.assigned_staff_id === null
            ? null
            : String(updatedRow?.assigned_staff_id ?? assignedStaffId ?? row.assigned_staff_id ?? ""),
      },
    });
  }

  const leadStatus = raw && "status" in raw ? normalizeLeadStatus(raw?.status) : undefined;
  if (leadStatus === undefined && assignedStaffId === undefined) {
    return NextResponse.json({ error: "At least one change is required." }, { status: 400 });
  }
  if (leadStatus === null) {
    return NextResponse.json({ error: "Invalid lead status." }, { status: 400 });
  }

  const { data: requestRow, error: requestLookupError } = await supabase
    .from("viewing_requests")
    .select("id,property_id,lead_status,assigned_staff_id")
    .eq("id", id)
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

  const currentLeadStatus = normalizeLeadStatus(requestRow.lead_status) ?? "new";
  const nextLeadStatus = leadStatus ?? currentLeadStatus;
  if (leadStatus && !canTransitionLeadStatus(currentLeadStatus, nextLeadStatus)) {
    return NextResponse.json({ error: `Lead status cannot transition from ${currentLeadStatus} to ${nextLeadStatus}.` }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
  };
  if (leadStatus !== undefined) {
    updatePayload.lead_status = nextLeadStatus;
  }
  if (assignedStaffId !== undefined) {
    updatePayload.assigned_staff_id = assignedStaffId;
  }

  const { data: updatedRow, error: updateError } = await supabase
    .from("viewing_requests")
    .update(updatePayload)
    .eq("id", id)
    .select("id,lead_status,assigned_staff_id,last_activity_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    item: {
      id,
      source,
      status: String(normalizeLeadStatus(updatedRow?.lead_status) ?? nextLeadStatus),
      assigned_staff_id:
        updatedRow?.assigned_staff_id === null
          ? null
          : String(updatedRow?.assigned_staff_id ?? assignedStaffId ?? requestRow.assigned_staff_id ?? ""),
      last_activity_at: updatedRow?.last_activity_at ?? null,
    },
  });
}

export async function DELETE(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, memberIds } = result.context;
  const raw = (await request.json().catch(() => null)) as { source?: unknown; id?: unknown } | null;
  const source = normalizeSource(raw?.source);
  const id = typeof raw?.id === "string" ? raw.id.trim() : "";

  if (!source || !id) {
    return NextResponse.json({ error: "Appointment source and id are required." }, { status: 400 });
  }

  if (source === "appointment") {
    const { data: row, error: lookupError } = await supabase
      .from("appointments")
      .select("id")
      .eq("id", id)
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (!row?.id) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    const { error: deleteError } = await supabase.from("appointments").delete().eq("id", id);
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  const { data: requestRow, error: requestLookupError } = await supabase
    .from("viewing_requests")
    .select("id,property_id")
    .eq("id", id)
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

  const { error: deleteError } = await supabase.from("viewing_requests").delete().eq("id", id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, user, memberIds } = result.context;
  const raw = (await request.json().catch(() => null)) as {
    property_id?: unknown;
    title?: unknown;
    start_at?: unknown;
    client_name?: unknown;
    client_phone?: unknown;
    notes?: unknown;
    assigned_staff_id?: unknown;
    status?: unknown;
  } | null;

  const propertyId = typeof raw?.property_id === "string" ? raw.property_id.trim() : "";
  const title = typeof raw?.title === "string" ? raw.title.trim() : "";
  const startAt = typeof raw?.start_at === "string" ? raw.start_at.trim() : "";
  const clientName = typeof raw?.client_name === "string" ? raw.client_name.trim() : "";
  const clientPhone = typeof raw?.client_phone === "string" ? raw.client_phone.trim() : "";
  const notes =
    raw && "notes" in raw ? (typeof raw?.notes === "string" ? raw.notes.trim() : raw?.notes === null ? null : "") : "";
  const assignedStaffId =
    typeof raw?.assigned_staff_id === "string" && raw.assigned_staff_id.trim()
      ? raw.assigned_staff_id.trim()
      : null;
  const status = normalizeAppointmentStatus(raw?.status ?? "requested");

  if (!propertyId || !startAt) {
    return NextResponse.json({ error: "Property and appointment time are required." }, { status: 400 });
  }

  if (!status) {
    return NextResponse.json({ error: "Invalid appointment status." }, { status: 400 });
  }

  if (assignedStaffId && !memberIds.includes(assignedStaffId)) {
    return NextResponse.json({ error: "Assigned staff must belong to this vendor workspace." }, { status: 400 });
  }

  const { data: propertyRow, error: propertyLookupError } = await supabase
    .from("properties")
    .select("id,created_by")
    .eq("id", propertyId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (propertyLookupError) {
    return NextResponse.json({ error: propertyLookupError.message }, { status: 500 });
  }

  if (!propertyRow?.id || !memberIds.includes(String(propertyRow.created_by ?? ""))) {
    return NextResponse.json({ error: "Property not found in this vendor workspace." }, { status: 404 });
  }

  const { data: insertedRow, error: insertError } = await supabase
    .from("appointments")
    .insert({
      vendor_id: vendor.id,
      property_id: propertyId,
      assigned_staff_id: assignedStaffId,
      title: title || null,
      notes: notes || null,
      start_at: startAt,
      status,
      created_by: user.id,
      client_name: clientName || null,
      client_phone: clientPhone || null,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ item: { id: String(insertedRow?.id ?? "") } }, { status: 201 });
}
