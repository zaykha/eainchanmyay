import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { toTemplateRows } from "@/lib/vendor-import";

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

export async function GET(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv").trim().toLowerCase();
  const rows = toTemplateRows();

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Listings");
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="vendor-listing-import-template.xlsx"',
      },
    });
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vendor-listing-import-template.csv"',
    },
  });
}
