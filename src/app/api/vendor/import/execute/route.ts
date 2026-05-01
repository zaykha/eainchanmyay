import { NextResponse } from "next/server";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { deletePropertyImages, uploadImportedPropertyImages } from "@/app/api/_lib/property-image-upload";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { getVendorPlanUsage } from "@/app/api/vendor/_lib/plan-limits";
import { normalizeImportFilename, toVendorImportRecords } from "@/lib/vendor-import";

export const runtime = "nodejs";

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

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
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
      vendor_id: result.context.vendor.id,
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
      const propertyImageFiles: Array<{ filename: string; buffer: Buffer }> = [];

      for (const filename of record.imageFilenames) {
        const zipEntry = zipMap.get(filename);
        if (!zipEntry) continue;
        propertyImageFiles.push({
          filename,
          buffer: await zipEntry.async("nodebuffer"),
        });
      }

      const { rows: imageRows, storagePaths } = await uploadImportedPropertyImages({
        supabase: result.context.supabase,
        vendorId: result.context.vendor.id,
        propertyId,
        files: propertyImageFiles,
      });

      if (imageRows.length) {
        const { error: imageInsertError } = await result.context.supabase.from("property_images").insert(imageRows);
        if (imageInsertError) {
          await deletePropertyImages({ supabase: result.context.supabase, storagePaths });
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
