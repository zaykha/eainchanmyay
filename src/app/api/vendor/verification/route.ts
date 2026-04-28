import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { getVendorPlan } from "@/lib/vendor-plans";

type VerificationDocumentInput = {
  document_type?: string;
  document_name?: string;
  document_url?: string;
};

function toOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeDocuments(value: unknown) {
  if (!Array.isArray(value)) return [] as Array<{ document_type: string; document_name: string; document_url: string }>;
  return value
    .map((item) => item as VerificationDocumentInput)
    .map((item) => ({
      document_type: toOptionalString(item.document_type),
      document_name: toOptionalString(item.document_name),
      document_url: toOptionalString(item.document_url),
    }))
    .filter(
      (item): item is { document_type: string; document_name: string; document_url: string } =>
        Boolean(item.document_type && item.document_name && item.document_url)
    );
}

function normalizePropertyIds(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value.map((item) => String(item ?? "")).filter(Boolean);
}

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request, { allowPendingBilling: true });
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, memberIds } = result.context;
  const currentPlan = getVendorPlan(vendor.plan);

  const { data: requestRows, error: requestError } = await supabase
    .from("vendor_verification_requests")
    .select("id,status,notes,review_notes,included_in_plan,requested_at,reviewed_at")
    .eq("vendor_id", vendor.id)
    .order("requested_at", { ascending: false })
    .limit(1);

  if (requestError) {
    return NextResponse.json({ error: requestError.message }, { status: 500 });
  }

  const latestRequest = requestRows?.[0];

  const requestId = latestRequest?.id ? String(latestRequest.id) : null;
  const [documentsResult, propertiesResult, publishedPropertiesResult] = await Promise.all([
    requestId
      ? supabase
          .from("vendor_verification_documents")
          .select("id,document_type,document_name,document_url,created_at")
          .eq("verification_request_id", requestId)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    requestId
      ? supabase
          .from("vendor_verification_request_properties")
          .select("property_id,property:properties(id,title,status,verification_status)")
          .eq("verification_request_id", requestId)
      : Promise.resolve({ data: [], error: null }),
    memberIds.length
      ? supabase
          .from("properties")
          .select("id,title,status,verification_status")
          .in("created_by", memberIds)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (documentsResult.error || propertiesResult.error || publishedPropertiesResult.error) {
    return NextResponse.json(
      {
        error:
          documentsResult.error?.message ||
          propertiesResult.error?.message ||
          publishedPropertiesResult.error?.message ||
          "Unable to load verification data.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    vendor: {
      id: vendor.id,
      name: vendor.name,
      plan: vendor.plan,
      verification_status: vendor.verified_status ?? "not_requested",
    },
    verification: {
      includedInPlan: currentPlan.includedVerification,
      latestRequest: latestRequest
        ? {
            id: String(latestRequest.id),
            status: String(latestRequest.status ?? "pending"),
            notes: (latestRequest.notes as string | null) ?? null,
            review_notes: (latestRequest.review_notes as string | null) ?? null,
            included_in_plan: Boolean(latestRequest.included_in_plan),
            requested_at: (latestRequest.requested_at as string | null) ?? null,
            reviewed_at: (latestRequest.reviewed_at as string | null) ?? null,
          }
        : null,
      documents: (documentsResult.data ?? []).map((item) => ({
        id: String(item.id ?? ""),
        document_type: String(item.document_type ?? ""),
        document_name: String(item.document_name ?? ""),
        document_url: String(item.document_url ?? ""),
        created_at: (item.created_at as string | null) ?? null,
      })),
      properties: (propertiesResult.data ?? []).map((item) => {
        const propertyRaw = Array.isArray(item.property) ? item.property[0] : item.property;
        return {
          property_id: String(item.property_id ?? ""),
          title: propertyRaw?.title ? String(propertyRaw.title) : "Untitled property",
          status: (propertyRaw?.status as string | null) ?? null,
          verification_status: (propertyRaw?.verification_status as string | null) ?? null,
        };
      }),
    },
    availableProperties: (publishedPropertiesResult.data ?? []).map((item) => ({
      id: String(item.id ?? ""),
      title: item.title ? String(item.title) : "Untitled property",
      status: (item.status as string | null) ?? null,
      verification_status: (item.verification_status as string | null) ?? "not_requested",
    })),
  });
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request, { allowPendingBilling: true });
  if (!result.ok) {
    return result.response;
  }

  if (!["owner", "admin"].includes(result.context.membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can request verification." }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const notes = toOptionalString(body.notes);
  const documents = normalizeDocuments(body.documents);
  const propertyIds = normalizePropertyIds(body.property_ids);

  if (!documents.length) {
    return NextResponse.json({ error: "At least one verification document is required." }, { status: 400 });
  }

  if (!propertyIds.length) {
    return NextResponse.json({ error: "Select at least one property for verification review." }, { status: 400 });
  }

  const { supabase, vendor, user, memberIds } = result.context;
  const currentPlan = getVendorPlan(vendor.plan);

  const { data: scopedProperties, error: scopedPropertiesError } = await supabase
    .from("properties")
    .select("id")
    .in("created_by", memberIds)
    .in("id", propertyIds)
    .eq("is_deleted", false);

  if (scopedPropertiesError) {
    return NextResponse.json({ error: scopedPropertiesError.message }, { status: 500 });
  }

  const scopedPropertyIds = (scopedProperties ?? []).map((item) => String(item.id ?? "")).filter(Boolean);
  if (!scopedPropertyIds.length || scopedPropertyIds.length !== new Set(propertyIds).size) {
    return NextResponse.json({ error: "One or more selected properties are outside this workspace." }, { status: 400 });
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("vendor_verification_requests")
    .select("id,status")
    .eq("vendor_id", vendor.id)
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
    .limit(1);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingRequest = existingRows?.[0];
  let requestId = existingRequest?.id ? String(existingRequest.id) : null;
  let previousPropertyIds: string[] = [];
  const requestPayload = {
    notes,
    included_in_plan: currentPlan.includedVerification,
    requested_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "pending",
    review_notes: null,
    reviewed_at: null,
    reviewed_by_user_id: null,
  };

  if (requestId) {
    const { data: existingRequestProperties } = await supabase
      .from("vendor_verification_request_properties")
      .select("property_id")
      .eq("verification_request_id", requestId);

    previousPropertyIds = (existingRequestProperties ?? [])
      .map((item) => String(item.property_id ?? ""))
      .filter(Boolean);

    const { error: updateError } = await supabase
      .from("vendor_verification_requests")
      .update(requestPayload)
      .eq("id", requestId);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.from("vendor_verification_documents").delete().eq("verification_request_id", requestId);
    await supabase.from("vendor_verification_request_properties").delete().eq("verification_request_id", requestId);
  } else {
    const { data: createdRequest, error: createError } = await supabase
      .from("vendor_verification_requests")
      .insert({
        vendor_id: vendor.id,
        requested_by_user_id: user.id,
        ...requestPayload,
      })
      .select("id")
      .maybeSingle();

    if (createError || !createdRequest?.id) {
      return NextResponse.json({ error: createError?.message ?? "Unable to create verification request." }, { status: 500 });
    }
    requestId = String(createdRequest.id);
  }

  const { error: documentsError } = await supabase.from("vendor_verification_documents").insert(
    documents.map((item) => ({
      verification_request_id: requestId,
      vendor_id: vendor.id,
      document_type: item.document_type,
      document_name: item.document_name,
      document_url: item.document_url,
    }))
  );

  if (documentsError) {
    return NextResponse.json({ error: documentsError.message }, { status: 500 });
  }

  const { error: propertiesError } = await supabase.from("vendor_verification_request_properties").insert(
    scopedPropertyIds.map((propertyId) => ({
      verification_request_id: requestId,
      property_id: propertyId,
    }))
  );

  if (propertiesError) {
    return NextResponse.json({ error: propertiesError.message }, { status: 500 });
  }

  await supabase
    .from("vendors")
    .update({
      verification_status: "pending",
      verification_requested_at: new Date().toISOString(),
      verification_notes: notes,
    })
    .eq("id", vendor.id);

  await supabase
    .from("properties")
    .update({
      verification_status: "pending",
      verification_notes: notes,
    })
    .in("id", scopedPropertyIds);

  const removedPropertyIds = previousPropertyIds.filter((item) => !scopedPropertyIds.includes(item));
  if (removedPropertyIds.length) {
    await supabase
      .from("properties")
      .update({
        verification_status: "not_requested",
        verification_notes: null,
      })
      .in("id", removedPropertyIds)
      .eq("verification_status", "pending");
  }

  return GET(request);
}
