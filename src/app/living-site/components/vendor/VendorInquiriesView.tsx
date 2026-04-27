"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { BadgeHelp, MapPinned, SearchCheck } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

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
  max-width: 860px;
`;

const Notice = styled.div`
  border-radius: 20px;
  border: 1px solid rgba(255, 61, 93, 0.22);
  background: rgba(255, 61, 93, 0.08);
  padding: 16px 18px;
  display: grid;
  gap: 8px;
`;

const NoticeTitle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #ffd8df;
  font-weight: 700;
`;

const NoticeCopy = styled.p`
  margin: 0;
  color: #f0c7d0;
  line-height: 1.6;
`;

const List = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #151b29;
  padding: 18px;
  display: grid;
  gap: 14px;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
`;

const Heading = styled.div`
  display: grid;
  gap: 6px;
`;

const Name = styled.div`
  color: #f8fafc;
  font-weight: 700;
  font-size: 1.02rem;
`;

const Meta = styled.div`
  color: #98a2b3;
  font-size: 0.92rem;
  line-height: 1.45;
`;

const ScorePill = styled.span`
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 61, 93, 0.14);
  color: #ffd9df;
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 800;
`;

const Rows = styled.div`
  display: grid;
  gap: 10px;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

const Label = styled.span`
  color: #98a2b3;
`;

const Value = styled.span`
  color: #e7edf8;
  font-weight: 600;
  text-align: right;
`;

const Chips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Chip = styled.span`
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #d8deea;
  font-size: 0.82rem;
  font-weight: 600;
`;

const Empty = styled.div`
  border-radius: 24px;
  border: 1px dashed rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.02);
  padding: 24px;
  color: #97a0b2;
  line-height: 1.65;
`;

type InquiryItem = {
  id: string;
  deal_type: string | null;
  property_type: string | null;
  state_region: string | null;
  district: string | null;
  township: string | null;
  budget_range: string | null;
  timeline: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  need_parking: boolean | null;
  need_lift: boolean | null;
  need_solar: boolean | null;
  need_generator: boolean | null;
  created_at: string | null;
  match_score: number;
};

type InquiriesPayload = {
  items?: InquiryItem[];
  matchingMode?: string;
  error?: string;
};

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimeline(value: string | null | undefined) {
  switch (value) {
    case "asap":
      return "ASAP";
    case "one_three_months":
      return "1 to 3 months";
    case "three_six_months":
      return "3 to 6 months";
    case "browsing":
      return "Just browsing";
    default:
      return labelize(value);
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function buildRequirementChips(item: InquiryItem) {
  const chips: string[] = [];
  if (item.bedrooms) chips.push(`${item.bedrooms}+ beds`);
  if (item.bathrooms) chips.push(`${item.bathrooms}+ baths`);
  if (item.area_sqft) chips.push(`${item.area_sqft} sqft`);
  if (item.need_parking) chips.push("Needs parking");
  if (item.need_lift) chips.push("Needs lift");
  if (item.need_solar) chips.push("Needs solar");
  if (item.need_generator) chips.push("Needs generator");
  return chips;
}

export function VendorInquiriesView() {
  const { authToken } = useAppState();
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [matchingMode, setMatchingMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/vendor/inquiries", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json()) as InquiriesPayload;
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load inquiries.");
        }
        if (!cancelled) {
          setItems(payload.items ?? []);
          setMatchingMode(payload.matchingMode ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load inquiries.");
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

  const totalMatches = items.length;
  const averageScore = useMemo(() => {
    if (!items.length) return 0;
    return Math.round(items.reduce((sum, item) => sum + item.match_score, 0) / items.length);
  }, [items]);

  if (loading) {
    return <LoadingOverlay message="Loading inquiries..." />;
  }

  return (
    <Page>
      <Header>
        <Title>Inquiries</Title>
        <Subtitle>
          Buyer and renter leads are currently matched against your published inventory by deal type, property type, and location overlap.
        </Subtitle>
      </Header>

      <Notice>
        <NoticeTitle>
          <BadgeHelp size={16} />
          <span>Temporary matching model</span>
        </NoticeTitle>
        <NoticeCopy>
          These leads are not explicitly assigned to your vendor yet. Until the schema gains direct vendor linkage for inquiries, this page shows best-fit leads discovered from your current published properties.
        </NoticeCopy>
      </Notice>

      {error ? <Empty>{error}</Empty> : null}

      {!error && !items.length ? (
        <Empty>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8, color: "#e5e7eb", fontWeight: 700 }}>
            <SearchCheck size={16} />
            <span>No matched inquiries yet.</span>
          </div>
          Publish more inventory or refine property coverage to surface better-matched buyer and renter requirements here.
        </Empty>
      ) : null}

      {!!items.length && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Chip>{totalMatches} matched leads</Chip>
            <Chip>Avg. score {averageScore}/12</Chip>
            <Chip>{matchingMode === "property_overlap" ? "Matched by property overlap" : "Matched leads"}</Chip>
          </div>

          <List>
            {items.map((item) => {
              const requirements = buildRequirementChips(item);
              const location = [item.township, item.district, item.state_region].filter(Boolean).join(" / ");

              return (
                <Card key={item.id}>
                  <Top>
                    <Heading>
                      <Name>
                        {labelize(item.deal_type)} {labelize(item.property_type)}
                      </Name>
                      <Meta>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <MapPinned size={14} />
                          {location || "Location pending"}
                        </span>
                      </Meta>
                    </Heading>
                    <ScorePill>Match {item.match_score}/12</ScorePill>
                  </Top>

                  <Rows>
                    <Row>
                      <Label>Budget</Label>
                      <Value>{item.budget_range || "Not specified"}</Value>
                    </Row>
                    <Row>
                      <Label>Timeline</Label>
                      <Value>{formatTimeline(item.timeline)}</Value>
                    </Row>
                    <Row>
                      <Label>Created</Label>
                      <Value>{formatDate(item.created_at)}</Value>
                    </Row>
                  </Rows>

                  {requirements.length ? (
                    <Chips>
                      {requirements.map((requirement) => (
                        <Chip key={requirement}>{requirement}</Chip>
                      ))}
                    </Chips>
                  ) : null}
                </Card>
              );
            })}
          </List>
        </>
      )}
    </Page>
  );
}
