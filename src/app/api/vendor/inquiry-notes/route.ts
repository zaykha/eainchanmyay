import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, user } = result.context;
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

  return NextResponse.json({
    ok: true,
    note: {
      id: String(noteRow?.id ?? ""),
      body: String(noteRow?.body ?? noteBody),
      created_at: (noteRow?.created_at as string | null) ?? null,
      author_name: result.context.profile.full_name ?? result.context.profile.email ?? null,
    },
  });
}
