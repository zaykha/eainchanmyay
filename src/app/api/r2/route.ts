import { NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { rateLimit } from "@/app/api/_lib/rate-limit";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;

const isConfigured = Boolean(accountId && accessKeyId && secretAccessKey && bucket);

const client = isConfigured
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

export const runtime = "nodejs";

export async function GET(request: Request) {
  const limit = rateLimit(request, {
    windowMs: 60_000,
    max: 240,
    minIntervalMs: 100,
    keyPrefix: "r2",
  });
  if (limit.limited) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
          "X-RateLimit-Reset": String(limit.resetAt),
        },
      }
    );
  }
  if (!isConfigured || !client) {
    return NextResponse.json(
      { error: "R2 is not configured." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawKey = searchParams.get("key");

  if (!rawKey) {
    return NextResponse.json({ error: "Missing key." }, { status: 400 });
  }

  const key = rawKey.replace(/^\//, "");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  try {
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 600 });
    const response = NextResponse.redirect(signedUrl);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );
    return response;
  } catch (error) {
    console.error("R2 signing error", error);
    return NextResponse.json({ error: "Unable to sign URL." }, { status: 500 });
  }
}
