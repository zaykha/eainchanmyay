"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { propertyTypeDefinitions } from "@/lib/property-types";
import { ChevronRight, Filter, Plus } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { formatCurrency } from "@/app/living-site/lib/format";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

const Page = styled.div`
  display: grid;
  gap: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const Heading = styled.div`
  display: grid;
  gap: 6px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  color: #f8fafc;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #98a2b3;
  line-height: 1.55;
`;

const ActionLink = styled(Link)`
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%);
  color: white;
  font-weight: 700;
`;

const Filters = styled.form`
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(3, minmax(0, 0.6fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
  color: #f8fafc;
  padding: 0 14px;
`;

const Select = styled.select`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
  color: #f8fafc;
  padding: 0 14px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
  padding: 18px;
  display: grid;
  gap: 14px;
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1.05rem;
  color: #f8fafc;
`;

const Meta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Pill = styled.span`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #d9dfeb;
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 600;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #c7cfdd;
`;

const Strong = styled.span`
  color: #f8fafc;
  font-weight: 700;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const OpenLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #ff7f96;
  font-weight: 700;
`;

const EmptyCard = styled.div`
  border-radius: 24px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.02);
  padding: 24px;
  color: #97a0b2;
  line-height: 1.65;
`;

const Notice = styled.div<{ $danger?: boolean }>`
  border-radius: 22px;
  border: 1px solid ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.22)" : "rgba(255, 210, 92, 0.22)")};
  background: ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.08)" : "rgba(255, 210, 92, 0.08)")};
  padding: 16px 18px;
  color: ${(props) => (props.$danger ? "#ffd9df" : "#f2dfab")};
  line-height: 1.6;
`;

type PropertyItem = {
  id: string;
  title: string | null;
  deal_type: string | null;
  property_type: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  district: string | null;
  township: string | null;
  city: string | null;
  appointments_count: number;
  verification_status: string | null;
};

type WorkspaceLimits = {
  limits?: {
    currentPlan?: {
      name: string;
    };
    listingCount?: number;
    listingLimit?: number;
    listingNearLimit?: boolean;
    listingOverLimit?: boolean;
    suggestedUpgrade?: {
      name: string;
      priceLabel: string;
    } | null;
  };
};

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function VendorPropertiesView() {
  const { authToken } = useAppState();
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceLimits, setWorkspaceLimits] = useState<WorkspaceLimits["limits"] | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [dealType, setDealType] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const requestUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);
    if (dealType) params.set("deal", dealType);
    if (propertyType) params.set("type", propertyType);
    const suffix = params.toString();
    return suffix ? `/api/vendor/properties?${suffix}` : "/api/vendor/properties";
  }, [dealType, propertyType, query, status]);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [response, workspaceResponse] = await Promise.all([
          fetch(requestUrl, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }),
          fetch("/api/vendor/workspace", {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }),
        ]);
        const payload = (await response.json()) as { items?: PropertyItem[]; error?: string };
        const workspacePayload = (await workspaceResponse.json()) as WorkspaceLimits & { error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load vendor properties.");
        }
        if (!workspaceResponse.ok) {
          throw new Error(workspacePayload?.error || "Unable to load workspace limits.");
        }
        if (!cancelled) {
          setItems(payload.items ?? []);
          setWorkspaceLimits(workspacePayload.limits ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load vendor properties.");
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

  if (loading) {
    return <LoadingOverlay message="Loading properties..." />;
  }

  return (
    <Page>
      <Header>
        <Heading>
          <Title>Properties</Title>
          <Subtitle>
            Manage the live properties linked to this vendor workspace, then open each one for workspace-specific detail and editing.
          </Subtitle>
        </Heading>
        <ActionLink href="/request-sale">
          <Plus size={18} />
          <span>Request listing</span>
        </ActionLink>
      </Header>

      {workspaceLimits?.listingNearLimit ? (
        <Notice $danger={workspaceLimits.listingOverLimit}>
          {workspaceLimits.listingOverLimit
            ? "This workspace is already over its current listing soft limit. New listing intake should move behind an upgrade flow in a later phase."
            : `This workspace is close to its listing limit: ${workspaceLimits.listingCount ?? items.length}/${workspaceLimits.listingLimit ?? items.length}. ${
                workspaceLimits.suggestedUpgrade
                  ? `Recommended upgrade: ${workspaceLimits.suggestedUpgrade.name} (${workspaceLimits.suggestedUpgrade.priceLabel}).`
                  : ""
              }`}
        </Notice>
      ) : null}

      <Filters>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title or location"
          aria-label="Search properties"
        />
        <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
          <option value="archived">Archived</option>
        </Select>
        <Select value={dealType} onChange={(event) => setDealType(event.target.value)} aria-label="Filter by deal type">
          <option value="">All deals</option>
          <option value="sale">Sale</option>
          <option value="rent">Rent</option>
        </Select>
        <Select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} aria-label="Filter by property type">
          <option value="">All types</option>
          {propertyTypeDefinitions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Filters>

      {error ? <EmptyCard>{error}</EmptyCard> : null}

      {!error && !items.length ? (
        <EmptyCard>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10, color: "#dbe2ef", fontWeight: 700 }}>
            <Filter size={16} />
            <span>No properties matched this workspace filter.</span>
          </div>
          Create a new listing request or relax the filters to see more results.
        </EmptyCard>
      ) : null}

      {!!items.length && (
        <Grid>
          {items.map((property) => (
            <Card key={property.id}>
              <CardTop>
                <CardTitle>{property.title || "Untitled property"}</CardTitle>
                <Pill>{labelize(property.status)}</Pill>
              </CardTop>
              <Meta>
                <Pill>{labelize(property.deal_type)}</Pill>
                <Pill>{labelize(property.property_type)}</Pill>
                <Pill>{`Verification: ${labelize(property.verification_status)}`}</Pill>
              </Meta>
              <Row>
                <span>Price</span>
                <Strong>{formatCurrency(property.price ?? undefined, property.currency ?? "MMK", "Contact")}</Strong>
              </Row>
              <Row>
                <span>Location</span>
                <Strong>{[property.district || property.city, property.township].filter(Boolean).join(" / ") || "Unspecified"}</Strong>
              </Row>
              <Footer>
                <span style={{ color: "#9aa4b6" }}>{property.appointments_count} appointments</span>
                <OpenLink href={`/vendor/properties/${property.id}`}>
                  <span>Open workspace</span>
                  <ChevronRight size={16} />
                </OpenLink>
              </Footer>
            </Card>
          ))}
        </Grid>
      )}
    </Page>
  );
}
