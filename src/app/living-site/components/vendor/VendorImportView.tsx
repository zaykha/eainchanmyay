"use client";

import { useRef, useState } from "react";
import styled from "styled-components";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";

const Page = styled.div`
  display: grid;
  gap: 20px;
`;

const Header = styled.div`
  display: grid;
  gap: 8px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: #f8fafc;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #98a2b3;
  line-height: 1.6;
  max-width: 900px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
  padding: 20px;
  display: grid;
  gap: 16px;
`;

const Actions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 46px;
  padding: 0 16px;
  border-radius: 999px;
  border: ${(props) => (props.$primary ? "none" : "1px solid rgba(255, 255, 255, 0.12)")};
  background: ${(props) =>
    props.$primary ? "linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%)" : "transparent"};
  color: #fff;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const Hint = styled.div`
  color: #aab4c6;
  line-height: 1.6;
`;

const Notice = styled.div`
  border-radius: 20px;
  border: 1px solid rgba(255, 210, 92, 0.22);
  background: rgba(255, 210, 92, 0.08);
  padding: 16px 18px;
  color: #f2dfab;
  line-height: 1.6;
`;

const UploadInput = styled.input`
  display: none;
`;

const ErrorText = styled.div`
  color: #ffb5c2;
  line-height: 1.6;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Pill = styled.span`
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #dbe2ef;
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 700;
`;

const Table = styled.div`
  display: grid;
  gap: 10px;
`;

const Row = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #101522;
  padding: 14px;
  display: grid;
  gap: 8px;
`;

type PreviewPayload = {
  filename?: string;
  columns?: string[];
  missingRequiredColumns?: string[];
  summary?: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
  previewRows?: Array<{
    rowNumber: number;
    title: string;
    dealType: string;
    propertyType: string;
    location: string;
    imageFilenames: string[];
    errors: string[];
  }>;
  nextStep?: string;
  error?: string;
};

type ImagePreviewPayload = {
  filename?: string;
  archiveFilenames?: string[];
  expectedFilenames?: string[];
  matchedFilenames?: string[];
  missingFilenames?: string[];
  extraFilenames?: string[];
  summary?: {
    archiveCount: number;
    expectedCount: number;
    matchedCount: number;
    missingCount: number;
    extraCount: number;
  };
  nextStep?: string;
  error?: string;
};

export function VendorImportView() {
  const { authToken } = useAppState();
  const spreadsheetInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [zipLoading, setZipLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloading, setDownloading] = useState<"csv" | "xlsx" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreviewPayload | null>(null);
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const handleDownloadTemplate = async (format: "csv" | "xlsx") => {
    if (!authToken) return;
    setDownloading(format);
    setError(null);

    try {
      const response = await fetch(`/api/vendor/import/template?format=${format}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Unable to download template.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `vendor-listing-import-template.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to download template.");
    } finally {
      setDownloading(null);
    }
  };

  const handleFileSelected = async (file: File | null) => {
    if (!authToken || !file) return;
    setLoading(true);
    setError(null);
    setPreview(null);
    setImportMessage(null);

    try {
      setSpreadsheetFile(file);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/vendor/import/preview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as PreviewPayload | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error || "Unable to preview spreadsheet.");
      }

      setPreview(payload);
      setImagePreview(null);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to preview spreadsheet.");
    } finally {
      setLoading(false);
    }
  };

  const handleZipSelected = async (file: File | null) => {
    if (!authToken || !file) return;
    setZipLoading(true);
    setError(null);
    setImagePreview(null);
    setImportMessage(null);

    try {
      setZipFile(file);
      const expectedFilenames = Array.from(
        new Set((preview?.previewRows ?? []).flatMap((row) => row.imageFilenames ?? []).filter(Boolean))
      );

      const formData = new FormData();
      formData.append("file", file);
      formData.append("expectedFilenames", JSON.stringify(expectedFilenames));

      const response = await fetch("/api/vendor/import/images/preview", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as ImagePreviewPayload | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error || "Unable to validate image zip.");
      }

      setImagePreview(payload);
    } catch (zipError) {
      setError(zipError instanceof Error ? zipError.message : "Unable to validate image zip.");
    } finally {
      setZipLoading(false);
    }
  };

  const canImport =
    Boolean(preview?.previewRows?.length) &&
    Boolean(imagePreview) &&
    !preview?.missingRequiredColumns?.length &&
    !(preview?.summary?.invalidRows ?? 0) &&
    !imagePreview?.missingFilenames?.length &&
    Boolean(spreadsheetFile) &&
    Boolean(zipFile);

  const handleExecuteImport = async () => {
    if (!authToken || !spreadsheetFile || !zipFile || !canImport) return;
    setImporting(true);
    setError(null);
    setImportMessage(null);

    try {
      const formData = new FormData();
      formData.append("spreadsheet", spreadsheetFile);
      formData.append("images", zipFile);

      const response = await fetch("/api/vendor/import/execute", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | { importedCount?: number; error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to execute import.");
      }

      setImportMessage(`Imported ${payload?.importedCount ?? 0} properties successfully.`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Unable to execute import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Page>
      <Header>
        <Title>Bulk import</Title>
        <Subtitle>
          Upload a CSV or Excel file to preview agency listings before import. This first version validates columns and
          rows now, while image zip upload and photo mapping come in the next slice.
        </Subtitle>
      </Header>

      <Grid>
        <Card>
          <div style={{ display: "grid", gap: 10 }}>
            <strong style={{ color: "#f8fafc" }}>1. Download the template</strong>
            <Hint>Use the provided template so your agency data matches the import columns expected by the platform.</Hint>
          </div>
          <Actions>
            <Button type="button" onClick={() => void handleDownloadTemplate("csv")} disabled={downloading !== null}>
              <Download size={16} />
              <span>{downloading === "csv" ? "Preparing CSV..." : "Download CSV template"}</span>
            </Button>
            <Button type="button" onClick={() => void handleDownloadTemplate("xlsx")} disabled={downloading !== null}>
              <FileSpreadsheet size={16} />
              <span>{downloading === "xlsx" ? "Preparing Excel..." : "Download Excel template"}</span>
            </Button>
          </Actions>

          <div style={{ display: "grid", gap: 10 }}>
            <strong style={{ color: "#f8fafc" }}>2. Upload your spreadsheet for preview</strong>
            <Hint>
              Supported now: `.csv` and `.xlsx`. Supported next: image zip upload and filename-to-photo matching.
            </Hint>
            <UploadInput
              ref={spreadsheetInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={(event) => void handleFileSelected(event.target.files?.[0] ?? null)}
            />
            <Button type="button" $primary onClick={() => spreadsheetInputRef.current?.click()} disabled={loading}>
              <Upload size={16} />
              <span>{loading ? "Parsing spreadsheet..." : "Choose spreadsheet"}</span>
            </Button>
          </div>

          {error ? <ErrorText>{error}</ErrorText> : null}
        </Card>

        <Card>
          <strong style={{ color: "#f8fafc" }}>Phase status</strong>
          <Notice>
            This build now covers the full bulk-import execution path: spreadsheet preview, zip filename checks, R2
            image upload, and property creation.
          </Notice>
          <Hint>
            Recommended spreadsheet image columns: `image_1`, `image_2`, `image_3`. Put filenames like `front.jpg` in
            those fields, then upload a single zip containing the actual images.
          </Hint>
          <UploadInput
            ref={zipInputRef}
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => void handleZipSelected(event.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            onClick={() => zipInputRef.current?.click()}
            disabled={!preview?.previewRows?.length || zipLoading}
          >
            <Upload size={16} />
            <span>{zipLoading ? "Checking image zip..." : "Upload image zip"}</span>
          </Button>
          <Button type="button" $primary onClick={() => void handleExecuteImport()} disabled={!canImport || importing}>
            <Upload size={16} />
            <span>{importing ? "Importing listings..." : "Import validated listings"}</span>
          </Button>
          {!preview?.previewRows?.length ? <Hint>Preview a spreadsheet first so image filenames can be matched.</Hint> : null}
          {importMessage ? <Hint>{importMessage}</Hint> : null}
        </Card>
      </Grid>

      {preview ? (
        <Card>
          <div style={{ display: "grid", gap: 8 }}>
            <strong style={{ color: "#f8fafc" }}>{preview.filename || "Spreadsheet preview"}</strong>
            <SummaryRow>
              <Pill>{preview.summary?.totalRows ?? 0} rows</Pill>
              <Pill>{preview.summary?.validRows ?? 0} valid</Pill>
              <Pill>{preview.summary?.invalidRows ?? 0} invalid</Pill>
            </SummaryRow>
            {preview.missingRequiredColumns?.length ? (
              <ErrorText>Missing required columns: {preview.missingRequiredColumns.join(", ")}</ErrorText>
            ) : null}
            {preview.nextStep ? <Hint>{preview.nextStep}</Hint> : null}
          </div>

          <Table>
            {(preview.previewRows ?? []).slice(0, 12).map((row) => (
              <Row key={row.rowNumber}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <strong style={{ color: "#f8fafc" }}>
                    Row {row.rowNumber}: {row.title || "Untitled listing"}
                  </strong>
                  <span style={{ color: "#aab4c6" }}>
                    {[row.dealType, row.propertyType, row.location].filter(Boolean).join(" • ") || "Missing core data"}
                  </span>
                </div>
                <div style={{ color: "#dbe2ef" }}>
                  Images: {row.imageFilenames.length ? row.imageFilenames.join(", ") : "No filenames yet"}
                </div>
                {row.errors.length ? <ErrorText>{row.errors.join(" | ")}</ErrorText> : <Hint>Row passes preview validation.</Hint>}
              </Row>
            ))}
          </Table>
        </Card>
      ) : null}

      {imagePreview ? (
        <Card>
          <div style={{ display: "grid", gap: 8 }}>
            <strong style={{ color: "#f8fafc" }}>{imagePreview.filename || "Image zip preview"}</strong>
            <SummaryRow>
              <Pill>{imagePreview.summary?.archiveCount ?? 0} files in zip</Pill>
              <Pill>{imagePreview.summary?.matchedCount ?? 0} matched</Pill>
              <Pill>{imagePreview.summary?.missingCount ?? 0} missing</Pill>
              <Pill>{imagePreview.summary?.extraCount ?? 0} extra</Pill>
            </SummaryRow>
            {imagePreview.nextStep ? <Hint>{imagePreview.nextStep}</Hint> : null}
            {imagePreview.missingFilenames?.length ? (
              <ErrorText>Missing image files: {imagePreview.missingFilenames.join(", ")}</ErrorText>
            ) : (
              <Hint>All referenced image filenames were found in the uploaded zip.</Hint>
            )}
            {imagePreview.extraFilenames?.length ? <Hint>Extra files in zip: {imagePreview.extraFilenames.join(", ")}</Hint> : null}
          </div>
        </Card>
      ) : null}
    </Page>
  );
}
