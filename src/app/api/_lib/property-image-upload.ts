import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getOptimizedImageFilename,
  optimizeImageBuffer,
  optimizedImageContentType,
} from "@/app/api/_lib/image-pipeline";

const propertyImageBucket = process.env.SUPABASE_PROPERTY_IMAGE_BUCKET ?? "item-images";

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadImportedPropertyImages(input: {
  supabase: SupabaseClient;
  vendorId: string;
  propertyId: string;
  files: Array<{ filename: string; buffer: Buffer }>;
}) {
  const rows: Array<{
    property_id: string;
    r2_key: string;
    public_url: string;
    is_cover: boolean;
    sort_order: number;
  }> = [];
  const storagePaths: string[] = [];

  for (const [index, file] of input.files.entries()) {
    const optimizedFilename = getOptimizedImageFilename(file.filename);
    const storagePath = `vendor-imports/${input.vendorId}/${input.propertyId}/${String(index + 1).padStart(2, "0")}-${sanitizeFilename(optimizedFilename)}`;
    const optimizedBuffer = await optimizeImageBuffer({ buffer: file.buffer });
    const { error: uploadError } = await input.supabase.storage
      .from(propertyImageBucket)
      .upload(storagePath, optimizedBuffer, {
        contentType: optimizedImageContentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = input.supabase.storage.from(propertyImageBucket).getPublicUrl(storagePath);

    storagePaths.push(storagePath);
    rows.push({
      property_id: input.propertyId,
      r2_key: storagePath,
      public_url: publicUrlData.publicUrl,
      is_cover: index === 0,
      sort_order: index,
    });
  }

  return { rows, storagePaths };
}

export async function uploadPropertyImages(input: {
  supabase: SupabaseClient;
  folder: string;
  propertyId: string;
  files: Array<{ filename: string; buffer: Buffer }>;
}) {
  const rows: Array<{
    property_id: string;
    r2_key: string;
    public_url: string;
    is_cover: boolean;
    sort_order: number;
  }> = [];
  const storagePaths: string[] = [];

  for (const [index, file] of input.files.entries()) {
    const optimizedFilename = getOptimizedImageFilename(file.filename);
    const storagePath = `${input.folder}/${input.propertyId}/${String(index + 1).padStart(2, "0")}-${sanitizeFilename(optimizedFilename)}`;
    const optimizedBuffer = await optimizeImageBuffer({ buffer: file.buffer });
    const { error: uploadError } = await input.supabase.storage
      .from(propertyImageBucket)
      .upload(storagePath, optimizedBuffer, {
        contentType: optimizedImageContentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = input.supabase.storage.from(propertyImageBucket).getPublicUrl(storagePath);

    storagePaths.push(storagePath);
    rows.push({
      property_id: input.propertyId,
      r2_key: storagePath,
      public_url: publicUrlData.publicUrl,
      is_cover: index === 0,
      sort_order: index,
    });
  }

  return { rows, storagePaths };
}

export async function deletePropertyImages(input: {
  supabase: SupabaseClient;
  storagePaths: string[];
}) {
  if (!input.storagePaths.length) return;
  await input.supabase.storage.from(propertyImageBucket).remove(input.storagePaths);
}
