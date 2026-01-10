import { NextResponse } from "next/server";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("R2 signing error", error);
    return NextResponse.json({ error: "Unable to sign URL." }, { status: 500 });
  }
}
