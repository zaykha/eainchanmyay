"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import styled from "styled-components";
import { ArrowLeft, BarChart3 } from "lucide-react";

const Page = styled.main`
  min-height: 100vh;
  background: var(--color-page);
`;

const Shell = styled.div`
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0 48px;
  display: grid;
  gap: 18px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text);
  font-weight: 700;
  text-decoration: none;
`;

const Card = styled.section`
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: var(--frame-shadow);
  padding: 24px;
  display: grid;
  gap: 12px;
`;

const Kicker = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
  font-size: 0.84rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.7rem, 3vw, 2.6rem);
  color: var(--color-text);
`;

const Copy = styled.p`
  margin: 0;
  max-width: 760px;
  color: var(--color-muted);
  line-height: 1.6;
`;

const Placeholder = styled.div`
  border-radius: 20px;
  border: 1px dashed var(--color-outline);
  background: color-mix(in srgb, var(--color-surface-2) 82%, white);
  min-height: 320px;
  display: grid;
  place-items: center;
  color: var(--color-muted);
  text-align: center;
  padding: 24px;
`;

const TITLES: Record<string, string> = {
  "listings-by-type": "Listings by type",
  "sales-by-type": "Sales by type",
  "price-range-by-type": "Price range by type",
  "appointments-by-type": "Appointments by type",
};

export default function HubAnalyticsDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "analytics";
  const title = useMemo(() => TITLES[slug] ?? "Workspace analytics", [slug]);

  return (
    <Page>
      <Shell>
        <BackLink href="/hub">
          <ArrowLeft size={16} />
          Back to hub
        </BackLink>
        <Card>
          <Kicker>
            <BarChart3 size={16} />
            Analytics
          </Kicker>
          <Title>{title}</Title>
          <Copy>
            This is a template analytics screen for the full breakdown view. The hub remains the at-a-glance summary,
            while this page can later hold deeper charts, tables, filters, and export actions.
          </Copy>
          <Placeholder>
            Full {title.toLowerCase()} breakdown will live here.
          </Placeholder>
        </Card>
      </Shell>
    </Page>
  );
}
