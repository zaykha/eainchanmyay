import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { uploadVendorCover } from "@/app/api/_lib/vendor-brand-upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request, { allowPendingBilling: true });
  if (!result.ok) {
    return result.response;
  }

  if (!["owner", "admin"].includes(result.context.membership.role)) {
    return NextResponse.json({ error: "Only owners and admins can upload branding assets." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload body." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Cover image file is required." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Cover image must be an image file." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) {
    return NextResponse.json({ error: "Uploaded cover image is empty." }, { status: 400 });
  }

  try {
    const upload = await uploadVendorCover({
      supabase: result.context.supabase,
      vendorId: result.context.vendor.id,
      file: {
        filename: file.name || "cover",
        buffer,
      },
    });

    return NextResponse.json({
      ok: true,
      publicUrl: upload.publicUrl,
      storagePath: upload.storagePath,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload cover image." },
      { status: 500 }
    );
  }
}
