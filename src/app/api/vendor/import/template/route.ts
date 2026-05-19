import { NextResponse } from "next/server";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import {
  getVendorImportLocationReferenceRows,
  toTemplateRows,
  vendorImportAllowedBackupPowerTypes,
  vendorImportAllowedBooleanValues,
  vendorImportAllowedDealTypes,
  vendorImportAllowedPropertyTypes,
  vendorImportAllowedStateRegions,
  vendorImportAllowedStatuses,
  vendorImportGuideLines,
} from "@/lib/vendor-import";

const templateFilenameBase = "property_bulk_upload_template";
const uploadSheetName = "Properties Upload";
const guideSheetName = "Guide";
const allowedValuesSheetName = "Allowed Values";
const locationReferenceSheetName = "Location Reference";

function toCsv(rows: readonly unknown[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = String(cell ?? "").replace(/"/g, '""');
          return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        })
        .join(",")
    )
    .join("\n");
}

function buildGuideRows() {
  return [
    ["Step", "Guidance"],
    ...vendorImportGuideLines.map((line, index) => [`${index + 1}`, line]),
  ];
}

function buildAllowedValueMap() {
  return {
    deal_type: [...vendorImportAllowedDealTypes],
    property_type: [...vendorImportAllowedPropertyTypes],
    status: [...vendorImportAllowedStatuses],
    state_region: [...vendorImportAllowedStateRegions],
    boolean_fields: [...vendorImportAllowedBooleanValues],
    backup_power_type: [...vendorImportAllowedBackupPowerTypes],
  } as const;
}

function buildAllowedValuesRows() {
  const allowedValueMap = buildAllowedValueMap();
  const keys = Object.keys(allowedValueMap) as Array<keyof typeof allowedValueMap>;
  const maxLength = Math.max(...keys.map((key) => allowedValueMap[key].length));
  return [
    keys,
    ...Array.from({ length: maxLength }, (_, rowIndex) =>
      keys.map((key) => allowedValueMap[key][rowIndex] ?? "")
    ),
  ];
}

function getColumnWidths(columns: readonly string[]) {
  return columns.map((column) => {
    if (column === "title" || column === "address_text" || column === "description") return { wch: 28 };
    if (column.startsWith("image_file_")) return { wch: 22 };
    if (["property_type", "state_region", "owner_name", "backup_power_type", "district", "township", "location_code"].includes(column)) {
      return { wch: 20 };
    }
    return { wch: 16 };
  });
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getUploadColumnLetter(columnName: string) {
  const columns = toTemplateRows()[0] as readonly string[];
  const index = columns.indexOf(columnName);
  return index === -1 ? null : XLSX.utils.encode_col(index);
}

function buildDataValidationXml(headerMap: Map<string, { columnLetter: string; length: number }>) {
  const dropdownConfig = [
    ["deal_type", "deal_type"],
    ["property_type", "property_type"],
    ["status", "status"],
    ["state_region", "state_region"],
    ["has_lift", "boolean_fields"],
    ["has_backup_power", "boolean_fields"],
    ["backup_power_type", "backup_power_type"],
    ["has_parking", "boolean_fields"],
  ] as const;

  const validations = dropdownConfig
    .map(([targetColumn, allowedKey]) => {
      const targetLetter = getUploadColumnLetter(targetColumn);
      const allowedMeta = headerMap.get(allowedKey);
      if (!targetLetter || !allowedMeta) return "";
      const formula = `'${allowedValuesSheetName}'!$${allowedMeta.columnLetter}$2:$${allowedMeta.columnLetter}$${allowedMeta.length + 1}`;
      return `<dataValidation type="list" allowBlank="1" showInputMessage="1" showErrorMessage="1" sqref="${targetLetter}2:${targetLetter}501"><formula1>${escapeXml(formula)}</formula1></dataValidation>`;
    })
    .filter(Boolean);

  if (!validations.length) return "";
  return `<dataValidations count="${validations.length}">${validations.join("")}</dataValidations>`;
}

async function buildValidatedWorkbookBuffer() {
  const workbook = XLSX.utils.book_new();

  const propertyRows = toTemplateRows();
  const propertySheet = XLSX.utils.aoa_to_sheet(propertyRows);
  propertySheet["!cols"] = getColumnWidths(propertyRows[0] as readonly string[]);
  propertySheet["!autofilter"] = { ref: `A1:${XLSX.utils.encode_col(propertyRows[0].length - 1)}1` };
  XLSX.utils.book_append_sheet(workbook, propertySheet, uploadSheetName);

  const guideSheet = XLSX.utils.aoa_to_sheet(buildGuideRows());
  guideSheet["!cols"] = [{ wch: 8 }, { wch: 120 }];
  XLSX.utils.book_append_sheet(workbook, guideSheet, guideSheetName);

  const allowedRows = buildAllowedValuesRows();
  const allowedSheet = XLSX.utils.aoa_to_sheet(allowedRows);
  allowedSheet["!cols"] = allowedRows[0].map(() => ({ wch: 24 }));
  XLSX.utils.book_append_sheet(workbook, allowedSheet, allowedValuesSheetName);

  const locationReferenceRows = getVendorImportLocationReferenceRows();
  const locationReferenceSheet = XLSX.utils.aoa_to_sheet(locationReferenceRows);
  locationReferenceSheet["!cols"] = [
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 },
  ];
  locationReferenceSheet["!autofilter"] = { ref: "A1:D1" };
  XLSX.utils.book_append_sheet(workbook, locationReferenceSheet, locationReferenceSheetName);

  const headerMap = new Map(
    allowedRows[0].map((header, index) => [
      String(header),
      {
        columnLetter: XLSX.utils.encode_col(index),
        length: allowedRows.slice(1).filter((row) => String(row[index] ?? "").trim()).length,
      },
    ])
  );

  const rawBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const zip = await JSZip.loadAsync(rawBuffer);
  const propertySheetXmlPath = "xl/worksheets/sheet1.xml";
  const propertySheetXml = await zip.file(propertySheetXmlPath)?.async("string");
  if (!propertySheetXml) {
    return Buffer.from(rawBuffer);
  }

  const dataValidationXml = buildDataValidationXml(headerMap);
  const patchedPropertySheetXml = propertySheetXml.includes("<dataValidations")
    ? propertySheetXml
    : propertySheetXml.includes("<pageMargins")
      ? propertySheetXml.replace("<pageMargins", `${dataValidationXml}<pageMargins`)
      : propertySheetXml.replace("</worksheet>", `${dataValidationXml}</worksheet>`);

  zip.file(propertySheetXmlPath, patchedPropertySheetXml);
  return await zip.generateAsync({ type: "nodebuffer" });
}

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const role = result.context.membership.role;
  if (!role || !["owner", "admin"].includes(role)) {
    return NextResponse.json({ error: "Only owners and admins can download bulk import templates." }, { status: 403 });
  }

  if ((result.context.vendor.plan ?? "").trim().toLowerCase() === "free") {
    return NextResponse.json(
      {
        error: "Bulk upload requires a Pro plan or higher.",
        code: "bulk_upload_upgrade_required",
      },
      { status: 403 }
    );
  }


  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "xlsx").trim().toLowerCase();
  const rowsUnknown = toTemplateRows() as unknown as unknown[][];

  if (format === "csv") {
    const rows = rowsUnknown as unknown[][];
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${templateFilenameBase}.csv"`,
      },
    });
  }

  const buffer = await buildValidatedWorkbookBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${templateFilenameBase}.xlsx"`,
    },
  });
}
