"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { CalendarClock, ClipboardList, FolderKanban, Layers3, Wallet } from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { formatCurrency } from "@/app/living-site/lib/format";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

const Page = styled.div`
  display: grid;
  gap: 22px;
`;

const Header = styled.div`
  display: grid;
  gap: 6px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.45rem);
  color: #f8fafc;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #98a2b3;
  line-height: 1.55;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
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

const MetricTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const MetricTitle = styled.span`
  color: #a6b0c1;
  font-size: 0.92rem;
`;

const MetricValue = styled.div`
  font-size: 1.55rem;
  font-weight: 800;
  color: #f8fafc;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const BlockTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: #f3f4f6;
`;

const BlockCopy = styled.p`
  margin: 0;
  color: #98a2b3;
  line-height: 1.6;
`;

const StatsList = styled.div`
  display: grid;
  gap: 10px;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  color: #d8deea;
  font-size: 0.95rem;
`;

const CountPill = styled.span`
  min-width: 32px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: #f8fafc;
  text-align: center;
  font-weight: 700;
`;

const TypeList = styled.div`
  display: grid;
  gap: 10px;
`;

const TypeRow = styled.div`
  display: grid;
  gap: 6px;
`;

const TypeMeta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.92rem;
  color: #dbe2ef;
`;

const TypeTrack = styled.div`
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
`;

const TypeFill = styled.div<{ $width: number }>`
  height: 100%;
  width: ${(props) => props.$width}%;
  border-radius: inherit;
  background: linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%);
`;

const AppointmentMeta = styled.div`
  display: grid;
  gap: 4px;
  color: #d8deea;
`;

const Empty = styled.div`
  color: #8c96a8;
  line-height: 1.6;
  min-height: 120px;
  display: grid;
  align-items: center;
`;

const RecentList = styled.div`
  display: grid;
  gap: 10px;
`;

const RecentRow = styled.div`
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const RecentTitle = styled.div`
  color: #f8fafc;
  font-weight: 700;
`;

const RecentLink = styled(Link)`
  color: inherit;
`;

const RecentMeta = styled.div`
  color: #9aa4b6;
  font-size: 0.9rem;
`;

type OverviewPayload = {
  workspace: {
    vendor: {
      id: string;
      name: string;
      vendor_type: string;
      plan: string | null;
    };
    membership: {
      role: string;
    };
    teamSize: number;
  };
  metrics: {
    totalProperties: number;
    publishedProperties: number;
    draftProperties: number;
    soldProperties: number;
    rentedProperties: number;
    archivedProperties: number;
    totalValue: number;
    publishedValue: number;
    salesRequestsCount: number;
    appointmentsCount: number;
  };
  nextAppointment:
    | {
        title: string | null;
        client_name: string | null;
        start_at: string | null;
        status: string | null;
      }
    | null;
  statusMix: Array<{ key: string; count: number }>;
  listingTypes: Array<{ key: string; count: number }>;
  recentProperties: Array<{
    id: string;
    title: string | null;
    status: string | null;
    deal_type: string | null;
    price: number | null;
    currency: string | null;
  }>;
};

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function VendorDashboardView() {
  const { authToken } = useAppState();
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/vendor/overview", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const payload = (await response.json()) as OverviewPayload & { error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load the vendor dashboard.");
        }
        if (!cancelled) {
          setData(payload);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load the vendor dashboard.");
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

  const maxTypeCount = useMemo(
    () => Math.max(1, ...(data?.listingTypes.map((item) => item.count) ?? [1])),
    [data?.listingTypes]
  );

  if (loading) {
    return <LoadingOverlay message="Loading dashboard..." />;
  }

  if (error || !data) {
    return (
      <Page>
        <Header>
          <Title>Vendor dashboard</Title>
          <Subtitle>{error ?? "Unable to load dashboard data."}</Subtitle>
        </Header>
      </Page>
    );
  }

  return (
    <Page>
      <Header>
        <Title>{data.workspace.vendor.name}</Title>
        <Subtitle>
          Dashboard overview for your vendor workspace. Membership role: {labelize(data.workspace.membership.role)}.
        </Subtitle>
      </Header>

      <SummaryGrid>
        <Card>
          <MetricTop>
            <MetricTitle>Total properties</MetricTitle>
            <FolderKanban size={18} color="#ff5d78" />
          </MetricTop>
          <MetricValue>{data.metrics.totalProperties}</MetricValue>
          <BlockCopy>{data.metrics.publishedProperties} published listings live right now.</BlockCopy>
        </Card>

        <Card>
          <MetricTop>
            <MetricTitle>Portfolio value</MetricTitle>
            <Wallet size={18} color="#ff5d78" />
          </MetricTop>
          <MetricValue>{formatCurrency(data.metrics.totalValue, "MMK", "MMK 0")}</MetricValue>
          <BlockCopy>{formatCurrency(data.metrics.publishedValue, "MMK", "MMK 0")} currently published.</BlockCopy>
        </Card>

        <Card>
          <MetricTop>
            <MetricTitle>Team seats</MetricTitle>
            <Layers3 size={18} color="#ff5d78" />
          </MetricTop>
          <MetricValue>{data.workspace.teamSize}</MetricValue>
          <BlockCopy>Active vendor members included in this workspace.</BlockCopy>
        </Card>

        <Card>
          <MetricTop>
            <MetricTitle>Sales requests</MetricTitle>
            <ClipboardList size={18} color="#ff5d78" />
          </MetricTop>
          <MetricValue>{data.metrics.salesRequestsCount}</MetricValue>
          <BlockCopy>Lead-side submissions and draft listing requests.</BlockCopy>
        </Card>
      </SummaryGrid>

      <DetailGrid>
        <Card>
          <BlockTitle>Operational overview</BlockTitle>
          <StatsList>
            <StatRow>
              <span>Published</span>
              <CountPill>{data.metrics.publishedProperties}</CountPill>
            </StatRow>
            <StatRow>
              <span>Draft</span>
              <CountPill>{data.metrics.draftProperties}</CountPill>
            </StatRow>
            <StatRow>
              <span>Sold</span>
              <CountPill>{data.metrics.soldProperties}</CountPill>
            </StatRow>
            <StatRow>
              <span>Rented</span>
              <CountPill>{data.metrics.rentedProperties}</CountPill>
            </StatRow>
            <StatRow>
              <span>Archived</span>
              <CountPill>{data.metrics.archivedProperties}</CountPill>
            </StatRow>
            <StatRow>
              <span>Appointments</span>
              <CountPill>{data.metrics.appointmentsCount}</CountPill>
            </StatRow>
          </StatsList>
        </Card>

        <Card>
          <BlockTitle>Next appointment</BlockTitle>
          {data.nextAppointment ? (
            <AppointmentMeta>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#f8fafc", fontWeight: 700 }}>
                <CalendarClock size={16} color="#ff5d78" />
                <span>{data.nextAppointment.title || "Upcoming appointment"}</span>
              </div>
              <span>{data.nextAppointment.client_name || "Unnamed client"}</span>
              <span>
                {data.nextAppointment.start_at
                  ? new Date(data.nextAppointment.start_at).toLocaleString()
                  : "Schedule pending"}
              </span>
            </AppointmentMeta>
          ) : (
            <Empty>No upcoming appointments yet for the current vendor scope.</Empty>
          )}
        </Card>
      </DetailGrid>

      <DetailGrid>
        <Card>
          <BlockTitle>Listings by type</BlockTitle>
          {data.listingTypes.length ? (
            <TypeList>
              {data.listingTypes.map((item) => (
                <TypeRow key={item.key}>
                  <TypeMeta>
                    <span>{labelize(item.key)}</span>
                    <span>{item.count}</span>
                  </TypeMeta>
                  <TypeTrack>
                    <TypeFill $width={(item.count / maxTypeCount) * 100} />
                  </TypeTrack>
                </TypeRow>
              ))}
            </TypeList>
          ) : (
            <Empty>No property type data yet.</Empty>
          )}
        </Card>

        <Card>
          <BlockTitle>Recent properties</BlockTitle>
          {data.recentProperties.length ? (
            <RecentList>
              {data.recentProperties.map((property) => (
                <RecentRow key={property.id}>
                  <RecentTitle>
                    <RecentLink href={`/vendor/properties/${property.id}`}>
                      {property.title || "Untitled property"}
                    </RecentLink>
                  </RecentTitle>
                  <RecentMeta>
                    {labelize(property.deal_type)} • {labelize(property.status)} • {formatCurrency(property.price ?? undefined, property.currency ?? "MMK", "Contact")}
                  </RecentMeta>
                </RecentRow>
              ))}
            </RecentList>
          ) : (
            <Empty>No properties created yet.</Empty>
          )}
        </Card>
      </DetailGrid>
    </Page>
  );
}
