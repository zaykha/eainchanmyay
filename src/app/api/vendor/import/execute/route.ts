import { NextResponse } from "next/server";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { deletePropertyImages, uploadImportedPropertyImages } from "@/app/api/_lib/property-image-upload";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { getVendorPlanUsage } from "@/app/api/vendor/_lib/plan-limits";
import { isLegacyPropertiesStatusConstraintError } from "@/lib/property-lifecycle-persistence";
import {
  normalizeImportFilename,
  toVendorImportRecords,
  vendorImportMaxRows,
  vendorImportMaxZipBytes,
} from "@/lib/vendor-import";

export const runtime = "nodejs";

function parseCsvRows(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const preferredSheet = workbook.Sheets["Properties Upload"] ? "Properties Upload" : workbook.SheetNames[0];
  if (!preferredSheet) return [];
  return XLSX.utils.sheet_to_json(workbook.Sheets[preferredSheet], {
    header: 1,
    raw: false,
    blankrows: false,
  }) as unknown[][];
}

function isSupportedSpreadsheet(filename: string) {
  return filename.endsWith(".csv") || filename.endsWith(".xlsx");
}

function getZipDuplicates(entries: JSZip.JSZipObject[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const filename = normalizeImportFilename(entry.name);
    if (!filename || !/\.(jpg|jpeg|png|webp)$/i.test(filename)) continue;
    counts.set(filename, (counts.get(filename) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([filename]) => filename)
    .sort((left, right) => left.localeCompare(right));
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const formData = await request.formData().catch(() => null);
  const spreadsheet = formData?.get("spreadsheet");
  const imageZip = formData?.get("images");

  if (!(spreadsheet instanceof File)) {
    return NextResponse.json({ error: "A CSV or Excel file is required." }, { status: 400 });
  }

  if (!(imageZip instanceof File)) {
    return NextResponse.json({ error: "A ZIP file is required." }, { status: 400 });
  }

  if (!isSupportedSpreadsheet(spreadsheet.name.toLowerCase())) {
    return NextResponse.json({ error: "Only CSV and XLSX files are supported for bulk upload." }, { status: 400 });
  }

  if (!imageZip.name.toLowerCase().endsWith(".zip")) {
    return NextResponse.json({ error: "Only ZIP files are supported for bulk upload images." }, { status: 400 });
  }

  if (imageZip.size > vendorImportMaxZipBytes) {
    return NextResponse.json({ error: "ZIP file is too large for bulk upload." }, { status: 400 });
  }

  const rows = parseCsvRows(Buffer.from(await spreadsheet.arrayBuffer()));
  const validation = toVendorImportRecords(rows);

  if (validation.missingRequiredColumns.length) {
    return NextResponse.json(
      { error: `Missing required columns: ${validation.missingRequiredColumns.join(", ")}` },
      { status: 400 }
    );
  }

  if (validation.globalErrors.length) {
    return NextResponse.json(
      {
        error: validation.globalErrors.join(" "),
        globalErrors: validation.globalErrors,
      },
      { status: 400 }
    );
  }

  if (!validation.records.length) {
    return NextResponse.json({ error: "No import rows were found in the spreadsheet." }, { status: 400 });
  }

  if (validation.records.length > vendorImportMaxRows) {
    return NextResponse.json({ error: `Maximum ${vendorImportMaxRows} rows are allowed per upload.` }, { status: 400 });
  }

  const validationErrorRows = validation.records.filter((record) => record.fieldErrors.length > 0);
  if (!validation.records.length || !validation.records.filter((record) => record.fieldErrors.length === 0).length) {
    return NextResponse.json(
      {
        ok: false,
        error: "Fix the spreadsheet errors before importing.",
        report: {
          totalRowsProcessed: validation.records.length,
          propertiesCreated: 0,
          imagesUploaded: 0,
          rowsSkipped: validation.records.length,
          failedImages: 0,
          skippedRows: validation.records.map((record) => ({
            rowNumber: record.rowNumber,
            title: record.title || null,
            fieldErrors: record.fieldErrors,
            missingImageFilenames: [],
          })),
        },
      },
      { status: 400 }
    );
  }

  const { planUsage } = await getVendorPlanUsage(result.context);
  if (planUsage.listingUsage + validation.records.length > planUsage.listingLimit) {
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
  const duplicateArchiveFilenames = getZipDuplicates(zipEntries);
  if (duplicateArchiveFilenames.length) {
    return NextResponse.json(
      {
        error: `Duplicate image filenames found in ZIP: ${duplicateArchiveFilenames.join(", ")}`,
        duplicateArchiveFilenames,
      },
      { status: 400 }
    );
  }

  const zipMap = new Map(
    zipEntries
      .map((entry) => [normalizeImportFilename(entry.name), entry] as const)
      .filter(([filename]) => filename && /\.(jpg|jpeg|png|webp)$/i.test(filename))
  );

  const recordsWithMissingImages = validation.records
    .map((record) => ({
      record,
      missingImageFilenames: record.imageFiles
        .map((image) => image.normalizedFilename)
        .filter((filename) => !zipMap.has(filename)),
    }))
    .filter((item) => item.missingImageFilenames.length > 0);

  if (validationErrorRows.length || recordsWithMissingImages.length) {
    return NextResponse.json(
      {
        ok: false,
        error: "Fix the highlighted row errors before importing.",
        report: {
          totalRowsProcessed: validation.records.length,
          propertiesCreated: 0,
          imagesUploaded: 0,
          rowsSkipped: validation.records.length,
          failedImages: recordsWithMissingImages.reduce((sum, item) => sum + item.missingImageFilenames.length, 0),
          skippedRows: validation.records.map((record) => {
            const missingImageFilenames =
              recordsWithMissingImages.find((item) => item.record.rowNumber === record.rowNumber)?.missingImageFilenames ?? [];
            return {
              rowNumber: record.rowNumber,
              title: record.title || null,
              fieldErrors: record.fieldErrors,
              missingImageFilenames,
            };
          }),
          failedImageUploads: recordsWithMissingImages.flatMap((item) =>
            item.missingImageFilenames.map((filename) => ({
              rowNumber: item.record.rowNumber,
              title: item.record.title || null,
              propertyId: null,
              filename,
              reason: "Referenced in the spreadsheet but missing from ZIP.",
            }))
          ),
        },
      },
      { status: 400 }
    );
  }

  const createdProperties: Array<{ rowNumber: number; propertyId: string; title: string }> = [];
  const uploadedImages: Array<{ rowNumber: number; propertyId: string; filename: string; sortOrder: number }> = [];
  const skippedRows: Array<{
    rowNumber: number;
    title: string | null;
    fieldErrors: Array<{ field: string; message: string }>;
    missingImageFilenames: string[];
  }> = [];
  const failedImages: Array<{
    rowNumber: number;
    title: string | null;
    propertyId: string | null;
    filename: string;
    reason: string;
  }> = [];

  for (const record of validation.records) {
    const propertyPayload = {
      vendor_id: result.context.vendor.id,
      created_by: result.context.user.id,
      title: record.title,
      description: record.description,
      deal_type: record.dealType,
      property_type: record.propertyType,
      price: record.price,
      status: record.importStatus,
      township: record.township,
      address_text: record.addressText,
      state_region: record.stateRegion,
      district: record.district,
      latitude: record.latitude,
      longitude: record.longitude,
      bedrooms: record.bedrooms,
      bathrooms: record.bathrooms,
      area_sqft: record.areaSqft,
      floor_count: record.floorCount,
      room_count: record.roomCount,
      has_lift: record.hasLift,
      has_backup_power: record.hasBackupPower,
      backup_power_type: record.backupPowerType,
      has_parking: record.hasParking,
      commission_percent: record.commissionPercent,
      owner_name: record.ownerName,
      owner_phone: record.ownerPhone,
      owner_phone_secondary: record.ownerPhoneSecondary,
      verification_notes: record.verificationNotes,
      is_deleted: false,
    };

    let propertyInsert = await result.context.supabase
      .from("properties")
      .insert(propertyPayload)
      .select("id,title")
      .maybeSingle();

    if (isLegacyPropertiesStatusConstraintError(propertyInsert.error) && record.importStatus === "active") {
      propertyInsert = await result.context.supabase
        .from("properties")
        .insert({
          ...propertyPayload,
          status: "published",
        })
        .select("id,title")
        .maybeSingle();
    }

    const { data: propertyRow, error: propertyInsertError } = propertyInsert;

    if (propertyInsertError || !propertyRow?.id) {
      skippedRows.push({
        rowNumber: record.rowNumber,
        title: record.title || null,
        fieldErrors: [{ field: "row", message: propertyInsertError?.message ?? "Unable to create property row." }],
        missingImageFilenames: [],
      });
      continue;
    }

    const propertyId = String(propertyRow.id);
    createdProperties.push({
      rowNumber: record.rowNumber,
      propertyId,
      title: String(propertyRow.title ?? record.title),
    });

    const matchedFiles: Array<{ filename: string; buffer: Buffer; sortOrder: number; isCover: boolean }> = [];
    for (const image of record.imageFiles) {
      const zipEntry = zipMap.get(image.normalizedFilename);
      if (!zipEntry) continue;
      matchedFiles.push({
        filename: image.normalizedFilename,
        buffer: await zipEntry.async("nodebuffer"),
        sortOrder: image.sortOrder,
        isCover: image.isCover,
      });
    }

    if (!matchedFiles.length) {
      continue;
    }

    const uploadResult = await uploadImportedPropertyImages({
      supabase: result.context.supabase,
      vendorId: result.context.vendor.id,
      propertyId,
      files: matchedFiles,
    });

    if (uploadResult.rows.length) {
      const { error: imageInsertError } = await result.context.supabase.from("property_images").insert(uploadResult.rows);
      if (imageInsertError) {
        await deletePropertyImages({ supabase: result.context.supabase, storagePaths: uploadResult.storagePaths });
        failedImages.push(
          ...matchedFiles.map((file) => ({
            rowNumber: record.rowNumber,
            title: record.title || null,
            propertyId,
            filename: file.filename,
            reason: imageInsertError.message,
          }))
        );
      } else {
        uploadedImages.push(
          ...uploadResult.rows.map((row) => ({
            rowNumber: record.rowNumber,
            propertyId,
            filename: matchedFiles.find((file) => file.sortOrder === row.sort_order)?.filename ?? row.r2_key,
            sortOrder: row.sort_order,
          }))
        );
      }
    }

    if (uploadResult.failedFiles.length) {
      failedImages.push(
        ...uploadResult.failedFiles.map((file) => ({
          rowNumber: record.rowNumber,
          title: record.title || null,
          propertyId,
          filename: file.filename,
          reason: file.reason,
        }))
      );
    }
  }

  return NextResponse.json({
    ok: true,
    report: {
      totalRowsProcessed: validation.records.length,
      propertiesCreated: createdProperties.length,
      imagesUploaded: uploadedImages.length,
      rowsSkipped: skippedRows.length,
      failedImages: failedImages.length,
      createdProperties,
      uploadedImages,
      skippedRows,
      failedImageUploads: failedImages,
    },
  });
}
