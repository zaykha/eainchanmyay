import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getOptimizedImageFilename,
  optimizeImageBuffer,
  optimizedImageContentType,
} from "@/app/api/_lib/image-pipeline";

const requestImageBucket = process.env.SUPABASE_REQUEST_IMAGE_BUCKET ?? "sales-request-images";

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadRequestImages(input: {
  supabase: SupabaseClient;
  scope: "public" | "vendor";
  requestId: string;
  ownerId: string;
  files: File[];
}) {
  const rows: Array<{
    sales_request_id: string;
    user_id: string;
    r2_key: string;
    public_url: string;
    sort_order: number;
  }> = [];
  const storagePaths: string[] = [];

  for (const [index, file] of input.files.entries()) {
    const optimizedFilename = getOptimizedImageFilename(file.name);
    const storagePath = `sales-requests/${input.scope}/${input.ownerId}/${input.requestId}/${String(index + 1).padStart(2, "0")}-${sanitizeFilename(optimizedFilename)}`;
    const optimizedBuffer = await optimizeImageBuffer({
      buffer: Buffer.from(await file.arrayBuffer()),
    });
    const { error: uploadError } = await input.supabase.storage
      .from(requestImageBucket)
      .upload(storagePath, optimizedBuffer, {
        contentType: optimizedImageContentType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = input.supabase.storage.from(requestImageBucket).getPublicUrl(storagePath);

    storagePaths.push(storagePath);
    rows.push({
      sales_request_id: input.requestId,
      user_id: input.ownerId,
      r2_key: storagePath,
      public_url: publicUrlData.publicUrl,
      sort_order: index,
    });
  }

  return { rows, storagePaths };
}

export async function deleteRequestImages(input: {
  supabase: SupabaseClient;
  storagePaths: string[];
}) {
  if (!input.storagePaths.length) return;
  await input.supabase.storage.from(requestImageBucket).remove(input.storagePaths);
}
