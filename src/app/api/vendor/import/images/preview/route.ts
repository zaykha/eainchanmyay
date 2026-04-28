import { NextResponse } from "next/server";
import JSZip from "jszip";
import { getVendorRequestContext } from "@/app/api/vendor/_lib/context";
import { normalizeImportFilename } from "@/lib/vendor-import";

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
    return NextResponse.json({ error: "Only zip archives are supported for image upload right now." }, { status: 400 });
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
  const archiveFilenames = uniqueSorted(
    Object.values(zip.files)
      .filter((entry) => !entry.dir)
      .map((entry) => normalizeImportFilename(entry.name))
      .filter((name) => /\.(jpg|jpeg|png|webp)$/i.test(name))
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
    nextStep:
      "Image filename matching is ready. The remaining bulk-import work is rehosting files and creating property/image records.",
  });
}
