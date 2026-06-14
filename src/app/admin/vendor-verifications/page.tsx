"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";

const Page = styled.div`
  min-height: 100vh;
  background: #0b0f18;
  color: #eef2ff;
  padding: 28px 18px 60px;
`;

const Shell = styled.div`
  max-width: 1240px;
  margin: 0 auto;
  display: grid;
  gap: 18px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.9rem, 3vw, 2.7rem);
`;

const Copy = styled.p`
  margin: 0;
  color: #9ba3b5;
  line-height: 1.65;
`;

const Toolbar = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
`;

const Select = styled.select`
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #151b29;
  color: #eef2ff;
  padding: 0 14px;
`;

const Input = styled.input`
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #151b29;
  color: #eef2ff;
  padding: 0 14px;
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
`;

const Card = styled.div`
  border-radius: 24px;
  background: #141a28;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 20px;
  display: grid;
  gap: 16px;
`;

const Badge = styled.span<{ $tone?: "success" | "warning" | "danger" | "neutral" }>`
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${(props) =>
    props.$tone === "success"
      ? "#d1fae5"
      : props.$tone === "danger"
      ? "#fecdd3"
      : props.$tone === "warning"
      ? "#fde68a"
      : "#dbe5f3"};
  background: ${(props) =>
    props.$tone === "success"
      ? "rgba(16, 185, 129, 0.16)"
      : props.$tone === "danger"
      ? "rgba(244, 63, 94, 0.16)"
      : props.$tone === "warning"
      ? "rgba(245, 158, 11, 0.16)"
      : "rgba(148, 163, 184, 0.14)"};
`;

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Column = styled.div`
  display: grid;
  gap: 12px;
`;

const Field = styled.label`
  display: grid;
  gap: 8px;
  color: #dbe5f3;
  font-weight: 600;
`;

const Textarea = styled.textarea`
  min-height: 120px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0f1623;
  color: #f8fafc;
  padding: 12px 14px;
  resize: vertical;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $tone?: "success" | "danger" | "neutral" }>`
  min-height: 42px;
  padding: 0 14px;
  border-radius: 999px;
  border: ${(props) => (props.$tone === "neutral" ? "1px solid rgba(255,255,255,0.12)" : "none")};
  background: ${(props) =>
    props.$tone === "success"
      ? "linear-gradient(135deg, #0f766e, #115e59)"
      : props.$tone === "danger"
      ? "linear-gradient(135deg, #e11d48, #be123c)"
      : "transparent"};
  color: #fff;
  font-weight: 700;
  cursor: pointer;
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const MetaCard = styled.div`
  border-radius: 16px;
  background: #101726;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px;
  display: grid;
  gap: 4px;
`;

const EventList = styled.div`
  display: grid;
  gap: 10px;
`;

const EventRow = styled.div`
  border-radius: 16px;
  background: #101726;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 12px;
  display: grid;
  gap: 4px;
`;

type VerificationItem = {
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
  vendor: {
    id: string;
    name: string;
    plan: string | null;
    verification_status: string | null;
    slug: string | null;
    verified_at: string | null;
    verification_expires_at: string | null;
    verification_level: string | null;
    verification_score: number | null;
    verification_rejection_reason_code: string | null;
    verification_rank_bonus: number;
  };
  requester: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
  reviewer: {
    id: string;
    full_name: string | null;
    email: string | null;
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

function pretty(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function tone(status: string) {
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  if (status === "pending" || status === "changes_requested") return "warning" as const;
  return "neutral" as const;
}

export default function AdminVendorVerificationsPage() {
  const { authToken, profileRole, profileReady } = useAppState();
  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [decisionReasonCodes, setDecisionReasonCodes] = useState<Record<string, string>>({});
  const [verificationLevels, setVerificationLevels] = useState<Record<string, string>>({});
  const [verificationScores, setVerificationScores] = useState<Record<string, string>>({});
  const [verificationBonuses, setVerificationBonuses] = useState<Record<string, string>>({});
  const [verificationExpiry, setVerificationExpiry] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const suffix = params.toString();
    return suffix ? `/api/admin/vendor-verifications?${suffix}` : "/api/admin/vendor-verifications";
  }, [statusFilter]);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(requestUrl, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json()) as { items?: VerificationItem[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "Unable to load vendor verification queue.");
        }
        if (!cancelled) {
          const nextItems = payload.items ?? [];
          setItems(nextItems);
          setReviewNotes(Object.fromEntries(nextItems.map((item) => [item.id, item.review_notes || ""])));
          setDecisionReasonCodes(
            Object.fromEntries(nextItems.map((item) => [item.id, item.decision_reason_code || ""])),
          );
          setVerificationLevels(
            Object.fromEntries(nextItems.map((item) => [item.id, item.vendor.verification_level || "verified_agency"]))
          );
          setVerificationScores(
            Object.fromEntries(nextItems.map((item) => [item.id, String(item.vendor.verification_score ?? 80)]))
          );
          setVerificationBonuses(
            Object.fromEntries(nextItems.map((item) => [item.id, String(item.vendor.verification_rank_bonus ?? 0)]))
          );
          setVerificationExpiry(
            Object.fromEntries(
              nextItems.map((item) => [
                item.id,
                item.vendor.verification_expires_at ? item.vendor.verification_expires_at.slice(0, 10) : "",
              ])
            )
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load vendor verification queue.");
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
  }, [authToken, requestUrl]);

  const handleReview = async (requestId: string, status: "approved" | "rejected" | "changes_requested") => {
    if (!authToken) return;

    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/vendor-verifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          request_id: requestId,
          status,
          review_notes: reviewNotes[requestId] || "",
          decision_reason_code: decisionReasonCodes[requestId] || "",
          verification_level: verificationLevels[requestId] || "verified_agency",
          verification_score: verificationScores[requestId] || "",
          verification_rank_bonus: verificationBonuses[requestId] || "",
          verification_expires_at: verificationExpiry[requestId] || "",
          checklist_json: {
            business_identity_checked: true,
            contact_checked: true,
            documents_reviewed: true,
          },
        }),
      });
      const payload = (await response.json()) as { items?: VerificationItem[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to update verification review.");
      }
      const nextItems = payload.items ?? [];
      setItems(nextItems);
      setMessage(`Verification request marked as ${pretty(status)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update verification review.");
    }
  };

  if (!profileReady || loading) {
    return <LoadingOverlay message="Loading verification queue..." />;
  }

  if (profileRole !== "admin" && profileRole !== "master_admin") {
    return (
      <Page>
        <Shell>
          <Card>
            <Title>Admin access required</Title>
            <Copy>Only platform admin accounts can review agency verification requests.</Copy>
          </Card>
        </Shell>
      </Page>
    );
  }

  return (
    <Page>
      <Shell>
        <div style={{ display: "grid", gap: 8 }}>
          <Title>Vendor Verifications</Title>
          <Copy>
            Manual agency verification queue. Review the legal identity package, document metadata, and decide both trust status and ranking bonus.
          </Copy>
        </div>

        <Toolbar>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="changes_requested">Changes requested</option>
          </Select>
          <Link href="/hub" style={{ color: "#f8fafc", fontWeight: 700 }}>
            Open hub
          </Link>
        </Toolbar>

        {error ? <Card>{error}</Card> : null}
        {message ? <Card>{message}</Card> : null}

        <Grid>
          {items.map((item) => (
            <Card key={item.id}>
              <Toolbar style={{ justifyContent: "space-between" }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <strong style={{ fontSize: "1.1rem" }}>{item.vendor.name}</strong>
                  <Copy>
                    Plan: {pretty(item.vendor.plan)} | Requester: {item.requester?.full_name || item.requester?.email || "Vendor user"}
                  </Copy>
                </div>
                <Badge $tone={tone(item.status)}>{pretty(item.status)}</Badge>
              </Toolbar>

              <MetaGrid>
                <MetaCard>
                  <strong>Request type</strong>
                  <Copy>{pretty(item.request_type)}</Copy>
                </MetaCard>
                <MetaCard>
                  <strong>Business name</strong>
                  <Copy>{item.business_name_submitted || "Not provided"}</Copy>
                </MetaCard>
                <MetaCard>
                  <strong>License number</strong>
                  <Copy>{item.license_number || "Not provided"}</Copy>
                </MetaCard>
                <MetaCard>
                  <strong>Registration number</strong>
                  <Copy>{item.company_registration_number || "Not provided"}</Copy>
                </MetaCard>
                <MetaCard>
                  <strong>Tax ID</strong>
                  <Copy>{item.tax_id || "Not provided"}</Copy>
                </MetaCard>
                <MetaCard>
                  <strong>Office address</strong>
                  <Copy>{item.office_address || "Not provided"}</Copy>
                </MetaCard>
                <MetaCard>
                  <strong>Contact person</strong>
                  <Copy>
                    {[item.contact_person_name, item.contact_person_role].filter(Boolean).join(" • ") || "Not provided"}
                  </Copy>
                </MetaCard>
                <MetaCard>
                  <strong>Contact channels</strong>
                  <Copy>
                    {[item.contact_person_phone, item.contact_person_email].filter(Boolean).join(" • ") || "Not provided"}
                  </Copy>
                </MetaCard>
              </MetaGrid>

              <TwoCol>
                <Column>
                  <Copy>{item.notes || "No vendor notes provided."}</Copy>
                  <Field>
                    Review notes
                    <Textarea
                      value={reviewNotes[item.id] || ""}
                      onChange={(event) => setReviewNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                    />
                  </Field>
                  <Grid>
                    <Field>
                      Decision reason code
                      <Input
                        value={decisionReasonCodes[item.id] || ""}
                        onChange={(event) =>
                          setDecisionReasonCodes((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                        placeholder="missing_license, unclear_nrc, office_mismatch"
                      />
                    </Field>
                    <Field>
                      Verification level
                      <Select
                        value={verificationLevels[item.id] || "verified_agency"}
                        onChange={(event) =>
                          setVerificationLevels((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                      >
                        <option value="basic">Basic</option>
                        <option value="business">Business</option>
                        <option value="verified_agency">Verified agency</option>
                      </Select>
                    </Field>
                    <Field>
                      Verification score
                      <Input
                        value={verificationScores[item.id] || ""}
                        onChange={(event) =>
                          setVerificationScores((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                        placeholder="80"
                      />
                    </Field>
                    <Field>
                      Rank bonus
                      <Input
                        value={verificationBonuses[item.id] || ""}
                        onChange={(event) =>
                          setVerificationBonuses((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                        placeholder="10"
                      />
                    </Field>
                    <Field>
                      Verification expiry
                      <Input
                        type="date"
                        value={verificationExpiry[item.id] || ""}
                        onChange={(event) =>
                          setVerificationExpiry((current) => ({ ...current, [item.id]: event.target.value }))
                        }
                      />
                    </Field>
                  </Grid>
                  <div style={{ display: "grid", gap: 8 }}>
                    <strong>Documents</strong>
                    {item.documents.map((document) => (
                      <MetaCard key={document.id}>
                        <strong>
                          {pretty(document.document_type)} {document.is_primary ? "• Primary" : ""}
                        </strong>
                        <Copy>
                          {document.document_name} | {pretty(document.review_status)}
                        </Copy>
                        <Copy>
                          {[document.document_number, document.document_country, document.document_side]
                            .filter(Boolean)
                            .join(" • ") || "No extra metadata"}
                        </Copy>
                        <Copy>
                          {[document.mime_type, document.file_size_bytes ? `${document.file_size_bytes} bytes` : null]
                            .filter(Boolean)
                            .join(" • ") || "No file metadata"}
                        </Copy>
                        <a href={document.document_url} target="_blank" rel="noreferrer" style={{ color: "#f8fafc", fontWeight: 700 }}>
                          Open document
                        </a>
                      </MetaCard>
                    ))}
                  </div>
                </Column>

              </TwoCol>

              {item.events.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  <strong>Verification timeline</strong>
                  <EventList>
                    {item.events.map((event) => (
                      <EventRow key={event.id}>
                        <strong>
                          {pretty(event.event_type)} by {event.actor_name}
                        </strong>
                        <Copy>
                          {event.created_at ? new Date(event.created_at).toLocaleString() : "Unknown time"}
                        </Copy>
                        {event.notes ? <Copy>{event.notes}</Copy> : null}
                      </EventRow>
                    ))}
                  </EventList>
                </div>
              ) : null}

              <ActionRow>
                <Button $tone="success" onClick={() => void handleReview(item.id, "approved")}>
                  Approve
                </Button>
                <Button $tone="danger" onClick={() => void handleReview(item.id, "rejected")}>
                  Reject
                </Button>
                <Button $tone="neutral" onClick={() => void handleReview(item.id, "changes_requested")}>
                  Request changes
                </Button>
              </ActionRow>
            </Card>
          ))}
        </Grid>
      </Shell>
    </Page>
  );
}
