"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { BadgeCheck, Calendar, ChevronDown, ChevronLeft, ChevronRight, Pencil, Search, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

const Page = styled.div`
  display: grid;
  gap: 20px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: var(--color-text);
`;

const Copy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.65;
  max-width: 840px;
`;

const Card = styled.div`
  border-radius: 24px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  padding: 20px;
  display: grid;
  gap: 16px;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(15, 23, 42, 0.52);
  backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 20px;
`;

const OverlayPanel = styled.div`
  width: min(720px, 100%);
  max-height: min(88vh, 920px);
  overflow: auto;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  background: var(--color-surface);
  box-shadow: 0 32px 90px rgba(15, 23, 42, 0.22);
  padding: 24px;
  display: grid;
  gap: 18px;
`;

const OverlayTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: var(--color-text);
`;

const Badge = styled.span<{ $tone?: "success" | "warning" | "neutral" }>`
  width: fit-content;
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${(props) =>
    props.$tone === "success" ? "#0f766e" : props.$tone === "warning" ? "#92400e" : "var(--color-text)"};
  background: ${(props) =>
    props.$tone === "success"
      ? "rgba(16, 185, 129, 0.12)"
      : props.$tone === "warning"
      ? "rgba(245, 158, 11, 0.12)"
      : "rgba(148, 163, 184, 0.1)"};
  border: 1px solid
    ${(props) =>
      props.$tone === "success"
        ? "rgba(16, 185, 129, 0.24)"
        : props.$tone === "warning"
        ? "rgba(245, 158, 11, 0.24)"
        : "var(--color-outline)"};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label`
  display: grid;
  gap: 8px;
  color: var(--color-text);
  font-weight: 600;
`;

const ClickField = styled.button`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  padding: 0 14px;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
`;

const Input = styled.input`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  padding: 0 14px;

  &::placeholder {
    color: var(--color-muted);
  }
`;

const Textarea = styled.textarea`
  height: 160px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  padding: 12px 14px;
  resize: none;
  overflow-y: auto;

  &::placeholder {
    color: var(--color-muted);
  }
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const Button = styled.button`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%);
  color: white;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: transparent;
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;
`;

const InlineRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
`;

const DocumentCard = styled.div`
  border-radius: 18px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  padding: 16px;
  display: grid;
  gap: 12px;
`;

const UploadArea = styled.button<{ $uploaded?: boolean }>`
  border-radius: 20px;
  border: 1px dashed ${(props) => (props.$uploaded ? "rgba(16, 185, 129, 0.34)" : "rgba(255, 61, 93, 0.28)")};
  background: ${(props) => (props.$uploaded ? "rgba(16, 185, 129, 0.06)" : "rgba(255, 61, 93, 0.05)")};
  padding: 18px;
  display: grid;
  gap: 14px;
  text-align: left;
  cursor: ${(props) => (props.$uploaded ? "default" : "pointer")};
`;

const UploadThumb = styled.img`
  width: 100%;
  max-height: 240px;
  object-fit: contain;
  border-radius: 16px;
  border: 1px solid var(--color-outline);
  background: var(--color-paper);
  padding: 8px;
`;

const UploadSkeleton = styled.div`
  border-radius: 20px;
  border: 1px solid var(--color-outline);
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.7) 0%, rgba(241, 245, 249, 1) 50%, rgba(226, 232, 240, 0.7) 100%);
  background-size: 200% 100%;
  min-height: 220px;
  animation: verificationUploadPulse 1.4s ease-in-out infinite;

  @keyframes verificationUploadPulse {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const UploadMeta = styled.div`
  display: grid;
  gap: 6px;
  color: var(--color-muted);
  font-size: 0.92rem;
`;

const Note = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(245, 158, 11, 0.22);
  background: rgba(255, 210, 92, 0.08);
  padding: 14px 16px;
  color: #92400e;
  line-height: 1.6;
`;

const GuidanceList = styled.ul`
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  line-height: 1.6;
`;

const Success = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(111, 232, 192, 0.22);
  background: rgba(111, 232, 192, 0.08);
  padding: 14px 16px;
  color: #0f766e;
  line-height: 1.6;
`;

const BenefitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const BenefitCard = styled.div`
  border-radius: 18px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  padding: 16px;
  display: grid;
  gap: 8px;
`;

const BenefitTop = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text);
  font-weight: 800;

  svg {
    width: 16px;
    height: 16px;
    color: #e93d5d;
  }
`;

const BenefitCopy = styled.div`
  color: var(--color-muted);
  line-height: 1.45;
  font-size: 0.94rem;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const DateFieldWrap = styled.div`
  position: relative;
  display: grid;
  gap: 8px;
`;

const DateTrigger = styled.button`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
`;

const DateValue = styled.span<{ $muted?: boolean }>`
  color: ${(props) => (props.$muted ? "var(--color-muted)" : "var(--color-text)")};
`;

const DateOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 95;
  background: rgba(15, 23, 42, 0.3);
  display: grid;
  place-items: center;
  padding: 20px;
`;

const DateCard = styled.div`
  width: min(360px, 100%);
  border-radius: 22px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.18);
  padding: 16px;
  display: grid;
  gap: 14px;
`;

const DateCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const DateNav = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const DateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

const DateDay = styled.button<{ $muted?: boolean; $active?: boolean }>`
  min-height: 38px;
  border-radius: 10px;
  border: 1px solid ${(props) => (props.$active ? "rgba(255, 61, 93, 0.28)" : "transparent")};
  background: ${(props) => (props.$active ? "rgba(255, 61, 93, 0.12)" : "transparent")};
  color: ${(props) => (props.$muted ? "var(--color-muted)" : "var(--color-text)")};
  font-weight: ${(props) => (props.$active ? 700 : 500)};
  cursor: pointer;
`;

const EventList = styled.div`
  display: grid;
  gap: 10px;
`;

const EventRow = styled.div`
  border-radius: 16px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  padding: 14px 16px;
  display: grid;
  gap: 6px;
`;

type VerificationData = {
  vendor: {
    id: string;
    name: string;
    plan: string | null;
    verification_status: string | null;
    verified_at: string | null;
    verification_expires_at: string | null;
    verification_level: string | null;
    verification_score: number | null;
    verification_rejection_reason_code: string | null;
    verification_rank_bonus: number;
  };
  verification: {
    includedInPlan: boolean;
    latestRequest: {
      id: string;
      status: string;
      notes: string | null;
      review_notes: string | null;
      included_in_plan: boolean;
      requested_at: string | null;
      reviewed_at: string | null;
      request_type: string;
      business_name_submitted: string | null;
      license_number: string | null;
      company_registration_number: string | null;
      tax_id: string | null;
      office_address: string | null;
      contact_person_name: string | null;
      contact_person_role: string | null;
      contact_person_phone: string | null;
      contact_person_email: string | null;
      decision_reason_code: string | null;
      checklist_json: Record<string, unknown>;
    } | null;
    documents: Array<{
      id: string;
      document_type: string;
      document_name: string;
      document_url: string;
      document_side: string | null;
      mime_type: string | null;
      file_size_bytes: number | null;
      storage_path: string | null;
      document_number: string | null;
      document_issued_at: string | null;
      document_expires_at: string | null;
      document_country: string | null;
      is_primary: boolean;
      review_status: string;
      review_notes: string | null;
      created_at: string | null;
    }>;
    events: Array<{
      id: string;
      event_type: string;
      from_status: string | null;
      to_status: string | null;
      notes: string | null;
      metadata_json: Record<string, unknown>;
      created_at: string | null;
      actor_name: string;
    }>;
  };
};

type DocumentDraft = {
  document_type: string;
  document_name: string;
  document_url: string;
  document_side: string;
  mime_type: string;
  file_size_bytes: string;
  storage_path: string;
  document_number: string;
  document_issued_at: string;
  document_expires_at: string;
  document_country: string;
  is_primary: boolean;
};

type VerificationForm = {
  request_type: string;
  business_name_submitted: string;
  license_number: string;
  company_registration_number: string;
  tax_id: string;
  office_address: string;
  contact_person_name: string;
  contact_person_role: string;
  contact_person_phone: string;
  contact_person_email: string;
  notes: string;
};

function prettyStatus(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function toAgencyStatus(status: string | null | undefined) {
  if (status === "approved") return "verified";
  if (status === "changes_requested") return "needs_changes";
  if (status === "not_requested" || status === "pending" || status === "rejected" || status === "verified") {
    return status;
  }
  return "not_requested";
}

function agencyStatusLabel(status: string | null | undefined) {
  const normalized = toAgencyStatus(status);
  if (normalized === "pending") return "Pending Review";
  if (normalized === "needs_changes") return "Needs Changes";
  if (normalized === "verified") return "Verified Agency";
  if (normalized === "rejected") return "Rejected";
  return "Not Requested";
}

function agencyStatusCopy(status: string | null | undefined) {
  const normalized = toAgencyStatus(status);
  if (normalized === "pending") return "Your documents are under review. We will update you within 1 week.";
  if (normalized === "needs_changes") return "Please update the requested information and resubmit.";
  if (normalized === "verified") return "Your agency is verified.";
  if (normalized === "rejected") {
    return "Your verification request was rejected. Please review the notes and submit again.";
  }
  return "Submit your agency verification package for manual review.";
}

function toneForStatus(status: string | null | undefined) {
  const normalized = toAgencyStatus(status);
  if (normalized === "verified") return "success" as const;
  if (normalized === "pending" || normalized === "needs_changes") return "warning" as const;
  return "neutral" as const;
}

function normalizeRequestType(value: string | null | undefined) {
  return value === "resubmission" ? "resubmission" : "initial";
}

function normalizeDocumentType(value: string | null | undefined) {
  const documentTypeMap: Record<string, string> = {
    business_license: "business_license",
    company_registration_certificate: "company_registration_certificate",
    tax_registration: "other",
    office_proof: "office_address_proof",
    owner_nrc: "owner_director_id",
    manager_nrc: "owner_director_id",
    authorization_letter: "authorization_letter",
    bank_account_proof: "other",
    supporting_document: "other",
    dica_myco_extract: "dica_myco_extract",
    real_estate_broker_certificate: "real_estate_broker_certificate",
    owner_director_id: "owner_director_id",
    office_address_proof: "office_address_proof",
    company_stamp_letterhead: "company_stamp_letterhead",
    other: "other",
  };

  return documentTypeMap[value ?? ""] ?? "other";
}

function documentTypeLabel(value: string | null | undefined) {
  const normalized = normalizeDocumentType(value);
  const labels: Record<string, string> = {
    company_registration_certificate: "Company Registration Certificate",
    dica_myco_extract: "DICA / MyCO Company Extract",
    business_license: "Business License",
    real_estate_broker_certificate: "Real Estate Agent / Broker Certificate",
    owner_director_id: "Owner / Director NRC or Passport",
    office_address_proof: "Office Address Proof",
    authorization_letter: "Authorization Letter",
    company_stamp_letterhead: "Company Stamp / Letterhead",
    other: "Other Supporting Document",
  };
  return labels[normalized] ?? "Other Supporting Document";
}

function normalizeDocumentSide(value: string | null | undefined) {
  if (value === "front" || value === "back") return value;
  return "not_specified";
}

function parseDateOnly(value: string | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateString(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const start = new Date(year, month, 1);
  const startDay = start.getDay();
  const first = new Date(year, month, 1 - startDay);
  const days: Array<{ date: Date; inMonth: boolean }> = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(first);
    current.setDate(first.getDate() + i);
    days.push({ date: current, inMonth: current.getMonth() === month });
  }

  return days;
}

function formatDatePickerLabel(value: string | undefined) {
  const parsed = parseDateOnly(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function VerificationDatePicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDateOnly(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate ?? new Date());
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <DateFieldWrap>
      <DateTrigger
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setCurrentMonth(selectedDate ?? new Date());
          setOpen(true);
        }}
      >
        <DateValue $muted={!value}>{formatDatePickerLabel(value) || "Select date"}</DateValue>
        <InlineRow style={{ gap: 8, flexWrap: "nowrap" }}>
          <Calendar size={14} />
          <ChevronDown size={16} />
        </InlineRow>
      </DateTrigger>
      {open ? (
        <DateOverlay onClick={() => setOpen(false)}>
          <DateCard onClick={(event) => event.stopPropagation()}>
            <DateCardHeader>
              <DateNav type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                <ChevronLeft size={16} />
              </DateNav>
              <strong>{monthLabel}</strong>
              <DateNav type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                <ChevronRight size={16} />
              </DateNav>
            </DateCardHeader>
            <DateGrid>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span
                  key={day}
                  style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-muted)", fontWeight: 600 }}
                >
                  {day}
                </span>
              ))}
              {days.map((item) => {
                const key = toDateString(item.date);
                return (
                  <DateDay
                    key={key}
                    type="button"
                    $muted={!item.inMonth}
                    $active={value === key}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                  >
                    {item.date.getDate()}
                  </DateDay>
                );
              })}
            </DateGrid>
          </DateCard>
        </DateOverlay>
      ) : null}
    </DateFieldWrap>
  );
}

export function VendorVerificationView() {
  const { authToken } = useAppState();
  const router = useRouter();
  const [data, setData] = useState<VerificationData | null>(null);
  const [form, setForm] = useState<VerificationForm>({
    request_type: "initial",
    business_name_submitted: "",
    license_number: "",
    company_registration_number: "",
    tax_id: "",
    office_address: "",
    contact_person_name: "",
    contact_person_role: "",
    contact_person_phone: "",
    contact_person_email: "",
    notes: "",
  });
  const [documents, setDocuments] = useState<DocumentDraft[]>([
    {
      document_type: "business_license",
      document_name: "",
      document_url: "",
      document_side: "not_specified",
      mime_type: "",
      file_size_bytes: "",
      storage_path: "",
      document_number: "",
      document_issued_at: "",
      document_expires_at: "",
      document_country: "",
      is_primary: true,
    },
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocumentIndex, setUploadingDocumentIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [nameEditorOpen, setNameEditorOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const notesWordLimit = 120;
  const emailIsValid =
    !form.contact_person_email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_person_email.trim());

  const currentAgencyStatus = toAgencyStatus(
    data?.verification.latestRequest?.status || data?.vendor.verification_status || "not_requested"
  );
  const showReadOnlyStatus = currentAgencyStatus === "pending" || currentAgencyStatus === "verified";

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.business_name_submitted.trim() &&
          form.office_address.trim() &&
          form.contact_person_name.trim() &&
          form.contact_person_phone.trim() &&
          emailIsValid &&
          documents.some((item) => item.document_type.trim() && item.document_url.trim())
      ),
    [documents, emailIsValid, form]
  );

  const primaryDocument = documents[0];
  const notesWordCount = form.notes.trim() ? form.notes.trim().split(/\s+/).length : 0;

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/vendor/verification", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json()) as VerificationData & { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load verification data.");
        }
        if (!cancelled) {
          setData(payload);
          const latest = payload.verification.latestRequest;
          setForm({
            request_type: normalizeRequestType(latest?.request_type),
            business_name_submitted: latest?.business_name_submitted || payload.vendor.name || "",
            license_number: latest?.license_number || "",
            company_registration_number: latest?.company_registration_number || "",
            tax_id: latest?.tax_id || "",
            office_address: latest?.office_address || "",
            contact_person_name: latest?.contact_person_name || "",
            contact_person_role: latest?.contact_person_role || "",
            contact_person_phone: latest?.contact_person_phone || "",
            contact_person_email: latest?.contact_person_email || "",
            notes: latest?.notes || "",
          });
          setNameDraft(latest?.business_name_submitted || payload.vendor.name || "");
          const firstDocument = payload.verification.documents[0];
          setDocuments([
            firstDocument
              ? {
                  document_type: normalizeDocumentType(firstDocument.document_type),
                  document_name: firstDocument.document_name,
                  document_url: firstDocument.document_url,
                  document_side: normalizeDocumentSide(firstDocument.document_side),
                  mime_type: firstDocument.mime_type || "",
                  file_size_bytes: firstDocument.file_size_bytes ? String(firstDocument.file_size_bytes) : "",
                  storage_path: firstDocument.storage_path || "",
                  document_number: firstDocument.document_number || "",
                  document_issued_at: firstDocument.document_issued_at ? firstDocument.document_issued_at.slice(0, 10) : "",
                  document_expires_at: firstDocument.document_expires_at ? firstDocument.document_expires_at.slice(0, 10) : "",
                  document_country: firstDocument.document_country || "",
                  is_primary: true,
                }
              : {
                  document_type: "business_license",
                  document_name: "",
                  document_url: "",
                  document_side: "not_specified",
                  mime_type: "",
                  file_size_bytes: "",
                  storage_path: "",
                  document_number: "",
                  document_issued_at: "",
                  document_expires_at: "",
                  document_country: "",
                  is_primary: true,
                },
          ]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load verification data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  const updateDocument = (index: number, key: keyof DocumentDraft, value: string | boolean) => {
    setDocuments((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item))
    );
  };

  const openNameEditor = () => {
    setNameDraft(form.business_name_submitted);
    setNameEditorOpen(true);
  };

  const applyBusinessName = () => {
    setForm((current) => ({ ...current, business_name_submitted: nameDraft }));
    setNameEditorOpen(false);
  };

  const updateNotes = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setForm((current) => ({ ...current, notes: value }));
      return;
    }
    const words = trimmed.split(/\s+/);
    if (words.length <= notesWordLimit) {
      setForm((current) => ({ ...current, notes: value }));
      return;
    }
    setForm((current) => ({ ...current, notes: words.slice(0, notesWordLimit).join(" ") }));
  };

  const handleDocumentPhotoUpload = async (index: number, file: File | null) => {
    if (!authToken || !file) return;
    setUploadingDocumentIndex(index);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/vendor/verification-document-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            publicUrl?: string;
            storagePath?: string;
            mimeType?: string;
            fileSizeBytes?: number;
          }
        | null;

      if (!response.ok || !payload?.publicUrl) {
        throw new Error(payload?.error || "Unable to upload document photo.");
      }

      setDocuments((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                document_name: item.document_name || documentTypeLabel(item.document_type),
                document_url: payload.publicUrl ?? "",
                storage_path: payload.storagePath ?? "",
                mime_type: payload.mimeType ?? item.mime_type,
                file_size_bytes:
                  typeof payload.fileSizeBytes === "number" ? String(payload.fileSizeBytes) : item.file_size_bytes,
              }
            : item
        )
      );
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload document photo.");
    } finally {
      setUploadingDocumentIndex(null);
    }
  };

  const handleSubmit = async () => {
    if (!authToken || !canSubmit) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/vendor/verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          ...form,
          documents,
        }),
      });
      const payload = (await response.json()) as VerificationData & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit verification request.");
      }
      setData(payload);
      router.push("/hub");
      return;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit verification request.");
    } finally {
      setSubmitting(false);
      setSubmitConfirmOpen(false);
    }
  };

  if (loading) {
    return <LoadingOverlay message="Loading verification..." />;
  }

  return (
    <Page>
      <div>
        <Title>Verification</Title>
        <Copy>
          Submit your agency verification package for manual review. Only document photos are accepted for this flow.
        </Copy>
      </div>

      {error ? <Note>{error}</Note> : null}
      {message ? <Success>{message}</Success> : null}

      <Card>
        <InlineRow>
          <ShieldCheck size={18} />
          <Badge $tone={toneForStatus(currentAgencyStatus)}>{agencyStatusLabel(currentAgencyStatus)}</Badge>
        </InlineRow>
        <Copy>{agencyStatusCopy(currentAgencyStatus)}</Copy>
        {data?.verification.latestRequest?.review_notes ? (
          <Note>Admin review notes: {data.verification.latestRequest.review_notes}</Note>
        ) : null}
      </Card>

      {currentAgencyStatus === "pending" ? (
        <Card>
          <Title style={{ fontSize: "1.1rem" }}>Verified benefits</Title>
          <Copy>
            What changes after approval.
          </Copy>
          <BenefitGrid>
            <BenefitCard>
              <BenefitTop>
                <BadgeCheck />
                <span>Trust badge</span>
              </BenefitTop>
              <BenefitCopy>Show a verified badge on your agency presence.</BenefitCopy>
            </BenefitCard>
            <BenefitCard>
              <BenefitTop>
                <Search />
                <span>Search boost</span>
              </BenefitTop>
              <BenefitCopy>Get stronger ranking support in matching search results.</BenefitCopy>
            </BenefitCard>
            <BenefitCard>
              <BenefitTop>
                <Sparkles />
                <span>Boostings access</span>
              </BenefitTop>
              <BenefitCopy>Unlock hero ads, ranking boosts, and listing boostings.</BenefitCopy>
            </BenefitCard>
            <BenefitCard>
              <BenefitTop>
                <ShieldCheck />
                <span>Buyer confidence</span>
              </BenefitTop>
              <BenefitCopy>Your agency feels safer and more trusted to buyers.</BenefitCopy>
            </BenefitCard>
          </BenefitGrid>
        </Card>
      ) : null}

      {!showReadOnlyStatus ? (
        <>
      <Card>
        <Title style={{ fontSize: "1.1rem" }}>Business profile</Title>
        <Grid>
          <Field>
            Request type
            <CustomSelect
              id="verification-request-type"
              name="request_type"
              label="Request type"
              value={form.request_type}
              onChange={(value) => setForm((current) => ({ ...current, request_type: value }))}
              hideLabel
            >
              <option value="initial">Initial</option>
              <option value="resubmission">Update / Resubmission</option>
            </CustomSelect>
          </Field>
          <Field>
            Business name
            <ClickField type="button" onClick={openNameEditor}>
              <span>{form.business_name_submitted || "Registered agency name"}</span>
              <Pencil size={16} />
            </ClickField>
          </Field>
          <Field>
            Business or agency license number
            <Input
              value={form.license_number}
              onChange={(event) => setForm((current) => ({ ...current, license_number: event.target.value }))}
              placeholder="Agency or business license number"
            />
          </Field>
          <Field>
            Company registration number
            <Input
              value={form.company_registration_number}
              onChange={(event) =>
                setForm((current) => ({ ...current, company_registration_number: event.target.value }))
              }
              placeholder="Registration number"
            />
          </Field>
          <Field>
            Tax ID
            <Input
              value={form.tax_id}
              onChange={(event) => setForm((current) => ({ ...current, tax_id: event.target.value }))}
              placeholder="Tax registration ID"
            />
          </Field>
          <Field>
            Office address
            <Input
              value={form.office_address}
              onChange={(event) => setForm((current) => ({ ...current, office_address: event.target.value }))}
              placeholder="Registered office address"
            />
          </Field>
        </Grid>
      </Card>

      <Card>
        <Title style={{ fontSize: "1.1rem" }}>Contact person</Title>
        <Grid>
          <Field>
            Responsible person
            <Input
              value={form.contact_person_name}
              onChange={(event) => setForm((current) => ({ ...current, contact_person_name: event.target.value }))}
              placeholder="Responsible person"
            />
          </Field>
          <Field>
            Role
            <Input
              value={form.contact_person_role}
              onChange={(event) => setForm((current) => ({ ...current, contact_person_role: event.target.value }))}
              placeholder="Owner, Director, Operations Lead"
            />
          </Field>
          <Field>
            Phone
            <Input
              value={form.contact_person_phone}
              onChange={(event) => setForm((current) => ({ ...current, contact_person_phone: event.target.value }))}
              placeholder="09..."
            />
          </Field>
          <Field>
            Email
            <Input
              type="email"
              value={form.contact_person_email}
              onChange={(event) => setForm((current) => ({ ...current, contact_person_email: event.target.value }))}
              placeholder="name@agency.com"
            />
          </Field>
        </Grid>
      </Card>

      <Card>
        <Field>
          Agency verification notes
          <Textarea
            value={form.notes}
            onChange={(event) => updateNotes(event.target.value)}
            placeholder="Describe your service area, operating history, or anything the review team should know."
          />
          <Copy style={{ fontSize: "0.92rem", maxWidth: "none" }}>{notesWordCount} / {notesWordLimit} words</Copy>
        </Field>
      </Card>

      <Card>
        <InlineRow style={{ justifyContent: "space-between" }}>
          <div>
            <Title style={{ fontSize: "1.1rem" }}>Documents</Title>
            <Copy>Upload one clear document photo for review. Once uploaded, it stays locked for this submission.</Copy>
          </div>
        </InlineRow>
        <Note>
          <strong>Recommended documents</strong>
          <GuidanceList>
            <li>Required: Company Registration Certificate or Business License.</li>
            <li>Required: Owner / Director NRC or Passport.</li>
            <li>Recommended: DICA / MyCO Company Extract and Office Address Proof.</li>
            <li>Optional: Real Estate Agent / Broker Certificate if available.</li>
            <li>Authorization Letter is only required if the applicant is not the owner or director.</li>
          </GuidanceList>
        </Note>
        <HiddenFileInput
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          disabled={uploadingDocumentIndex === 0 || Boolean(primaryDocument?.document_url)}
          onChange={(event) => void handleDocumentPhotoUpload(0, event.target.files?.[0] ?? null)}
        />
        {uploadingDocumentIndex === 0 ? (
          <UploadSkeleton aria-label="Uploading document photo" />
        ) : (
          <UploadArea
            type="button"
            $uploaded={Boolean(primaryDocument?.document_url)}
            onClick={() => {
              if (primaryDocument?.document_url || uploadingDocumentIndex === 0) return;
              uploadInputRef.current?.click();
            }}
          >
            {primaryDocument?.document_url ? (
              <>
                <UploadThumb
                  src={primaryDocument.document_url}
                  alt={documentTypeLabel(primaryDocument.document_type)}
                />
                <UploadMeta>
                  <strong style={{ color: "var(--color-text)" }}>{documentTypeLabel(primaryDocument.document_type)}</strong>
                  <span>Your uploaded photo is attached to this verification request.</span>
                </UploadMeta>
              </>
            ) : (
              <>
                <InlineRow>
                  <Upload size={18} />
                  <strong>Upload document photo</strong>
                </InlineRow>
                <Copy style={{ maxWidth: "none" }}>
                  Choose one clear image from your device. After upload, it will appear here as the review thumbnail.
                </Copy>
              </>
            )}
          </UploadArea>
        )}
        <DocumentCard>
          <Grid>
            <Field>
              Document type
              <CustomSelect
                id="verification-document-type"
                name="document_type"
                label="Document type"
                value={primaryDocument.document_type}
                onChange={(value) => {
                  updateDocument(0, "document_type", value);
                  updateDocument(0, "document_name", documentTypeLabel(value));
                }}
                hideLabel
              >
                <option value="company_registration_certificate">Company Registration Certificate</option>
                <option value="dica_myco_extract">DICA / MyCO Company Extract</option>
                <option value="business_license">Business License</option>
                <option value="real_estate_broker_certificate">Real Estate Agent / Broker Certificate</option>
                <option value="owner_director_id">Owner / Director NRC or Passport</option>
                <option value="office_address_proof">Office Address Proof</option>
                <option value="authorization_letter">Authorization letter</option>
                <option value="company_stamp_letterhead">Company Stamp / Letterhead</option>
                <option value="other">Other Supporting Document</option>
                </CustomSelect>
              </Field>
            <Field>
              Document number
              <Input
                value={primaryDocument.document_number}
                onChange={(event) => updateDocument(0, "document_number", event.target.value)}
                placeholder="Optional document number"
              />
            </Field>
            <Field>
              Issued date
              <VerificationDatePicker
                id="verification-document-issued-at"
                value={primaryDocument.document_issued_at}
                onChange={(value) => updateDocument(0, "document_issued_at", value)}
              />
            </Field>
            <Field>
              Expiry date
              <VerificationDatePicker
                id="verification-document-expires-at"
                value={primaryDocument.document_expires_at}
                onChange={(value) => updateDocument(0, "document_expires_at", value)}
              />
            </Field>
          </Grid>
        </DocumentCard>
      </Card>

      {!showReadOnlyStatus && data?.verification.events.length ? (
        <Card>
          <Title style={{ fontSize: "1.1rem" }}>Verification timeline</Title>
          <EventList>
            {data.verification.events.map((event) => (
              <EventRow key={event.id}>
                <strong>
                  {prettyStatus(event.event_type)} by {event.actor_name}
                </strong>
                <span style={{ color: "var(--color-muted)" }}>
                  {event.created_at ? new Date(event.created_at).toLocaleString() : "Unknown time"}
                </span>
                {event.notes ? <span>{event.notes}</span> : null}
              </EventRow>
            ))}
          </EventList>
        </Card>
      ) : null}

      <ActionRow>
        <Button
          type="button"
          disabled={!canSubmit || submitting || uploadingDocumentIndex !== null}
          onClick={() => setSubmitConfirmOpen(true)}
        >
          {submitting ? "Submitting..." : uploadingDocumentIndex !== null ? "Uploading document..." : "Submit verification request"}
        </Button>
      </ActionRow>
        </>
      ) : null}

      {nameEditorOpen && !showReadOnlyStatus ? (
        <Overlay>
          <OverlayPanel>
            <OverlayTitle>Edit business name</OverlayTitle>
            <Copy>
              If this is different from your current agency name, we will update the public agency name after verification is approved.
            </Copy>
            <Field>
              Business name
              <Input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} placeholder="Registered agency name" />
            </Field>
            <ActionRow>
              <Button type="button" onClick={applyBusinessName} disabled={!nameDraft.trim()}>
                Save name
              </Button>
              <SecondaryButton type="button" onClick={() => setNameEditorOpen(false)}>
                Cancel
              </SecondaryButton>
            </ActionRow>
          </OverlayPanel>
        </Overlay>
      ) : null}

      {submitConfirmOpen && !showReadOnlyStatus ? (
        <Overlay>
          <OverlayPanel>
            <OverlayTitle>Confirm verification submission</OverlayTitle>
            <Copy>
              Please double-check your business details and uploaded document photo before sending this verification request.
            </Copy>
            <Note>
              You are submitting:
              <GuidanceList>
                <li>Business name: {form.business_name_submitted || "Not set"}</li>
                <li>Responsible person: {form.contact_person_name || "Not set"}</li>
                <li>Document attached: {primaryDocument?.document_name || "Not set"}</li>
              </GuidanceList>
            </Note>
            <ActionRow>
              <Button
                type="button"
                disabled={!canSubmit || submitting || uploadingDocumentIndex !== null}
                onClick={() => void handleSubmit()}
              >
                {submitting ? "Submitting..." : "Confirm and submit"}
              </Button>
              <SecondaryButton type="button" onClick={() => setSubmitConfirmOpen(false)} disabled={submitting}>
                Go back
              </SecondaryButton>
            </ActionRow>
          </OverlayPanel>
        </Overlay>
      ) : null}
    </Page>
  );
}
