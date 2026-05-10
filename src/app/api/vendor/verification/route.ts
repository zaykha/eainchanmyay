import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { getVendorPlan } from "@/lib/vendor-plans";

type VerificationDocumentInput = {
  document_type?: string;
  document_name?: string;
  document_url?: string;
  document_side?: string;
  mime_type?: string;
  file_size_bytes?: number | string | null;
  storage_path?: string;
  document_number?: string;
  document_issued_at?: string;
  document_expires_at?: string;
  document_country?: string;
  is_primary?: boolean;
};

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

function normalizeDocuments(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as Array<{
      document_type: string;
      document_name: string;
      document_url: string;
      document_side: string | null;
      mime_type: string | null;
      file_size_bytes: number | null;
      storage_path: string | null;
      document_number: string | null;
      document_issued_at: string | null;
      document_expires_at: string | null;
      document_country: string | null;
      is_primary: boolean;
    }>;
  }

  return value
    .map((item) => item as VerificationDocumentInput)
    .map((item) => ({
      document_type: toOptionalString(item.document_type),
      document_name: toOptionalString(item.document_name),
      document_url: toOptionalString(item.document_url),
      document_side: toOptionalString(item.document_side),
      mime_type: toOptionalString(item.mime_type),
      file_size_bytes: toOptionalInteger(item.file_size_bytes),
      storage_path: toOptionalString(item.storage_path),
      document_number: toOptionalString(item.document_number),
      document_issued_at: toOptionalIsoDate(item.document_issued_at),
      document_expires_at: toOptionalIsoDate(item.document_expires_at),
      document_country: toOptionalString(item.document_country),
      is_primary: Boolean(item.is_primary),
    }))
    .filter(
      (
        item
      ): item is {
        document_type: string;
        document_name: string;
        document_url: string;
        document_side: string | null;
        mime_type: string | null;
        file_size_bytes: number | null;
        storage_path: string | null;
        document_number: string | null;
        document_issued_at: string | null;
        document_expires_at: string | null;
        document_country: string | null;
        is_primary: boolean;
      } => Boolean(item.document_type && item.document_name && item.document_url)
    );
}

async function loadVerificationPayload(
  supabase: Awaited<ReturnType<typeof getVendorRequestContext>> extends { ok: true; context: infer C }
    ? C["supabase"]
    : never,
  vendor: Awaited<ReturnType<typeof getVendorRequestContext>> extends { ok: true; context: infer C }
    ? C["vendor"]
    : never,
  currentPlan = getVendorPlan(vendor.plan)
) {
  const { data: requestRows, error: requestError } = await supabase
    .from("vendor_verification_requests")
    .select(
      "id,status,notes,review_notes,included_in_plan,requested_at,reviewed_at,request_type,business_name_submitted,license_number,company_registration_number,tax_id,office_address,contact_person_name,contact_person_role,contact_person_phone,contact_person_email,decision_reason_code,checklist_json"
    )
    .eq("vendor_id", vendor.id)
    .order("requested_at", { ascending: false })
    .limit(1);

  if (requestError) {
    return { error: requestError.message } as const;
  }

  const latestRequest = requestRows?.[0];
  const requestId = latestRequest?.id ? String(latestRequest.id) : null;

  const [documentsResult, eventsResult] = await Promise.all([
    requestId
      ? supabase
          .from("vendor_verification_documents")
          .select(
            "id,document_type,document_name,document_url,document_side,mime_type,file_size_bytes,storage_path,document_number,document_issued_at,document_expires_at,document_country,is_primary,review_status,review_notes,created_at"
          )
          .eq("verification_request_id", requestId)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    requestId
      ? supabase
          .from("vendor_verification_events")
          .select(
            "id,event_type,from_status,to_status,notes,metadata_json,created_at,actor:profiles!vendor_verification_events_actor_user_id_fkey(id,full_name,email)"
          )
          .eq("verification_request_id", requestId)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (documentsResult.error || eventsResult.error) {
    return {
      error:
        documentsResult.error?.message ||
        eventsResult.error?.message ||
        "Unable to load verification data.",
    } as const;
  }

  return {
    vendor: {
      id: vendor.id,
      name: vendor.name,
      plan: vendor.plan,
      verification_status: vendor.verified_status ?? "not_requested",
      verified_at: "verified_at" in vendor ? (vendor as Record<string, unknown>).verified_at ?? null : null,
      verification_expires_at:
        "verification_expires_at" in vendor ? (vendor as Record<string, unknown>).verification_expires_at ?? null : null,
      verification_level:
        "verification_level" in vendor ? (vendor as Record<string, unknown>).verification_level ?? null : null,
      verification_score:
        "verification_score" in vendor ? (vendor as Record<string, unknown>).verification_score ?? null : null,
      verification_rejection_reason_code:
        "verification_rejection_reason_code" in vendor
          ? (vendor as Record<string, unknown>).verification_rejection_reason_code ?? null
          : null,
      verification_rank_bonus:
        "verification_rank_bonus" in vendor ? (vendor as Record<string, unknown>).verification_rank_bonus ?? 0 : 0,
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
            request_type: (latestRequest.request_type as string | null) ?? "initial",
            business_name_submitted: (latestRequest.business_name_submitted as string | null) ?? null,
            license_number: (latestRequest.license_number as string | null) ?? null,
            company_registration_number: (latestRequest.company_registration_number as string | null) ?? null,
            tax_id: (latestRequest.tax_id as string | null) ?? null,
            office_address: (latestRequest.office_address as string | null) ?? null,
            contact_person_name: (latestRequest.contact_person_name as string | null) ?? null,
            contact_person_role: (latestRequest.contact_person_role as string | null) ?? null,
            contact_person_phone: (latestRequest.contact_person_phone as string | null) ?? null,
            contact_person_email: (latestRequest.contact_person_email as string | null) ?? null,
            decision_reason_code: (latestRequest.decision_reason_code as string | null) ?? null,
            checklist_json: (latestRequest.checklist_json as Record<string, unknown> | null) ?? {},
          }
        : null,
      documents: (documentsResult.data ?? []).map((item) => ({
        id: String(item.id ?? ""),
        document_type: String(item.document_type ?? ""),
        document_name: String(item.document_name ?? ""),
        document_url: String(item.document_url ?? ""),
        document_side: (item.document_side as string | null) ?? null,
        mime_type: (item.mime_type as string | null) ?? null,
        file_size_bytes: (item.file_size_bytes as number | null) ?? null,
        storage_path: (item.storage_path as string | null) ?? null,
        document_number: (item.document_number as string | null) ?? null,
        document_issued_at: (item.document_issued_at as string | null) ?? null,
        document_expires_at: (item.document_expires_at as string | null) ?? null,
        document_country: (item.document_country as string | null) ?? null,
        is_primary: Boolean(item.is_primary),
        review_status: (item.review_status as string | null) ?? "pending",
        review_notes: (item.review_notes as string | null) ?? null,
        created_at: (item.created_at as string | null) ?? null,
      })),
      properties: [],
      events: (eventsResult.data ?? []).map((item) => {
        const actorRaw = Array.isArray(item.actor) ? item.actor[0] : item.actor;
        return {
          id: String(item.id ?? ""),
          event_type: String(item.event_type ?? ""),
          from_status: (item.from_status as string | null) ?? null,
          to_status: (item.to_status as string | null) ?? null,
          notes: (item.notes as string | null) ?? null,
          metadata_json: (item.metadata_json as Record<string, unknown> | null) ?? {},
          created_at: (item.created_at as string | null) ?? null,
          actor_name:
            (actorRaw?.full_name as string | null) ?? (actorRaw?.email as string | null) ?? "System reviewer",
        };
      }),
    },
    availableProperties: [],
  } as const;
}

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request, { allowPendingBilling: true });
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor } = result.context;
  const currentPlan = getVendorPlan(vendor.plan);
  const payload = await loadVerificationPayload(supabase, vendor, currentPlan);
  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 500 });
  }
  return NextResponse.json(payload);
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
  const requestType = toOptionalString(body.request_type) ?? "initial";
  const businessNameSubmitted = toOptionalString(body.business_name_submitted);
  const licenseNumber = toOptionalString(body.license_number);
  const companyRegistrationNumber = toOptionalString(body.company_registration_number);
  const taxId = toOptionalString(body.tax_id);
  const officeAddress = toOptionalString(body.office_address);
  const contactPersonName = toOptionalString(body.contact_person_name);
  const contactPersonRole = toOptionalString(body.contact_person_role);
  const contactPersonPhone = toOptionalString(body.contact_person_phone);
  const contactPersonEmail = toOptionalString(body.contact_person_email);

  if (!documents.length) {
    return NextResponse.json({ error: "At least one verification document is required." }, { status: 400 });
  }

  if (!businessNameSubmitted || !officeAddress || !contactPersonName || !contactPersonPhone) {
    return NextResponse.json(
      { error: "Business name, office address, contact person name, and contact person phone are required." },
      { status: 400 }
    );
  }

  const { supabase, vendor, user } = result.context;
  const currentPlan = getVendorPlan(vendor.plan);

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
  const now = new Date().toISOString();
  const requestPayload = {
    notes,
    included_in_plan: currentPlan.includedVerification,
    requested_at: now,
    updated_at: now,
    status: "pending",
    review_notes: null,
    reviewed_at: null,
    reviewed_by_user_id: null,
    request_type: requestType,
    business_name_submitted: businessNameSubmitted,
    license_number: licenseNumber,
    company_registration_number: companyRegistrationNumber,
    tax_id: taxId,
    office_address: officeAddress,
    contact_person_name: contactPersonName,
    contact_person_role: contactPersonRole,
    contact_person_phone: contactPersonPhone,
    contact_person_email: contactPersonEmail,
    decision_reason_code: null,
    checklist_json: {},
  };

  if (requestId) {
    const { error: updateError } = await supabase
      .from("vendor_verification_requests")
      .update(requestPayload)
      .eq("id", requestId);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await supabase.from("vendor_verification_documents").delete().eq("verification_request_id", requestId);
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
      document_side: item.document_side,
      mime_type: item.mime_type,
      file_size_bytes: item.file_size_bytes,
      storage_path: item.storage_path,
      document_number: item.document_number,
      document_issued_at: item.document_issued_at,
      document_expires_at: item.document_expires_at,
      document_country: item.document_country,
      is_primary: item.is_primary,
      review_status: "pending",
      review_notes: null,
    }))
  );

  if (documentsError) {
    return NextResponse.json({ error: documentsError.message }, { status: 500 });
  }

  await supabase
    .from("vendors")
    .update({
      verification_status: "pending",
      verification_requested_at: now,
      verification_notes: notes,
      verification_last_reviewed_by: null,
      verification_last_reviewed_at: null,
      verification_rejection_reason_code: null,
    })
    .eq("id", vendor.id);

  await supabase.from("vendor_verification_events").insert({
    verification_request_id: requestId,
    actor_user_id: user.id,
    event_type: existingRequest ? "resubmitted" : "submitted",
    from_status: existingRequest?.status ? String(existingRequest.status) : null,
    to_status: "pending",
    notes,
    metadata_json: {
      request_type: requestType,
      document_count: documents.length,
      business_name_submitted: businessNameSubmitted,
    },
  });

  const payload = await loadVerificationPayload(supabase, vendor, currentPlan);
  if ("error" in payload) {
    return NextResponse.json({ error: payload.error }, { status: 500 });
  }
  return NextResponse.json(payload);
}
