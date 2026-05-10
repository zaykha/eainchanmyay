import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, user, memberIds } = result.context;

  if (!memberIds.length) {
    return NextResponse.json({ unreadCount: 0 });
  }

  const { data: properties, error: propertiesError } = await supabase
    .from("properties")
    .select("id")
    .in("created_by", memberIds)
    .eq("is_deleted", false);

  if (propertiesError) {
    return NextResponse.json({ error: propertiesError.message }, { status: 500 });
  }

  const propertyIds = (properties ?? []).map((property) => String(property.id ?? "")).filter(Boolean);
  if (!propertyIds.length) {
    return NextResponse.json({ unreadCount: 0 });
  }

  const [{ data: requestRows, error: requestError }, { data: readRows, error: readError }] = await Promise.all([
    supabase.from("viewing_requests").select("id,last_activity_at,created_at").in("property_id", propertyIds),
    supabase.from("vendor_viewing_request_reads").select("request_id,last_read_at").eq("user_id", user.id),
  ]);

  if (requestError) {
    return NextResponse.json({ error: requestError.message }, { status: 500 });
  }

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const readsByRequestId = new Map<string, string | null>();
  for (const row of readRows ?? []) {
    const requestId = String(row.request_id ?? "");
    if (!requestId) continue;
    readsByRequestId.set(requestId, (row.last_read_at as string | null) ?? null);
  }

  let unreadCount = 0;
  for (const row of requestRows ?? []) {
    const requestId = String(row.id ?? "");
    if (!requestId) continue;
    const lastActivityAt = (row.last_activity_at as string | null) ?? (row.created_at as string | null) ?? null;
    if (!lastActivityAt) continue;
    const lastReadAt = readsByRequestId.get(requestId) ?? null;
    if (!lastReadAt || new Date(lastActivityAt).getTime() > new Date(lastReadAt).getTime()) {
      unreadCount += 1;
    }
  }

  return NextResponse.json({ unreadCount });
}
