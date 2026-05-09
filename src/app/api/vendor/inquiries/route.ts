import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

const allowedStatuses = new Set(["new", "contacted", "qualified", "closed", "lost"]);
const allowedPipelineStages = new Set(["new_lead", "contacted", "qualified", "negotiating", "won", "lost"]);

function normalizeStatus(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return allowedStatuses.has(normalized) ? normalized : null;
}

function normalizePipelineStage(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return allowedPipelineStages.has(normalized) ? normalized : null;
}

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, membership, user } = result.context;

  const [{ data: leadRows, error: leadError }, { data: memberRows, error: memberError }, { data: templateRows, error: templateError }] = await Promise.all([
    supabase
      .from("vendor_inquiry_leads")
      .select(
        "id,inquiry_id,status,source,routing_score,assigned_member_user_id,pipeline_stage,last_contacted_at,last_activity_at,sla_due_at,created_at,updated_at,deal_type,property_type,state_region,district,township,budget_range,timeline,bedrooms,bathrooms,area_sqft,need_parking,need_lift,need_solar,need_generator,assignee:profiles!vendor_inquiry_leads_assigned_member_user_id_fkey(full_name,email)"
      )
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vendor_members")
      .select("user_id,role,status,profiles:profiles(full_name,email)")
      .eq("vendor_id", vendor.id)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
    supabase
      .from("vendor_message_templates")
      .select("id,title,body,created_at,updated_at")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
  ]);

  if (leadError) {
    return NextResponse.json({ error: leadError.message }, { status: 500 });
  }

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  if (templateError) {
    return NextResponse.json({ error: templateError.message }, { status: 500 });
  }

  const leadIds = (leadRows ?? []).map((row) => String(row.id ?? "")).filter(Boolean);
  const inquiryIds = (leadRows ?? []).map((row) => String(row.inquiry_id ?? "")).filter(Boolean);
  const [{ data: noteRows, error: noteError }, { data: reminderRows, error: reminderError }, { data: readRows, error: readError }] = leadIds.length
    ? await Promise.all([
        supabase
          .from("vendor_lead_notes")
          .select("id,lead_id,body,created_at,author:profiles!vendor_lead_notes_author_user_id_fkey(full_name,email)")
          .in("lead_id", leadIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("vendor_lead_reminders")
          .select("id,lead_id,assigned_user_id,remind_at,status,note,created_at,updated_at,assignee:profiles!vendor_lead_reminders_assigned_user_id_fkey(full_name,email)")
          .in("lead_id", leadIds)
          .order("remind_at", { ascending: true }),
        supabase
          .from("vendor_lead_reads")
          .select("lead_id,last_read_at")
          .eq("user_id", user.id)
          .in("lead_id", leadIds),
      ])
    : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }];

  if (noteError) {
    return NextResponse.json({ error: noteError.message }, { status: 500 });
  }

  if (reminderError) {
    return NextResponse.json({ error: reminderError.message }, { status: 500 });
  }

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const { data: inquiryContactRows, error: inquiryContactError } = inquiryIds.length
    ? await supabase
        .from("inquiries")
        .select("id,user_id,profile:profiles!inquiries_user_id_fkey(phone,full_name,email)")
        .in("id", inquiryIds)
    : { data: [], error: null };

  if (inquiryContactError) {
    return NextResponse.json({ error: inquiryContactError.message }, { status: 500 });
  }

  const assignees = (memberRows ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      user_id: String(row.user_id ?? ""),
      role: String(row.role ?? "agent"),
      full_name: (profile?.full_name as string | null) ?? null,
      email: (profile?.email as string | null) ?? null,
    };
  });

  const notesByLead = (noteRows ?? []).reduce<Record<string, Array<{ id: string; body: string; created_at: string | null; author_name: string | null }>>>(
    (accumulator, row) => {
      const leadId = String(row.lead_id ?? "");
      if (!leadId) return accumulator;
      const author = Array.isArray(row.author) ? row.author[0] : row.author;
      const bucket = accumulator[leadId] ?? [];
      bucket.push({
        id: String(row.id ?? ""),
        body: String(row.body ?? ""),
        created_at: (row.created_at as string | null) ?? null,
        author_name: (author?.full_name as string | null) ?? (author?.email as string | null) ?? null,
      });
      accumulator[leadId] = bucket;
      return accumulator;
    },
    {}
  );

  const remindersByLead = (reminderRows ?? []).reduce<
    Record<
      string,
      Array<{
        id: string;
        assigned_user_id: string | null;
        assigned_name: string | null;
        remind_at: string | null;
        status: string | null;
        note: string | null;
      }>
    >
  >((accumulator, row) => {
    const leadId = String(row.lead_id ?? "");
    if (!leadId) return accumulator;
    const assignee = Array.isArray(row.assignee) ? row.assignee[0] : row.assignee;
    const bucket = accumulator[leadId] ?? [];
    bucket.push({
      id: String(row.id ?? ""),
      assigned_user_id: row.assigned_user_id ? String(row.assigned_user_id) : null,
      assigned_name: (assignee?.full_name as string | null) ?? (assignee?.email as string | null) ?? null,
      remind_at: (row.remind_at as string | null) ?? null,
      status: (row.status as string | null) ?? null,
      note: (row.note as string | null) ?? null,
    });
    accumulator[leadId] = bucket;
    return accumulator;
  }, {});

  const inquiryContactById = (inquiryContactRows ?? []).reduce<
    Record<
      string,
      {
        phone: string | null;
        full_name: string | null;
        email: string | null;
      }
    >
  >((accumulator, row) => {
    const inquiryId = String(row.id ?? "");
    if (!inquiryId) return accumulator;
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    accumulator[inquiryId] = {
      phone: (profile?.phone as string | null) ?? null,
      full_name: (profile?.full_name as string | null) ?? null,
      email: (profile?.email as string | null) ?? null,
    };
    return accumulator;
  }, {});

  const leadReadMap = (readRows ?? []).reduce<Record<string, string | null>>((accumulator, row) => {
    const leadId = String(row.lead_id ?? "");
    if (!leadId) return accumulator;
    accumulator[leadId] = (row.last_read_at as string | null) ?? null;
    return accumulator;
  }, {});

  const items = (leadRows ?? []).flatMap((row) => {
    const assignee = Array.isArray(row.assignee) ? row.assignee[0] : row.assignee;
    const inquiryId = row.inquiry_id ? String(row.inquiry_id) : "";
    const inquiryContact = inquiryContactById[inquiryId];

    return [
      {
        lead_id: String(row.id ?? ""),
        inquiry_id: inquiryId,
        status: String(row.status ?? "new"),
        source: String(row.source ?? "marketplace_routed"),
        routing_score: typeof row.routing_score === "number" ? row.routing_score : null,
        assigned_member_user_id: row.assigned_member_user_id ? String(row.assigned_member_user_id) : null,
        assigned_member_name: (assignee?.full_name as string | null) ?? null,
        pipeline_stage: String(row.pipeline_stage ?? "new_lead"),
        last_contacted_at: (row.last_contacted_at as string | null) ?? null,
        last_activity_at: (row.last_activity_at as string | null) ?? null,
        sla_due_at: (row.sla_due_at as string | null) ?? null,
        deal_type: (row.deal_type as string | null) ?? null,
        property_type: (row.property_type as string | null) ?? null,
        state_region: (row.state_region as string | null) ?? null,
        district: (row.district as string | null) ?? null,
        township: (row.township as string | null) ?? null,
        budget_range: (row.budget_range as string | null) ?? null,
        timeline: (row.timeline as string | null) ?? null,
        bedrooms: (row.bedrooms as number | null) ?? null,
        bathrooms: (row.bathrooms as number | null) ?? null,
        area_sqft: (row.area_sqft as number | null) ?? null,
        need_parking: (row.need_parking as boolean | null) ?? null,
        need_lift: (row.need_lift as boolean | null) ?? null,
        need_solar: (row.need_solar as boolean | null) ?? null,
        need_generator: (row.need_generator as boolean | null) ?? null,
        contact_number: inquiryContact?.phone ?? null,
        created_at: (row.created_at as string | null) ?? null,
        is_unread: (() => {
          const lastActivityAt = (row.last_activity_at as string | null) ?? (row.created_at as string | null) ?? null;
          const lastReadAt = leadReadMap[String(row.id ?? "")] ?? null;
          if (!lastActivityAt) return false;
          if (!lastReadAt) return true;
          return new Date(lastActivityAt).getTime() > new Date(lastReadAt).getTime();
        })(),
        notes: notesByLead[String(row.id ?? "")] ?? [],
        reminders: remindersByLead[String(row.id ?? "")] ?? [],
      },
    ];
  });

  return NextResponse.json({
    items,
    assignees,
    membershipRole: membership.role,
    templates: (templateRows ?? []).map((row) => ({
      id: String(row.id ?? ""),
      title: String(row.title ?? ""),
      body: String(row.body ?? ""),
      created_at: (row.created_at as string | null) ?? null,
      updated_at: (row.updated_at as string | null) ?? null,
    })),
  });
}

export async function PATCH(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, membership } = result.context;
  let body: {
    lead_id?: string;
    status?: string;
    pipeline_stage?: string;
    assigned_member_user_id?: string | null;
  } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const leadId = body.lead_id?.trim();
  const status = body.status ? normalizeStatus(body.status) : null;
  const pipelineStage = body.pipeline_stage ? normalizePipelineStage(body.pipeline_stage) : null;
  const assigneeId =
    typeof body.assigned_member_user_id === "string"
      ? body.assigned_member_user_id.trim()
      : body.assigned_member_user_id ?? null;

  if (!leadId) {
    return NextResponse.json({ error: "Lead id is required." }, { status: 400 });
  }

  const { data: existingLead, error: existingLeadError } = await supabase
    .from("vendor_inquiry_leads")
    .select("id,vendor_id")
    .eq("id", leadId)
    .eq("vendor_id", vendor.id)
    .maybeSingle();

  if (existingLeadError) {
    return NextResponse.json({ error: existingLeadError.message }, { status: 500 });
  }

  if (!existingLead?.id) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    last_activity_at: new Date().toISOString(),
  };

  if (status) {
    updatePayload.status = status;
    if (status === "contacted" || status === "qualified" || status === "closed") {
      updatePayload.last_contacted_at = new Date().toISOString();
    }
  }

  if (pipelineStage) {
    updatePayload.pipeline_stage = pipelineStage;
  }

  if (body.assigned_member_user_id !== undefined) {
    if (!["owner", "admin"].includes(membership.role)) {
      return NextResponse.json({ error: "Only owner or admin members can assign inquiry leads." }, { status: 403 });
    }

    if (!assigneeId) {
      updatePayload.assigned_member_user_id = null;
    } else {
      const { data: memberRow, error: memberLookupError } = await supabase
        .from("vendor_members")
        .select("user_id,status")
        .eq("vendor_id", vendor.id)
        .eq("user_id", assigneeId)
        .eq("status", "active")
        .maybeSingle();

      if (memberLookupError) {
        return NextResponse.json({ error: memberLookupError.message }, { status: 500 });
      }

      if (!memberRow?.user_id) {
        return NextResponse.json({ error: "Assignee must be an active vendor member." }, { status: 400 });
      }

      updatePayload.assigned_member_user_id = assigneeId;
    }
  }

  const { error: updateError } = await supabase
    .from("vendor_inquiry_leads")
    .update(updatePayload)
    .eq("id", leadId)
    .eq("vendor_id", vendor.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
