import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;

export const isR2Configured = Boolean(accountId && accessKeyId && secretAccessKey && bucket);

export const r2Bucket = bucket ?? "";

export const r2Client = isR2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
      forcePathStyle: true,
    })
  : null;

const imageContentTypeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadRequestImages(input: {
  scope: "public" | "vendor";
  requestId: string;
  ownerId: string;
  files: File[];
}) {
  if (!isR2Configured || !r2Client || !r2Bucket) {
    throw new Error("R2 is not configured for request image uploads.");
  }

  const rows: Array<{
    sales_request_id: string;
    user_id: string;
    r2_key: string;
    public_url: null;
    sort_order: number;
  }> = [];

  for (const [index, file] of input.files.entries()) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const objectKey = `sales-requests/${input.scope}/${input.ownerId}/${input.requestId}/${String(index + 1).padStart(2, "0")}-${sanitizeFilename(file.name)}`;
    const contentType =
      imageContentTypeByExtension[extension] ??
      (file.type && file.type.trim() ? file.type : undefined) ??
      "application/octet-stream";
    await r2Client.send(
      new PutObjectCommand({
        Bucket: r2Bucket,
        Key: objectKey,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: contentType,
      })
    );

    rows.push({
      sales_request_id: input.requestId,
      user_id: input.ownerId,
      r2_key: objectKey,
      public_url: null,
      sort_order: index,
    });
  }

  return rows;
}
