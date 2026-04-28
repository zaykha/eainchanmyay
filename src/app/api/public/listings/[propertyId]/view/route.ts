import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const isConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

type RouteContext = {
  params: Promise<{
    propertyId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  if (!isConfigured) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { propertyId } = await context.params;
  const resolvedPropertyId = propertyId.trim();
  if (!resolvedPropertyId) {
    return NextResponse.json({ error: "Property id is required." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let viewerUserId: string | null = null;
  const token = getBearerToken(request);
  if (token) {
    const { data: userData } = await supabase.auth.getUser(token);
    viewerUserId = userData.user?.id ?? null;
  }

  let body: { sessionId?: string | null; source?: string | null } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const source = typeof body.source === "string" && body.source.trim() ? body.source.trim() : "listing_detail";
  const sessionId = typeof body.sessionId === "string" && body.sessionId.trim() ? body.sessionId.trim() : null;
  const userAgent = request.headers.get("user-agent");
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ipRaw = forwardedFor?.split(",")[0]?.trim() || realIp || "";
  const ipHash = ipRaw ? hashValue(ipRaw) : null;

  const { data: existingProperty, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", resolvedPropertyId)
    .eq("status", "published")
    .eq("is_deleted", false)
    .maybeSingle();

  if (propertyError || !existingProperty?.id) {
    return NextResponse.json({ error: propertyError?.message ?? "Property not found." }, { status: 404 });
  }

  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  let duplicateFound = false;

  if (viewerUserId || sessionId || ipHash) {
    let duplicateQuery = supabase
      .from("property_view_events")
      .select("id")
      .eq("property_id", resolvedPropertyId)
      .gte("viewed_at", fifteenMinutesAgo)
      .limit(1);

    if (viewerUserId) {
      duplicateQuery = duplicateQuery.eq("viewer_user_id", viewerUserId);
    } else if (sessionId) {
      duplicateQuery = duplicateQuery.eq("session_id", sessionId);
    } else if (ipHash) {
      duplicateQuery = duplicateQuery.eq("ip_hash", ipHash);
    }

    const { data: duplicateRows } = await duplicateQuery;
    duplicateFound = Boolean(duplicateRows?.length);
  }

  if (!duplicateFound) {
    await supabase.from("property_view_events").insert({
      property_id: resolvedPropertyId,
      viewer_user_id: viewerUserId,
      session_id: sessionId,
      source,
      ip_hash: ipHash,
      user_agent: userAgent,
      viewed_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({ ok: true, counted: !duplicateFound });
}
