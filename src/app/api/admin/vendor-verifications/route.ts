import { NextResponse } from "next/server";
import { getAdminRequestContext } from "@/app/api/admin/_lib/context";

function toOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function toOptionalInteger(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }
  return null;
}

function toOptionalIsoDate(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

async function loadAdminVerificationItems(
  supabase: Awaited<ReturnType<typeof getAdminRequestContext>> extends { ok: true; context: infer C }
    ? C["supabase"]
    : never,
  statusFilter: string | null
) {
  let query = supabase
    .from("vendor_verification_requests")
    .select(
      "id,vendor_id,status,notes,review_notes,included_in_plan,requested_at,reviewed_at,request_type,business_name_submitted,license_number,company_registration_number,tax_id,office_address,contact_person_name,contact_person_role,contact_person_phone,contact_person_email,decision_reason_code,checklist_json,vendor:vendors(id,name,plan,verification_status,slug,verified_at,verification_expires_at,verification_level,verification_score,verification_rejection_reason_code,verification_rank_bonus),requester:profiles!vendor_verification_requests_requested_by_user_id_fkey(id,full_name,email),reviewer:profiles!vendor_verification_requests_reviewed_by_user_id_fkey(id,full_name,email)"
    )
    .order("requested_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: requests, error } = await query;
  if (error) {
    return { error: error.message } as const;
  }

  const requestIds = (requests ?? []).map((item) => String(item.id ?? "")).filter(Boolean);
  const [documentsResult, eventsResult] = await Promise.all([
    requestIds.length
      ? supabase
          .from("vendor_verification_documents")
          .select(
            "id,verification_request_id,document_type,document_name,document_url,document_side,mime_type,file_size_bytes,storage_path,document_number,document_issued_at,document_expires_at,document_country,is_primary,review_status,review_notes,created_at"
          )
          .in("verification_request_id", requestIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    requestIds.length
      ? supabase
          .from("vendor_verification_events")
          .select(
            "id,verification_request_id,event_type,from_status,to_status,notes,metadata_json,created_at,actor:profiles!vendor_verification_events_actor_user_id_fkey(id,full_name,email)"
          )
          .in("verification_request_id", requestIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (documentsResult.error || eventsResult.error) {
    return {
      error:
        documentsResult.error?.message ||
        eventsResult.error?.message ||
        "Unable to load verification review data.",
    } as const;
  }

  const documentsByRequest = new Map<string, Array<Record<string, unknown>>>();
  for (const row of documentsResult.data ?? []) {
    const requestId = String(row.verification_request_id ?? "");
    const bucket = documentsByRequest.get(requestId) ?? [];
    bucket.push(row as Record<string, unknown>);
    documentsByRequest.set(requestId, bucket);
  }

  const eventsByRequest = new Map<string, Array<Record<string, unknown>>>();
  for (const row of eventsResult.data ?? []) {
    const requestId = String(row.verification_request_id ?? "");
    const bucket = eventsByRequest.get(requestId) ?? [];
    bucket.push(row as Record<string, unknown>);
    eventsByRequest.set(requestId, bucket);
  }

  return {
    items: (requests ?? []).map((item) => {
      const vendorRaw = Array.isArray(item.vendor) ? item.vendor[0] : item.vendor;
      const requesterRaw = Array.isArray(item.requester) ? item.requester[0] : item.requester;
      const reviewerRaw = Array.isArray(item.reviewer) ? item.reviewer[0] : item.reviewer;
      const requestId = String(item.id ?? "");
      return {
        id: requestId,
        status: String(item.status ?? "pending"),
        notes: (item.notes as string | null) ?? null,
        review_notes: (item.review_notes as string | null) ?? null,
        included_in_plan: Boolean(item.included_in_plan),
        requested_at: (item.requested_at as string | null) ?? null,
        reviewed_at: (item.reviewed_at as string | null) ?? null,
        request_type: (item.request_type as string | null) ?? "initial",
        business_name_submitted: (item.business_name_submitted as string | null) ?? null,
        license_number: (item.license_number as string | null) ?? null,
        company_registration_number: (item.company_registration_number as string | null) ?? null,
        tax_id: (item.tax_id as string | null) ?? null,
        office_address: (item.office_address as string | null) ?? null,
        contact_person_name: (item.contact_person_name as string | null) ?? null,
        contact_person_role: (item.contact_person_role as string | null) ?? null,
        contact_person_phone: (item.contact_person_phone as string | null) ?? null,
        contact_person_email: (item.contact_person_email as string | null) ?? null,
        decision_reason_code: (item.decision_reason_code as string | null) ?? null,
        checklist_json: (item.checklist_json as Record<string, unknown> | null) ?? {},
        vendor: {
          id: vendorRaw?.id ? String(vendorRaw.id) : "",
          name: vendorRaw?.name ? String(vendorRaw.name) : "Unknown vendor",
          plan: (vendorRaw?.plan as string | null) ?? null,
          verification_status: (vendorRaw?.verification_status as string | null) ?? null,
          slug: (vendorRaw?.slug as string | null) ?? null,
          verified_at: (vendorRaw?.verified_at as string | null) ?? null,
          verification_expires_at: (vendorRaw?.verification_expires_at as string | null) ?? null,
          verification_level: (vendorRaw?.verification_level as string | null) ?? null,
          verification_score: (vendorRaw?.verification_score as number | null) ?? null,
          verification_rejection_reason_code:
            (vendorRaw?.verification_rejection_reason_code as string | null) ?? null,
          verification_rank_bonus: (vendorRaw?.verification_rank_bonus as number | null) ?? 0,
        },
        requester: requesterRaw
          ? {
              id: String(requesterRaw.id ?? ""),
              full_name: (requesterRaw.full_name as string | null) ?? null,
              email: (requesterRaw.email as string | null) ?? null,
            }
          : null,
        reviewer: reviewerRaw
          ? {
              id: String(reviewerRaw.id ?? ""),
              full_name: (reviewerRaw.full_name as string | null) ?? null,
              email: (reviewerRaw.email as string | null) ?? null,
            }
          : null,
        documents: (documentsByRequest.get(requestId) ?? []).map((row) => ({
          id: String(row.id ?? ""),
          document_type: String(row.document_type ?? ""),
          document_name: String(row.document_name ?? ""),
          document_url: String(row.document_url ?? ""),
          document_side: (row.document_side as string | null) ?? null,
          mime_type: (row.mime_type as string | null) ?? null,
          file_size_bytes: (row.file_size_bytes as number | null) ?? null,
          storage_path: (row.storage_path as string | null) ?? null,
          document_number: (row.document_number as string | null) ?? null,
          document_issued_at: (row.document_issued_at as string | null) ?? null,
          document_expires_at: (row.document_expires_at as string | null) ?? null,
          document_country: (row.document_country as string | null) ?? null,
          is_primary: Boolean(row.is_primary),
          review_status: (row.review_status as string | null) ?? "pending",
          review_notes: (row.review_notes as string | null) ?? null,
          created_at: (row.created_at as string | null) ?? null,
        })),
        properties: [],
        events: (eventsByRequest.get(requestId) ?? []).map((row) => {
          const actorRaw = Array.isArray(row.actor) ? row.actor[0] : row.actor;
          return {
            id: String(row.id ?? ""),
            event_type: String(row.event_type ?? ""),
            from_status: (row.from_status as string | null) ?? null,
            to_status: (row.to_status as string | null) ?? null,
            notes: (row.notes as string | null) ?? null,
            metadata_json: (row.metadata_json as Record<string, unknown> | null) ?? {},
            created_at: (row.created_at as string | null) ?? null,
            actor_name:
              (actorRaw?.full_name as string | null) ?? (actorRaw?.email as string | null) ?? "System reviewer",
          };
        }),
      };
    }),
  } as const;
}

export async function GET(request: Request) {
  const result = await getAdminRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { searchParams } = new URL(request.url);
  const status = toOptionalString(searchParams.get("status"));
  const payload = await loadAdminVerificationItems(result.context.supabase, status);
  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 500 });
  }
  return NextResponse.json(payload);
}

export async function PATCH(request: Request) {
  const result = await getAdminRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const requestId = toOptionalString(body.request_id);
  const status = toOptionalString(body.status);
  const reviewNotes = toOptionalString(body.review_notes);
  const decisionReasonCode = toOptionalString(body.decision_reason_code);
  const verificationLevel = toOptionalString(body.verification_level);
  const verificationScore = toOptionalInteger(body.verification_score);
  const verificationRankBonus = toOptionalInteger(body.verification_rank_bonus);
  const verificationExpiresAt = toOptionalIsoDate(body.verification_expires_at);
  const checklistJson =
    body.checklist_json && typeof body.checklist_json === "object" && !Array.isArray(body.checklist_json)
      ? (body.checklist_json as Record<string, unknown>)
      : {};

  if (!requestId) {
    return NextResponse.json({ error: "Verification request id is required." }, { status: 400 });
  }

  if (!status || !["approved", "rejected", "changes_requested"].includes(status)) {
    return NextResponse.json({ error: "Invalid review status." }, { status: 400 });
  }

  const { data: requestRow, error: requestError } = await result.context.supabase
    .from("vendor_verification_requests")
    .select("id,vendor_id,status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !requestRow?.id || !requestRow.vendor_id) {
    return NextResponse.json({ error: requestError?.message ?? "Verification request not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const vendorVerificationStatus = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";
  const previousStatus = String(requestRow.status ?? "pending");

  const { error: updateRequestError } = await result.context.supabase
    .from("vendor_verification_requests")
    .update({
      status,
      review_notes: reviewNotes,
      reviewed_at: now,
      reviewed_by_user_id: result.context.user.id,
      updated_at: now,
      decision_reason_code: decisionReasonCode,
      checklist_json: checklistJson,
    })
    .eq("id", requestId);

  if (updateRequestError) {
    return NextResponse.json({ error: updateRequestError.message }, { status: 500 });
  }

  await result.context.supabase
    .from("vendors")
    .update({
      verification_status: vendorVerificationStatus,
      verified_at: status === "approved" ? now : null,
      verification_notes: reviewNotes,
      verification_rejection_reason_code: status === "approved" ? null : decisionReasonCode,
      verification_last_reviewed_by: result.context.user.id,
      verification_last_reviewed_at: now,
      verification_level: status === "approved" ? verificationLevel : null,
      verification_score: status === "approved" ? verificationScore : null,
      verification_rank_bonus: status === "approved" ? verificationRankBonus ?? 0 : 0,
      verification_expires_at: status === "approved" ? verificationExpiresAt : null,
    })
    .eq("id", requestRow.vendor_id);

  await result.context.supabase
    .from("vendor_verification_documents")
    .update({
      review_status: status === "approved" ? "accepted" : status === "rejected" ? "rejected" : "pending",
      review_notes: reviewNotes,
    })
    .eq("verification_request_id", requestId);

  await result.context.supabase.from("vendor_verification_events").insert({
    verification_request_id: requestId,
    actor_user_id: result.context.user.id,
    event_type: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "changes_requested",
    from_status: previousStatus,
    to_status: status,
    notes: reviewNotes,
    metadata_json: {
      decision_reason_code: decisionReasonCode,
      verification_level: verificationLevel,
      verification_score: verificationScore,
      verification_rank_bonus: verificationRankBonus,
      verification_expires_at: verificationExpiresAt,
      checklist_json: checklistJson,
    },
  });

  const { searchParams } = new URL(request.url);
  const statusFilter = toOptionalString(searchParams.get("status"));
  const payload = await loadAdminVerificationItems(result.context.supabase, statusFilter);
  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 500 });
  }
  return NextResponse.json(payload);
}
