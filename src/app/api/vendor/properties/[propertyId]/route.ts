import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { resolveListingImage } from "@/app/living-site/lib/images";

type PropertyRow = {
  id: string;
  title: string | null;
  deal_type: string | null;
  property_type: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  district: string | null;
  township: string | null;
  city: string | null;
  verification_status: string | null;
  created_by: string | null;
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
  property_id: string | null;
  public_url: string | null;
  r2_key: string | null;
  is_cover: boolean | null;
  sort_order: number | null;
};

export async function GET(request: Request, { params }: { params: Promise<{ propertyId: string }> }) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) return result.response;

  const { propertyId } = await params;
  const { supabase, memberIds } = result.context;

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id,title,deal_type,property_type,price,currency,status,district,township,city,verification_status,created_by")
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
        .select("property_id,public_url,r2_key,is_cover,sort_order")
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
      appointments_count: appointmentRows.length,
      cover_image_url: resolveListingImage(
        row as unknown as Record<string, unknown>,
        ((propertyImages ?? []) as PropertyImageRow[]) as unknown as Record<string, unknown>[]
      ),
    },
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
