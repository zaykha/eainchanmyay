import { NextResponse } from "next/server";
import { getAdminRequestContext } from "@/app/api/admin/_lib/context";

function toOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizePropertyIds(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => String(item ?? "")).filter(Boolean);
}

export async function GET(request: Request) {
  const result = await getAdminRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { searchParams } = new URL(request.url);
  const status = toOptionalString(searchParams.get("status"));

  let query = result.context.supabase
    .from("vendor_verification_requests")
    .select(
      "id,vendor_id,status,notes,review_notes,included_in_plan,requested_at,reviewed_at,vendor:vendors(id,name,plan,verification_status,slug),requester:profiles!vendor_verification_requests_requested_by_user_id_fkey(id,full_name,email),reviewer:profiles!vendor_verification_requests_reviewed_by_user_id_fkey(id,full_name,email)"
    )
    .order("requested_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: requests, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const requestIds = (requests ?? []).map((item) => String(item.id ?? "")).filter(Boolean);
  const [documentsResult, propertiesResult] = await Promise.all([
    requestIds.length
      ? result.context.supabase
          .from("vendor_verification_documents")
          .select("id,verification_request_id,document_type,document_name,document_url,created_at")
          .in("verification_request_id", requestIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    requestIds.length
      ? result.context.supabase
          .from("vendor_verification_request_properties")
          .select("verification_request_id,property_id,property:properties(id,title,status,verification_status)")
          .in("verification_request_id", requestIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (documentsResult.error || propertiesResult.error) {
    return NextResponse.json(
      { error: documentsResult.error?.message || propertiesResult.error?.message || "Unable to load verification review data." },
      { status: 500 }
    );
  }

  const documentsByRequest = new Map<string, Array<Record<string, unknown>>>();
  for (const row of documentsResult.data ?? []) {
    const requestId = String(row.verification_request_id ?? "");
    const bucket = documentsByRequest.get(requestId) ?? [];
    bucket.push(row as Record<string, unknown>);
    documentsByRequest.set(requestId, bucket);
  }

  const propertiesByRequest = new Map<string, Array<Record<string, unknown>>>();
  for (const row of propertiesResult.data ?? []) {
    const requestId = String(row.verification_request_id ?? "");
    const bucket = propertiesByRequest.get(requestId) ?? [];
    bucket.push(row as Record<string, unknown>);
    propertiesByRequest.set(requestId, bucket);
  }

  return NextResponse.json({
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
        vendor: {
          id: vendorRaw?.id ? String(vendorRaw.id) : "",
          name: vendorRaw?.name ? String(vendorRaw.name) : "Unknown vendor",
          plan: (vendorRaw?.plan as string | null) ?? null,
          verification_status: (vendorRaw?.verification_status as string | null) ?? null,
          slug: (vendorRaw?.slug as string | null) ?? null,
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
          created_at: (row.created_at as string | null) ?? null,
        })),
        properties: (propertiesByRequest.get(requestId) ?? []).map((row) => {
          const propertyRaw = Array.isArray(row.property) ? row.property[0] : row.property;
          return {
            property_id: String(row.property_id ?? ""),
            title: propertyRaw?.title ? String(propertyRaw.title) : "Untitled property",
            status: (propertyRaw?.status as string | null) ?? null,
            verification_status: (propertyRaw?.verification_status as string | null) ?? null,
          };
        }),
      };
    }),
  });
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
  const verifiedPropertyIds = normalizePropertyIds(body.verified_property_ids);

  if (!requestId) {
    return NextResponse.json({ error: "Verification request id is required." }, { status: 400 });
  }

  if (!status || !["approved", "rejected", "changes_requested"].includes(status)) {
    return NextResponse.json({ error: "Invalid review status." }, { status: 400 });
  }

  const { data: requestRow, error: requestError } = await result.context.supabase
    .from("vendor_verification_requests")
    .select("id,vendor_id")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !requestRow?.id || !requestRow.vendor_id) {
    return NextResponse.json({ error: requestError?.message ?? "Verification request not found." }, { status: 404 });
  }

  const { data: requestProperties, error: requestPropertiesError } = await result.context.supabase
    .from("vendor_verification_request_properties")
    .select("property_id")
    .eq("verification_request_id", requestId);

  if (requestPropertiesError) {
    return NextResponse.json({ error: requestPropertiesError.message }, { status: 500 });
  }

  const requestedPropertyIds = (requestProperties ?? []).map((item) => String(item.property_id ?? "")).filter(Boolean);
  const approvedPropertyIds =
    status === "approved"
      ? (verifiedPropertyIds.length ? verifiedPropertyIds : requestedPropertyIds).filter((item) => requestedPropertyIds.includes(item))
      : [];

  const now = new Date().toISOString();
  const vendorVerificationStatus = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";

  const { error: updateRequestError } = await result.context.supabase
    .from("vendor_verification_requests")
    .update({
      status,
      review_notes: reviewNotes,
      reviewed_at: now,
      reviewed_by_user_id: result.context.user.id,
      updated_at: now,
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
    })
    .eq("id", requestRow.vendor_id);

  if (requestedPropertyIds.length) {
    if (status === "approved") {
      const rejectedPropertyIds = requestedPropertyIds.filter((item) => !approvedPropertyIds.includes(item));

      if (approvedPropertyIds.length) {
        await result.context.supabase
          .from("properties")
          .update({
            verification_status: "approved",
            verified_at: now,
            verification_notes: reviewNotes,
          })
          .in("id", approvedPropertyIds);
      }

      if (rejectedPropertyIds.length) {
        await result.context.supabase
          .from("properties")
          .update({
            verification_status: "rejected",
            verified_at: null,
            verification_notes: reviewNotes,
          })
          .in("id", rejectedPropertyIds);
      }
    } else if (status === "rejected") {
      await result.context.supabase
        .from("properties")
        .update({
          verification_status: "rejected",
          verified_at: null,
          verification_notes: reviewNotes,
        })
        .in("id", requestedPropertyIds);
    } else {
      await result.context.supabase
        .from("properties")
        .update({
          verification_status: "pending",
          verification_notes: reviewNotes,
        })
        .in("id", requestedPropertyIds);
    }
  }

  return GET(request);
}
