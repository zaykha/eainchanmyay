import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { validateVendorImportRows } from "@/lib/vendor-import";

function parseCsvText(content: string) {
  const workbook = XLSX.read(content, { type: "string" });
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
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A spreadsheet file is required." }, { status: 400 });
  }

  const filename = file.name.toLowerCase();
  if (!filename.endsWith(".csv") && !filename.endsWith(".xlsx")) {
    return NextResponse.json({ error: "Only CSV and XLSX files are supported right now." }, { status: 400 });
  }

  let rows: unknown[][] = [];

  if (filename.endsWith(".csv")) {
    rows = parseCsvText(await file.text());
  } else {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheet = workbook.SheetNames[0];
    rows = firstSheet
      ? (XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], {
          header: 1,
          raw: false,
          blankrows: false,
        }) as unknown[][])
      : [];
  }

  return NextResponse.json({
    ok: true,
    filename: file.name,
    ...validateVendorImportRows(rows),
    nextStep:
      "Spreadsheet parsing is ready. Image zip upload and filename-to-photo matching are the next implementation step.",
  });
}
