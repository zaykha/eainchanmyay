"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { CalendarRange } from "lucide-react";
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

const Subtitle = styled.p`
  margin: 0;
  color: #98a2b3;
  line-height: 1.55;
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
  gap: 12px;
`;

const Property = styled.div`
  color: #f8fafc;
  font-weight: 700;
`;

const Meta = styled.div`
  color: #98a2b3;
  font-size: 0.92rem;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #cad3e2;
`;

const Notes = styled.div`
  color: #b6c0d1;
  line-height: 1.6;
`;

const Empty = styled.div`
  border-radius: 24px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.02);
  padding: 24px;
  color: #97a0b2;
  line-height: 1.65;
`;

type ViewingRequestItem = {
  id: string;
  name: string | null;
  phone: string | null;
  preferred_date: string | null;
  preferred_time_window: string | null;
  notes: string | null;
  property?: {
    title: string | null;
    district: string | null;
    township: string | null;
    city: string | null;
  } | null;
};

export function VendorViewingRequestsView() {
  const { authToken } = useAppState();
  const [items, setItems] = useState<ViewingRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/vendor/viewing-requests", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json()) as { items?: ViewingRequestItem[]; error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load viewing requests.");
        }
        if (!cancelled) {
          setItems(payload.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load viewing requests.");
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

  if (loading) {
    return <LoadingOverlay message="Loading viewing requests..." />;
  }

  return (
    <Page>
      <div style={{ display: "grid", gap: 6 }}>
        <Title>Viewing requests</Title>
        <Subtitle>Buyer and renter viewing requests linked to properties created by your vendor workspace members.</Subtitle>
      </div>

      {error ? <Empty>{error}</Empty> : null}

      {!error && !items.length ? (
        <Empty>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#e5e7eb", fontWeight: 700 }}>
            <CalendarRange size={16} />
            <span>No viewing requests yet.</span>
          </div>
          Requests from interested clients will show up here as soon as they target your published properties.
        </Empty>
      ) : null}

      {!!items.length && (
        <Grid>
          {items.map((item) => (
            <Card key={item.id}>
              <Property>{item.property?.title || "Property"}</Property>
              <Meta>{[item.property?.district || item.property?.city, item.property?.township].filter(Boolean).join(" / ") || "Location pending"}</Meta>
              <Row>
                <span>Client</span>
                <strong>{item.name || "Unnamed requester"}</strong>
              </Row>
              <Row>
                <span>Phone</span>
                <strong>{item.phone || "No phone"}</strong>
              </Row>
              <Row>
                <span>Date</span>
                <strong>{item.preferred_date || "Open"}</strong>
              </Row>
              <Row>
                <span>Time window</span>
                <strong>{item.preferred_time_window || "Flexible"}</strong>
              </Row>
              {item.notes ? <Notes>{item.notes}</Notes> : null}
            </Card>
          ))}
        </Grid>
      )}
    </Page>
  );
}
