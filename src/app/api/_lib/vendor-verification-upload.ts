import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getOptimizedImageFilename,
  optimizeImageBuffer,
  optimizedImageContentType,
} from "@/app/api/_lib/image-pipeline";

const vendorVerificationBucket =
  process.env.SUPABASE_VENDOR_VERIFICATION_BUCKET ?? "vendor-verification-documents";

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadVendorVerificationDocument(input: {
  supabase: SupabaseClient;
  vendorId: string;
  file: { filename: string; buffer: Buffer };
}) {
  const optimizedFilename = getOptimizedImageFilename(input.file.filename);
  const storagePath = `documents/${input.vendorId}/${Date.now()}-${sanitizeFilename(optimizedFilename)}`;
  const optimizedBuffer = await optimizeImageBuffer({ buffer: input.file.buffer });

  const { error: uploadError } = await input.supabase.storage
    .from(vendorVerificationBucket)
    .upload(storagePath, optimizedBuffer, {
      contentType: optimizedImageContentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = input.supabase.storage
    .from(vendorVerificationBucket)
    .getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: publicUrlData.publicUrl,
    contentType: optimizedImageContentType,
    fileSizeBytes: optimizedBuffer.byteLength,
  };
}
