"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { PageSection, SectionTitle, Panel } from "@/app/living-site/components/PageSection";
import { useAppState } from "@/app/living-site/lib/app-state";
import { formatCurrency } from "@/app/living-site/lib/format";
import {
  getSavedPropertiesForUser,
  getViewingRequestsForUser,
} from "@/app/living-site/lib/data";

const PageShell = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 16px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
`;

const StatCard = styled(Panel)`
  display: grid;
  gap: 6px;
  background: var(--color-surface);
`;

const StatLabel = styled.span`
  font-size: 0.75rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 700;
`;

const StatValue = styled.div`
  font-size: 1.6rem;
  font-weight: 700;
`;

const List = styled.div`
  display: grid;
  gap: 10px;
`;

const ListItem = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 14px;
  padding: 12px 14px;
  background: var(--color-surface);
  display: grid;
  gap: 6px;
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-muted);
`;

const CTAButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: var(--gradient);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
`;

const BenefitsCard = styled(Panel)`
  display: grid;
  gap: 10px;
`;

const BenefitList = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: var(--color-muted);
  display: grid;
  gap: 6px;
`;

export default function AccountPage() {
  const { user } = useAppState();
  const router = useRouter();
  const [viewingRequests, setViewingRequests] = useState<Array<Record<string, unknown>>>([]);
  const [savedProperties, setSavedProperties] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setLoading(true);
    Promise.all([
      getViewingRequestsForUser(user.id),
      getSavedPropertiesForUser(user.id),
    ])
      .then(([requests, saved]) => {
        if (!active) return;
        setViewingRequests(requests);
        setSavedProperties(saved);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const stats = useMemo(
    () => [
      { label: "Viewing requests", value: viewingRequests.length },
      { label: "Saved properties", value: savedProperties.length },
      { label: "Inquiries", value: 0 },
    ],
    [savedProperties.length, viewingRequests.length]
  );

  return (
    <div>
      <SiteHeader />
      <PageShell>
        <SectionTitle>Account</SectionTitle>
        {user ? (
          <Muted>Signed in as {user.email}</Muted>
        ) : (
          <Muted>Sign in to track your requests and save properties.</Muted>
        )}

        {!user && (
          <BenefitsCard>
            <strong>Why create an account?</strong>
            <BenefitList>
              <li>Save properties and compare later.</li>
              <li>Track viewing requests and follow-up status.</li>
              <li>Get faster requests with prefilled contact details.</li>
              <li>Receive price-change alerts and similar listings.</li>
              <li>Priority follow-up from our agents.</li>
            </BenefitList>
            <CTAButton type="button" onClick={() => router.push("/auth")}>
              Sign in
            </CTAButton>
          </BenefitsCard>
        )}

        {user && (
          <>
            <SummaryGrid>
              {stats.map((stat) => (
                <StatCard key={stat.label}>
                  <StatLabel>{stat.label}</StatLabel>
                  <StatValue>{stat.value}</StatValue>
                </StatCard>
              ))}
            </SummaryGrid>

            <PageSection>
              <SectionTitle>Viewing requests</SectionTitle>
              {loading ? (
                <Muted>Loading requests...</Muted>
              ) : viewingRequests.length ? (
                <List>
                  {viewingRequests.map((request) => {
                    const property = request.property as Record<string, unknown> | undefined;
                    const title = (property?.title as string) || "Property";
                    const location = [property?.township, property?.district]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <ListItem key={String(request.id)}>
                        <strong>{title}</strong>
                        <Muted>{location || "Location TBD"}</Muted>
                        <Muted>
                          {String(request.preferred_date ?? "")}
                          {request.preferred_time_window
                            ? ` · ${String(request.preferred_time_window)}`
                            : ""}
                        </Muted>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Muted>No viewing requests yet.</Muted>
              )}
            </PageSection>

            <PageSection>
              <SectionTitle>Saved properties</SectionTitle>
              {loading ? (
                <Muted>Loading saved properties...</Muted>
              ) : savedProperties.length ? (
                <List>
                  {savedProperties.map((item) => {
                    const property = item.property as Record<string, unknown> | undefined;
                    const title = (property?.title as string) || "Property";
                    const price = property?.price as number | undefined;
                    const currency = (property?.currency as string) || "MMK";
                    const location = [property?.township, property?.district]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <ListItem key={String(item.id)}>
                        <strong>{title}</strong>
                        <Muted>{location || "Location TBD"}</Muted>
                        <Muted>{formatCurrency(price, currency)}</Muted>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Muted>No saved properties yet.</Muted>
              )}
            </PageSection>

            <PageSection>
              <SectionTitle>Inquiries</SectionTitle>
              <Muted>No inquiries yet. We’ll show your agent conversations here.</Muted>
            </PageSection>
          </>
        )}
      </PageShell>
      <BottomNav />
    </div>
  );
}
