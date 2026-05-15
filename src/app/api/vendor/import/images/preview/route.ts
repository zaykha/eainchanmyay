import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { normalizeImportFilename, vendorImportMaxZipBytes, vendorImportRecommendedImageBytes } from "@/lib/vendor-import";

export const runtime = "nodejs";

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

export async function POST(request: Request) {
  const result = await getVendorRequestContext(request);
  if (!result.ok) {
    return result.response;
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  const expectedFilenamesRaw = formData?.get("expectedFilenames");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A zip file is required." }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".zip")) {
    return NextResponse.json({ error: "Only ZIP archives are supported for image upload." }, { status: 400 });
  }

  if (file.size > vendorImportMaxZipBytes) {
    return NextResponse.json({ error: "ZIP file is too large for bulk upload." }, { status: 400 });
  }

  let expectedFilenames: string[] = [];
  if (typeof expectedFilenamesRaw === "string" && expectedFilenamesRaw.trim()) {
    try {
      const parsed = JSON.parse(expectedFilenamesRaw) as unknown;
      if (Array.isArray(parsed)) {
        expectedFilenames = parsed.map((value) => normalizeImportFilename(typeof value === "string" ? value : "")).filter(Boolean);
      }
    } catch {
      return NextResponse.json({ error: "Invalid expectedFilenames payload." }, { status: 400 });
    }
  }

  const zip = await JSZip.loadAsync(Buffer.from(await file.arrayBuffer()));
  const archiveEntries = Object.values(zip.files).filter((entry) => !entry.dir);
  const basenameCounts = new Map<string, number>();
  const invalidArchiveEntries: string[] = [];
  const oversizedFilenames: string[] = [];
  const archiveFilenamesRaw: string[] = [];

  for (const entry of archiveEntries) {
    const filename = normalizeImportFilename(entry.name);
    if (!/\.(jpg|jpeg|png|webp)$/i.test(filename)) {
      if (filename) invalidArchiveEntries.push(filename);
      continue;
    }
    basenameCounts.set(filename, (basenameCounts.get(filename) ?? 0) + 1);
    const buffer = await entry.async("uint8array");
    if (buffer.byteLength > vendorImportRecommendedImageBytes) {
      oversizedFilenames.push(filename);
    }
    archiveFilenamesRaw.push(filename);
  }

  const archiveFilenames = uniqueSorted(archiveFilenamesRaw);

  const duplicateArchiveFilenames = uniqueSorted(
    Array.from(basenameCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([filename]) => filename)
  );

  const expected = uniqueSorted(expectedFilenames);
  const archiveSet = new Set(archiveFilenames);
  const expectedSet = new Set(expected);

  const missingFilenames = expected.filter((name) => !archiveSet.has(name));
  const extraFilenames = archiveFilenames.filter((name) => !expectedSet.has(name));
  const matchedFilenames = expected.filter((name) => archiveSet.has(name));

  return NextResponse.json({
    ok: true,
    filename: file.name,
    archiveFilenames,
    expectedFilenames: expected,
    matchedFilenames,
    missingFilenames,
    extraFilenames,
    summary: {
      archiveCount: archiveFilenames.length,
      expectedCount: expected.length,
      matchedCount: matchedFilenames.length,
      missingCount: missingFilenames.length,
      extraCount: extraFilenames.length,
    },
    duplicateArchiveFilenames,
    invalidArchiveEntries: uniqueSorted(invalidArchiveEntries),
    oversizedFilenames: uniqueSorted(oversizedFilenames),
    nextStep:
      duplicateArchiveFilenames.length > 0
        ? "Resolve duplicate image filenames in the ZIP before importing."
        : "ZIP validation passed. You can now import valid rows as draft listings.",
  });
}
