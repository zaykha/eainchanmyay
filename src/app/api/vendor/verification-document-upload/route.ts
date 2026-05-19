import { NextResponse } from "next/server";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { uploadVendorVerificationDocument } from "@/app/api/_lib/vendor-verification-upload";
import { getVendorPlan } from "@/lib/vendor-plans";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request, {
    requireExplicitVendorSelection: true,
  });
  if (!result.ok) {
    return result.response;
  }

  if (result.context.membership.role !== "owner") {
    return NextResponse.json({ error: "Only workspace owners can upload verification documents." }, { status: 403 });
  }

  const currentPlan = getVendorPlan(result.context.vendor.plan);
  if (!currentPlan.includedVerification) {
    return NextResponse.json(
      {
        error: "Verification submission is included only on the Verified plan.",
        code: "verification_upgrade_required",
      },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload body." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Document image file is required." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Verification documents must be uploaded as photos only." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.length) {
    return NextResponse.json({ error: "Uploaded document image is empty." }, { status: 400 });
  }

  try {
    const upload = await uploadVendorVerificationDocument({
      supabase: result.context.supabase,
      vendorId: result.context.vendor.id,
      file: {
        filename: file.name || "verification-document",
        buffer,
      },
    });

    return NextResponse.json({
      ok: true,
      publicUrl: upload.publicUrl,
      storagePath: upload.storagePath,
      mimeType: upload.contentType,
      fileSizeBytes: upload.fileSizeBytes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to upload verification document." },
      { status: 500 }
    );
  }
}
