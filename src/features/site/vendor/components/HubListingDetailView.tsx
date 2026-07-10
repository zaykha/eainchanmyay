"use client";

import type { ReactNode } from "react";
import { Bath, BedDouble, Building2, Calendar, ChevronLeft, Home, MapPin, Megaphone, Pencil, Ruler, ShieldCheck, Trash2 } from "lucide-react";
import styled from "styled-components";
import { formatCurrency } from "@/features/site/shared/lib/format";
import type { Translate } from "@/features/site/shared/lib/i18n";
import { formatPropertyTypeValue } from "@/lib/property-types";

type HubListingProperty = {
  id?: string;
  title?: string | null;
  status?: string | null;
  property_type?: string | null;
  deal_type?: string | null;
  cover_image_url?: string | null;
  price?: number | null;
  currency?: string | null;
  area_sqft?: number | null;
  township?: string | null;
  district?: string | null;
  city?: string | null;
  state_region?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  room_count?: number | null;
  floor_count?: number | null;
  has_parking?: boolean | null;
  has_lift?: boolean | null;
  appointments_count?: number | null;
};

type FactCard = {
  key: string;
  label: string;
  icon: ReactNode;
  wide?: boolean;
  value?: string;
  render?: ReactNode;
};

type PropertyDetail = {
  property: HubListingProperty;
  unassigned_count?: number;
};

type ListingAppointment = {
  id: string;
  time: string;
  title: string;
  client: string;
  assignee: string;
  status: string;
};

type ListingStaff = {
  id: string;
  name: string;
  assigned_count: number;
};

type HubListingDetailViewProps = {
  t: Translate;
  locale: string;
  language: string;
  detail: PropertyDetail | null;
  loading: boolean;
  error: string | null;
  canCreateAppointments: boolean;
  canManageListingOperations: boolean;
  canShowPromoteAction: boolean;
  deleting: boolean;
  statusSaving: boolean;
  statusError: string | null;
  statusNotice: string | null;
  hasStatusOptions: boolean;
  appointments: ListingAppointment[];
  staff: ListingStaff[];
  onBack: () => void;
  onScheduleAppointment: () => void;
  onOpenStatusModal: () => void;
  onEditListing: () => void;
  onOpenDeleteModal: () => void;
  onPromoteListing: () => void;
  onOpenAppointmentEditor: (appointmentId: string) => void;
  getListingStatusTone: (value: string | null | undefined) => "status-success" | "status-warning" | "status-danger" | "status-muted" | "neutral";
  getListingStatusLabel: (value: string | null | undefined, t: Translate) => string;
  getDealTypeLabel: (value: string | null | undefined) => string;
  getCompactDealTypeLabel: (value: string | null | undefined) => string;
  translateLocationName: (value: string, language: string) => string;
  formatArea: (value: unknown, locale: string, unitLabel: string) => string;
};

const Viewport = styled.div`
  @media (max-width: 640px) {
    min-height: auto;
    max-height: none;
    height: auto;
    overflow: visible;
  }
`;

const Scroller = styled.div`
  display: grid;
  gap: 16px;

  @media (max-width: 640px) {
    min-height: auto;
    height: auto;
    overflow: visible;
    padding-right: 0;
  }
`;

const Copy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.55;
`;

const Skeleton = styled.div<{ $height?: number; $radius?: number }>`
  width: 100%;
  height: ${(props) => `${props.$height ?? 16}px`};
  border-radius: ${(props) => `${props.$radius ?? 14}px`};
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-surface-2) 92%, transparent) 0%,
    color-mix(in srgb, var(--color-outline) 38%, white) 50%,
    color-mix(in srgb, var(--color-surface-2) 92%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s linear infinite;

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    align-items: flex-start;
  }
`;

const Back = styled.button`
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  @media (max-width: 640px) {
    min-height: 32px;
    min-width: 32px;
    padding: 0;
    justify-content: center;
    flex: 0 0 32px;
  }
`;

const BackLabel = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`;

const HeaderWrap = styled.div`
  display: grid;
  gap: 4px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const HeaderTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-text);
`;

const HeaderCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.45;

  @media (max-width: 640px) {
    display: none;
  }
`;

const ActionButton = styled.button`
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: var(--gradient);
  color: white;
  font-weight: 700;
  cursor: pointer;
`;

const Hero = styled.div`
  display: grid;
  grid-template-columns: minmax(228px, 0.88fr) minmax(0, 1.12fr);
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const HeroImage = styled.div<{ $image?: string }>`
  min-height: 220px;
  border-radius: 20px;
  border: 1px solid var(--color-outline);
  background: ${(props) =>
    props.$image ? `center / cover no-repeat url(${props.$image})` : "color-mix(in srgb, var(--color-surface) 92%, white)"};
  display: grid;
  place-items: center;
  color: var(--color-muted);
  overflow: hidden;
`;

const Info = styled.div`
  display: grid;
  gap: 10px;
  border: 1px solid var(--color-outline);
  border-radius: 20px;
  background: color-mix(in srgb, var(--color-surface-2) 72%, white);
  padding: 14px;
`;

const PillRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
`;

const Pills = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const Pill = styled.span<{ $tone?: "neutral" | "warning" | "success" }>`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  border: 1px solid var(--color-outline);
  background: ${(props) => (props.$tone === "warning" ? "#fff1f3" : props.$tone === "success" ? "#ecfdf5" : "var(--color-surface)")};
  color: ${(props) => (props.$tone === "warning" ? "#b4233a" : props.$tone === "success" ? "#0f766e" : "var(--color-text)")};
`;

const StatusButton = styled.button<{ $tone?: "neutral" | "warning" | "success" }>`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: ${(props) => (props.$tone === "warning" ? "#fff1f3" : props.$tone === "success" ? "#ecfdf5" : "var(--color-surface)")};
  color: ${(props) => (props.$tone === "warning" ? "#b4233a" : props.$tone === "success" ? "#0f766e" : "var(--color-text)")};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const IconAction = styled.button<{ $danger?: boolean }>`
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid ${(props) => (props.$danger ? "rgba(225, 29, 72, 0.18)" : "color-mix(in srgb, var(--color-primary) 18%, var(--color-outline))")};
  background: ${(props) => (props.$danger ? "#fff1f2" : "#fff1f3")};
  color: ${(props) => (props.$danger ? "#be123c" : "var(--color-primary)")};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const Message = styled.div<{ $tone?: "danger" | "success" }>`
  color: ${(props) => (props.$tone === "danger" ? "var(--color-danger)" : "#0f766e")};
  font-size: 0.82rem;
  font-weight: 600;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-text);
`;

const Price = styled.div`
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.1;
`;

const PromoteAction = styled.button`
  min-height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(236, 72, 153, 0.18);
  background: linear-gradient(135deg, #fff1f7 0%, #ffe4ef 100%);
  color: #be185d;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const MetaCard = styled.div<{ $wide?: boolean }>`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 10px 12px;
  display: grid;
  gap: 4px;
  align-content: start;
  min-height: 76px;
  ${(props) => (props.$wide ? "grid-column: span 2;" : "")}
`;

const MetaLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.72rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const MetaValue = styled.strong`
  color: var(--color-text);
  font-size: 0.8rem;
  line-height: 1.3;
`;

const LocationValue = styled.div`
  display: grid;
  gap: 4px;
`;

const LocationPrimary = styled.strong`
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.25;
`;

const LocationSecondary = styled.span`
  color: var(--color-muted);
  font-size: 0.74rem;
  line-height: 1.25;
`;

const Lower = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 24px;
  background: color-mix(in srgb, var(--color-surface-2) 72%, white);
  padding: 18px;
  display: grid;
  gap: 14px;
`;

const SectionTitle = styled.h4`
  margin: 0;
  color: var(--color-text);
  font-size: 0.98rem;
`;

const AppointmentList = styled.div`
  display: grid;
  gap: 10px;
`;

const AppointmentRow = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 12px 14px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const AppointmentTime = styled.strong`
  color: var(--color-text);
  font-size: 0.9rem;
`;

const AppointmentMain = styled.div`
  display: grid;
  gap: 4px;
`;

const AppointmentTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.88rem;
`;

const AppointmentMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.78rem;
  line-height: 1.4;
`;

const StaffList = styled.div`
  display: grid;
  gap: 10px;
`;

const StaffRow = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 12px 14px;
  display: grid;
  gap: 5px;
`;

const StaffName = styled.strong`
  color: var(--color-text);
  font-size: 0.88rem;
`;

const StaffMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.78rem;
  line-height: 1.4;
`;

const DesktopLabel = styled.span`
  @media (max-width: 640px) { display: none; }
`;

const MobileLabel = styled.span`
  display: none;
  @media (max-width: 640px) { display: inline; }
`;

export function HubListingDetailView(props: HubListingDetailViewProps) {
  const {
    t, locale, language, detail, loading, error, canCreateAppointments,
    canManageListingOperations, canShowPromoteAction, deleting, statusSaving, statusError, statusNotice,
    hasStatusOptions, appointments, staff, onBack, onScheduleAppointment, onOpenStatusModal, onEditListing,
    onOpenDeleteModal, onPromoteListing, onOpenAppointmentEditor, getListingStatusTone,
    getListingStatusLabel, getDealTypeLabel, getCompactDealTypeLabel, translateLocationName, formatArea,
  } = props;

  const property = detail?.property ?? null;
  const statusTone =
    property && getListingStatusTone(property.status) === "status-success"
      ? "success"
      : property && getListingStatusTone(property.status) === "status-warning"
        ? "warning"
        : "neutral";

  const renderFactCards = () => {
    if (!property) return null;
    const area = formatArea(property.area_sqft, locale, t("listing.areaSqft"));
    const township = property.township?.trim() ? translateLocationName(property.township.trim(), language) : "";
    const district = (property.district || property.city || "").trim()
      ? translateLocationName((property.district || property.city || "").trim(), language)
      : "";
    const stateRegion = property.state_region?.trim() ? translateLocationName(property.state_region.trim(), language) : "";
    const locationSecondary = [district, stateRegion].filter(Boolean).join(" • ");
    const featureValue = [
      property.has_parking ? t("requestSale.parking") : null,
      property.has_lift ? t("requestSale.lift") : null,
    ].filter(Boolean).join(" • ");
    const factCards = [
      township || locationSecondary ? { key: "location", label: t("listing.location"), icon: <MapPin size={14} />, wide: true, render: (
        <LocationValue>
          {township ? <LocationPrimary>{township}</LocationPrimary> : null}
          {locationSecondary ? <LocationSecondary>{locationSecondary}</LocationSecondary> : null}
        </LocationValue>
      ) } : null,
      area ? { key: "area", label: t("filter.area"), icon: <Ruler size={14} />, value: area } : null,
      typeof property.bedrooms === "number" ? { key: "bedrooms", label: t("filter.bedrooms"), icon: <BedDouble size={14} />, value: String(property.bedrooms) } : null,
      typeof property.bathrooms === "number" ? { key: "bathrooms", label: t("filter.bathrooms"), icon: <Bath size={14} />, value: String(property.bathrooms) } : null,
      typeof property.room_count === "number" ? { key: "rooms", label: t("hub.rooms"), icon: <Home size={14} />, value: String(property.room_count) } : null,
      typeof property.floor_count === "number" ? { key: "floors", label: t("hub.floors"), icon: <Building2 size={14} />, value: String(property.floor_count) } : null,
      (property.appointments_count ?? 0) > 0 ? { key: "appointments", label: t("hub.appointmentsCount"), icon: <Calendar size={14} />, value: t("hub.scheduledCount", { count: property.appointments_count ?? 0 }) } : null,
      featureValue ? { key: "features", label: t("hub.features"), icon: <ShieldCheck size={14} />, value: featureValue } : null,
    ].filter(Boolean) as FactCard[];
    return (
      <MetaGrid>
        {factCards.map((card) => (
          <MetaCard key={card.key} $wide={card.wide}>
            <MetaLabel>{card.icon}{card.label}</MetaLabel>
            {card.render ? card.render : <MetaValue>{card.value}</MetaValue>}
          </MetaCard>
        ))}
      </MetaGrid>
    );
  };

  return (
    <Viewport>
      <Scroller>
        <Header>
          <HeaderWrap>
            <HeaderRow>
              <Back type="button" onClick={onBack}>
                <ChevronLeft size={16} />
                <BackLabel>{t("hub.backToListings")}</BackLabel>
              </Back>
              <HeaderTitle>{t("hub.listingDetailTitle")}</HeaderTitle>
            </HeaderRow>
            <HeaderCopy>{t("hub.listingDetailCopy")}</HeaderCopy>
          </HeaderWrap>
          {canCreateAppointments ? <ActionButton type="button" onClick={onScheduleAppointment}><DesktopLabel>{t("hub.scheduleAppointment")}</DesktopLabel><MobileLabel>{t("hub.scheduleAppointmentShort")}</MobileLabel></ActionButton> : null}
        </Header>

        <Hero>
          {loading ? (
            <>
              <Skeleton $height={260} $radius={24} />
              <Info>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Skeleton $height={28} $radius={999} style={{ width: 88 }} />
                    <Skeleton $height={28} $radius={999} style={{ width: 82 }} />
                    <Skeleton $height={28} $radius={999} style={{ width: 104 }} />
                  </div>
                  <Skeleton $height={30} $radius={999} style={{ width: 118 }} />
                </div>
                <Skeleton $height={28} style={{ width: "58%" }} />
                <Skeleton $height={22} style={{ width: "34%" }} />
                <MetaGrid>
                  <Skeleton $height={78} $radius={18} />
                  <Skeleton $height={78} $radius={18} />
                  <Skeleton $height={78} $radius={18} />
                  <Skeleton $height={78} $radius={18} />
                </MetaGrid>
              </Info>
            </>
          ) : error || !property ? (
            <Copy>{error ?? t("hub.unableLoadListingDetail")}</Copy>
          ) : (
            <>
              <HeroImage $image={property.cover_image_url || undefined}>
                {!property.cover_image_url ? <Building2 size={24} /> : null}
              </HeroImage>
              <Info>
                <PillRow>
                  <Pills>
                    {canManageListingOperations ? (
                      <StatusButton type="button" $tone={statusTone} onClick={onOpenStatusModal} disabled={!hasStatusOptions || deleting}>
                        {getListingStatusLabel(property.status, t)}
                      </StatusButton>
                    ) : (
                      <Pill>{getListingStatusLabel(property.status, t)}</Pill>
                    )}
                    <Pill $tone="warning"><DesktopLabel>{getDealTypeLabel(property.deal_type)}</DesktopLabel><MobileLabel>{getCompactDealTypeLabel(property.deal_type)}</MobileLabel></Pill>
                    <Pill>{formatPropertyTypeValue(property.property_type ?? null, t)}</Pill>
                    {canManageListingOperations ? (
                      <>
                        <IconAction type="button" aria-label={t("hub.editListing")} onClick={onEditListing} disabled={deleting}><Pencil size={14} /></IconAction>
                        <IconAction type="button" $danger aria-label={t("hub.deleteListing")} onClick={onOpenDeleteModal} disabled={deleting || statusSaving}><Trash2 size={14} /></IconAction>
                      </>
                    ) : null}
                  </Pills>
                </PillRow>
                {statusError ? <Message $tone="danger">{statusError}</Message> : null}
                {statusNotice ? <Message $tone="success">{statusNotice}</Message> : null}
                <Title>{property.title || t("vendor.properties.untitled")}</Title>
                <Price>{formatCurrency(property.price ?? undefined, property.currency ?? "MMK", t("listing.contactPrice"), language)}</Price>
                {canShowPromoteAction ? (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <PromoteAction type="button" onClick={onPromoteListing} disabled={deleting || statusSaving}>
                      <Megaphone size={13} />
                      <span>{t("hub.boostThisListing")}</span>
                    </PromoteAction>
                  </div>
                ) : null}
                {renderFactCards()}
              </Info>
            </>
          )}
        </Hero>

        <Lower>
          <Card>
            <SectionTitle>{t("hub.scheduledAppointments")}</SectionTitle>
            <AppointmentList>
              {loading ? (
                <>
                  <Skeleton $height={84} $radius={18} />
                  <Skeleton $height={84} $radius={18} />
                  <Skeleton $height={84} $radius={18} />
                </>
              ) : appointments.length ? (
                appointments.map((appointment) => (
                  <AppointmentRow key={appointment.id} type="button" onClick={() => onOpenAppointmentEditor(appointment.id)}>
                    <AppointmentTime>{appointment.time}</AppointmentTime>
                    <AppointmentMain>
                      <AppointmentTitle>{appointment.title}</AppointmentTitle>
                      <AppointmentMeta>{t("hub.assignedTo", { client: appointment.client, assignee: appointment.assignee })}</AppointmentMeta>
                    </AppointmentMain>
                    <Pill $tone={appointment.status === "Confirmed" ? "success" : "warning"}>{appointment.status}</Pill>
                  </AppointmentRow>
                ))
              ) : (
                <Copy>{t("hub.noListingAppointments")}</Copy>
              )}
            </AppointmentList>
          </Card>

          <Card>
            <SectionTitle>{t("hub.staffAssignment")}</SectionTitle>
            <StaffList>
              {loading ? (
                <>
                  <Skeleton $height={62} $radius={16} />
                  <Skeleton $height={62} $radius={16} />
                  <Skeleton $height={62} $radius={16} />
                </>
              ) : staff.length ? (
                staff.map((member) => (
                  <StaffRow key={member.id}>
                    <StaffName>{member.name}</StaffName>
                    <StaffMeta>
                      {member.assigned_count > 1
                        ? t("hub.assignedAppointmentsPlural", { count: member.assigned_count })
                        : t("hub.assignedAppointmentsSingular", { count: member.assigned_count })}
                    </StaffMeta>
                  </StaffRow>
                ))
              ) : (
                <Copy>
                  {detail?.unassigned_count
                    ? detail.unassigned_count > 1
                      ? t("hub.unassignedAppointmentsPlural", { count: detail.unassigned_count })
                      : t("hub.unassignedAppointmentsSingular", { count: detail.unassigned_count })
                    : t("hub.noStaffAssignments")}
                </Copy>
              )}
            </StaffList>
          </Card>
        </Lower>
      </Scroller>
    </Viewport>
  );
}
