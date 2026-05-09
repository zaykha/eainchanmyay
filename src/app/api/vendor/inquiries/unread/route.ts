import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, user } = result.context;

  const [{ data: leadRows, error: leadError }, { data: readRows, error: readError }] = await Promise.all([
    supabase.from("vendor_inquiry_leads").select("id,last_activity_at,created_at").eq("vendor_id", vendor.id),
    supabase.from("vendor_lead_reads").select("lead_id,last_read_at").eq("user_id", user.id),
  ]);

  if (leadError) {
    return NextResponse.json({ error: leadError.message }, { status: 500 });
  }

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const readsByLeadId = new Map<string, string | null>();
  for (const row of readRows ?? []) {
    const leadId = String(row.lead_id ?? "");
    if (!leadId) continue;
    readsByLeadId.set(leadId, (row.last_read_at as string | null) ?? null);
  }

  let unreadCount = 0;
  for (const row of leadRows ?? []) {
    const leadId = String(row.id ?? "");
    if (!leadId) continue;
    const lastActivityAt = (row.last_activity_at as string | null) ?? (row.created_at as string | null) ?? null;
    if (!lastActivityAt) continue;

    const lastReadAt = readsByLeadId.get(leadId) ?? null;
    if (!lastReadAt || new Date(lastActivityAt).getTime() > new Date(lastReadAt).getTime()) {
      unreadCount += 1;
    }
  }

  return NextResponse.json({ unreadCount });
}
