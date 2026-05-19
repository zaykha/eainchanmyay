import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

function isFreePlan(plan: string | null | undefined) {
  return (plan ?? "").trim().toLowerCase() === "free";
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
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

  const { supabase, user, memberIds } = result.context;
  let body: { request_id?: string } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const requestId = body.request_id?.trim();
  if (!requestId) {
    return NextResponse.json({ error: "Viewing request id is required." }, { status: 400 });
  }

  const { data: requestRow, error: requestError } = await supabase
    .from("viewing_requests")
    .select("id,property_id")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    return NextResponse.json({ error: requestError.message }, { status: 500 });
  }

  if (!requestRow?.id || !requestRow.property_id) {
    return NextResponse.json({ error: "Viewing request not found." }, { status: 404 });
  }

  const { data: propertyRow, error: propertyError } = await supabase
    .from("properties")
    .select("id,created_by")
    .eq("id", requestRow.property_id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (propertyError) {
    return NextResponse.json({ error: propertyError.message }, { status: 500 });
  }

  if (!propertyRow?.id || !memberIds.includes(String(propertyRow.created_by ?? ""))) {
    return NextResponse.json({ error: "Viewing request not found in this vendor workspace." }, { status: 404 });
  }

  const { error: upsertError } = await supabase.from("vendor_viewing_request_reads").upsert({
    request_id: requestId,
    user_id: user.id,
    last_read_at: new Date().toISOString(),
  });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
