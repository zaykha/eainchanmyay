import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { supabase, vendor, user, membership } = result.context;
  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ error: "Only owner or admin members can create templates." }, { status: 403 });
  }

  let body: { title?: string; body?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const title = body.title?.trim();
  const templateBody = body.body?.trim();

  if (!title || !templateBody) {
    return NextResponse.json({ error: "Template title and body are required." }, { status: 400 });
  }

  const { data: templateRow, error: insertError } = await supabase
    .from("vendor_message_templates")
    .insert({
      vendor_id: vendor.id,
      title,
      body: templateBody,
      created_by_user_id: user.id,
    })
    .select("id,title,body,created_at,updated_at")
    .maybeSingle();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    template: {
      id: String(templateRow?.id ?? ""),
      title: String(templateRow?.title ?? title),
      body: String(templateRow?.body ?? templateBody),
      created_at: (templateRow?.created_at as string | null) ?? null,
      updated_at: (templateRow?.updated_at as string | null) ?? null,
    },
  });
}
