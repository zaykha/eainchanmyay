import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { deletePropertyImages } from "@/app/api/_lib/property-image-upload";
import { resolveListingImage } from "@/app/living-site/lib/images";
import { normalizeListingStatus } from "@/lib/lifecycle";
import {
  isLegacyPropertiesStatusConstraintError,
  isMissingPropertyLifecycleColumnError,
  stripUnsupportedPropertyLifecycleFields,
} from "@/lib/property-lifecycle-persistence";

type PropertyRow = {
  id: string;
  title: string | null;
  description: string | null;
  deal_type: string | null;
  property_type: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  state_region: string | null;
  district: string | null;
  township: string | null;
  address_text: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  has_lift: boolean | null;
  has_backup_power: boolean | null;
  backup_power_type: string | null;
  has_parking: boolean | null;
  latitude: number | null;
  longitude: number | null;
  verification_status: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type AppointmentRow = {
  id: string;
  title: string | null;
  start_at: string | null;
  status: string | null;
  client_name: string | null;
  assigned_staff_id: string | null;
};

type PropertyImageRow = {
  id: string;
  property_id: string | null;
  public_url: string | null;
  r2_key: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

type PropertyUpdatePayload = {
  title?: string | null;
  description?: string | null;
  deal_type?: string | null;
  property_type?: string | null;
  price?: number | null;
  currency?: string | null;
  status?: string | null;
  state_region?: string | null;
  district?: string | null;
  township?: string | null;
  address_text?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
  has_lift?: boolean | null;
  has_backup_power?: boolean | null;
  backup_power_type?: string | null;
  has_parking?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  rejection_reason?: string | null;
};

export async function GET(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) return result.response;

  const { propertyId } = await params;
  const { supabase, memberIds } = result.context;

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id,title,description,deal_type,property_type,price,currency,status,state_region,district,township,address_text,bedrooms,bathrooms,area_sqft,has_lift,has_backup_power,backup_power_type,has_parking,latitude,longitude,verification_status,created_by,created_at,updated_at")
    .eq("id", propertyId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (propertyError) {
    return NextResponse.json({ error: propertyError.message }, { status: 500 });
  }

  const row = property as PropertyRow | null;
  if (!row || !row.created_by || !memberIds.includes(row.created_by)) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const [{ data: appointments, error: appointmentsError }, { data: propertyImages, error: propertyImagesError }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id,title,start_at,status,client_name,assigned_staff_id")
        .eq("property_id", propertyId)
        .order("start_at", { ascending: true }),
      supabase
        .from("property_images")
        .select("id,property_id,public_url,r2_key,is_cover,sort_order")
        .eq("property_id", propertyId)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true }),
    ]);

  if (appointmentsError || propertyImagesError) {
    return NextResponse.json(
      { error: appointmentsError?.message || propertyImagesError?.message || "Unable to load property detail." },
      { status: 500 }
    );
  }

  const assignedStaffIds = Array.from(
    new Set(
      ((appointments ?? []) as AppointmentRow[])
        .map((appointment) => appointment.assigned_staff_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  let staffProfiles: Array<{ id: string | null; full_name: string | null; email: string | null }> = [];
  if (assignedStaffIds.length) {
    const { data, error } = await supabase.from("profiles").select("id,full_name,email").in("id", assignedStaffIds);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    staffProfiles = data ?? [];
  }

  const profileMap = new Map(
    staffProfiles.map((profile) => [
      String(profile.id ?? ""),
      {
        full_name: profile.full_name ?? null,
        email: profile.email ?? null,
      },
    ])
  );

  const appointmentRows = (appointments ?? []) as AppointmentRow[];
  const staffSummaryMap = new Map<string, { id: string; name: string; assigned_count: number }>();

  for (const appointment of appointmentRows) {
    const assignedId = String(appointment.assigned_staff_id ?? "");
    if (!assignedId) continue;
    const existing = staffSummaryMap.get(assignedId);
    const profile = profileMap.get(assignedId);
    if (existing) {
      existing.assigned_count += 1;
      continue;
    }
    staffSummaryMap.set(assignedId, {
      id: assignedId,
      name: profile?.full_name || profile?.email || "Assigned staff",
      assigned_count: 1,
    });
  }

  return NextResponse.json({
    property: {
      ...row,
      city: row.district ?? null,
      status: normalizeListingStatus(row.status) ?? row.status,
      appointments_count: appointmentRows.length,
      cover_image_url: resolveListingImage(
        row as unknown as Record<string, unknown>,
        ((propertyImages ?? []) as PropertyImageRow[]) as unknown as Record<string, unknown>[]
      ),
    },
    images: ((propertyImages ?? []) as PropertyImageRow[]).map((image) => ({
      id: image.id,
      resolved_url: image.public_url ?? resolveListingImage(
        { primary_image_url: image.public_url, primary_r2_key: image.r2_key } as unknown as Record<string, unknown>,
        [image] as unknown as Record<string, unknown>[]
      ),
    })),
    appointments: appointmentRows.map((appointment) => {
      const assignedId = String(appointment.assigned_staff_id ?? "");
      const profile = assignedId ? profileMap.get(assignedId) : null;
      return {
        id: appointment.id,
        title: appointment.title,
        start_at: appointment.start_at,
        status: appointment.status,
        client_name: appointment.client_name,
        assigned_staff_id: appointment.assigned_staff_id,
        assigned_staff_name: profile?.full_name || profile?.email || null,
      };
    }),
    staff_summary: Array.from(staffSummaryMap.values()),
    unassigned_count: appointmentRows.filter((appointment) => !appointment.assigned_staff_id).length,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) return result.response;

  const { propertyId } = await params;
  const { supabase, memberIds } = result.context;
  const body = (await request.json().catch(() => null)) as PropertyUpdatePayload | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { data: existingProperty, error: existingError } = await supabase
    .from("properties")
    .select("id,created_by,status")
    .eq("id", propertyId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const createdBy = String(existingProperty?.created_by ?? "");
  if (!existingProperty?.id || !createdBy || !memberIds.includes(createdBy)) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const currentStatus = normalizeListingStatus(existingProperty.status) ?? "draft";
  const nextStatus = body.status ? normalizeListingStatus(body.status) : null;

  if (body.status && !nextStatus) {
    return NextResponse.json(
      { error: "Invalid listing status." },
      { status: 400 }
    );
  }

  const updatePayload: Record<string, unknown> = { updated_at: now };
  const updatableFields: Array<keyof PropertyUpdatePayload> = [
    "title",
    "description",
    "deal_type",
    "property_type",
    "price",
    "currency",
    "state_region",
    "district",
    "township",
    "address_text",
    "bedrooms",
    "bathrooms",
    "area_sqft",
    "has_lift",
    "has_backup_power",
    "backup_power_type",
    "has_parking",
    "latitude",
    "longitude",
  ];

  for (const field of updatableFields) {
    if (field in body) {
      updatePayload[field] = body[field] ?? null;
    }
  }

  if (nextStatus) {
    updatePayload.status = nextStatus;
    if (nextStatus === "active" && currentStatus !== "active") updatePayload.published_at = now;
    if (nextStatus === "reserved" && currentStatus !== "reserved") updatePayload.reserved_at = now;
    if ((nextStatus === "sold" || nextStatus === "rented") && currentStatus !== nextStatus) updatePayload.closed_at = now;
    if (nextStatus === "archived" && currentStatus !== "archived") updatePayload.archived_at = now;
    if (nextStatus === "rejected") {
      updatePayload.rejection_reason = body.rejection_reason ?? null;
    } else if (currentStatus === "rejected") {
      updatePayload.rejection_reason = null;
    }
  }

  let propertyUpdate = await supabase
    .from("properties")
    .update(updatePayload)
    .eq("id", propertyId)
    .eq("is_deleted", false);

  if (isMissingPropertyLifecycleColumnError(propertyUpdate.error)) {
    const fallback = stripUnsupportedPropertyLifecycleFields(updatePayload);
    propertyUpdate = await supabase
      .from("properties")
      .update(fallback.payload)
      .eq("id", propertyId)
      .eq("is_deleted", false);
  }

  if (isLegacyPropertiesStatusConstraintError(propertyUpdate.error) && nextStatus === "active") {
    const legacyPayload = stripUnsupportedPropertyLifecycleFields({
      ...updatePayload,
      status: "published",
    }).payload;
    propertyUpdate = await supabase
      .from("properties")
      .update(legacyPayload)
      .eq("id", propertyId)
      .eq("is_deleted", false);
  }

  const { error: updateError } = propertyUpdate;

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) return result.response;

  const { propertyId } = await params;
  const { supabase, memberIds } = result.context;

  const { data: existingProperty, error: existingError } = await supabase
    .from("properties")
    .select("id,created_by")
    .eq("id", propertyId)
    .eq("is_deleted", false)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const createdBy = String(existingProperty?.created_by ?? "");
  if (!existingProperty?.id || !createdBy || !memberIds.includes(createdBy)) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const { data: propertyImages, error: propertyImagesError } = await supabase
    .from("property_images")
    .select("r2_key")
    .eq("property_id", propertyId);

  if (propertyImagesError) {
    return NextResponse.json({ error: propertyImagesError.message }, { status: 500 });
  }

  const storagePaths = (propertyImages ?? [])
    .map((row) => String(row.r2_key ?? "").trim())
    .filter(Boolean);

  await deletePropertyImages({
    supabase,
    storagePaths,
  });

  const { error: imageDeleteError } = await supabase.from("property_images").delete().eq("property_id", propertyId);

  if (imageDeleteError) {
    return NextResponse.json({ error: imageDeleteError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("properties")
    .delete()
    .eq("id", propertyId)
    .eq("is_deleted", false);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
