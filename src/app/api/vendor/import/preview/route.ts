import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { validateVendorImportRows } from "@/lib/vendor-import";

export const runtime = "nodejs";


function parseSpreadsheetRows(buffer: Buffer) {
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

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A CSV or Excel file is required." }, { status: 400 });
  }

  const filename = file.name.toLowerCase();
  if (!isSupportedSpreadsheet(filename)) {
    return NextResponse.json({ error: "Only CSV and XLSX files are supported for bulk upload." }, { status: 400 });
  }

  const rows = parseSpreadsheetRows(Buffer.from(await file.arrayBuffer()));
  const validation = validateVendorImportRows(rows);

  return NextResponse.json({
    ok: true,
    filename: file.name,
    ...validation,
    nextStep:
      "Upload a ZIP file containing images whose base filenames match image_file_1 through image_file_10 in the spreadsheet.",
  });
}
