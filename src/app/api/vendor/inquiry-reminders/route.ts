import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

const allowedReminderStatuses = new Set(["pending", "done", "canceled"]);

function normalizeReminderStatus(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return allowedReminderStatuses.has(normalized) ? normalized : null;
}

function isFreePlan(plan: string | null | undefined) {
  return (plan ?? "").trim().toLowerCase() === "free";
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request, { requireExplicitVendorSelection: true });
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, membership, user } = result.context;
  if (isFreePlan(vendor.plan)) {
    return NextResponse.json(
      {
        error: "Lead inbox requires a Pro plan or higher.",
        code: "lead_inbox_upgrade_required",
      },
      { status: 403 }
    );
  }
  const isOwnerOrAdmin = ["owner", "admin"].includes(membership.role);
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

  if (!isOwnerOrAdmin && assignedUserId && assignedUserId !== user.id) {
    return NextResponse.json({ error: "Only owner or admin members can assign reminders to others." }, { status: 403 });
  }

  const { data: leadRow, error: leadError } = await supabase
    .from("vendor_inquiry_leads")
    .select("id,vendor_id,assigned_member_user_id")
    .eq("id", leadId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (leadError) {
    return NextResponse.json({ error: leadError.message }, { status: 500 });
  }

  if (!leadRow?.id) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  if (!isOwnerOrAdmin && String(leadRow.assigned_member_user_id ?? "") !== user.id) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const effectiveAssignedUserId = isOwnerOrAdmin ? assignedUserId : user.id;

  if (effectiveAssignedUserId) {
    const { data: memberRow, error: memberError } = await supabase
      .from("vendor_members")
      .select("user_id")
      .eq("vendor_id", vendor.id)
      .eq("user_id", effectiveAssignedUserId)
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
      assigned_user_id: effectiveAssignedUserId,
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
      assigned_user_id: reminderRow?.assigned_user_id ? String(reminderRow.assigned_user_id) : effectiveAssignedUserId,
      remind_at: (reminderRow?.remind_at as string | null) ?? remindAt,
      status: (reminderRow?.status as string | null) ?? "pending",
      note: (reminderRow?.note as string | null) ?? (body.note?.trim() || null),
    },
  });
}

export async function PATCH(request: Request) {
  const result = await getVendorRequestContext(request, { requireExplicitVendorSelection: true });
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, user, membership } = result.context;
  if (isFreePlan(vendor.plan)) {
    return NextResponse.json(
      {
        error: "Lead inbox requires a Pro plan or higher.",
        code: "lead_inbox_upgrade_required",
      },
      { status: 403 }
    );
  }
  const isOwnerOrAdmin = ["owner", "admin"].includes(membership.role);
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

  const { data: existingReminder, error: reminderLookupError } = await supabase
    .from("vendor_lead_reminders")
    .select("id,assigned_user_id")
    .eq("id", reminderId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (reminderLookupError) {
    return NextResponse.json({ error: reminderLookupError.message }, { status: 500 });
  }

  if (!existingReminder?.id) {
    return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
  }

  if (!isOwnerOrAdmin && String(existingReminder.assigned_user_id ?? "") !== user.id) {
    return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
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

export async function DELETE(request: Request) {
  const result = await getVendorRequestContext(request, { requireExplicitVendorSelection: true });
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, user, membership } = result.context;
  if (isFreePlan(vendor.plan)) {
    return NextResponse.json(
      {
        error: "Lead inbox requires a Pro plan or higher.",
        code: "lead_inbox_upgrade_required",
      },
      { status: 403 }
    );
  }
  const isOwnerOrAdmin = ["owner", "admin"].includes(membership.role);
  let body: { reminder_id?: string } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const reminderId = body.reminder_id?.trim();

  if (!reminderId) {
    return NextResponse.json({ error: "Reminder id is required." }, { status: 400 });
  }

  const { data: existingReminder, error: reminderLookupError } = await supabase
    .from("vendor_lead_reminders")
    .select("id,assigned_user_id")
    .eq("id", reminderId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (reminderLookupError) {
    return NextResponse.json({ error: reminderLookupError.message }, { status: 500 });
  }

  if (!existingReminder?.id) {
    return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
  }

  if (!isOwnerOrAdmin && String(existingReminder.assigned_user_id ?? "") !== user.id) {
    return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
  }

  const { error } = await supabase
    .from("vendor_lead_reminders")
    .delete()
    .eq("id", reminderId)
    .eq("vendor_id", vendor.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
