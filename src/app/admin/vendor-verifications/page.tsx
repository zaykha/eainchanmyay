"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

const Page = styled.div`
  min-height: 100vh;
  background: #0b0f18;
  color: #eef2ff;
  padding: 28px 18px 60px;
`;

const Shell = styled.div`
  max-width: 1200px;
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
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
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

const PropertyList = styled.div`
  display: grid;
  gap: 10px;
`;

const PropertyRow = styled.label`
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px;
  border-radius: 16px;
  background: #101726;
  border: 1px solid rgba(255, 255, 255, 0.06);
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

type VerificationItem = {
  id: string;
  status: string;
  notes: string | null;
  review_notes: string | null;
  included_in_plan: boolean;
  requested_at: string | null;
  reviewed_at: string | null;
  vendor: {
    id: string;
    name: string;
    plan: string | null;
    verification_status: string | null;
    slug: string | null;
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
    created_at: string | null;
  }>;
  properties: Array<{
    property_id: string;
    title: string;
    status: string | null;
    verification_status: string | null;
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
  const [selectedProperties, setSelectedProperties] = useState<Record<string, string[]>>({});
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
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
          setSelectedProperties(
            Object.fromEntries(nextItems.map((item) => [item.id, item.properties.map((property) => property.property_id)]))
          );
          setReviewNotes(Object.fromEntries(nextItems.map((item) => [item.id, item.review_notes || ""])));
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
          verified_property_ids: selectedProperties[requestId] || [],
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
          <Copy>Manual agency and listing verification queue. Approve the agency, decide which listings receive verified status, and leave review notes for the vendor team.</Copy>
        </div>

        <Toolbar>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="changes_requested">Changes requested</option>
          </Select>
          <Link href="/vendor" style={{ color: "#f8fafc", fontWeight: 700 }}>
            Open vendor workspace
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
                  <div style={{ display: "grid", gap: 8 }}>
                    <strong>Documents</strong>
                    {item.documents.map((document) => (
                      <Copy key={document.id}>
                        {pretty(document.document_type)}:{" "}
                        <a href={document.document_url} target="_blank" rel="noreferrer" style={{ color: "#f8fafc", fontWeight: 700 }}>
                          {document.document_name}
                        </a>
                      </Copy>
                    ))}
                  </div>
                </Column>

                <Column>
                  <strong>Listings to verify</strong>
                  <PropertyList>
                    {item.properties.map((property) => (
                      <PropertyRow key={property.property_id}>
                        <input
                          type="checkbox"
                          checked={(selectedProperties[item.id] || []).includes(property.property_id)}
                          onChange={() =>
                            setSelectedProperties((current) => {
                              const bucket = current[item.id] || [];
                              return {
                                ...current,
                                [item.id]: bucket.includes(property.property_id)
                                  ? bucket.filter((value) => value !== property.property_id)
                                  : [...bucket, property.property_id],
                              };
                            })
                          }
                        />
                        <div style={{ display: "grid", gap: 4 }}>
                          <strong style={{ color: "#f8fafc" }}>{property.title}</strong>
                          <Copy>
                            Listing status: {pretty(property.status)} | Verification: {pretty(property.verification_status)}
                          </Copy>
                        </div>
                      </PropertyRow>
                    ))}
                  </PropertyList>
                </Column>
              </TwoCol>

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
