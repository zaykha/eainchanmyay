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
  let body: { lead_id?: string } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const leadId = body.lead_id?.trim();
  if (!leadId) {
    return NextResponse.json({ error: "Lead id is required." }, { status: 400 });
  }

  const { data: leadRow, error: leadError } = await supabase
    .from("vendor_inquiry_leads")
    .select("id,assigned_member_user_id")
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

  const { error: upsertError } = await supabase.from("vendor_lead_reads").upsert({
    lead_id: leadId,
    user_id: user.id,
    last_read_at: new Date().toISOString(),
  });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
