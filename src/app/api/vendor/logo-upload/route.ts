import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { uploadVendorLogo } from "@/app/api/_lib/vendor-brand-upload";

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
    return NextResponse.json({ error: "Logo file is required." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Logo must be an image file." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) {
    return NextResponse.json({ error: "Uploaded logo is empty." }, { status: 400 });
  }

  try {
    const upload = await uploadVendorLogo({
      supabase: result.context.supabase,
      vendorId: result.context.vendor.id,
      file: {
        filename: file.name || "logo",
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
      { error: error instanceof Error ? error.message : "Unable to upload logo." },
      { status: 500 }
    );
  }
}
