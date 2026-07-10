"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { ClipboardList } from "lucide-react";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { formatCurrency } from "@/features/site/shared/lib/format";
import { useI18n } from "@/features/site/shared/lib/i18n";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";

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

const List = styled.div`
  display: grid;
  gap: 14px;
`;

const Card = styled.div`
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
  padding: 18px;
  display: grid;
  gap: 12px;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const Name = styled.div`
  color: #f8fafc;
  font-weight: 700;
`;

const Meta = styled.div`
  color: #98a2b3;
  font-size: 0.92rem;
`;

const Pill = styled.span`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #e1e7f3;
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 700;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #c8d0df;
`;

const Empty = styled.div`
  border-radius: 24px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.02);
  padding: 24px;
  color: #97a0b2;
  line-height: 1.65;
`;

type SalesRequestItem = {
  id: string;
  title: string | null;
  deal_type: string | null;
  property_type: string | null;
  price: number | null;
  currency: string | null;
  state_region: string | null;
  district: string | null;
  township: string | null;
  city: string | null;
  status: string | null;
  created_at: string | null;
};

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function VendorSalesRequestsView() {
  const { authToken } = useAppState();
  const { language } = useI18n();
  const [items, setItems] = useState<SalesRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/vendor/sales-requests", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json()) as { items?: SalesRequestItem[]; error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load vendor sales requests.");
        }
        if (!cancelled) {
          setItems(payload.items ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load vendor sales requests.");
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
    return <LoadingOverlay message="Loading sales requests..." />;
  }

  return (
    <Page>
      <div style={{ display: "grid", gap: 6 }}>
        <Title>Sales requests</Title>
        <Subtitle>Vendor-side sale and rental submissions created by your workspace members.</Subtitle>
      </div>

      {error ? <Empty>{error}</Empty> : null}

      {!error && !items.length ? (
        <Empty>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#e5e7eb", fontWeight: 700 }}>
            <ClipboardList size={16} />
            <span>No sales requests yet.</span>
          </div>
          New listing submissions from your vendor team will appear here.
        </Empty>
      ) : null}

      {!!items.length && (
        <List>
          {items.map((item) => (
            <Card key={item.id}>
              <Top>
                <div>
                  <Name>{item.title || "Untitled request"}</Name>
                  <Meta>{[item.district || item.city, item.township, item.state_region].filter(Boolean).join(" / ") || "Location pending"}</Meta>
                </div>
                <Pill>{labelize(item.status)}</Pill>
              </Top>
              <Row>
                <span>Deal</span>
                <strong>{labelize(item.deal_type)}</strong>
              </Row>
              <Row>
                <span>Property type</span>
                <strong>{labelize(item.property_type)}</strong>
              </Row>
              <Row>
                <span>Price</span>
                <strong>{formatCurrency(item.price ?? undefined, item.currency ?? "MMK", "Contact", language)}</strong>
              </Row>
            </Card>
          ))}
        </List>
      )}
    </Page>
  );
}
