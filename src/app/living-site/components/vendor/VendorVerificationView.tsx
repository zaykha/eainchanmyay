"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
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

const Select = styled.select`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  padding: 0 14px;
`;

const Textarea = styled.textarea`
  min-height: 130px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  padding: 12px 14px;
  resize: vertical;

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

const UploadPreview = styled.div`
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-paper);
  padding: 12px;
  display: grid;
  gap: 10px;

  img {
    width: 100%;
    max-height: 220px;
    object-fit: cover;
    border-radius: 10px;
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

const Success = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(111, 232, 192, 0.22);
  background: rgba(111, 232, 192, 0.08);
  padding: 14px 16px;
  color: #0f766e;
  line-height: 1.6;
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

function toneForStatus(status: string | null | undefined) {
  if (status === "approved") return "success" as const;
  if (status === "pending" || status === "changes_requested") return "warning" as const;
  return "neutral" as const;
}

export function VendorVerificationView() {
  const { authToken } = useAppState();
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
      document_side: "",
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

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.business_name_submitted.trim() &&
          form.office_address.trim() &&
          form.contact_person_name.trim() &&
          form.contact_person_phone.trim() &&
          documents.some((item) => item.document_type.trim() && item.document_name.trim() && item.document_url.trim())
      ),
    [documents, form]
  );

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
            request_type: latest?.request_type || "initial",
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
          setDocuments(
            payload.verification.documents.length
              ? payload.verification.documents.map((item) => ({
                  document_type: item.document_type,
                  document_name: item.document_name,
                  document_url: item.document_url,
                  document_side: item.document_side || "",
                  mime_type: item.mime_type || "",
                  file_size_bytes: item.file_size_bytes ? String(item.file_size_bytes) : "",
                  storage_path: item.storage_path || "",
                  document_number: item.document_number || "",
                  document_issued_at: item.document_issued_at ? item.document_issued_at.slice(0, 10) : "",
                  document_expires_at: item.document_expires_at ? item.document_expires_at.slice(0, 10) : "",
                  document_country: item.document_country || "",
                  is_primary: item.is_primary,
                }))
              : [
                  {
                    document_type: "business_license",
                    document_name: "",
                    document_url: "",
                    document_side: "",
                    mime_type: "",
                    file_size_bytes: "",
                    storage_path: "",
                    document_number: "",
                    document_issued_at: "",
                    document_expires_at: "",
                    document_country: "",
                    is_primary: true,
                  },
                ]
          );
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
      setMessage("Verification request submitted. The admin review queue is now updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit verification request.");
    } finally {
      setSubmitting(false);
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
          <Badge $tone={toneForStatus(data?.vendor.verification_status)}>
            {prettyStatus(data?.verification.latestRequest?.status || data?.vendor.verification_status || "not_requested")}
          </Badge>
          <span style={{ color: "var(--color-muted)" }}>
            {data?.verification.includedInPlan
              ? "Verification package included in this plan."
              : "Verification is handled as a manual paid review."}
          </span>
        </InlineRow>
        <Copy>
          Level: {prettyStatus(data?.vendor.verification_level || "not_set")} | Score:{" "}
          {data?.vendor.verification_score ?? "Not scored"} | Rank bonus: {data?.vendor.verification_rank_bonus ?? 0}
        </Copy>
        {data?.vendor.verification_expires_at ? (
          <Copy>Verification expires: {new Date(data.vendor.verification_expires_at).toLocaleDateString()}</Copy>
        ) : null}
        {data?.verification.latestRequest?.review_notes ? (
          <Note>Admin review notes: {data.verification.latestRequest.review_notes}</Note>
        ) : null}
      </Card>

      <Card>
        <Title style={{ fontSize: "1.1rem" }}>Business profile</Title>
        <Grid>
          <Field>
            Request type
            <Select
              value={form.request_type}
              onChange={(event) => setForm((current) => ({ ...current, request_type: event.target.value }))}
            >
              <option value="initial">Initial</option>
              <option value="resubmission">Resubmission</option>
              <option value="renewal">Renewal</option>
            </Select>
          </Field>
          <Field>
            Business name
            <Input
              value={form.business_name_submitted}
              onChange={(event) =>
                setForm((current) => ({ ...current, business_name_submitted: event.target.value }))
              }
              placeholder="Registered agency name"
            />
          </Field>
          <Field>
            License number
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
            Full name
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
              placeholder="Owner, Director, Operations lead"
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
            onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Describe your service area, operating history, or anything the review team should know."
          />
        </Field>
      </Card>

      <Card>
        <InlineRow style={{ justifyContent: "space-between" }}>
          <div>
            <Title style={{ fontSize: "1.1rem" }}>Documents</Title>
            <Copy>Upload document photos only. Each upload stores the image plus its review metadata.</Copy>
          </div>
          <SecondaryButton
            type="button"
            onClick={() =>
              setDocuments((current) => [
                ...current,
                {
                  document_type: "supporting_document",
                  document_name: "",
                  document_url: "",
                  document_side: "",
                  mime_type: "",
                  file_size_bytes: "",
                  storage_path: "",
                  document_number: "",
                  document_issued_at: "",
                  document_expires_at: "",
                  document_country: "",
                  is_primary: false,
                },
              ])
            }
          >
            <Plus size={16} style={{ marginRight: 6 }} />
            Add document
          </SecondaryButton>
        </InlineRow>
        {documents.map((document, index) => (
          <DocumentCard key={`document-${index}`}>
            <Grid>
              <Field>
                Document type
                <Select
                  value={document.document_type}
                  onChange={(event) => updateDocument(index, "document_type", event.target.value)}
                >
                  <option value="business_license">Business license</option>
                  <option value="company_registration_certificate">Company registration certificate</option>
                  <option value="tax_registration">Tax registration</option>
                  <option value="office_proof">Office proof</option>
                  <option value="owner_nrc">Owner NRC</option>
                  <option value="manager_nrc">Manager NRC</option>
                  <option value="authorization_letter">Authorization letter</option>
                  <option value="bank_account_proof">Bank account proof</option>
                  <option value="supporting_document">Supporting document</option>
                </Select>
              </Field>
              <Field>
                Document name
                <Input
                  value={document.document_name}
                  onChange={(event) => updateDocument(index, "document_name", event.target.value)}
                  placeholder="Agency business license"
                />
              </Field>
              <Field>
                Document photo
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploadingDocumentIndex === index}
                  onChange={(event) => void handleDocumentPhotoUpload(index, event.target.files?.[0] ?? null)}
                />
              </Field>
              <Field>
                Storage path
                <Input
                  value={document.storage_path}
                  readOnly
                  placeholder="Filled after upload"
                />
              </Field>
              <Field>
                Side
                <Select
                  value={document.document_side}
                  onChange={(event) => updateDocument(index, "document_side", event.target.value)}
                >
                  <option value="">Not specified</option>
                  <option value="front">Front</option>
                  <option value="back">Back</option>
                  <option value="full">Full</option>
                  <option value="supporting">Supporting</option>
                </Select>
              </Field>
              <Field>
                MIME type
                <Input
                  value={document.mime_type}
                  readOnly
                  placeholder="Detected from uploaded photo"
                />
              </Field>
              <Field>
                File size bytes
                <Input
                  value={document.file_size_bytes}
                  readOnly
                  placeholder="Filled after upload"
                />
              </Field>
              <Field>
                Document number
                <Input
                  value={document.document_number}
                  onChange={(event) => updateDocument(index, "document_number", event.target.value)}
                  placeholder="Optional document number"
                />
              </Field>
              <Field>
                Issued date
                <Input
                  type="date"
                  value={document.document_issued_at}
                  onChange={(event) => updateDocument(index, "document_issued_at", event.target.value)}
                />
              </Field>
              <Field>
                Expiry date
                <Input
                  type="date"
                  value={document.document_expires_at}
                  onChange={(event) => updateDocument(index, "document_expires_at", event.target.value)}
                />
              </Field>
              <Field>
                Document country
                <Input
                  value={document.document_country}
                  onChange={(event) => updateDocument(index, "document_country", event.target.value)}
                  placeholder="Myanmar"
                />
              </Field>
            </Grid>
            {document.document_url ? (
              <UploadPreview>
                <img src={document.document_url} alt={document.document_name || "Uploaded verification document"} />
                <UploadMeta>
                  <span>{uploadingDocumentIndex === index ? "Uploading photo..." : "Uploaded photo is ready for review."}</span>
                  {document.mime_type ? <span>Format: {document.mime_type}</span> : null}
                  {document.file_size_bytes ? <span>Size: {Number(document.file_size_bytes).toLocaleString()} bytes</span> : null}
                </UploadMeta>
              </UploadPreview>
            ) : null}
            <InlineRow>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={document.is_primary}
                  onChange={(event) => updateDocument(index, "is_primary", event.target.checked)}
                />
                Primary document
              </label>
              {documents.length > 1 ? (
                <SecondaryButton
                  type="button"
                  onClick={() => setDocuments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                >
                  <Trash2 size={16} style={{ marginRight: 6 }} />
                  Remove
                </SecondaryButton>
              ) : null}
            </InlineRow>
          </DocumentCard>
        ))}
      </Card>

      {data?.verification.events.length ? (
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
          onClick={() => void handleSubmit()}
        >
          {submitting ? "Submitting..." : uploadingDocumentIndex !== null ? "Uploading document..." : "Submit verification request"}
        </Button>
      </ActionRow>
    </Page>
  );
}
