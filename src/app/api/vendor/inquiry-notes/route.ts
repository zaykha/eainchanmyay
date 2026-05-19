import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

function isFreePlan(plan: string | null | undefined) {
  return (plan ?? "").trim().toLowerCase() === "free";
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request, { requireExplicitVendorSelection: true });
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, user, membership, profile } = result.context;
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
  let body: { lead_id?: string; body?: string } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const leadId = body.lead_id?.trim();
  const noteBody = body.body?.trim();

  if (!leadId || !noteBody) {
    return NextResponse.json({ error: "Lead id and note body are required." }, { status: 400 });
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

  const { data: noteRow, error: insertError } = await supabase
    .from("vendor_lead_notes")
    .insert({
      lead_id: leadId,
      vendor_id: vendor.id,
      author_user_id: user.id,
      body: noteBody,
    })
    .select("id,body,created_at")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const activityTimestamp = new Date().toISOString();
  const { error: touchError } = await supabase
    .from("vendor_inquiry_leads")
    .update({
      last_activity_at: activityTimestamp,
      updated_at: activityTimestamp,
    })
    .eq("id", leadId)
    .eq("vendor_id", vendor.id);

  if (touchError) {
    return NextResponse.json({ error: touchError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    note: {
      id: String(noteRow?.id ?? ""),
      body: String(noteRow?.body ?? noteBody),
      created_at: (noteRow?.created_at as string | null) ?? null,
      author_name: profile.full_name ?? profile.email ?? null,
    },
  });
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
  let body: { note_id?: string } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const noteId = body.note_id?.trim();

  if (!noteId) {
    return NextResponse.json({ error: "Note id is required." }, { status: 400 });
  }

  const { data: existingNote, error: noteLookupError } = await supabase
    .from("vendor_lead_notes")
    .select("id,lead_id,author_user_id")
    .eq("id", noteId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (noteLookupError) {
    return NextResponse.json({ error: noteLookupError.message }, { status: 500 });
  }

  if (!existingNote?.id) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  if (!isOwnerOrAdmin) {
    const { data: leadRow, error: leadLookupError } = await supabase
      .from("vendor_inquiry_leads")
      .select("id,assigned_member_user_id")
      .eq("id", existingNote.lead_id)
      .eq("vendor_id", vendor.id)
      .maybeSingle();

    if (leadLookupError) {
      return NextResponse.json({ error: leadLookupError.message }, { status: 500 });
    }

    const isAssignedToCurrentUser = String(leadRow?.assigned_member_user_id ?? "") === user.id;
    const isAuthor = String(existingNote.author_user_id ?? "") === user.id;
    if (!leadRow?.id || !isAssignedToCurrentUser || !isAuthor) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }
  }

  const { error } = await supabase.from("vendor_lead_notes").delete().eq("id", noteId).eq("vendor_id", vendor.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const activityTimestamp = new Date().toISOString();
  const { error: touchError } = await supabase
    .from("vendor_inquiry_leads")
    .update({
      last_activity_at: activityTimestamp,
      updated_at: activityTimestamp,
    })
    .eq("id", existingNote.lead_id)
    .eq("vendor_id", vendor.id);

  if (touchError) {
    return NextResponse.json({ error: touchError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
