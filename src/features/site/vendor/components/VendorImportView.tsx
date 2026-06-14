"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileArchive,
  FileSpreadsheet,
  ImageIcon,
  Upload,
} from "lucide-react";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { withActiveVendorHeaders } from "@/features/site/vendor/lib/active-context";

const Page = styled.div<{ $embedded?: boolean }>`
  display: grid;
  gap: 18px;
  padding: ${(props) => (props.$embedded ? "0" : "20px")};
`;

const Shell = styled.div<{ $embedded?: boolean }>`
  display: grid;
  gap: 18px;
  padding: ${(props) => (props.$embedded ? "22px" : "24px")};
  border-radius: 28px;
  background: linear-gradient(180deg, #f8f9fc 0%, #f3f5fa 100%);
  border: 1px solid rgba(148, 163, 184, 0.26);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
`;

const GuideHero = styled.div`
  display: grid;
  gap: 14px;
`;

const GuideImageFrame = styled.div`
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #ffffff;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
`;

const GuideImage = styled(Image)`
  display: block;
  width: 100%;
  height: auto;
`;

const GuideActions = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 18px;

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  border-radius: 24px;
  padding: 18px;
  background: linear-gradient(180deg, #fefefe 0%, #f4f7fb 100%);
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow:
    0 16px 34px rgba(15, 23, 42, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  display: grid;
  gap: 14px;
`;

const ImportOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(241, 245, 249, 0.78);
  backdrop-filter: blur(10px);
`;

const ImportOverlayCard = styled.div`
  width: min(440px, 100%);
  display: grid;
  gap: 10px;
  padding: 26px 24px;
  border-radius: 28px;
  background: linear-gradient(180deg, #ffffff 0%, #f7f9fd 100%);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
  text-align: center;
`;

const ImportOverlaySpinner = styled.div`
  width: 54px;
  height: 54px;
  margin: 0 auto 6px;
  border-radius: 999px;
  border: 4px solid rgba(233, 61, 93, 0.16);
  border-top-color: #e93d5d;
  animation: vendor-import-spin 0.9s linear infinite;

  @keyframes vendor-import-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const ImportOverlayTitle = styled.div`
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-text);
`;

const ImportOverlayCopy = styled.div`
  color: var(--color-muted);
  line-height: 1.6;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: var(--color-text);
`;

const CardCopy = styled.p`
  margin: 4px 0 0;
  color: var(--color-muted);
  line-height: 1.55;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: flex-start;
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid ${(props) => (props.$primary ? "transparent" : "rgba(148, 163, 184, 0.28)")};
  background: ${(props) => (props.$primary ? "linear-gradient(135deg, #ff4b6b 0%, #df274c 100%)" : "#fff")};
  color: ${(props) => (props.$primary ? "#fff" : "var(--color-text)")};
  font-weight: 750;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: ${(props) => (props.$primary ? "0 10px 20px rgba(223, 39, 76, 0.18)" : "none")};

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const PrimaryActionButton = styled(Button)`
  min-height: 54px;
  padding: 0 24px;
  border-radius: 18px;
  font-size: 1rem;
  font-weight: 800;
  align-self: flex-start;
  flex: 0 0 auto;
  box-shadow: 0 16px 30px rgba(223, 39, 76, 0.2);
`;

const GhostButton = styled(Button)`
  background: #f8fafc;
`;

const FileInput = styled.input`
  display: none;
`;

const HelpList = styled.div`
  display: grid;
  gap: 10px;
`;

const HelpItem = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: var(--color-muted);
  line-height: 1.55;
  font-size: 0.92rem;

  svg {
    color: #e93d5d;
    flex: 0 0 auto;
    margin-top: 2px;
  }
`;

const Pill = styled.span<{ $tone?: "neutral" | "accent" | "warning" | "danger" | "success" }>`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  font-size: 0.76rem;
  font-weight: 800;
  background: ${(props) =>
    props.$tone === "accent"
      ? "#fff1f3"
      : props.$tone === "warning"
        ? "#fff7ed"
        : props.$tone === "danger"
          ? "#fff1f2"
          : props.$tone === "success"
            ? "#ecfdf3"
            : "#eef2f8"};
  color: ${(props) =>
    props.$tone === "accent"
      ? "#e93d5d"
      : props.$tone === "warning"
        ? "#c2410c"
        : props.$tone === "danger"
          ? "#be123c"
          : props.$tone === "success"
            ? "#15803d"
            : "var(--color-muted)"};
  border: 1px solid
    ${(props) =>
      props.$tone === "accent"
        ? "rgba(233, 61, 93, 0.16)"
        : props.$tone === "warning"
          ? "rgba(251, 146, 60, 0.22)"
          : props.$tone === "danger"
            ? "rgba(244, 63, 94, 0.18)"
            : props.$tone === "success"
              ? "rgba(34, 197, 94, 0.18)"
              : "rgba(148, 163, 184, 0.2)"};
`;

const Notice = styled.div<{ $tone?: "warning" | "danger" | "success" }>`
  border-radius: 18px;
  padding: 14px 16px;
  line-height: 1.55;
  background: ${(props) =>
    props.$tone === "danger"
      ? "#fff1f2"
      : props.$tone === "success"
        ? "#ecfdf3"
        : "#fff7ed"};
  border: 1px solid
    ${(props) =>
      props.$tone === "danger"
        ? "rgba(244, 63, 94, 0.16)"
        : props.$tone === "success"
          ? "rgba(34, 197, 94, 0.16)"
          : "rgba(251, 146, 60, 0.18)"};
  color: ${(props) =>
    props.$tone === "danger" ? "#be123c" : props.$tone === "success" ? "#166534" : "#9a3412"};
`;

const PreviewTable = styled.div`
  display: grid;
  gap: 12px;
`;

const FileStack = styled.div`
  display: grid;
  gap: 12px;
`;

const FileRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #f3f6fb 0%, #eef2f8 100%);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75);

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FileDetails = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

const FileLabel = styled.div`
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
`;

const FileHeadline = styled.div`
  font-weight: 700;
  color: var(--color-text);
`;

const FileMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.5;
  word-break: break-word;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, #f3f6fb 0%, #edf2f7 100%);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
`;

const StatValue = styled.div`
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
`;

const StatLabel = styled.div`
  font-size: 0.82rem;
  color: var(--color-muted);
`;

const RequirementList = styled.div`
  display: grid;
  gap: 8px;
`;

const RequirementItem = styled.div<{ $done?: boolean }>`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 0.9rem;
  line-height: 1.5;
  color: ${(props) => (props.$done ? "#166534" : "#9f1239")};
`;

const PreviewRow = styled.div<{ $tone: "valid" | "warning" | "error" }>`
  border-radius: 20px;
  padding: 14px;
  background: ${(props) =>
    props.$tone === "error" ? "#fff8f8" : props.$tone === "warning" ? "#fffdf8" : "#ffffff"};
  border: 1px solid
    ${(props) =>
      props.$tone === "error"
        ? "rgba(244, 63, 94, 0.18)"
        : props.$tone === "warning"
          ? "rgba(251, 146, 60, 0.18)"
          : "rgba(148, 163, 184, 0.22)"};
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  display: grid;
  gap: 10px;
`;

const PreviewTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
`;

const PreviewTitle = styled.strong`
  color: var(--color-text);
`;

const PreviewMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.5;
`;

const InlineList = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const IssueList = styled.div`
  display: grid;
  gap: 6px;
  color: var(--color-muted);
  font-size: 0.88rem;
`;

const EmptyState = styled.div`
  border-radius: 18px;
  padding: 16px;
  background: linear-gradient(180deg, #f4f7fb 0%, #eef2f7 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: var(--color-muted);
  line-height: 1.55;
`;

type PreviewPayload = {
  filename?: string;
  columns?: string[];
  missingRequiredColumns?: string[];
  globalErrors?: string[];
  summary?: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
  };
  previewRows?: Array<{
    rowNumber: number;
    title: string;
    dealType: string;
    propertyType: string;
    sourceStatus: string;
    importStatus: string;
    location: string;
    imageFilenames: string[];
    fieldErrors: Array<{ field: string; message: string }>;
    warnings: string[];
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
  duplicateArchiveFilenames?: string[];
  invalidArchiveEntries?: string[];
  oversizedFilenames?: string[];
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

type ImportReportPayload = {
  report?: {
    totalRowsProcessed: number;
    propertiesCreated: number;
    imagesUploaded: number;
    rowsSkipped: number;
    failedImages: number;
    createdProperties: Array<{ rowNumber: number; propertyId: string; title: string }>;
    uploadedImages: Array<{ rowNumber: number; propertyId: string; filename: string; sortOrder: number }>;
    skippedRows: Array<{
      rowNumber: number;
      title: string | null;
      fieldErrors: Array<{ field: string; message: string }>;
      missingImageFilenames: string[];
    }>;
    failedImageUploads: Array<{
      rowNumber: number;
      title: string | null;
      propertyId: string | null;
      filename: string;
      reason: string;
    }>;
  };
  error?: string;
};

type VendorImportViewProps = {
  embedded?: boolean;
  vendorId?: string | null;
  onBack?: () => void;
};

export function VendorImportView({ embedded = false, vendorId = null, onBack }: VendorImportViewProps = {}) {
  const { authToken } = useAppState();
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const zipInputRef = useRef<HTMLInputElement | null>(null);
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [imagePreview, setImagePreview] = useState<ImagePreviewPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingZip, setLoadingZip] = useState(false);
  const [importing, setImporting] = useState(false);

  const rowPreview = useMemo(() => {
    const matched = new Set(imagePreview?.matchedFilenames ?? []);
    const zipMissing = new Set(imagePreview?.missingFilenames ?? []);
    return (preview?.previewRows ?? []).map((row) => {
      const missingImages = row.imageFilenames.filter((name) => zipMissing.has(name));
      const duplicateWarnings = imagePreview?.duplicateArchiveFilenames?.length
        ? [`Duplicate filenames in ZIP: ${imagePreview.duplicateArchiveFilenames.join(", ")}.`]
        : [];
      const status = row.fieldErrors.length || missingImages.length || duplicateWarnings.length
        ? "error"
        : row.warnings.length
          ? "warning"
          : "valid";
      return {
        ...row,
        status,
        matchedCount: row.imageFilenames.filter((name) => matched.has(name)).length,
        missingImages,
        extraWarnings: duplicateWarnings,
      };
    });
  }, [imagePreview, preview]);

  const errorRows = useMemo(() => rowPreview.filter((row) => row.status === "error"), [rowPreview]);
  const warningRows = useMemo(() => rowPreview.filter((row) => row.status === "warning"), [rowPreview]);

  const canImport = useMemo(() => {
    if (!spreadsheetFile || !zipFile || !preview || !imagePreview) return false;
    if ((preview.globalErrors?.length ?? 0) > 0) return false;
    if ((preview.missingRequiredColumns?.length ?? 0) > 0) return false;
    if ((imagePreview.duplicateArchiveFilenames?.length ?? 0) > 0) return false;
    return rowPreview.length > 0 && rowPreview.every((row) => row.status === "valid" || row.status === "warning");
  }, [spreadsheetFile, imagePreview, preview, rowPreview, zipFile]);

  const importRequirements = useMemo(
    () => [
      { label: "Spreadsheet uploaded and parsed", done: Boolean(spreadsheetFile && preview) },
      { label: "ZIP uploaded and checked", done: Boolean(zipFile && imagePreview) },
      { label: "No blocking spreadsheet or row errors", done: Boolean(preview) && (preview?.globalErrors?.length ?? 0) === 0 && errorRows.length === 0 },
      { label: "No duplicate ZIP filenames", done: (imagePreview?.duplicateArchiveFilenames?.length ?? 0) === 0 },
    ],
    [errorRows.length, imagePreview, preview, spreadsheetFile, zipFile]
  );

  const handleDownloadTemplate = async () => {
    if (!authToken) return;
    setLoadingTemplate(true);
    setError(null);

    try {
      const response = await fetch("/api/vendor/import/template?format=xlsx", {
        headers: withActiveVendorHeaders(
          {
            Authorization: `Bearer ${authToken}`,
          },
          vendorId
        ),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || "Unable to download Excel template.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "property_bulk_upload_template.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to download template.");
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleSpreadsheetSelected = async (file: File | null) => {
    if (!authToken || !file) return;
    setSpreadsheetFile(file);
    setPreview(null);
    setImagePreview(null);
    setError(null);
    setLoadingPreview(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/vendor/import/preview", {
        method: "POST",
        headers: withActiveVendorHeaders(
          {
            Authorization: `Bearer ${authToken}`,
          },
          vendorId
        ),
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as PreviewPayload | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error || "Unable to preview spreadsheet.");
      }
      setPreview(payload);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Unable to preview spreadsheet.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleZipSelected = async (file: File | null) => {
    if (!authToken || !file) return;
    setZipFile(file);
    setImagePreview(null);
    setError(null);
    setLoadingZip(true);

    try {
      const expectedFilenames = Array.from(
        new Set((preview?.previewRows ?? []).flatMap((row) => row.imageFilenames ?? []).filter(Boolean))
      );
      const formData = new FormData();
      formData.append("file", file);
      formData.append("expectedFilenames", JSON.stringify(expectedFilenames));

      const response = await fetch("/api/vendor/import/images/preview", {
        method: "POST",
        headers: withActiveVendorHeaders(
          {
            Authorization: `Bearer ${authToken}`,
          },
          vendorId
        ),
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as ImagePreviewPayload | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error || "Unable to validate ZIP.");
      }
      setImagePreview(payload);
    } catch (zipError) {
      setError(zipError instanceof Error ? zipError.message : "Unable to validate ZIP.");
    } finally {
      setLoadingZip(false);
    }
  };

  const handleImport = async () => {
    if (!authToken || !spreadsheetFile || !zipFile || !canImport) return;
    setImporting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("spreadsheet", spreadsheetFile);
      formData.append("images", zipFile);
      const response = await fetch("/api/vendor/import/execute", {
        method: "POST",
        headers: withActiveVendorHeaders(
          {
            Authorization: `Bearer ${authToken}`,
          },
          vendorId
        ),
        body: formData,
      });
      const payload = (await response.json().catch(() => null)) as ImportReportPayload | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error || "Unable to import listings.");
      }
      if (onBack) {
        onBack();
      } else {
        window.location.href = "/hub?section=manage-listings";
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Unable to import listings.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Page $embedded={embedded}>
      {importing ? (
        <ImportOverlay>
          <ImportOverlayCard>
            <ImportOverlaySpinner />
            <ImportOverlayTitle>Importing listings</ImportOverlayTitle>
            <ImportOverlayCopy>
              Please wait while we create the listings and attach matched images. Do not close this screen.
            </ImportOverlayCopy>
          </ImportOverlayCard>
        </ImportOverlay>
      ) : null}
      <Shell $embedded={embedded}>
        <GuideHero>
          <GuideImageFrame>
            <GuideImage
              src="/Assets/bulkupload/bulkuploadguide.png"
              alt="Bulk upload listings guide"
              width={1942}
              height={799}
              priority
            />
          </GuideImageFrame>
          {onBack ? (
            <GuideActions>
              <GhostButton type="button" onClick={onBack}>
                <ArrowLeft size={16} />
                Back to listings
              </GhostButton>
            </GuideActions>
          ) : null}
        </GuideHero>

        <ContentGrid>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Files and validation</CardTitle>
                <CardCopy>Keep this simple: download the template, upload the spreadsheet, then upload the ZIP that matches the image columns.</CardCopy>
              </div>
            </CardHeader>
            <ButtonRow>
              <Button type="button" onClick={() => void handleDownloadTemplate()} disabled={loadingTemplate}>
                <Download size={16} />
                {loadingTemplate ? "Preparing template..." : "Download Excel template"}
              </Button>
            </ButtonRow>
            <FileInput
              ref={csvInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv,text/csv"
              onChange={(event) => void handleSpreadsheetSelected(event.target.files?.[0] ?? null)}
            />
            <FileInput ref={zipInputRef} type="file" accept=".zip,application/zip" onChange={(event) => void handleZipSelected(event.target.files?.[0] ?? null)} />

            <FileStack>
              <FileRow>
                <FileDetails>
                  <FileLabel>Step 1</FileLabel>
                  <FileHeadline>Spreadsheet</FileHeadline>
                  <FileMeta>
                    {spreadsheetFile
                      ? spreadsheetFile.name
                      : "Upload the filled Excel template. This checks required columns, row values, and location validation."}
                  </FileMeta>
                </FileDetails>
                <Button type="button" $primary onClick={() => csvInputRef.current?.click()} disabled={loadingPreview}>
                  <FileSpreadsheet size={16} />
                  {loadingPreview ? "Checking..." : spreadsheetFile ? "Replace" : "Upload"}
                </Button>
              </FileRow>

              <FileRow>
                <FileDetails>
                  <FileLabel>Step 2</FileLabel>
                  <FileHeadline>Images ZIP</FileHeadline>
                  <FileMeta>
                    {zipFile
                      ? zipFile.name
                      : "Upload one ZIP after the spreadsheet is ready. Filenames must match image_file_1 to image_file_10."}
                  </FileMeta>
                </FileDetails>
                <Button type="button" onClick={() => zipInputRef.current?.click()} disabled={!preview || loadingZip}>
                  <FileArchive size={16} />
                  {loadingZip ? "Checking..." : zipFile ? "Replace" : "Upload"}
                </Button>
              </FileRow>
            </FileStack>

            {error ? <Notice $tone="danger">{error}</Notice> : null}

            <HelpList>
              <HelpItem>
                <ImageIcon size={16} />
                <span>Use unique image names like `condo-hlaing-1.jpg`, not generic names like `photo1.jpg`.</span>
              </HelpItem>
              <HelpItem>
                <Upload size={16} />
                <span>`image_file_1` becomes the cover image. Up to 10 images are supported per property.</span>
              </HelpItem>
              <HelpItem>
                <AlertTriangle size={16} />
                <span>Recommended image size is under 1 MB each. Images larger than 5 MB are flagged during ZIP validation.</span>
              </HelpItem>
            </HelpList>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Import actions</CardTitle>
                <CardCopy>Import stays locked until the uploaded files pass all blocking checks.</CardCopy>
              </div>
            </CardHeader>
            <StatGrid>
              <StatCard>
                <StatValue>{preview?.summary?.totalRows ?? 0}</StatValue>
                <StatLabel>Total rows</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{preview?.summary?.validRows ?? 0}</StatValue>
                <StatLabel>Ready rows</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{preview?.summary?.errorRows ?? 0}</StatValue>
                <StatLabel>Blocking errors</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{imagePreview?.summary?.missingCount ?? 0}</StatValue>
                <StatLabel>Missing images</StatLabel>
              </StatCard>
            </StatGrid>
            {(preview?.globalErrors?.length ?? 0) > 0 ? <Notice $tone="danger">{preview?.globalErrors?.join(" ")}</Notice> : null}
            {(imagePreview?.duplicateArchiveFilenames?.length ?? 0) > 0 ? (
              <Notice $tone="danger">Duplicate filenames in ZIP: {imagePreview?.duplicateArchiveFilenames?.join(", ")}</Notice>
            ) : null}
            {(imagePreview?.missingFilenames?.length ?? 0) > 0 ? (
              <Notice>
                Missing image files referenced by the spreadsheet: {imagePreview?.missingFilenames?.slice(0, 12).join(", ")}
                {(imagePreview?.missingFilenames?.length ?? 0) > 12 ? "..." : ""}
              </Notice>
            ) : null}
            {(imagePreview?.invalidArchiveEntries?.length ?? 0) > 0 ? (
              <Notice>
                Unsupported files in ZIP were ignored: {imagePreview?.invalidArchiveEntries?.slice(0, 12).join(", ")}
                {(imagePreview?.invalidArchiveEntries?.length ?? 0) > 12 ? "..." : ""}
              </Notice>
            ) : null}
            {(imagePreview?.oversizedFilenames?.length ?? 0) > 0 ? (
              <Notice>
                Large images detected: {imagePreview?.oversizedFilenames?.slice(0, 8).join(", ")}
                {(imagePreview?.oversizedFilenames?.length ?? 0) > 8 ? "..." : ""}
              </Notice>
            ) : null}

            <ButtonRow>
              <PrimaryActionButton type="button" $primary onClick={() => void handleImport()} disabled={!canImport || importing}>
                <Upload size={16} />
                {importing ? "Importing listings..." : "Import rows"}
              </PrimaryActionButton>
            </ButtonRow>
            <RequirementList>
              {importRequirements.map((item) => (
                <RequirementItem key={item.label} $done={item.done}>
                  <span>{item.done ? "✓" : "!"}</span>
                  <span>{item.label}</span>
                </RequirementItem>
              ))}
            </RequirementList>
          </Card>
        </ContentGrid>

        {preview ? (
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Fix before import</CardTitle>
                <CardCopy>Only blocking rows are shown here so you can fix the exact line and field without scanning valid rows.</CardCopy>
              </div>
            </CardHeader>
            {preview.nextStep ? <Notice>{preview.nextStep}</Notice> : null}
            {errorRows.length ? (
              <PreviewTable>
                {errorRows.map((row) => (
                  <PreviewRow key={row.rowNumber} $tone="error">
                    <PreviewTop>
                      <div>
                        <PreviewTitle>
                          Row {row.rowNumber}: {row.title || "Untitled property"}
                        </PreviewTitle>
                        <PreviewMeta>
                          {[row.dealType, row.propertyType, row.location].filter(Boolean).join(" • ") || "Missing location details"}
                        </PreviewMeta>
                      </div>
                      <InlineList>
                        <Pill $tone="danger">Error</Pill>
                        <Pill>Import status: {row.importStatus}</Pill>
                      </InlineList>
                    </PreviewTop>
                    {row.fieldErrors.length ? (
                      <IssueList>
                        {row.fieldErrors.map((issue, index) => (
                          <div key={`${row.rowNumber}-${issue.field}-${index}`}>
                            Column `{issue.field}`: {issue.message}
                          </div>
                        ))}
                      </IssueList>
                    ) : null}
                    {row.missingImages.length || row.extraWarnings.length ? (
                      <IssueList>
                        {row.missingImages.length ? <div>Missing ZIP images: {row.missingImages.join(", ")}</div> : null}
                        {row.extraWarnings.map((warning, index) => (
                          <div key={`${row.rowNumber}-zip-warning-${index}`}>{warning}</div>
                        ))}
                      </IssueList>
                    ) : null}
                  </PreviewRow>
                ))}
              </PreviewTable>
            ) : (
              <EmptyState>No blocking row errors found. If the import button is still locked, check the notices above for ZIP-level issues.</EmptyState>
            )}
            {warningRows.length ? (
              <Notice>
                {warningRows.length} row{warningRows.length === 1 ? "" : "s"} still have warning-only notes, but they do not block import.
              </Notice>
            ) : null}
          </Card>
        ) : null}

      </Shell>
    </Page>
  );
}
