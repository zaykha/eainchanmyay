import { NextResponse } from "next/server";
import JSZip from "jszip";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as XLSX from "xlsx";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { getVendorPlanUsage } from "@/app/api/vendor/_lib/plan-limits";
import { normalizeImportFilename, toVendorImportRecords } from "@/lib/vendor-import";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;

const isR2Configured = Boolean(accountId && accessKeyId && secretAccessKey && bucket);

const client = isR2Configured
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

function parseSpreadsheetRows(filename: string, buffer: Buffer) {
  if (filename.endsWith(".csv")) {
    const workbook = XLSX.read(buffer.toString("utf8"), { type: "string" });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) return [];
    return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
      header: 1,
      raw: false,
      blankrows: false,
    }) as unknown[][];
  }

  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
    header: 1,
    raw: false,
    blankrows: false,
  }) as unknown[][];
}

function sanitizeFilename(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  if (!isR2Configured || !client || !bucket) {
    return NextResponse.json({ error: "R2 is not configured for image imports." }, { status: 500 });
  }

  const formData = await request.formData().catch(() => null);
  const spreadsheet = formData?.get("spreadsheet");
  const imageZip = formData?.get("images");

  if (!(spreadsheet instanceof File)) {
    return NextResponse.json({ error: "A spreadsheet file is required." }, { status: 400 });
  }

  if (!(imageZip instanceof File)) {
    return NextResponse.json({ error: "An image zip file is required." }, { status: 400 });
  }

  const spreadsheetName = spreadsheet.name.toLowerCase();
  if (!spreadsheetName.endsWith(".csv") && !spreadsheetName.endsWith(".xlsx")) {
    return NextResponse.json({ error: "Only CSV and XLSX files are supported." }, { status: 400 });
  }

  if (!imageZip.name.toLowerCase().endsWith(".zip")) {
    return NextResponse.json({ error: "Only zip archives are supported for images." }, { status: 400 });
  }

  const rows = parseSpreadsheetRows(spreadsheetName, Buffer.from(await spreadsheet.arrayBuffer()));
  const { records, missingRequiredColumns } = toVendorImportRecords(rows);

  if (missingRequiredColumns.length) {
    return NextResponse.json(
      { error: `Missing required columns: ${missingRequiredColumns.join(", ")}` },
      { status: 400 }
    );
  }

  if (!records.length) {
    return NextResponse.json({ error: "No import rows were found in the spreadsheet." }, { status: 400 });
  }

  const invalidRows = records.filter((record) => record.errors.length > 0);
  if (invalidRows.length) {
    return NextResponse.json(
      {
        error: "The spreadsheet contains invalid rows. Fix the preview errors before importing.",
        invalidRows: invalidRows.map((record) => ({ rowNumber: record.rowNumber, errors: record.errors })),
      },
      { status: 400 }
    );
  }

  const { planUsage } = await getVendorPlanUsage(result.context);
  if (planUsage.listingUsage + records.length > planUsage.listingLimit) {
    return NextResponse.json(
      {
        error: `Your ${planUsage.plan.name} plan allows up to ${planUsage.listingLimit} listing records. This import would exceed the limit.`,
        code: "LISTING_LIMIT_REACHED",
      },
      { status: 403 }
    );
  }

  const zip = await JSZip.loadAsync(Buffer.from(await imageZip.arrayBuffer()));
  const zipEntries = Object.values(zip.files).filter((entry) => !entry.dir);
  const zipMap = new Map(zipEntries.map((entry) => [normalizeImportFilename(entry.name), entry] as const));

  const expectedFilenames = Array.from(new Set(records.flatMap((record) => record.imageFilenames)));
  const missingFilenames = expectedFilenames.filter((name) => !zipMap.has(name));
  if (missingFilenames.length) {
    return NextResponse.json(
      {
        error: `Missing image files in zip: ${missingFilenames.join(", ")}`,
        missingFilenames,
      },
      { status: 400 }
    );
  }

  const importedItems: Array<{ propertyId: string; title: string; imageCount: number }> = [];

  for (const record of records) {
    const propertyPayload = {
      title: record.title,
      description: record.description,
      deal_type: record.dealType,
      property_type: record.propertyType,
      status: record.status,
      price: record.price,
      currency: record.currency,
      state_region: record.stateRegion,
      district: record.district,
      township: record.township,
      city: record.city,
      address_text: record.addressText,
      bedrooms: record.bedrooms,
      bathrooms: record.bathrooms,
      area_sqft: record.areaSqft,
      has_lift: record.hasLift,
      has_backup_power: record.hasBackupPower,
      backup_power_type: record.backupPowerType,
      has_parking: record.hasParking,
      latitude: record.latitude,
      longitude: record.longitude,
      created_by: result.context.user.id,
      is_deleted: false,
    };

    const { data: propertyRow, error: propertyInsertError } = await result.context.supabase
      .from("properties")
      .insert(propertyPayload)
      .select("id,title")
      .maybeSingle();

    if (propertyInsertError || !propertyRow?.id) {
      return NextResponse.json(
        { error: propertyInsertError?.message ?? `Unable to create property for row ${record.rowNumber}.` },
        { status: 500 }
      );
    }

    const propertyId = String(propertyRow.id);

    try {
      const imageRows: Array<{
        property_id: string;
        r2_key: string;
        public_url: null;
        is_cover: boolean;
        sort_order: number;
      }> = [];

      for (const [index, filename] of record.imageFilenames.entries()) {
        const zipEntry = zipMap.get(filename);
        if (!zipEntry) continue;
        const fileBuffer = await zipEntry.async("nodebuffer");
        const extension = filename.split(".").pop()?.toLowerCase() ?? "jpg";
        const objectKey = `vendor-imports/${result.context.vendor.id}/${propertyId}/${String(index + 1).padStart(2, "0")}-${sanitizeFilename(filename)}`;

        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: objectKey,
            Body: fileBuffer,
            ContentType: imageContentTypeByExtension[extension] ?? "application/octet-stream",
          })
        );

        imageRows.push({
          property_id: propertyId,
          r2_key: objectKey,
          public_url: null,
          is_cover: index === 0,
          sort_order: index,
        });
      }

      if (imageRows.length) {
        const { error: imageInsertError } = await result.context.supabase.from("property_images").insert(imageRows);
        if (imageInsertError) {
          throw imageInsertError;
        }
      }

      importedItems.push({
        propertyId,
        title: String(propertyRow.title ?? record.title),
        imageCount: imageRows.length,
      });
    } catch (imageError) {
      await result.context.supabase.from("property_images").delete().eq("property_id", propertyId);
      await result.context.supabase.from("properties").delete().eq("id", propertyId);
      return NextResponse.json(
        {
          error: imageError instanceof Error ? imageError.message : `Unable to import images for row ${record.rowNumber}.`,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    importedCount: importedItems.length,
    items: importedItems,
  });
}
