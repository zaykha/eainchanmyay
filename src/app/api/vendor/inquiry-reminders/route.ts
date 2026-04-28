import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

const allowedReminderStatuses = new Set(["pending", "done", "canceled"]);

function normalizeReminderStatus(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return allowedReminderStatuses.has(normalized) ? normalized : null;
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, membership } = result.context;
  let body: {
    lead_id?: string;
    remind_at?: string;
    assigned_user_id?: string | null;
    note?: string | null;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const leadId = body.lead_id?.trim();
  const remindAt = body.remind_at?.trim();
  const assignedUserId = body.assigned_user_id?.trim() || null;

  if (!leadId || !remindAt) {
    return NextResponse.json({ error: "Lead id and remind_at are required." }, { status: 400 });
  }

  if (!["owner", "admin"].includes(membership.role) && assignedUserId && assignedUserId !== result.context.user.id) {
    return NextResponse.json({ error: "Only owner or admin members can assign reminders to others." }, { status: 403 });
  }

  const { data: leadRow, error: leadError } = await supabase
    .from("vendor_inquiry_leads")
    .select("id,vendor_id")
    .eq("id", leadId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (leadError) {
    return NextResponse.json({ error: leadError.message }, { status: 500 });
  }

  if (!leadRow?.id) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  if (assignedUserId) {
    const { data: memberRow, error: memberError } = await supabase
      .from("vendor_members")
      .select("user_id")
      .eq("vendor_id", vendor.id)
      .eq("user_id", assignedUserId)
      .eq("status", "active")
      .maybeSingle();

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    if (!memberRow?.user_id) {
      return NextResponse.json({ error: "Reminder assignee must be an active vendor member." }, { status: 400 });
    }
  }

  const { data: reminderRow, error: insertError } = await supabase
    .from("vendor_lead_reminders")
    .insert({
      lead_id: leadId,
      vendor_id: vendor.id,
      assigned_user_id: assignedUserId,
      remind_at: remindAt,
      note: body.note?.trim() || null,
      status: "pending",
    })
    .select("id,assigned_user_id,remind_at,status,note")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    reminder: {
      id: String(reminderRow?.id ?? ""),
      assigned_user_id: reminderRow?.assigned_user_id ? String(reminderRow.assigned_user_id) : assignedUserId,
      remind_at: (reminderRow?.remind_at as string | null) ?? remindAt,
      status: (reminderRow?.status as string | null) ?? "pending",
      note: (reminderRow?.note as string | null) ?? (body.note?.trim() || null),
    },
  });
}

export async function PATCH(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor } = result.context;
  let body: { reminder_id?: string; status?: string } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const reminderId = body.reminder_id?.trim();
  const status = normalizeReminderStatus(body.status);

  if (!reminderId || !status) {
    return NextResponse.json({ error: "Reminder id and status are required." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("vendor_lead_reminders")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reminderId)
    .eq("vendor_id", vendor.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
