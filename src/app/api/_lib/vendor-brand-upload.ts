import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getOptimizedImageFilename,
  optimizeImageBuffer,
  optimizedImageContentType,
} from "@/app/api/_lib/image-pipeline";

const vendorBrandBucket = process.env.SUPABASE_VENDOR_BRAND_BUCKET ?? "vendor-brand-assets";

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadVendorLogo(input: {
  supabase: SupabaseClient;
  vendorId: string;
  file: { filename: string; buffer: Buffer };
}) {
  const optimizedFilename = getOptimizedImageFilename(input.file.filename);
  const storagePath = `logos/${input.vendorId}/${sanitizeFilename(optimizedFilename)}`;
  const optimizedBuffer = await optimizeImageBuffer({ buffer: input.file.buffer });

  const { error: uploadError } = await input.supabase.storage
    .from(vendorBrandBucket)
    .upload(storagePath, optimizedBuffer, {
      contentType: optimizedImageContentType,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = input.supabase.storage.from(vendorBrandBucket).getPublicUrl(storagePath);

  return {
    storagePath,
    publicUrl: publicUrlData.publicUrl,
  };
}
