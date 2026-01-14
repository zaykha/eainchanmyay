"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Bath,
  BedDouble,
  Calendar,
  Clock,
  Eye,
  Heart,
  Home,
  Mail,
  MapPin,
  Ruler,
  Tag as TagIcon,
  X,
} from "lucide-react";
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-soft);
  }
`;

const ListItemGrid = styled(ListItem)`
  grid-template-columns: 92px 1fr;
  align-items: stretch;
  gap: 12px;
  padding: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 84px 1fr;
  }
`;

const Thumbnail = styled.div`
  width: 92px;
  height: 100%;
  min-height: 72px;
  border-radius: 10px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  overflow: hidden;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: var(--color-muted);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (max-width: 640px) {
    width: 84px;
    min-height: 84px;
    border-radius: 8px;
  }
`;

const ItemContent = styled.div`
  display: grid;
  gap: 6px;
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-muted);
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
`;

const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const DealPill = styled.span`
  border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-muted);
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-muted);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
`;

const DetailRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
`;

const IconLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-muted);

  svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 640px) {
    font-size: 0.85rem;
  }
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-muted);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
`;

const MobileOnly = styled.span`
  display: none;

  @media (max-width: 640px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
`;

const DesktopOnly = styled.span`
  display: inline-flex;

  @media (max-width: 640px) {
    display: none;
  }
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

  @media (max-width: 640px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    justify-content: center;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

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

  @media (max-width: 640px) {
    min-width: auto;
    padding: 8px 12px;
    white-space: nowrap;
    font-size: 0.8rem;
    gap: 6px;
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

  @media (max-width: 640px) {
    display: none;
  }
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

const FloatingAction = styled.button`
  position: fixed;
  right: 16px;
  bottom: 92px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 999px;
  padding: 12px 16px;
  background: var(--gradient);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
  z-index: 30;

  @media (min-width: 641px) {
    display: none;
  }
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

const CardDivider = styled.div`
  height: 1px;
  background: var(--color-outline);
  opacity: 0.6;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--color-paper) 55%, transparent);
  display: grid;
  place-items: center;
  z-index: 90;
  padding: 16px;
`;

const ModalCard = styled(Panel)`
  max-width: 720px;
  width: min(720px, 94vw);
  display: grid;
  gap: 14px;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
`;

const GhostButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: transparent;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
`;

const formatEnum = (value: unknown) => {
  if (!value) return "";
  return String(value).replace(/_/g, " ");
};

const formatDate = (value: unknown) => {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatArea = (value: unknown) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "";
  return `${numeric.toLocaleString("en-US")} sqft`;
};

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
  const [activeInquiry, setActiveInquiry] = useState<Record<string, unknown> | null>(null);
  const [activeSale, setActiveSale] = useState<Record<string, unknown> | null>(null);

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

  const closeDetails = () => {
    setActiveInquiry(null);
    setActiveSale(null);
  };

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
                    <DesktopOnly>Viewing requests</DesktopOnly>
                    <MobileOnly>
                      <Eye size={16} />
                    </MobileOnly>
                  </TabButton>
                  <TabButton
                    type="button"
                    $active={activeTab === "saved"}
                    onClick={() => setActiveTab("saved")}
                  >
                    <DesktopOnly>Saved properties</DesktopOnly>
                    <MobileOnly>
                      <Heart size={16} />
                    </MobileOnly>
                  </TabButton>
                  <TabButton
                    type="button"
                    $active={activeTab === "inquiries"}
                    onClick={() => setActiveTab("inquiries")}
                  >
                    <DesktopOnly>Inquiries</DesktopOnly>
                    <MobileOnly>
                      <Mail size={16} />
                    </MobileOnly>
                  </TabButton>
                  <TabButton
                    type="button"
                    $active={activeTab === "sales"}
                    onClick={() => setActiveTab("sales")}
                  >
                    <DesktopOnly>Sale listings</DesktopOnly>
                    <MobileOnly>
                      <TagIcon size={16} />
                    </MobileOnly>
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
                      const propertyId = String(request.property_id ?? property?.id ?? "");
                      const title = (property?.title as string) || "Property";
                      const location = [property?.township, property?.district]
                        .filter(Boolean)
                        .join(", ");
                      const imageUrl = property?.imageUrl as string | undefined;
                      const price = property?.price as number | undefined;
                      const currency = (property?.currency as string) || "MMK";
                      const typeLabel = formatEnum(property?.property_type);
                      const dealLabel = formatEnum(property?.deal_type);
                      const bedrooms = property?.bedrooms as number | undefined;
                      const bathrooms = property?.bathrooms as number | undefined;
                      const area = formatArea(property?.area_sqft);
                      const requestedDate = formatDate(request.preferred_date);
                      const requestedTime = request.preferred_time_window
                        ? String(request.preferred_time_window)
                        : "";
                      const requestedLabel = [requestedDate, requestedTime]
                        .filter(Boolean)
                        .join(" | ");
                      const createdAt = formatDate(request.created_at);
                      return (
                        <ListItemGrid
                          key={String(request.id)}
                          role="button"
                          tabIndex={0}
                          onClick={() => propertyId && router.push(`/listing/${propertyId}`)}
                          onKeyDown={(event) => {
                            if ((event.key === "Enter" || event.key === " ") && propertyId) {
                              event.preventDefault();
                              router.push(`/listing/${propertyId}`);
                            }
                          }}
                          aria-label={`View ${title}`}
                        >
                          <Thumbnail>
                            {imageUrl ? <img src={imageUrl} alt={title} /> : "No photo"}
                          </Thumbnail>
                          <ItemContent>
                            <TitleRow>
                              <TitleGroup>
                                <strong>{title}</strong>
                                {dealLabel ? <DealPill>{dealLabel}</DealPill> : null}
                              </TitleGroup>
                              <StatusRow>
                                <StatusBadge>
                                  <BadgeCheck size={12} />
                                  Requested
                                </StatusBadge>
                                <span>{createdAt || "TBD"}</span>
                              </StatusRow>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {location || "Location TBD"}
                            </IconLabel>
                            <CardDivider />
                            <DetailRow>
                              <IconLabel>
                                <Calendar />
                                {requestedLabel || "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <TagIcon />
                                {formatCurrency(price, currency) || "TBD"}
                              </IconLabel>
                            </DetailRow>
                            <DetailRow>
                              <IconLabel>
                                <Home />
                                {[typeLabel].filter(Boolean).join(" ") || "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <BedDouble />
                                {bedrooms ?? "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <Bath />
                                {bathrooms ?? "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <Ruler />
                                {area || "TBD"}
                              </IconLabel>
                            </DetailRow>
                          </ItemContent>
                        </ListItemGrid>
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
                      const propertyId = String(item.property_id ?? property?.id ?? "");
                      const title = (property?.title as string) || "Property";
                      const price = property?.price as number | undefined;
                      const currency = (property?.currency as string) || "MMK";
                      const location = [property?.township, property?.district]
                        .filter(Boolean)
                        .join(", ");
                      const imageUrl = property?.imageUrl as string | undefined;
                      const typeLabel = formatEnum(property?.property_type);
                      const dealLabel = formatEnum(property?.deal_type);
                      const bedrooms = property?.bedrooms as number | undefined;
                      const bathrooms = property?.bathrooms as number | undefined;
                      const area = formatArea(property?.area_sqft);
                      const savedAt = formatDate(item.created_at);
                      return (
                        <ListItemGrid
                          key={String(item.id)}
                          role="button"
                          tabIndex={0}
                          onClick={() => propertyId && router.push(`/listing/${propertyId}`)}
                          onKeyDown={(event) => {
                            if ((event.key === "Enter" || event.key === " ") && propertyId) {
                              event.preventDefault();
                              router.push(`/listing/${propertyId}`);
                            }
                          }}
                          aria-label={`View ${title}`}
                        >
                          <Thumbnail>
                            {imageUrl ? <img src={imageUrl} alt={title} /> : "No photo"}
                          </Thumbnail>
                          <ItemContent>
                            <TitleRow>
                              <TitleGroup>
                                <strong>{title}</strong>
                                {dealLabel ? <DealPill>{dealLabel}</DealPill> : null}
                              </TitleGroup>
                              <StatusRow>
                                <StatusBadge>
                                  <BadgeCheck size={12} />
                                  Saved
                                </StatusBadge>
                                <span>{savedAt || "TBD"}</span>
                              </StatusRow>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {location || "Location TBD"}
                            </IconLabel>
                            <CardDivider />
                            <DetailRow>
                              <IconLabel>
                                <Calendar />
                                {savedAt || "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <TagIcon />
                                {formatCurrency(price, currency) || "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <Home />
                                {[typeLabel].filter(Boolean).join(" ") || "TBD"}
                              </IconLabel>
                            </DetailRow>
                            <DetailRow>
                              <IconLabel>
                                <BedDouble />
                                {bedrooms ?? "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <Bath />
                                {bathrooms ?? "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <Ruler />
                                {area || "TBD"}
                              </IconLabel>
                            </DetailRow>
                          </ItemContent>
                        </ListItemGrid>
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
                      {inquiries.map((item) => {
                        const needs = [];
                        if (item.need_parking) needs.push("Parking");
                        if (item.need_lift) needs.push("Lift");
                        if (item.need_solar) needs.push("Solar");
                        if (item.need_generator) needs.push("Generator");
                        const timeline = formatEnum(item.timeline);
                        const createdAt = formatDate(item.created_at);
                        return (
                          <ListItem
                            key={String(item.id)}
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveInquiry(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setActiveInquiry(item);
                              }
                            }}
                            aria-label="View inquiry details"
                          >
                            <TitleRow>
                              <TitleGroup>
                                <strong>
                                  {String(item.deal_type ?? "").toUpperCase()} {formatEnum(item.property_type)}
                                </strong>
                              </TitleGroup>
                              <StatusRow>
                                <StatusBadge>
                                  <BadgeCheck size={12} />
                                  Inquiry
                                </StatusBadge>
                                <span>{createdAt || "TBD"}</span>
                              </StatusRow>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {[item.township, item.district, item.state_region]
                                .filter(Boolean)
                                .join(", ") || "Location TBD"}
                            </IconLabel>
                            <CardDivider />
                            <DetailRow>
                              <IconLabel>
                                <TagIcon />
                                {String(item.budget_range ?? "") || "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <Clock />
                                {timeline || "TBD"}
                              </IconLabel>
                            </DetailRow>
                            {needs.length ? (
                              <TagRow>
                                {needs.map((need) => (
                                  <Tag key={need}>{need}</Tag>
                                ))}
                              </TagRow>
                            ) : (
                              <Muted>No special requirements</Muted>
                            )}
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Muted>No inquiries yet. Start a new inquiry to reach our team.</Muted>
                  )}
                  <FloatingAction type="button" onClick={() => router.push("/inquiries/new")}>
                    + inquiry
                  </FloatingAction>
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
                      {salesRequests.map((item) => {
                        const typeLabel = formatEnum(item.property_type);
                        const dealLabel = formatEnum(item.deal_type);
                        const createdAt = formatDate(item.created_at);
                        return (
                          <ListItem
                            key={String(item.id)}
                            role="button"
                            tabIndex={0}
                            onClick={() => setActiveSale(item)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setActiveSale(item);
                              }
                            }}
                            aria-label="View sale request details"
                          >
                            <TitleRow>
                              <TitleGroup>
                                <strong>{String(item.title ?? "Sale request")}</strong>
                                {dealLabel ? <DealPill>{dealLabel}</DealPill> : null}
                              </TitleGroup>
                              <StatusRow>
                                <StatusBadge>
                                  <BadgeCheck size={12} />
                                  Submitted
                                </StatusBadge>
                                <span>{createdAt || "TBD"}</span>
                              </StatusRow>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {[item.township, item.district, item.state_region]
                                .filter(Boolean)
                                .join(", ") || "Location TBD"}
                            </IconLabel>
                            <CardDivider />
                            <DetailRow>
                              <IconLabel>
                                <Calendar />
                                {createdAt || "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <TagIcon />
                                {formatCurrency(item.price as number, item.currency as string) || "TBD"}
                              </IconLabel>
                              <IconLabel>
                                <Home />
                                {[typeLabel].filter(Boolean).join(" ") || "TBD"}
                              </IconLabel>
                            </DetailRow>
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Muted>No sale listing requests yet.</Muted>
                  )}
                  <FloatingAction type="button" onClick={() => router.push("/request-sale")}>
                    + sale listing
                  </FloatingAction>
                </>
              )}
            {/* </PageSection> */}
          </>
        )}
      </PageShell>
      {activeInquiry && (
        <ModalOverlay onClick={closeDetails}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <strong>
                  {String(activeInquiry.deal_type ?? "").toUpperCase()} {formatEnum(activeInquiry.property_type)}
                </strong>
                <Muted>{formatDate(activeInquiry.created_at) || "Submitted date TBD"}</Muted>
              </div>
              <GhostButton type="button" onClick={closeDetails} aria-label="Close details">
                <X size={16} />
              </GhostButton>
            </ModalHeader>
            <IconLabel>
              <MapPin />
              {[activeInquiry.township, activeInquiry.district, activeInquiry.state_region]
                .filter(Boolean)
                .join(", ") || "Location TBD"}
            </IconLabel>
            <CardDivider />
            <DetailRow>
              <IconLabel>
                <TagIcon />
                {String(activeInquiry.budget_range ?? "") || "Budget TBD"}
              </IconLabel>
              <IconLabel>
                <Clock />
                {formatEnum(activeInquiry.timeline) || "Timeline TBD"}
              </IconLabel>
            </DetailRow>
            {(() => {
              const needs = [];
              if (activeInquiry.need_parking) needs.push("Parking");
              if (activeInquiry.need_lift) needs.push("Lift");
              if (activeInquiry.need_solar) needs.push("Solar");
              if (activeInquiry.need_generator) needs.push("Generator");
              return needs.length ? (
                <TagRow>
                  {needs.map((need) => (
                    <Tag key={need}>{need}</Tag>
                  ))}
                </TagRow>
              ) : (
                <Muted>No special requirements</Muted>
              );
            })()}
            <ModalActions>
              <GhostButton type="button" onClick={closeDetails}>
                Close
              </GhostButton>
              <CTAButton
                type="button"
                onClick={() => {
                  closeDetails();
                  router.push(`/inquiries/new?editId=${String(activeInquiry.id ?? "")}`);
                }}
              >
                Edit inquiry
              </CTAButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
      {activeSale && (
        <ModalOverlay onClick={closeDetails}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <strong>{String(activeSale.title ?? "Sale request")}</strong>
                <Muted>{formatDate(activeSale.created_at) || "Submitted date TBD"}</Muted>
              </div>
              <GhostButton type="button" onClick={closeDetails} aria-label="Close details">
                <X size={16} />
              </GhostButton>
            </ModalHeader>
            <IconLabel>
              <MapPin />
              {[activeSale.township, activeSale.district, activeSale.state_region]
                .filter(Boolean)
                .join(", ") || "Location TBD"}
            </IconLabel>
            <CardDivider />
            <DetailRow>
              <IconLabel>
                <TagIcon />
                {formatCurrency(activeSale.price as number, activeSale.currency as string) || "Price TBD"}
              </IconLabel>
              <IconLabel>
                <Home />
                {[formatEnum(activeSale.deal_type), formatEnum(activeSale.property_type)]
                  .filter(Boolean)
                  .join(" ") || "Type TBD"}
              </IconLabel>
              <IconLabel>
                <BedDouble />
                {activeSale.bedrooms ?? "TBD"}
              </IconLabel>
              <IconLabel>
                <Bath />
                {activeSale.bathrooms ?? "TBD"}
              </IconLabel>
              <IconLabel>
                <Ruler />
                {formatArea(activeSale.area_sqft) || "TBD"}
              </IconLabel>
            </DetailRow>
            {activeSale.address_text ? (
              <Muted>{String(activeSale.address_text)}</Muted>
            ) : activeSale.city ? (
              <Muted>{String(activeSale.city)}</Muted>
            ) : null}
            {activeSale.description ? <Muted>{String(activeSale.description)}</Muted> : null}
            <ModalActions>
              <GhostButton type="button" onClick={closeDetails}>
                Close
              </GhostButton>
              <CTAButton
                type="button"
                onClick={() => {
                  closeDetails();
                  router.push(`/request-sale?editId=${String(activeSale.id ?? "")}`);
                }}
              >
                Edit listing
              </CTAButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
      <BottomNav />
    </div>
  );
}
