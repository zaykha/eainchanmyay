"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { PageSection, SectionTitle, Panel } from "@/app/living-site/components/PageSection";
import { useAppState } from "@/app/living-site/lib/app-state";
import { formatCurrency } from "@/app/living-site/lib/format";
import {
  getInquiriesForUser,
  getSalesRequestsForUser,
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

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

const TabBar = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
`;

const TabButton = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${(props) => (props.$active ? "var(--color-primary)" : "transparent")};
  border-radius: 12px;
  padding: 8px 16px;
  min-width: 140px;
  background: ${(props) =>
    props.$active
      ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
      : "transparent"};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-muted)")};
  font-weight: 600;
  cursor: pointer;
  position: relative;
  text-align: center;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 12px;
    box-shadow: ${(props) =>
      props.$active
        ? "0 6px 16px color-mix(in srgb, var(--color-primary) 25%, transparent)"
        : "none"};
  }
`;

const TabAction = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  background: var(--gradient);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
`;

const CTAButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: var(--gradient);
  color: #fff;
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
  const { user, loading } = useAppState();
  const router = useRouter();
  const [viewingRequests, setViewingRequests] = useState<Array<Record<string, unknown>>>([]);
  const [savedProperties, setSavedProperties] = useState<Array<Record<string, unknown>>>([]);
  const [inquiries, setInquiries] = useState<Array<Record<string, unknown>>>([]);
  const [salesRequests, setSalesRequests] = useState<Array<Record<string, unknown>>>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"viewing" | "saved" | "inquiries" | "sales">(
    "viewing"
  );

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setDataLoading(true);
    Promise.all([
      getViewingRequestsForUser(user.id),
      getSavedPropertiesForUser(user.id),
      getInquiriesForUser(user.id),
      getSalesRequestsForUser(user.id),
    ])
      .then(([requests, saved, inquiryRows, salesRows]) => {
        if (!active) return;
        setViewingRequests(requests.data);
        setSavedProperties(saved.data);
        setInquiries(inquiryRows.data);
        setSalesRequests(salesRows.data);
        const errors = [requests.error, saved.error, inquiryRows.error, salesRows.error]
          .filter(Boolean)
          .join(" • ");
        setLoadError(errors || null);
      })
      .finally(() => {
        if (active) setDataLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <div>
      <SiteHeader />
      <PageShell>
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
            {/* <PageSection> */}
              <HeaderRow>
                <TabBar>
                  <TabButton
                    type="button"
                    $active={activeTab === "viewing"}
                    onClick={() => setActiveTab("viewing")}
                  >
                    Viewing requests
                  </TabButton>
                  <TabButton
                    type="button"
                    $active={activeTab === "saved"}
                    onClick={() => setActiveTab("saved")}
                  >
                    Saved properties
                  </TabButton>
                  <TabButton
                    type="button"
                    $active={activeTab === "inquiries"}
                    onClick={() => setActiveTab("inquiries")}
                  >
                    Inquiries
                  </TabButton>
                  <TabButton
                    type="button"
                    $active={activeTab === "sales"}
                    onClick={() => setActiveTab("sales")}
                  >
                    Sale listings
                  </TabButton>
                </TabBar>
              </HeaderRow>

              {loading || dataLoading ? (
                <Muted>Loading account data...</Muted>
              ) : loadError ? (
                <Muted style={{ color: "var(--color-danger)" }}>{loadError}</Muted>
              ) : activeTab === "viewing" ? (
                viewingRequests.length ? (
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
                )
              ) : activeTab === "saved" ? (
                savedProperties.length ? (
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
                )
              ) : activeTab === "inquiries" ? (
                <>
                  <ActionRow>
                    <TabAction type="button" onClick={() => router.push("/inquiries/new")}>
                      + inquiry
                    </TabAction>
                  </ActionRow>
                  {inquiries.length ? (
                    <List>
                      {inquiries.map((item) => (
                        <ListItem key={String(item.id)}>
                          <strong>
                            {String(item.deal_type ?? "").toUpperCase()} ·{" "}
                            {String(item.property_type ?? "").replace(/_/g, " ")}
                          </strong>
                          <Muted>
                            {[item.township, item.district, item.state_region]
                              .filter(Boolean)
                              .join(", ")}
                          </Muted>
                          <Muted>{String(item.budget_range ?? "")}</Muted>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Muted>No inquiries yet. Start a new inquiry to reach our team.</Muted>
                  )}
                </>
              ) : (
                <>
                  <ActionRow>
                    <TabAction type="button" onClick={() => router.push("/request-sale")}>
                      + sale listing
                    </TabAction>
                  </ActionRow>
                  {salesRequests.length ? (
                    <List>
                      {salesRequests.map((item) => (
                        <ListItem key={String(item.id)}>
                          <strong>{String(item.title ?? "Sale request")}</strong>
                          <Muted>
                            {[item.township, item.district, item.state_region]
                              .filter(Boolean)
                              .join(", ")}
                          </Muted>
                          <Muted>{formatCurrency(item.price as number, item.currency as string)}</Muted>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Muted>No sale listing requests yet.</Muted>
                  )}
                </>
              )}
            {/* </PageSection> */}
          </>
        )}
      </PageShell>
      <BottomNav />
    </div>
  );
}
