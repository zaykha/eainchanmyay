"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

const Page = styled.div`
  display: grid;
  gap: 20px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: #f8fafc;
`;

const Copy = styled.p`
  margin: 0;
  color: #98a2b3;
  line-height: 1.65;
  max-width: 840px;
`;

const Card = styled.div`
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
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
    props.$tone === "success" ? "#d1fae5" : props.$tone === "warning" ? "#fde68a" : "#dbe5f3"};
  background: ${(props) =>
    props.$tone === "success"
      ? "rgba(16, 185, 129, 0.16)"
      : props.$tone === "warning"
      ? "rgba(245, 158, 11, 0.16)"
      : "rgba(148, 163, 184, 0.14)"};
  border: 1px solid
    ${(props) =>
      props.$tone === "success"
        ? "rgba(16, 185, 129, 0.24)"
        : props.$tone === "warning"
        ? "rgba(245, 158, 11, 0.24)"
        : "rgba(148, 163, 184, 0.18)"};
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
  color: #dbe5f3;
  font-weight: 600;
`;

const Input = styled.input`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0f1623;
  color: #f8fafc;
  padding: 0 14px;
`;

const Textarea = styled.textarea`
  min-height: 130px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0f1623;
  color: #f8fafc;
  padding: 12px 14px;
  resize: vertical;
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
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: #eef2ff;
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
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #101726;
  padding: 16px;
  display: grid;
  gap: 12px;
`;

const PropertyGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const PropertyOption = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 14px 16px;
  background: #101726;
  color: #d9dfeb;
`;

const Note = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(255, 210, 92, 0.22);
  background: rgba(255, 210, 92, 0.08);
  padding: 14px 16px;
  color: #f2dfab;
  line-height: 1.6;
`;

const Success = styled.div`
  border-radius: 18px;
  border: 1px solid rgba(111, 232, 192, 0.22);
  background: rgba(111, 232, 192, 0.08);
  padding: 14px 16px;
  color: #d4ffe8;
  line-height: 1.6;
`;

type VerificationData = {
  vendor: {
    id: string;
    name: string;
    plan: string | null;
    verification_status: string | null;
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
    } | null;
    documents: Array<{
      id: string;
      document_type: string;
      document_name: string;
      document_url: string;
      created_at: string | null;
    }>;
    properties: Array<{
      property_id: string;
      title: string;
      status: string | null;
      verification_status: string | null;
    }>;
  };
  availableProperties: Array<{
    id: string;
    title: string;
    status: string | null;
    verification_status: string | null;
  }>;
};

type DocumentDraft = {
  document_type: string;
  document_name: string;
  document_url: string;
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
  const [notes, setNotes] = useState("");
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [documents, setDocuments] = useState<DocumentDraft[]>([
    { document_type: "business_license", document_name: "", document_url: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      Boolean(
        selectedPropertyIds.length &&
          documents.some((item) => item.document_type.trim() && item.document_name.trim() && item.document_url.trim())
      ),
    [documents, selectedPropertyIds]
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
          setNotes(payload.verification.latestRequest?.notes || "");
          setSelectedPropertyIds(payload.verification.properties.map((item) => item.property_id));
          setDocuments(
            payload.verification.documents.length
              ? payload.verification.documents.map((item) => ({
                  document_type: item.document_type,
                  document_name: item.document_name,
                  document_url: item.document_url,
                }))
              : [{ document_type: "business_license", document_name: "", document_url: "" }]
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

  const updateDocument = (index: number, key: keyof DocumentDraft, value: string) => {
    setDocuments((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  };

  const toggleProperty = (propertyId: string) => {
    setSelectedPropertyIds((current) =>
      current.includes(propertyId) ? current.filter((item) => item !== propertyId) : [...current, propertyId]
    );
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
          notes,
          property_ids: selectedPropertyIds,
          documents,
        }),
      });
      const payload = (await response.json()) as VerificationData & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit verification request.");
      }
      setData(payload);
      setMessage("Verification request submitted. The platform admin review queue is now updated.");
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
          Submit your agency verification package for manual review. Higher plans can include the package price, but approval is still handled manually by platform admins.
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
          <span style={{ color: "#98a2b3" }}>
            {data?.verification.includedInPlan ? "Verification package included in this plan." : "Verification is handled as a manual add-on review."}
          </span>
        </InlineRow>
        {data?.verification.latestRequest?.review_notes ? (
          <Note>Admin review notes: {data.verification.latestRequest.review_notes}</Note>
        ) : null}
      </Card>

      <Card>
        <Field>
          Agency verification notes
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Describe your license, coverage area, operating history, or anything the review team should know."
          />
        </Field>
      </Card>

      <Card>
        <InlineRow style={{ justifyContent: "space-between" }}>
          <div>
            <Title style={{ fontSize: "1.1rem" }}>Documents</Title>
            <Copy>Use document URLs for now. This can point to storage links, cloud folders, or hosted scans.</Copy>
          </div>
          <SecondaryButton
            type="button"
            onClick={() =>
              setDocuments((current) => [...current, { document_type: "ownership_authority", document_name: "", document_url: "" }])
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
                <Input
                  value={document.document_type}
                  onChange={(event) => updateDocument(index, "document_type", event.target.value)}
                  placeholder="business_license"
                />
              </Field>
              <Field>
                Document name
                <Input
                  value={document.document_name}
                  onChange={(event) => updateDocument(index, "document_name", event.target.value)}
                  placeholder="Agency business license"
                />
              </Field>
            </Grid>
            <Field>
              Document URL
              <Input
                value={document.document_url}
                onChange={(event) => updateDocument(index, "document_url", event.target.value)}
                placeholder="https://..."
              />
            </Field>
            {documents.length > 1 ? (
              <SecondaryButton type="button" onClick={() => setDocuments((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                <Trash2 size={16} style={{ marginRight: 6 }} />
                Remove
              </SecondaryButton>
            ) : null}
          </DocumentCard>
        ))}
      </Card>

      <Card>
        <Title style={{ fontSize: "1.1rem" }}>Listings for verification</Title>
        <Copy>Select the published listings you want reviewed for a verified listing flag.</Copy>
        <PropertyGrid>
          {data?.availableProperties.map((property) => (
            <PropertyOption key={property.id}>
              <input
                type="checkbox"
                checked={selectedPropertyIds.includes(property.id)}
                onChange={() => toggleProperty(property.id)}
              />
              <div style={{ display: "grid", gap: 4 }}>
                <strong style={{ color: "#f8fafc" }}>{property.title}</strong>
                <span>
                  Status: {prettyStatus(property.status)} | Verification: {prettyStatus(property.verification_status)}
                </span>
              </div>
            </PropertyOption>
          ))}
        </PropertyGrid>
      </Card>

      <ActionRow>
        <Button type="button" disabled={!canSubmit || submitting} onClick={() => void handleSubmit()}>
          {submitting ? "Submitting..." : "Submit verification request"}
        </Button>
      </ActionRow>
    </Page>
  );
}
