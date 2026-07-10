"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
  Eye,
  Globe2,
  Heart,
  Home,
  ImageIcon,
  Lock,
  Mail,
  Menu,
  MapPin,
  MoreVertical,
  Megaphone,
  MessageSquareText,
  Phone,
  Plus,
  Ruler,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag as TagIcon,
  Upload,
  Users2,
  X,
} from "lucide-react";
import { useLanguage } from "@/features/site/shared/components/Providers";
import { Panel } from "@/features/site/shared/components/PageSection";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { supabase } from "@/features/site/shared/lib/supabaseClient";
import {
  deriveActiveContextFromPath,
  readActiveContext,
  readActiveVendorWorkspace,
  withActiveVendorHeaders,
  writeActiveContext,
  writeActiveVendorWorkspace,
} from "@/features/site/vendor/lib/active-context";
import { readWorkspaceCache, writeWorkspaceCache } from "@/features/site/vendor/lib/vendor-workspace-cache";
import { formatCurrency } from "@/features/site/shared/lib/format";
import {
  getInquiriesForUser,
  getOwnedPropertiesForUser,
  getSavedPropertiesForUser,
  getViewingRequestsForUser,
} from "@/features/site/shared/lib/data";
import { useI18n } from "@/features/site/shared/lib/i18n";
import { translateLocationName } from "@/features/site/shared/lib/myanmar-geo";
import { getUpgradePlan, getVendorPlan } from "@/lib/vendor-plans";
import { listingStatuses, normalizeListingStatus, type ListingStatus } from "@/lib/lifecycle";
import { isVendorStorefrontSetupComplete } from "@/lib/vendor-storefront";
import { formatPropertyTypeValue } from "@/lib/property-types";
import { CustomSelect } from "@/features/site/shared/components/form-controls/CustomSelect";
import {
  VendorPropertiesView,
  type VendorPropertyItem,
} from "@/features/site/vendor/components/VendorPropertiesView";
import { VendorImportView } from "@/features/site/vendor/components/VendorImportView";
import { VendorInquiriesView } from "@/features/site/vendor/components/VendorInquiriesView";
import { HubPage } from "@/features/site/vendor/components/HubPage";
import { HubListingDetailView } from "@/features/site/vendor/components/HubListingDetailView";
import { HubAppointmentsView } from "@/features/site/vendor/components/HubAppointmentsView";
import { HubAppointmentEditorModal } from "@/features/site/vendor/components/HubAppointmentEditorModal";
import { HubStaffAppointmentsModal } from "@/features/site/vendor/components/HubStaffAppointmentsModal";
import { VendorVerificationView } from "@/features/site/vendor/components/VendorVerificationView";
import { VendorPromotionsView } from "@/features/site/vendor/components/VendorPromotionsView";
import type { HubSection } from "@/features/site/vendor/lib/hub-sections";
import { HubAnalyticsContent } from "@/app/hub/analytics/page";

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;

type VendorOverviewPayload = {
  metrics: {
    totalProperties: number;
    publishedProperties: number;
    draftProperties: number;
    soldProperties: number;
    rentedProperties: number;
    archivedProperties: number;
    totalValue: number;
    publishedValue: number;
    appointmentsCount: number;
    listingViewsCount: number;
    inquiryLeadCount: number;
  };
  nextAppointment:
    | {
        title: string | null;
        client_name: string | null;
        start_at: string | null;
      }
    | null;
  statusMix: Array<{ key: string; count: number }>;
  listingTypes: Array<{ key: string; count: number }>;
  salesByType: Array<{ key: string; count: number }>;
  priceRangesByType: Array<{ key: string; min: number; max: number; count: number; currency: string }>;
  appointmentsByType: Array<{ key: string; count: number }>;
};

type HubPropertyDetailPayload = {
  property: VendorPropertyItem;
  appointments: Array<{
    id: string;
    title: string | null;
    start_at: string | null;
    status: string | null;
    client_name: string | null;
    assigned_staff_id: string | null;
    assigned_staff_name: string | null;
  }>;
  staff_summary: Array<{
    id: string;
    name: string;
    assigned_count: number;
  }>;
  unassigned_count: number;
};

type VendorAppointmentsDashboardPayload = {
  stats: {
    today: number;
    unassigned: number;
    upcoming: number;
  };
  assignments: Array<{
    id: string;
    name: string;
    role: string;
    assigned_count: number;
  }>;
  appointments: Array<{
    id: string;
    title: string;
    start_at: string | null;
    status: string;
    client_name: string;
    client_phone: string | null;
    notes: string | null;
    property_id: string | null;
    property_title: string;
    property_location: string;
    assigned_staff_id: string | null;
    assigned_staff_name: string | null;
    source: "appointment" | "viewing_request";
    is_unread?: boolean;
  }>;
};

function toLocalDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0"
  )}`;
}

const HUB_SNAPSHOT_TEMPLATE: VendorOverviewPayload = {
  metrics: {
    totalProperties: 18,
    publishedProperties: 12,
    draftProperties: 4,
    soldProperties: 2,
    rentedProperties: 1,
    archivedProperties: 0,
    totalValue: 400000000,
    publishedValue: 320000000,
    appointmentsCount: 14,
    listingViewsCount: 328,
    inquiryLeadCount: 42,
  },
  nextAppointment: {
    title: "Condo viewing with buyer",
    client_name: "Ko Aung",
    start_at: "2026-05-09T10:30:00+09:00",
  },
  statusMix: [
    { key: "published", count: 12 },
    { key: "draft", count: 4 },
    { key: "sold", count: 2 },
  ],
  listingTypes: [
    { key: "condo", count: 6 },
    { key: "house", count: 5 },
    { key: "land", count: 4 },
    { key: "shop_office", count: 3 },
  ],
  salesByType: [
    { key: "condo", count: 3 },
    { key: "house", count: 2 },
    { key: "land", count: 1 },
  ],
  priceRangesByType: [
    { key: "condo", min: 180000000, max: 420000000, count: 4, currency: "MMK" },
    { key: "house", min: 250000000, max: 950000000, count: 3, currency: "MMK" },
    { key: "land", min: 120000000, max: 600000000, count: 3, currency: "MMK" },
    { key: "shop_office", min: 300000000, max: 800000000, count: 2, currency: "MMK" },
  ],
  appointmentsByType: [
    { key: "condo", count: 6 },
    { key: "house", count: 4 },
    { key: "land", count: 3 },
    { key: "shop_office", count: 1 },
  ],
};

const HUB_SUMMARY_TEMPLATE = {
  totalValue: HUB_SNAPSHOT_TEMPLATE.metrics.totalValue,
  nextAppointmentTitle: HUB_SNAPSHOT_TEMPLATE.nextAppointment?.title ?? "Upcoming appointment",
  nextAppointmentAt: HUB_SNAPSHOT_TEMPLATE.nextAppointment?.start_at ?? null,
};

type InsightSummaryItem = { key: string; count: number; label?: string };

function withOthers<T extends InsightSummaryItem>(items: T[], limit = 4): InsightSummaryItem[] {
  const top = items.slice(0, limit);
  if (items.length <= limit) return top;
  const othersCount = items.slice(limit).reduce((sum, item) => sum + item.count, 0);
  return [...top, { count: othersCount, key: "others", label: "Others" }];
}

const Header = styled.header`
  padding-bottom: 14px;

  @media (max-width: 720px) {
    padding: 0;
  }
`;

const VendorIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;

  @media (max-width: 640px) {
    align-items: flex-start;
    gap: 10px;
  }
`;

const VendorLogoBadge = styled.div<{ $image?: string }>`
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  border-radius: 18px;
  border: 1px solid var(--color-outline);
  background: ${(props) =>
    props.$image ? `center / cover no-repeat url(${props.$image})` : "var(--color-surface-2)"};
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
  display: grid;
  place-items: center;
  color: var(--color-muted);
  overflow: hidden;

  @media (max-width: 640px) {
    width: 46px;
    height: 46px;
    flex-basis: 46px;
    border-radius: 14px;
  }
`;

const HeaderInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);

  @media (max-width: 960px) {
    flex-wrap: wrap;
    gap: 14px;
  }

  @media (max-width: 720px) {
    display: grid;
    grid-template-columns: 40px 1fr 40px;
    align-items: center;
    border-radius: 0;
    border-left: none;
    border-right: none;
    padding: 10px 12px;
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  }
`;

const HeaderBrand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  @media (max-width: 720px) {
    justify-self: center;
    gap: 8px;
  }
`;

const HeaderBrandMark = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 30px;
    height: 30px;
    object-fit: contain;
  }

  @media (max-width: 720px) {
    width: 34px;
    height: 34px;

    img {
      width: 24px;
      height: 24px;
    }
  }
`;

const HeaderBrandText = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

const HeaderBrandName = styled.span`
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.1;

  @media (max-width: 720px) {
    font-size: 0.95rem;
  }
`;

const HeaderBrandSub = styled.span`
  color: var(--color-muted);
  font-size: 0.8rem;
  letter-spacing: 0.02em;

  @media (max-width: 720px) {
    display: none;
  }
`;

const HeaderLinks = styled.nav`
  display: flex;
  align-items: center;
  gap: 30px;
  margin-left: auto;
  color: rgba(26, 34, 48, 0.86);
  font-size: 0.92rem;

  a {
    white-space: nowrap;
  }

  @media (max-width: 1100px) {
    gap: 18px;
  }

  @media (max-width: 960px) {
    order: 3;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    margin-left: 0;
  }

  @media (max-width: 720px) {
    display: none;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  @media (max-width: 720px) {
    justify-self: end;
  }
`;

const HeaderWorkspaceDropdown = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  min-width: 260px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
  display: grid;
  gap: 6px;
  z-index: 30;
`;

const HeaderWorkspaceItem = styled.button<{ $active?: boolean }>`
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background: ${(props) => (props.$active ? "color-mix(in srgb, var(--color-primary) 8%, white)" : "transparent")};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  text-align: left;
  cursor: pointer;

  strong {
    display: block;
    font-size: 0.92rem;
    line-height: 1.2;
  }

  span {
    display: block;
    font-size: 0.78rem;
    color: var(--color-muted);
  }
`;

const ContextSwitch = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;

  &:hover > div,
  &:focus-within > div {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }
`;

const ContextButton = styled.button`
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 0;

  svg {
    width: 14px;
    height: 14px;
    color: var(--color-muted);
  }
`;

const ContextMenu = styled.div`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  min-width: 220px;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 38px rgba(15, 23, 42, 0.14);
  display: grid;
  gap: 6px;
  opacity: 0;
  transform: translateY(8px);
  pointer-events: none;
  transition: opacity 140ms ease, transform 140ms ease;
  z-index: 20;
`;

const ContextMenuItem = styled(Link)<{ $active?: boolean }>`
  min-height: 42px;
  padding: 10px 12px;
  border-radius: 12px;
  display: grid;
  gap: 2px;
  background: ${(props) => (props.$active ? "color-mix(in srgb, var(--color-primary) 8%, white)" : "transparent")};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};

  strong {
    font-size: 0.92rem;
    line-height: 1.2;
  }

  span {
    font-size: 0.78rem;
    color: var(--color-muted);
  }
`;

const MobileMenuButton = styled.button`
  display: none;

  @media (max-width: 720px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--color-text);
    padding: 0;
    cursor: pointer;
    justify-self: start;

    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

const LanguageTrigger = styled.button`
  border: none;
  background: transparent;
  color: #fff;
  padding: 0;
  font-size: 2rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  text-shadow: 0 6px 18px rgba(15, 23, 42, 0.24);

  @media (max-width: 720px) {
    font-size: 1.55rem;
    text-shadow: none;
  }
`;

const MobileMenuOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 22, 0.5);
  z-index: 115;
  display: none;

  @media (max-width: 720px) {
    display: grid;
    align-items: start;
  }
`;

const MobileMenuDrawer = styled.div`
  width: 100%;
  max-height: min(72vh, 480px);
  background: #fff;
  box-shadow: 0 26px 50px rgba(15, 23, 42, 0.18);
  padding: 18px 18px 20px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 18px;
  border-radius: 0 0 24px 24px;
  overflow-y: auto;
`;

const MobileMenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const MobileMenuTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const MobileMenuLinks = styled.nav`
  display: grid;
  gap: 6px;

  a {
    padding: 12px 2px;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    font-size: 0.95rem;
    font-weight: 600;
  }
`;

const PageShell = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 16px;
  @media (max-width: 729px) {
  gap: 10px;
  padding: 10px;
  }
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

const ImageCard = styled(ListItemGrid)<{ $image?: string }>`
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    background-image: ${(props) =>
      props.$image
        ? `linear-gradient(90deg, rgba(12, 18, 36, 0.8), rgba(12, 18, 36, 0.6), rgba(12, 18, 36, 0.2)),
           linear-gradient(0deg, rgba(12, 18, 36, 0.45), rgba(12, 18, 36, 0.45)),
           url(${props.$image})`
        : "none"};
    background-size: cover;
    background-position: center;
    position: relative;
    overflow: hidden;
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
  font-size: 13px;
  color: var(--color-muted);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

const ItemContent = styled.div`
  display: grid;
  gap: 6px;
`;

const ImageCardContent = styled(ItemContent)`
  @media (max-width: 640px) {
    position: relative;
    z-index: 1;
    color: #fff;

    * {
      color: rgba(255, 255, 255);
    }

    svg {
      color: #fff;
    }
  }
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

const DetailRowHorizontal = styled(DetailRow)`
  @media (max-width: 640px) {
    flex-direction: row;
    align-items: center;
    gap: 8px 12px;
  }
`;

const IconLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  // color: var(--color-muted);

  svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 640px) {
    font-size: 0.75rem;
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
    flex-direction: column;
    gap: 4px;
    font-size: 0.7rem;
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

const ToolbarRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const UtilityLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  width: 42px;
  height: 42px;
  background: var(--color-surface-2);
  color: var(--color-muted);
  font-weight: 600;
  text-decoration: none;
  box-shadow: var(--shadow-soft);

  @media (max-width: 640px) {
    width: 40px;
    height: 40px;
  }
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const InlineNotice = styled.div<{ $danger?: boolean }>`
  width: 100%;
  border-radius: 14px;
  border: 1px solid ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.22)" : "rgba(255, 210, 92, 0.22)")};
  background: ${(props) => (props.$danger ? "rgba(255, 148, 148, 0.08)" : "rgba(255, 210, 92, 0.08)")};
  padding: 12px 14px;
  color: ${(props) => (props.$danger ? "#a61c2f" : "#7a5b00")};
  font-size: 0.9rem;
  line-height: 1.5;
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

const VendorGrid = styled.div`
  display: grid;
  align-items: stretch;
  gap: 16px;
  grid-template-columns: 84px minmax(0, 1fr);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const VendorSkeleton = styled.div`
  display: grid;
  gap: 16px;
`;

const SkeletonBlock = styled.div<{ $height?: number; $radius?: number }>`
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
  animation: ${shimmer} 1.4s linear infinite;
`;

const VendorSkeletonHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const VendorSkeletonStats = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const VendorSkeletonActions = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const VendorCard = styled(Panel)`
  display: grid;
  gap: 14px;
  align-self: start;

  @media (max-width: 640px) {
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    box-shadow: none;

    &::after {
      display: none;
    }
  }
`;

const VendorCardFill = styled(VendorCard)`
  align-self: start;
`;

const VendorHero = styled.div`
  display: grid;
  gap: 8px;
`;

const VendorTitle = styled.h2`
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2.1rem);

  @media (max-width: 640px) {
    font-size: 1.18rem;
    line-height: 1.18;
  }
`;

const VendorPillLink = styled(Link)<{ $tone?: "success" | "warning" | "neutral" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid
    ${(props) =>
      props.$tone === "success"
        ? "rgba(16, 185, 129, 0.28)"
        : props.$tone === "warning"
        ? "rgba(245, 158, 11, 0.28)"
        : "var(--color-outline)"};
  background: ${(props) =>
    props.$tone === "success"
      ? "rgba(16, 185, 129, 0.12)"
      : props.$tone === "warning"
      ? "rgba(245, 158, 11, 0.12)"
      : "var(--color-surface-2)"};
  color: ${(props) =>
    props.$tone === "success" ? "#0f766e" : props.$tone === "warning" ? "#b45309" : "var(--color-text)"};
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;

  @media (max-width: 640px) {
    gap: 5px;
    padding: 5px 9px;
    font-size: 0.76rem;
  }
`;

const VendorActionGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const VendorSectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const StarterHeader = styled.div`
  display: grid;
  gap: 10px;
`;

const StarterTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;

  @media (max-width: 960px) {
    flex-direction: column;
    align-items: stretch;
  }

  @media (max-width: 640px) {
    gap: 12px;
  }
`;

const StarterSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px 14px;

  @media (max-width: 960px) {
    justify-content: flex-start;
  }

  @media (max-width: 640px) {
    gap: 6px;
  }
`;

const StarterSummaryItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 88px;

  @media (max-width: 640px) {
    min-width: 68px;
  }
`;

const StarterSummaryLabel = styled.div`
  color: var(--color-muted);
  font-size: 0.76rem;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 0.71rem;
  }
`;

const StarterSummaryValue = styled.div`
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 0.84rem;
  }
`;

const StarterSummaryBadge = styled.div<{ $mobileOrder?: number }>`
  display: inline-flex;

  @media (max-width: 640px) {
    order: ${(props) => props.$mobileOrder ?? 0};
  }
`;

const HubFeatureCard = styled.div`
  position: relative;
  display: grid;
  gap: 14px;
  overflow: hidden;
`;

const HubSectionFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 2px;
`;

const HubSectionAction = styled(Link)`
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--gradient);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: var(--frame-shadow);
  transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;

  &:visited,
  &:active,
  &:hover {
    color: #fff;
    text-decoration: none;
  }

  &:hover {
    transform: translateY(-1px);
    filter: brightness(0.98);
    box-shadow: 0 12px 22px rgba(235, 35, 64, 0.16);
  }
`;

const HubSectionViewport = styled.div`
  min-height: 640px;
  max-height: 640px;
  display: grid;
  overflow: hidden;
`;

const HubSectionScroller = styled.div`
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  padding-right: 6px;
  display: grid;
  align-content: start;
  gap: 16px;
`;

const AppointmentPill = styled.span<{ $tone?: "neutral" | "warning" | "success" }>`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid
    ${(props) =>
      props.$tone === "warning"
        ? "rgba(235, 35, 64, 0.14)"
        : props.$tone === "success"
          ? "rgba(16, 185, 129, 0.14)"
          : "var(--color-outline)"};
  background: ${(props) =>
    props.$tone === "warning"
      ? "#fff1f3"
      : props.$tone === "success"
        ? "#ecfdf5"
        : "var(--color-surface)"};
  color: ${(props) =>
    props.$tone === "warning"
      ? "#b4233a"
      : props.$tone === "success"
        ? "#0f766e"
        : "var(--color-text)"};
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  font-weight: 700;
  white-space: nowrap;

  @media (max-width: 640px) {
    min-height: 24px;
    padding: 0 8px;
    font-size: 0.72rem;
  }
`;

const WorkspaceSectionViewport = styled(HubSectionViewport)``;

const WorkspaceSectionScroller = styled(HubSectionScroller)``;


const LeadInboxViewport = styled(HubSectionViewport)`
  min-height: 640px;
  max-height: 640px;
  height: 640px;
`;

const LeadInboxScroller = styled(HubSectionScroller)`
  overflow: hidden;
  padding-right: 0;
`;

const WorkspaceSectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const WorkspaceSectionTitleWrap = styled.div`
  display: grid;
  gap: 6px;
`;

const WorkspaceSectionTitle = styled.h3`
  margin: 0;
  color: var(--color-text);
  font-size: 1.34rem;
`;

const WorkspaceSectionCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.55;
`;

const WorkspacePanel = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 22px;
  background: color-mix(in srgb, var(--color-surface-2) 78%, white);
  padding: 16px;
  display: grid;
  gap: 14px;

  @media (max-width: 640px) {
    padding: 12px;
    gap: 10px;
    border-radius: 18px;
  }
`;

const WorkspacePanelTitle = styled.strong`
  color: var(--color-text);
  font-size: 1rem;
`;

const WorkspacePanelCopy = styled.span`
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.5;

  @media (max-width: 640px) {
    font-size: 0.8rem;
    line-height: 1.35;
  }
`;

const MobileCompactCopy = styled.span`
  display: none;

  @media (max-width: 640px) {
    display: inline;
  }
`;

const WorkspaceSummaryHint = styled.span`
  color: var(--color-muted);
  font-size: 0.84rem;
  line-height: 1.45;
`;

const TeamInviteGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(180px, 0.8fr) auto;
  gap: 10px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    gap: 8px;
  }
`;

const TeamSectionStack = styled.div`
  display: grid;
  gap: 14px;
`;

const DesktopOnlyBlock = styled.div`
  @media (max-width: 640px) {
    display: none;
  }
`;

const TeamSummaryBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const TeamMobileActions = styled.div`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: -4px;
  }
`;

const TeamMobileIconButton = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  flex: 0 0 38px;
`;

const TeamMobileCount = styled.span`
  position: absolute;
  top: -4px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--color-primary);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 700;
`;

const TeamSummaryItem = styled.div`
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  display: inline-flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 640px) {
    min-height: 34px;
    padding: 0 10px;
    gap: 6px;
    flex: 0 0 auto;
  }
`;

const TeamSummaryItemLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;

  @media (max-width: 640px) {
    font-size: 0.66rem;
    letter-spacing: 0.04em;
  }
`;

const TeamSummaryItemValue = styled.strong`
  color: var(--color-text);
  font-size: 0.92rem;

  @media (max-width: 640px) {
    font-size: 0.82rem;
  }
`;

const SettingsIndexGrid = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const SettingsIndexCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 22px;
  background: color-mix(in srgb, var(--color-surface-2) 82%, white);
  padding: 16px;
  display: grid;
  gap: 14px;
`;

const SettingsIndexHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const SettingsIndexTitleWrap = styled.div`
  display: grid;
  gap: 4px;
`;

const SettingsIndexTitle = styled.h4`
  margin: 0;
  color: var(--color-text);
  font-size: 0.98rem;
`;

const SettingsIndexCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.8rem;
  line-height: 1.4;
`;

const SettingsIndexRows = styled.div`
  display: grid;
  gap: 10px;
`;

const SettingsIndexRow = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const SettingsIndexLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const SettingsIndexValue = styled.strong`
  color: var(--color-text);
  font-size: 0.86rem;
  line-height: 1.4;
  text-align: right;
`;

const SettingsIndexBullets = styled.div`
  display: grid;
  gap: 8px;
`;

const SettingsIndexBullet = styled.div`
  color: var(--color-muted);
  font-size: 0.78rem;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const SettingsIndexActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const CompactTextInput = styled.input`
  width: 100%;
  min-height: 46px;
  border-radius: 16px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 16px;
  font-size: 0.96rem;
  outline: none;

  &::placeholder {
    color: var(--color-muted);
  }

  &:focus {
    border-color: color-mix(in srgb, var(--color-primary) 24%, var(--color-outline));
    box-shadow: 0 0 0 3px rgba(235, 35, 64, 0.08);
  }

  @media (max-width: 640px) {
    min-height: 42px;
    border-radius: 14px;
    padding: 0 14px;
    font-size: 0.88rem;
  }
`;

const CompactSelectWrap = styled.div`
  .Control {
    min-height: 46px;
    padding-top: 0;
    padding-bottom: 0;
    border-radius: 16px;
    font-size: 0.96rem;
  }

  @media (max-width: 640px) {
    .Control {
      min-height: 42px;
      border-radius: 14px;
      font-size: 0.88rem;
    }
  }
`;

const CompactGhostButton = styled.button`
  min-height: 42px;
  padding: 0 14px;
  border-radius: 14px;
  font-size: 0.88rem;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const WorkspaceSwitchButton = styled(CompactGhostButton)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;

  @media (max-width: 640px) {
    min-height: 36px;
    padding: 0 12px;
    border-radius: 12px;
    font-size: 0.8rem;
    gap: 6px;
  }
`;

const CompactCTAButton = styled(CTAButton)`
  min-height: 46px;
  padding: 0 18px;
  border-radius: 16px;
  font-size: 0.94rem;

  @media (max-width: 640px) {
    min-height: 42px;
    width: 100%;
    border-radius: 14px;
    font-size: 0.88rem;
  }
`;

const TeamMembersList = styled.div`
  display: grid;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;

  @media (max-width: 640px) {
    max-height: none;
    overflow-y: visible;
    padding-right: 0;
    gap: 8px;
  }
`;

const TeamMemberCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  display: grid;
  gap: 10px;
  position: relative;
  padding: 16px 14px;

  @media (max-width: 640px) {
    padding: 12px;
    gap: 8px;
    border-radius: 16px;
  }
`;

const MemberActionsButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: var(--color-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 1;
  &:hover {
    background: var(--color-surface-2);
  }
`;

const TeamMemberTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    gap: 8px;
  }
`;

const TeamMemberName = styled.strong`
  color: var(--color-text);
  font-size: 0.96rem;

  @media (max-width: 640px) {
    font-size: 0.9rem;
  }
`;

const TeamMemberMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.82rem;
  line-height: 1.45;

  @media (max-width: 640px) {
    font-size: 0.76rem;
    line-height: 1.3;
  }
`;

const TeamMemberPills = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    gap: 6px;
  }
`;

const TeamMobileModalCard = styled(Panel)`
  max-width: 720px;
  width: min(720px, 94vw);
  display: grid;
  gap: 14px;

  @media (max-width: 640px) {
    width: 100%;
    max-width: none;
    min-height: auto;
    max-height: 80dvh;
    overflow-y: auto;
    border-radius: 24px 24px 0 0;
    align-self: end;
    padding: 16px;
    gap: 12px;
  }
`;

const TeamMobileModalHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 640px) {
    position: sticky;
    top: 0;
    background: inherit;
    z-index: 1;
  }
`;

const ModalCloseIconButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: 0 0 36px;
`;

const ToastMessage = styled.div<{ $type?: 'success' | 'error' }>`
  background: ${(props) => (props.$type === "error" ? "var(--color-danger)" : "#10b981")};
  color: white;
  padding: 10px 16px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 12px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.35rem;
  color: var(--color-text);
`;

const ModalText = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.65;
`;

const PrimaryAction = styled(CTAButton)<{ $danger?: boolean }>`
  ${(props) => props.$danger && `
    background: var(--color-danger);
  `}
`;

const ListingStatusSelectWrap = styled.div`
  min-width: 220px;
  max-width: 280px;
`;

const ListingStatusMessage = styled.div<{ $tone?: "danger" | "success" }>`
  color: ${(props) => (props.$tone === "danger" ? "var(--color-danger)" : "#0f766e")};
  font-size: 0.82rem;
  font-weight: 600;
`;

const HubFeatureHeader = styled.div`
  display: grid;
  gap: 4px;
`;

const HubFeatureTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const HubFeatureTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const HubFeatureCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.55;
`;

const HubProgressPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-outline);
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
`;

const HubChecklist = styled.div`
  display: grid;
  gap: 10px;
`;

const HubChecklistRow = styled(Link)<{ $done?: boolean }>`
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid
    ${(props) => (props.$done ? "rgba(16, 185, 129, 0.28)" : "var(--color-outline)")};
  background: ${(props) =>
    props.$done ? "rgba(16, 185, 129, 0.08)" : "color-mix(in srgb, var(--color-surface-2) 62%, white)"};
  color: inherit;
  text-decoration: none;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;

  &:hover {
    transform: translateY(-1px);
    border-color: ${(props) => (props.$done ? "rgba(16, 185, 129, 0.38)" : "color-mix(in srgb, var(--color-primary) 24%, var(--color-outline))")};
    box-shadow: var(--shadow-soft);
  }
`;

const HubChecklistText = styled.div`
  display: grid;
  gap: 3px;
`;

const HubChecklistTitle = styled.span`
  font-weight: 700;
  color: var(--color-text);
`;

const HubChecklistHint = styled.span`
  font-size: 0.88rem;
  color: var(--color-muted);
  line-height: 1.45;
`;

const HubChecklistAction = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  font-size: 0.84rem;
  font-weight: 700;
  white-space: nowrap;
`;

const HubFeaturePreview = styled.div`
  display: grid;
  gap: 12px;
`;

const HubFeaturePreviewGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const HubFeaturePreviewItem = styled.div`
  display: grid;
  align-content: start;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--color-outline) 85%, transparent);
  background: color-mix(in srgb, var(--color-surface-2) 78%, white);
  filter: blur(1.5px);
  opacity: 0.72;
`;

const HubFeaturePreviewTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--color-muted);

  svg {
    width: 16px;
    height: 16px;
  }
`;

const HubFeaturePreviewValue = styled.div`
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--color-text);
`;

const HubFeatureUpsellCard = styled(Link)`
  display: grid;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-outline));
  background: color-mix(in srgb, var(--color-primary) 6%, white);
  color: inherit;
  text-decoration: none;
  transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--color-primary) 30%, var(--color-outline));
    box-shadow: var(--frame-shadow);
    background: color-mix(in srgb, var(--color-primary) 9%, white);
  }
`;

const HubFeatureUpsellHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HubInsightGrid = styled.div`
  display: grid;
  gap: 22px 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const HubInsightCard = styled.div`
  position: relative;
  min-height: 142px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--color-outline) 85%, transparent);
  background: color-mix(in srgb, var(--color-surface-2) 78%, white);
  overflow: visible;
  padding: 24px 14px 18px;

  @media (max-width: 640px) {
    min-height: auto;
    padding: 16px 12px 14px;
  }
`;

const HubInsightBody = styled.div`
  position: relative;
  min-height: 98px;
  border-radius: 14px;
  overflow: visible;

  @media (max-width: 640px) {
    min-height: auto;
  }
`;

const HubInsightCardInner = styled.div<{ $blurred?: boolean }>`
  display: grid;
  gap: 8px;
  min-height: 72px;
  height: 100%;
  filter: ${(props) => (props.$blurred ? "blur(2px)" : "none")};
  opacity: ${(props) => (props.$blurred ? 0.52 : 1)};
  transition: filter 160ms ease, opacity 160ms ease;
`;

const HubInsightCardTop = styled.div`
  position: absolute;
  top: 0;
  left: 14px;
  transform: translateY(-50%);

  @media (max-width: 640px) {
    position: static;
    transform: none;
    margin-bottom: 0;
  }
`;

const HubInsightHeaderRow = styled.div`
  display: contents;

  @media (max-width: 640px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
`;

const HubInsightCardTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.01em;

  svg {
    width: 15px;
    height: 15px;
    color: var(--color-text);
  }

  @media (max-width: 640px) {
    min-height: 28px;
    padding: 0 10px;
    font-size: 0.75rem;
  }
`;

const HubInsightCardValue = styled.div`
  font-size: 1.18rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.2;
`;

const HubInsightCardValueCentered = styled(HubInsightCardValue)`
  min-height: 100%;
  display: grid;
  place-items: center;
  text-align: center;
`;

const HubInsightMiniCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 4px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface) 90%, white);
  border: 1px solid var(--color-outline);
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
`;

const HUB_INSIGHT_COLORS = ["#f43f5e", "#fb7185", "#f97316", "#22c55e", "#3b82f6", "#8b5cf6"];

const HubInsightHero = styled.div`
  display: grid;
  gap: 6px;
`;

const HubInsightHeroValue = styled.div`
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-text);
  line-height: 1.15;
`;

const HubInsightHeroLabel = styled.div`
  font-size: 0.84rem;
  color: var(--color-muted);
`;

const HubInsightPieWrap = styled.div`
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: 84px minmax(0, 1fr);
    gap: 10px;
  }
`;

const HubInsightPie = styled.div<{ $gradient: string }>`
  width: 96px;
  height: 96px;
  border-radius: 999px;
  background: ${(props) => props.$gradient};
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);

  @media (max-width: 640px) {
    width: 84px;
    height: 84px;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 20px;
    border-radius: 999px;
    background: var(--color-surface);
    box-shadow: inset 0 0 0 1px var(--color-outline);
  }
`;

const HubInsightPieCenter = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 1;
  font-size: 1rem;
  font-weight: 800;
  color: var(--color-text);
`;

const HubInsightStack = styled.div`
  position: relative;
  display: grid;
  gap: 8px;
`;

const HubInsightLegend = styled.div`
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  z-index: 3;
  min-width: 220px;
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.12);
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
  transition: opacity 160ms ease, transform 160ms ease;

  ${HubInsightCard}:hover & {
    opacity: 1;
    transform: translateY(0);
  }
`;

const HubInsightLegendRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
  color: var(--color-text);
`;

const HubInsightLegendDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: ${(props) => props.$color};
`;

const HubInsightBarList = styled.div`
  display: grid;
  gap: 8px;
`;

const HubInsightBarRow = styled.div`
  display: grid;
  gap: 0;
`;

const HubInsightBarTrack = styled.div`
  height: 20px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-surface) 92%, white);
  border: 1px solid var(--color-outline);
`;

const HubInsightBarFill = styled.div<{ $width: number; $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 8px;
  height: 100%;
  width: ${(props) => props.$width}%;
  background: ${(props) => props.$color};
  border-radius: inherit;
  min-width: ${(props) => (props.$width > 0 ? "74px" : "0")};
  color: white;
  font-size: 0.76rem;
  font-weight: 800;
  white-space: nowrap;
`;

const HubInsightRangeList = styled.div`
  display: grid;
  gap: 12px;
`;

const HubInsightRangeRow = styled.div`
  display: grid;
  gap: 7px;
`;

const HubInsightRangeMeta = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.86rem;
  color: var(--color-text);

  @media (max-width: 640px) {
    gap: 8px;
    align-items: flex-start;
  }
`;

const HubInsightRangeValue = styled.span`
  color: var(--color-muted);
  text-align: right;
  font-size: 0.82rem;
  line-height: 1.3;

  @media (max-width: 640px) {
    font-size: 0.73rem;
    letter-spacing: -0.01em;
  }
`;

const HubInsightRangeTrack = styled.div`
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface) 92%, white);
  border: 1px solid var(--color-outline);
`;

const HubInsightRangeFill = styled.div<{ $left: number; $width: number; $color: string }>`
  position: absolute;
  top: -1px;
  left: ${(props) => props.$left}%;
  width: ${(props) => props.$width}%;
  height: calc(100% + 2px);
  min-width: 10px;
  border-radius: 999px;
  background: ${(props) => props.$color};
`;

const HubInsightColumnWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  align-items: end;
  min-height: 108px;
`;

const HubInsightColumn = styled.div`
  display: grid;
  gap: 7px;
  justify-items: center;
`;

const HubInsightColumnBar = styled.div<{ $height: number; $color: string }>`
  width: 100%;
  max-width: 32px;
  height: ${(props) => props.$height}px;
  min-height: 12px;
  border-radius: 10px 10px 4px 4px;
  background: ${(props) => props.$color};
`;

const HubInsightColumnLabel = styled.span`
  font-size: 0.74rem;
  color: var(--color-muted);
  text-align: center;
  line-height: 1.25;
`;

const HubInsightFooterLink = styled(Link)`
  position: absolute;
  top: 0;
  right: 14px;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-primary);
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    position: static;
    transform: none;
    min-height: 28px;
    margin: 0;
    padding: 0 10px;
    font-size: 0.72rem;
    white-space: nowrap;
  }
`;

const DesktopLabel = styled.span`
  @media (max-width: 640px) {
    display: none;
  }
`;

const MobileLabel = styled.span`
  display: none;

  @media (max-width: 640px) {
    display: inline;
  }
`;

const HubFeatureLock = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
`;

const HubNavList = styled.div`
  display: grid;
  grid-auto-rows: 64px;
  gap: 10px;

  @media (max-width: 960px) {
    grid-auto-rows: auto;
  }
`;

const HubNavItem = styled(Link)<{ $active?: boolean; $disabled?: boolean; $expanded?: boolean }>`
  box-sizing: border-box;
  border: 1px solid
    ${(props) =>
      props.$active
        ? "color-mix(in srgb, var(--color-primary) 30%, var(--color-outline))"
        : "var(--color-outline)"};
  border-radius: 16px;
  padding: 10px 12px;
  min-height: 64px;
  height: 64px;
  background: ${(props) =>
    props.$active ? "color-mix(in srgb, var(--color-primary) 10%, white)" : "var(--color-surface)"};
  display: grid;
  grid-template-columns: 36px ${(props) => (props.$expanded ? "minmax(0,1fr) 18px" : "0px 0px")};
  align-items: center;
  justify-content: ${(props) => (props.$expanded ? "stretch" : "center")};
  gap: ${(props) => (props.$expanded ? "12px" : "0")};
  color: inherit;
  text-decoration: none;
  box-shadow: ${(props) => (props.$active ? "var(--frame-shadow)" : "var(--shadow-soft)")};
  opacity: ${(props) => (props.$disabled ? 0.55 : 1)};
  pointer-events: ${(props) => (props.$disabled ? "none" : "auto")};
  overflow: hidden;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease,
    grid-template-columns 180ms ease,
    gap 180ms ease;

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--color-primary) 24%, var(--color-outline));
    box-shadow: var(--frame-shadow);
  }

  @media (max-width: 960px) {
    min-height: 56px;
    height: auto;
    grid-template-columns: 36px minmax(0,1fr) 18px;
    gap: 12px;
    justify-content: stretch;

    html[lang="mm"] & {
      min-height: 62px;
      align-items: flex-start;
      overflow: visible;
      padding-block: 11px;
    }
  }
`;

const HubNavButton = styled.button<{ $active?: boolean; $expanded?: boolean }>`
  box-sizing: border-box;
  border: 1px solid
    ${(props) =>
      props.$active
        ? "color-mix(in srgb, var(--color-primary) 30%, var(--color-outline))"
        : "var(--color-outline)"};
  border-radius: 16px;
  padding: 10px 12px;
  min-height: 64px;
  height: 64px;
  background: ${(props) =>
    props.$active ? "color-mix(in srgb, var(--color-primary) 10%, white)" : "var(--color-surface)"};
  display: grid;
  grid-template-columns: 36px ${(props) => (props.$expanded ? "minmax(0,1fr) 18px" : "0px 0px")};
  align-items: center;
  justify-content: ${(props) => (props.$expanded ? "stretch" : "center")};
  gap: ${(props) => (props.$expanded ? "12px" : "0")};
  color: inherit;
  box-shadow: ${(props) => (props.$active ? "var(--frame-shadow)" : "var(--shadow-soft)")};
  cursor: pointer;
  overflow: visible;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease,
    grid-template-columns 180ms ease,
    gap 180ms ease;

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--color-primary) 24%, var(--color-outline));
    box-shadow: var(--frame-shadow);
  }

  @media (max-width: 960px) {
    min-height: 56px;
    height: auto;
    grid-template-columns: 36px minmax(0,1fr) 18px;
    gap: 12px;
    justify-content: stretch;

    html[lang="mm"] & {
      min-height: 62px;
      align-items: flex-start;
      padding-block: 11px;
    }
  }
`;

const HubNavIcon = styled.div<{ $active?: boolean; $image?: string }>`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: ${(props) =>
    props.$image
      ? `center / cover no-repeat url(${props.$image})`
      : props.$active
      ? "color-mix(in srgb, var(--color-primary) 16%, white)"
      : "color-mix(in srgb, var(--color-primary) 10%, transparent)"};
  color: var(--color-primary);
  display: grid;
  place-items: center;
  overflow: visible;
  position: relative;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const HubNavIconBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.64rem;
  font-weight: 800;
  line-height: 1;
  border: 2px solid var(--color-surface);
`;

const HubNavBody = styled.div<{ $expanded?: boolean }>`
  display: grid;
  gap: 0;
  text-align: left;
  overflow: hidden;
  opacity: ${(props) => (props.$expanded ? 1 : 0)};
  max-width: ${(props) => (props.$expanded ? "220px" : "0px")};
  transform: translateX(${(props) => (props.$expanded ? "0" : "-4px")});
  transition:
    opacity 140ms ease,
    transform 140ms ease,
    max-width 180ms ease;
  pointer-events: ${(props) => (props.$expanded ? "auto" : "none")};

  @media (max-width: 960px) {
    opacity: 1;
    transform: none;
    pointer-events: auto;
    max-width: none;
    gap: 2px;
    overflow: visible;

    html[lang="mm"] & {
      gap: 4px;
      padding-block: 2px;
    }
  }
`;

const HubNavTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  html[lang="mm"] & {
    align-items: flex-start;
    flex-wrap: wrap;
  }
`;

const HubNavTitle = styled.strong<{ $active?: boolean }>`
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  font-size: 0.92rem;
  line-height: 1.25;

  @media (max-width: 960px) {
    font-size: 0.98rem;

    html[lang="mm"] & {
      font-family: "Noto Sans Myanmar", "Padauk", "Myanmar Text", sans-serif;
      font-size: 0.92rem;
      line-height: 1.7;
      padding-block: 2px 3px;
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      overflow-wrap: anywhere;
    }
  }
`;

const HubNavArrow = styled.div<{ $expanded?: boolean }>`
  display: grid;
  place-items: center;
  opacity: ${(props) => (props.$expanded ? 1 : 0)};
  max-width: ${(props) => (props.$expanded ? "18px" : "0px")};
  overflow: hidden;
  transform: translateX(${(props) => (props.$expanded ? "0" : "-4px")});
  transition:
    opacity 140ms ease,
    transform 140ms ease,
    max-width 180ms ease;
  pointer-events: none;

  @media (max-width: 960px) {
    opacity: 1;
    transform: none;
    max-width: 18px;
  }
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

  @media (max-width: 720px) {
    padding: 0;
  }
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

const formatEnum = (value: unknown) => {
  if (!value) return "";
  return String(value).replace(/_/g, " ");
};

const formatDealTypeLabel = (value: unknown, t: (key: string) => string) => {
  if (!value) return "";
  const lowered = String(value).toLowerCase();
  if (lowered === "sale") return t("listing.forSale");
  if (lowered === "rent") return t("listing.forRent");
  return formatEnum(value);
};

const formatInquiryDealLabel = (value: unknown, t: (key: string) => string) => {
  if (!value) return "";
  const lowered = String(value).toLowerCase();
  if (lowered === "buy") return t("inquiry.buy");
  if (lowered === "rent") return t("inquiry.rent");
  return formatEnum(value);
};

const formatPropertyTypeLabel = (value: unknown, t: (key: string) => string) => {
  return formatPropertyTypeValue(typeof value === "string" ? value : null, t) || formatEnum(value);
};

const formatRoleLabel = (value: string | null | undefined) =>
  value
    ? value
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "Unknown";

function AccountHeader({ isVendor }: { isVendor: boolean }) {
  const { user, profileRole, profileReady } = useAppState();
  const pathname = usePathname();
  const { t } = useI18n();
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<"personal" | "vendor">("personal");
  const navLinks = [
    { label: t("header.articles"), href: "/articles" },
    { label: t("header.ourPartners"), href: "/partners" },
  ];
  const languageOptions = [
    { value: "en", flag: "🇬🇧", name: "English", label: "Eng" },
    { value: "mm", flag: "🇲🇲", name: "Myanmar", label: "မြန်မာ" },
    { value: "zh", flag: "🇨🇳", name: "Chinese", label: "中文" },
    { value: "th", flag: "🇹🇭", name: "Thai", label: "ไทย" },
  ] as const;
  const activeLanguage =
    languageOptions.find((option) => option.value === language) ?? languageOptions[0];
  const hasWorkspaceAccess = profileReady && profileRole === "vendor_user";
  const accountLabel = !user ? t("header.signInRegister") : isVendor ? t("header.hub") : t("header.account");
  const accountHref = !user ? "/auth" : isVendor ? "/hub" : "/account";

  useEffect(() => {
    const pathContext = deriveActiveContextFromPath(pathname);
    if (pathContext) {
      setActiveContext(pathContext);
      writeActiveContext(pathContext);
      return;
    }
    const cached = readActiveContext();
    if (cached) {
      setActiveContext(cached);
    }
  }, [pathname]);

  return (
    <>
      <Header>
        <HeaderInner>
          <MobileMenuButton
            type="button"
            aria-label={t("header.openNavigationMenu")}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu />
          </MobileMenuButton>
          <HeaderBrand href="/">
            <HeaderBrandMark>
              <img src="/KTLogo.png" alt="Eain Chan Myay logo" />
            </HeaderBrandMark>
            <HeaderBrandText>
              <HeaderBrandName>EainChanMyay.com</HeaderBrandName>
              <HeaderBrandSub>{t("site.tagline")}</HeaderBrandSub>
            </HeaderBrandText>
          </HeaderBrand>

          <HeaderLinks>
            {navLinks.map((item) => (
              <Link key={item.label} href={item.href}>
                {item.label}
              </Link>
            ))}
            {user && hasWorkspaceAccess ? (
              <ContextSwitch>
                <ContextButton type="button" aria-label={t("header.openWorkspaceSwitcher")}>
                  <span>{t("header.hub")}</span>
                  <ChevronDown />
                </ContextButton>
                <ContextMenu>
                  <ContextMenuItem
                    href="/account"
                    $active={activeContext === "personal"}
                    onClick={() => {
                      writeActiveContext("personal");
                      setActiveContext("personal");
                    }}
                  >
                    <strong>{t("header.personalAccount")}</strong>
                    <span>{t("header.personalAccountHint")}</span>
                  </ContextMenuItem>
                  <ContextMenuItem
                    href="/hub"
                    $active={activeContext === "vendor"}
                    onClick={() => {
                      writeActiveContext("vendor");
                      setActiveContext("vendor");
                    }}
                  >
                    <strong>{t("header.agencyWorkspace")}</strong>
                    <span>{t("header.agencyWorkspaceHint")}</span>
                  </ContextMenuItem>
                </ContextMenu>
              </ContextSwitch>
            ) : (
              <Link href={accountHref}>{accountLabel}</Link>
            )}
          </HeaderLinks>

          <HeaderActions>
            <LanguageTrigger
              type="button"
              aria-label={t("header.openLanguageSelector")}
              onClick={() => setLanguageOpen(true)}
            >
              {activeLanguage.flag}
            </LanguageTrigger>
          </HeaderActions>
        </HeaderInner>
      </Header>

      {mobileMenuOpen ? (
        <MobileMenuOverlay onClick={() => setMobileMenuOpen(false)}>
          <MobileMenuDrawer onClick={(event) => event.stopPropagation()}>
            <MobileMenuHeader>
              <MobileMenuTitle>{t("header.menu")}</MobileMenuTitle>
              <GhostButton type="button" onClick={() => setMobileMenuOpen(false)}>
                {t("header.close")}
              </GhostButton>
            </MobileMenuHeader>
            <MobileMenuLinks>
              {user && hasWorkspaceAccess ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => {
                      writeActiveContext("personal");
                      setActiveContext("personal");
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t("header.personalAccount")}
                  </Link>
                  <Link
                    href="/hub"
                    onClick={() => {
                      writeActiveContext("vendor");
                      setActiveContext("vendor");
                      setMobileMenuOpen(false);
                    }}
                  >
                    {t("header.agencyWorkspace")}
                  </Link>
                </>
              ) : null}
              {navLinks.map((item) => (
                <Link key={item.label} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              ))}
              <Link href={accountHref} onClick={() => setMobileMenuOpen(false)}>
                {accountLabel}
              </Link>
            </MobileMenuLinks>
          </MobileMenuDrawer>
        </MobileMenuOverlay>
      ) : null}

      {languageOpen ? (
        <ModalOverlay onClick={() => setLanguageOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <VendorSectionTitle>{t("settings.language")}</VendorSectionTitle>
                <Muted>{t("header.languagePrompt")}</Muted>
              </div>
              <GhostButton type="button" aria-label={t("header.close")} onClick={() => setLanguageOpen(false)}>
                X
              </GhostButton>
            </ModalHeader>
            <VendorActionGrid>
              {languageOptions.map((option) => (
                <GhostButton
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setLanguage(option.value);
                    setLanguageOpen(false);
                  }}
                  style={{
                    borderColor:
                      option.value === language ? "rgba(235, 35, 64, 0.28)" : "var(--color-outline)",
                    background:
                      option.value === language ? "rgba(235, 35, 64, 0.06)" : "transparent",
                  }}
                >
                  {option.flag} {option.name}
                </GhostButton>
              ))}
            </VendorActionGrid>
          </ModalCard>
        </ModalOverlay>
      ) : null}
    </>
  );
}

const formatTimelineLabel = (value: unknown, t: (key: string) => string) => {
  if (!value) return "";
  const raw = String(value);
  const map: Record<string, string> = {
    asap: t("inquiry.timeline.asap"),
    "1-3": t("inquiry.timeline.oneThree"),
    "3-6": t("inquiry.timeline.threeSix"),
    browsing: t("inquiry.timeline.browsing"),
  };
  return map[raw] ?? formatEnum(value);
};

const formatBudgetLabel = (
  value: unknown,
  dealType: unknown,
  t: (key: string) => string
) => {
  if (!value) return "";
  const raw = String(value);
  const isRent = String(dealType ?? "").toLowerCase() === "rent";
  const map = isRent
    ? {
        "0-5": t("inquiry.budget.rent1"),
        "5-10": t("inquiry.budget.rent2"),
        "10-20": t("inquiry.budget.rent3"),
        "20-50": t("inquiry.budget.rent4"),
        "50-100": t("inquiry.budget.rent5"),
        "100+": t("inquiry.budget.rent6"),
      }
    : {
        "0-1000": t("inquiry.budget.buy1"),
        "1000-5000": t("inquiry.budget.buy2"),
        "5000-50000": t("inquiry.budget.buy3"),
        "50000-100000": t("inquiry.budget.buy4"),
        "100000+": t("inquiry.budget.buy5"),
      };
  return map[raw as keyof typeof map] ?? raw;
};

const formatDate = (value: unknown, locale: string) => {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTimeWindow = (value: unknown, t: (key: string) => string) => {
  if (!value) return "";
  const raw = String(value);
  const map: Record<string, string> = {
    "9-12": t("listing.timeWindow.morning"),
    "12-3": t("listing.timeWindow.afternoon"),
    "3-6": t("listing.timeWindow.evening"),
    "6-9": t("listing.timeWindow.night"),
  };
  return map[raw] ?? raw;
};

const formatArea = (value: unknown, locale: string, unitLabel: string) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "";
  return `${numeric.toLocaleString(locale)} ${unitLabel}`;
};

const getListingStatusLabel = (value: unknown) => {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "published") return "Active";
  if (!normalized) return "Listing";
  return normalized
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

function withTimeout<T>(promise: Promise<T>, timeoutMs = 12000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error("Request timed out."));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

type AccountTabKey = "viewing" | "saved" | "inquiries" | "sales";

type AccountCachePayload = {
  items: Array<Record<string, unknown>>;
  cachedAt: number;
};

const ACCOUNT_CACHE_PREFIX = "ecm_account_tab_cache_v2";
const ACCOUNT_CACHE_TTL_MS = 5 * 60 * 1000;

function getAccountCacheKey(userId: string, tab: AccountTabKey) {
  return `${ACCOUNT_CACHE_PREFIX}:${userId}:${tab}`;
}

function readAccountTabCache(userId: string, tab: AccountTabKey): AccountCachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getAccountCacheKey(userId, tab));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AccountCachePayload;
    if (!Array.isArray(parsed.items) || typeof parsed.cachedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeAccountTabCache(userId: string, tab: AccountTabKey, items: Array<Record<string, unknown>>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      getAccountCacheKey(userId, tab),
      JSON.stringify({ items, cachedAt: Date.now() } satisfies AccountCachePayload)
    );
  } catch {
    // Ignore localStorage quota or privacy-mode failures.
  }
}

function isFreshAccountCache(payload: AccountCachePayload | null) {
  return Boolean(payload && Date.now() - payload.cachedAt < ACCOUNT_CACHE_TTL_MS);
}

export default function AccountPage() {
  const { user, loading, profileRole, profileReady, authToken, logout } = useAppState();
  const userId = user?.id ?? null;
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useI18n();
  const locale =
    language === "mm" ? "my-MM" : language === "zh" ? "zh-CN" : language === "th" ? "th-TH" : "en-US";
  const [viewingRequests, setViewingRequests] = useState<Array<Record<string, unknown>>>([]);
  const [savedProperties, setSavedProperties] = useState<Array<Record<string, unknown>>>([]);
  const [inquiries, setInquiries] = useState<Array<Record<string, unknown>>>([]);
  const [salesRequests, setSalesRequests] = useState<Array<Record<string, unknown>>>([]);
  const [activeTab, setActiveTab] = useState<AccountTabKey>("viewing");
  const [loadedTabs, setLoadedTabs] = useState<Record<AccountTabKey, boolean>>({
    viewing: false,
    saved: false,
    inquiries: false,
    sales: false,
  });
  const [tabLoading, setTabLoading] = useState<Record<AccountTabKey, boolean>>({
    viewing: false,
    saved: false,
    inquiries: false,
    sales: false,
  });
  const [tabError, setTabError] = useState<Record<AccountTabKey, string | null>>({
    viewing: null,
    saved: null,
    inquiries: null,
    sales: null,
  });
  const [refreshedTabs, setRefreshedTabs] = useState<Record<AccountTabKey, boolean>>({
    viewing: false,
    saved: false,
    inquiries: false,
    sales: false,
  });
  const [activeInquiry, setActiveInquiry] = useState<Record<string, unknown> | null>(null);
  const [activeSale, setActiveSale] = useState<Record<string, unknown> | null>(null);
  const [onboardingPending, setOnboardingPending] = useState(false);
  const [hubRailExpanded, setHubRailExpanded] = useState(false);
  const [hubRailMobileOpen, setHubRailMobileOpen] = useState(false);
  const [hubSection, setHubSection] = useState<HubSection>("snapshot");
  const searchParams = useSearchParams();
  const [selectedHubProperty, setSelectedHubProperty] = useState<VendorPropertyItem | null>(null);
  const [selectedHubPropertyDetail, setSelectedHubPropertyDetail] = useState<HubPropertyDetailPayload | null>(null);
  const [selectedHubPropertyLoading, setSelectedHubPropertyLoading] = useState(false);
  const [selectedHubPropertyError, setSelectedHubPropertyError] = useState<string | null>(null);
  const [selectedHubPropertyStatus, setSelectedHubPropertyStatus] = useState<ListingStatus | "">("");
  const [selectedHubPropertyStatusSaving, setSelectedHubPropertyStatusSaving] = useState(false);
  const [selectedHubPropertyDeleting, setSelectedHubPropertyDeleting] = useState(false);
  const [selectedHubPropertyStatusError, setSelectedHubPropertyStatusError] = useState<string | null>(null);
  const [selectedHubPropertyStatusNotice, setSelectedHubPropertyStatusNotice] = useState<string | null>(null);
  const [listingStatusModalOpen, setListingStatusModalOpen] = useState(false);
  const [listingDeleteModalOpen, setListingDeleteModalOpen] = useState(false);
  const [appointmentCalendarView, setAppointmentCalendarView] = useState<"week" | "month">("week");
  const [appointmentMonthOffset, setAppointmentMonthOffset] = useState(0);
  const [appointmentPopupDay, setAppointmentPopupDay] = useState<string | null>(null);
  const appointmentMonthPopupRef = useRef<HTMLDivElement | null>(null);
  const [appointmentDashboard, setAppointmentDashboard] = useState<VendorAppointmentsDashboardPayload | null>(null);
  const [appointmentDashboardLoading, setAppointmentDashboardLoading] = useState(false);
  const [appointmentDashboardError, setAppointmentDashboardError] = useState<string | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [appointmentEditorStatus, setAppointmentEditorStatus] = useState("");
  const [appointmentEditorAssignee, setAppointmentEditorAssignee] = useState("");
  const [appointmentEditorPropertyId, setAppointmentEditorPropertyId] = useState("");
  const [appointmentEditorTitle, setAppointmentEditorTitle] = useState("");
  const [appointmentEditorStartAt, setAppointmentEditorStartAt] = useState("");
  const [appointmentEditorClientName, setAppointmentEditorClientName] = useState("");
  const [appointmentEditorClientPhone, setAppointmentEditorClientPhone] = useState("");
  const [appointmentEditorNotes, setAppointmentEditorNotes] = useState("");
  const [appointmentEditorSaving, setAppointmentEditorSaving] = useState(false);
  const [appointmentEditorError, setAppointmentEditorError] = useState<string | null>(null);
  const [appointmentDashboardVersion, setAppointmentDashboardVersion] = useState(0);
  const [appointmentUnreadCount, setAppointmentUnreadCount] = useState(0);
  const [appointmentUnreadVersion, setAppointmentUnreadVersion] = useState(0);
  const [appointmentComposerMode, setAppointmentComposerMode] = useState<"edit" | "create" | null>(null);

  const [teamMembers, setTeamMembers] = useState<
    Array<{
      user_id: string;
      role: string;
      status: string;
      created_at: string | null;
      full_name: string | null;
      email: string | null;
      phone: string | null;
    }>
  >([]);
  const [appointmentComposerPropertyLocked, setAppointmentComposerPropertyLocked] = useState(false);
  const [vendorPropertyOptions, setVendorPropertyOptions] = useState<VendorPropertyItem[]>([]);
  const [selectedAppointmentStaffId, setSelectedAppointmentStaffId] = useState<string | null>(null);
  const [showPastStaffAppointments, setShowPastStaffAppointments] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);

  const [toastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [teamInvites, setTeamInvites] = useState<
    Array<{
      id: string;
      email: string;
      role: string;
      status: string;
      has_existing_account: boolean;
      created_at: string | null;
      expires_at: string | null;
      last_sent_at: string | null;
      accepted_at: string | null;
    }>
  >([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [teamInviteEmail, setTeamInviteEmail] = useState("");
  const [teamInviteRole, setTeamInviteRole] = useState("agent");
  const [teamSavingInvite, setTeamSavingInvite] = useState(false);
  const [mobileTeamInviteOpen, setMobileTeamInviteOpen] = useState(false);
  const [mobilePendingInvitesOpen, setMobilePendingInvitesOpen] = useState(false);
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [vendorWorkspace, setVendorWorkspace] = useState<{
    vendor: {
      id: string;
      name: string;
      vendor_type: string;
      plan: string | null;
      description?: string | null;
      logo_url?: string | null;
      contact_phone?: string | null;
      contact_email?: string | null;
      facebook_url?: string | null;
      telegram_url?: string | null;
      viber_phone?: string | null;
      tiktok_url?: string | null;
      website_url?: string | null;
      billing_status?: string | null;
      public_storefront_enabled?: boolean;
      cover_image_url?: string | null;
      slug?: string | null;
      verified_status?: string | null;
    };
    membership: {
      role: string;
    };
    workspaces?: Array<{
      vendor: {
        id: string;
        name: string;
        slug?: string | null;
        logo_url?: string | null;
        plan?: string | null;
        verified_status?: string | null;
      };
      membership: {
        role: string;
        status: string;
      };
    }>;
    limits?: {
      currentPlan?: {
        name: string;
      };
      listingCount?: number;
      listingLimit?: number;
      livePropertyCount?: number;
      agentCount?: number;
      agentLimit?: number;
      suggestedUpgrade?: {
        name?: string;
      } | null;
    };
  } | null>(null);
  const [vendorWorkspaceError, setVendorWorkspaceError] = useState<string | null>(null);
  const [vendorWorkspaceLoading, setVendorWorkspaceLoading] = useState(false);
  const [vendorOverview, setVendorOverview] = useState<VendorOverviewPayload | null>(null);
  const [vendorOverviewLoading, setVendorOverviewLoading] = useState(false);
  const [vendorOverviewError, setVendorOverviewError] = useState<string | null>(null);
  const [leadInboxUnreadCount, setLeadInboxUnreadCount] = useState(0);
  const [leadInboxUnreadVersion, setLeadInboxUnreadVersion] = useState(0);
  const isHubPath = pathname === "/hub";
  const isAccountPath = pathname === "/account";
  const hasVendorWorkspaceAccess =
    profileRole === "vendor_user" || onboardingPending || Boolean(vendorWorkspace?.vendor.id);
  const workspaceRole = (vendorWorkspace?.membership.role ?? "").trim().toLowerCase();
  const isFreeAgencyPlan = vendorWorkspace?.vendor.plan === "free";
  const isOwnerOrAdmin = workspaceRole === "owner" || workspaceRole === "admin";
  const canAccessAppointments = !isFreeAgencyPlan;
  const canAccessLeadInbox = !isFreeAgencyPlan;
  const canManagePromotions = workspaceRole === "owner";
  const canAccessBilling = workspaceRole === "owner";
  const canAccessHubSnapshot = isOwnerOrAdmin;
  const canAccessAnalytics = isOwnerOrAdmin && !isFreeAgencyPlan;
  const canAccessBoostings = isOwnerOrAdmin;
  const canAccessSettings = isOwnerOrAdmin;
  const canAccessVerification = workspaceRole === "owner";
  const canAccessBulkUpload = isOwnerOrAdmin && !isFreeAgencyPlan;
  const canManageListingOperations = isOwnerOrAdmin;
  const canCreateAppointments = isOwnerOrAdmin && canAccessAppointments;
  const canManageTeam = isOwnerOrAdmin;
  const canAccessTeam = canManageTeam && !isFreeAgencyPlan;
  const canInviteAdminSeats = workspaceRole === "owner";
  const getFallbackHubSection = useCallback(
    (): HubSection => (canAccessHubSnapshot ? "snapshot" : "manage-listings"),
    [canAccessHubSnapshot]
  );
  const isHubSectionAllowed = useCallback((section: HubSection) => {
    if (section === "manage-listings" || section === "listing-detail") return true;
    if (section === "appointments") return canAccessAppointments;
    if (section === "lead-inbox") return canAccessLeadInbox;
    if (section === "bulk-upload") return canAccessBulkUpload;
    if (section === "snapshot") return canAccessHubSnapshot;
    if (section === "analytics") return canAccessAnalytics;
    if (section === "boostings") return canAccessBoostings;
    if (section === "settings") return canAccessSettings;
    if (section === "verification") return canAccessVerification;
    if (section === "team") return canAccessTeam;
    return false;
  }, [
    canAccessAnalytics,
    canAccessAppointments,
    canAccessBoostings,
    canAccessBulkUpload,
    canAccessHubSnapshot,
    canAccessLeadInbox,
    canAccessSettings,
    canAccessTeam,
    canAccessVerification,
  ]);

  const updateHubSection = useCallback((
    section: HubSection,
    options?: {
      listingId?: string | null;
    }
  ) => {
    const nextSection = isHubSectionAllowed(section) ? section : getFallbackHubSection();
    setHubSection(nextSection);
    if (!isHubPath) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    if (nextSection === "snapshot") {
      nextParams.delete("section");
    } else if (nextSection === "listing-detail" || nextSection === "bulk-upload") {
      nextParams.delete("section");
    } else {
      nextParams.set("section", nextSection);
    }

    if (nextSection === "boostings" && options?.listingId) {
      nextParams.set("listingId", options.listingId);
    } else {
      nextParams.delete("listingId");
    }

    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [getFallbackHubSection, isHubPath, isHubSectionAllowed, pathname, router, searchParams]);

  useEffect(() => {
    const section = searchParams.get("section");
    if (
      section === "snapshot" ||
      section === "analytics" ||
      section === "boostings" ||
      section === "manage-listings" ||
      section === "lead-inbox" ||
      section === "appointments" ||
      section === "verification" ||
      section === "team" ||
      section === "settings"
    ) {
      if (isHubSectionAllowed(section)) {
        setHubSection(section);
      } else {
        updateHubSection(getFallbackHubSection());
      }
    } else if (!section && !canAccessHubSnapshot) {
      setHubSection("manage-listings");
    }
  }, [canAccessHubSnapshot, getFallbackHubSection, isHubSectionAllowed, searchParams, updateHubSection]);

  useEffect(() => {
    if (!isHubSectionAllowed(hubSection)) {
      updateHubSection(getFallbackHubSection());
    }
  }, [getFallbackHubSection, hubSection, isHubSectionAllowed, updateHubSection]);

  useEffect(() => {
    const pathContext = deriveActiveContextFromPath(pathname);
    if (pathContext) {
      writeActiveContext(pathContext);
    }
  }, [pathname]);

  useEffect(() => {
    if (!userId) {
      setActiveVendorId(null);
      return;
    }
    const storedVendorId = readActiveVendorWorkspace(userId);
    if (storedVendorId) {
      setActiveVendorId(storedVendorId);
    }
  }, [userId]);

  const buildVendorHeaders = useCallback((contentType = true) =>
    withActiveVendorHeaders(
      {
        ...(contentType ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${authToken}`,
      },
      activeVendorId
    ), [activeVendorId, authToken]);

  useEffect(() => {
    setViewingRequests([]);
    setSavedProperties([]);
    setInquiries([]);
    setSalesRequests([]);
    setActiveInquiry(null);
    setActiveSale(null);
    setLoadedTabs({
      viewing: false,
      saved: false,
      inquiries: false,
      sales: false,
    });
    setTabLoading({
      viewing: false,
      saved: false,
      inquiries: false,
      sales: false,
    });
    setTabError({
      viewing: null,
      saved: null,
      inquiries: null,
      sales: null,
    });
    setRefreshedTabs({
      viewing: false,
      saved: false,
      inquiries: false,
      sales: false,
    });
  }, [userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnboardingPending(window.localStorage.getItem("kaiten_vendor_onboarding_pending") === "1");
  }, []);

  useEffect(() => {
    if (!authToken || profileRole !== "vendor_user" || !canAccessHubSnapshot) {
      setVendorOverview(null);
      setVendorOverviewError(null);
      setVendorOverviewLoading(false);
      return;
    }

    if (vendorWorkspace?.vendor.plan === "free") {
      setVendorOverview(null);
      setVendorOverviewError(null);
      setVendorOverviewLoading(false);
      return;
    }

    let active = true;
    setVendorOverviewLoading(true);
    setVendorOverviewError(null);

    fetch("/api/vendor/overview", {
      headers: buildVendorHeaders(false),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as (VendorOverviewPayload & { error?: string }) | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load workspace insights.");
        }
        if (!payload) {
          throw new Error("Unable to load workspace insights.");
        }
        if (active) {
          setVendorOverview(payload);
        }
      })
      .catch((error) => {
        if (active) {
          setVendorOverviewError(error instanceof Error ? error.message : "Unable to load workspace insights.");
        }
      })
      .finally(() => {
        if (active) {
          setVendorOverviewLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeVendorId, authToken, buildVendorHeaders, canAccessHubSnapshot, profileRole, vendorWorkspace?.vendor.plan]);

  useEffect(() => {
    if (!authToken || profileRole !== "vendor_user" || vendorWorkspace?.vendor.plan === "free") {
      setLeadInboxUnreadCount(0);
      return;
    }

    let active = true;

    fetch("/api/vendor/inquiries/unread", {
      headers: buildVendorHeaders(false),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as { unreadCount?: number; error?: string } | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load unread lead count.");
        }
        if (active) {
          setLeadInboxUnreadCount(typeof payload?.unreadCount === "number" ? payload.unreadCount : 0);
        }
      })
      .catch(() => {
        if (active) {
          setLeadInboxUnreadCount(0);
        }
      });

    return () => {
      active = false;
    };
  }, [activeVendorId, authToken, buildVendorHeaders, leadInboxUnreadVersion, profileRole, vendorWorkspace?.vendor.plan]);

  useEffect(() => {
    if (!authToken || profileRole !== "vendor_user" || vendorWorkspace?.vendor.plan === "free") {
      setAppointmentUnreadCount(0);
      return;
    }

    let active = true;

    fetch("/api/vendor/viewing-requests/unread", {
      headers: buildVendorHeaders(false),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as { unreadCount?: number; error?: string } | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load unread viewing request count.");
        }
        if (active) {
          setAppointmentUnreadCount(typeof payload?.unreadCount === "number" ? payload.unreadCount : 0);
        }
      })
      .catch(() => {
        if (active) {
          setAppointmentUnreadCount(0);
        }
      });

    return () => {
      active = false;
    };
  }, [activeVendorId, appointmentUnreadVersion, authToken, buildVendorHeaders, profileRole, vendorWorkspace?.vendor.plan]);

  useEffect(() => {
    if (!authToken || !userId || profileRole !== "vendor_user" || vendorWorkspace?.vendor.plan === "free") return;

    const channel = supabase
      .channel(`hub-lead-unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_inquiry_leads" },
        () => setLeadInboxUnreadVersion((current) => current + 1)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_lead_notes" },
        () => setLeadInboxUnreadVersion((current) => current + 1)
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_lead_reads" },
        () => setLeadInboxUnreadVersion((current) => current + 1)
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authToken, profileRole, userId, vendorWorkspace?.vendor.plan]);

  useEffect(() => {
    if (!authToken || !userId || profileRole !== "vendor_user") return;

    const channel = supabase
      .channel(`hub-viewing-unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "viewing_requests" },
        () => {
          setAppointmentUnreadVersion((current) => current + 1);
          setAppointmentDashboardVersion((current) => current + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vendor_viewing_request_reads" },
        () => {
          setAppointmentUnreadVersion((current) => current + 1);
          setAppointmentDashboardVersion((current) => current + 1);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [authToken, profileRole, userId]);

  useEffect(() => {
    if (!authToken || !selectedHubProperty?.id || hubSection !== "listing-detail") {
      setSelectedHubPropertyDetail(null);
      setSelectedHubPropertyLoading(false);
      setSelectedHubPropertyError(null);
      return;
    }

    let active = true;
    setSelectedHubPropertyLoading(true);
    setSelectedHubPropertyError(null);

    fetch(`/api/vendor/properties/${selectedHubProperty.id}`, {
      headers: buildVendorHeaders(false),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as (HubPropertyDetailPayload & { error?: string }) | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load property detail.");
        }
        if (!payload) {
          throw new Error("Unable to load property detail.");
        }
        if (active) {
          setSelectedHubPropertyDetail(payload);
          setSelectedHubPropertyStatus(normalizeListingStatus(payload.property.status) ?? "");
          setSelectedHubPropertyStatusError(null);
          setSelectedHubPropertyStatusNotice(null);
        }
      })
      .catch((error) => {
        if (active) {
          setSelectedHubPropertyError(error instanceof Error ? error.message : "Unable to load property detail.");
        }
      })
      .finally(() => {
        if (active) {
          setSelectedHubPropertyLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeVendorId, authToken, buildVendorHeaders, hubSection, selectedHubProperty?.id]);

  const availableListingStatusOptions = useMemo(() => [...listingStatuses], []);

  const handleHubPropertyStatusUpdate = async () => {
    if (!selectedHubPropertyDetail?.property.id || !selectedHubPropertyStatus) return;

    setSelectedHubPropertyStatusSaving(true);
    setSelectedHubPropertyStatusError(null);
    setSelectedHubPropertyStatusNotice(null);

    try {
      const response = await fetch(`/api/vendor/properties/${selectedHubPropertyDetail.property.id}`, {
        method: "PATCH",
        headers: buildVendorHeaders(),
        body: JSON.stringify({
          status: selectedHubPropertyStatus,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update listing status.");
      }

      setSelectedHubPropertyDetail((current) =>
        current
          ? {
              ...current,
              property: {
                ...current.property,
                status: selectedHubPropertyStatus,
              },
            }
          : current
      );
      setSelectedHubProperty((current) =>
        current
          ? {
              ...current,
              status: selectedHubPropertyStatus,
            }
          : current
      );
      setSelectedHubPropertyStatusNotice(t("hub.statusUpdated"));
      setListingStatusModalOpen(false);
    } catch (error) {
      setSelectedHubPropertyStatusError(error instanceof Error ? error.message : t("hub.updateStatusError"));
    } finally {
      setSelectedHubPropertyStatusSaving(false);
    }
  };

  const handleHubPropertyDelete = async () => {
    if (!selectedHubPropertyDetail?.property.id || !authToken) return;

    setSelectedHubPropertyDeleting(true);
    setSelectedHubPropertyStatusError(null);
    setSelectedHubPropertyStatusNotice(null);

    try {
      const response = await fetch(`/api/vendor/properties/${selectedHubPropertyDetail.property.id}`, {
        method: "DELETE",
        headers: buildVendorHeaders(),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || t("hub.deleteListingError"));
      }

      setSelectedHubPropertyStatusNotice(t("hub.listingDeleted"));
      setListingDeleteModalOpen(false);
      setSelectedHubPropertyDetail(null);
      setSelectedHubProperty(null);
      updateHubSection("manage-listings");
    } catch (error) {
      setSelectedHubPropertyStatusError(error instanceof Error ? error.message : t("hub.deleteListingError"));
    } finally {
      setSelectedHubPropertyDeleting(false);
    }
  };

  useEffect(() => {
    if (!authToken || hubSection !== "team") {
      setTeamLoading(false);
      setTeamError(null);
      return;
    }

    let cancelled = false;
    setTeamLoading(true);
    setTeamError(null);

    fetch("/api/vendor/team", {
      headers: buildVendorHeaders(false),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { members?: Array<{
              user_id: string;
              role: string;
              status: string;
              created_at: string | null;
              full_name: string | null;
              email: string | null;
              phone: string | null;
            }>;
              invites?: Array<{
                id: string;
                email: string;
                role: string;
                status: string;
                has_existing_account: boolean;
                created_at: string | null;
                expires_at: string | null;
                last_sent_at: string | null;
                accepted_at: string | null;
              }>;
              error?: string }
          | null;
        if (!response.ok) {
          throw new Error(payload?.error || t("vendor.team.loadingError"));
        }
        if (!cancelled) {
          setTeamMembers(payload?.members ?? []);
          setTeamInvites(payload?.invites ?? []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setTeamError(error instanceof Error ? error.message : t("vendor.team.loadingError"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTeamLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeVendorId, authToken, buildVendorHeaders, hubSection, t]);

  useEffect(() => {
    const shouldLoadAppointmentDashboard = appointmentComposerMode || hubSection === "appointments";
    if (!authToken || !shouldLoadAppointmentDashboard || vendorWorkspace?.vendor.plan === "free") {
      setAppointmentDashboard(null);
      setAppointmentDashboardLoading(false);
      setAppointmentDashboardError(null);
      return;
    }

    let active = true;
    setAppointmentDashboardLoading(true);
    setAppointmentDashboardError(null);

    fetch("/api/vendor/appointments/dashboard", {
      headers: buildVendorHeaders(false),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as (VendorAppointmentsDashboardPayload & {
          error?: string;
        }) | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load appointment management.");
        }
        if (!payload) {
          throw new Error("Unable to load appointment management.");
        }
        if (active) {
          setAppointmentDashboard(payload);
        }
      })
      .catch((error) => {
        if (active) {
          setAppointmentDashboardError(
            error instanceof Error ? error.message : "Unable to load appointment management."
          );
        }
      })
      .finally(() => {
        if (active) {
          setAppointmentDashboardLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    activeVendorId,
    appointmentComposerMode,
    appointmentDashboardVersion,
    authToken,
    buildVendorHeaders,
    hubSection,
    vendorWorkspace?.vendor.plan,
  ]);

  useEffect(() => {
    if (!authToken || profileRole !== "vendor_user") {
      setVendorPropertyOptions([]);
      return;
    }

    let active = true;

    fetch("/api/vendor/properties", {
      headers: buildVendorHeaders(false),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as { items?: VendorPropertyItem[]; error?: string } | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load properties.");
        }
        if (active) {
          setVendorPropertyOptions(payload?.items ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setVendorPropertyOptions([]);
        }
      });

    return () => {
      active = false;
    };
  }, [activeVendorId, authToken, buildVendorHeaders, profileRole]);

  useEffect(() => {
    if (!profileReady || loading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if (isHubPath && !hasVendorWorkspaceAccess) {
      router.replace("/account");
    }
  }, [hasVendorWorkspaceAccess, isHubPath, loading, profileReady, router, user]);

  useEffect(() => {
    if (!userId || !isAccountPath) return;

    const nextLoaded: Record<AccountTabKey, boolean> = {
      viewing: false,
      saved: false,
      inquiries: false,
      sales: false,
    };
    const nextRefreshed: Record<AccountTabKey, boolean> = {
      viewing: false,
      saved: false,
      inquiries: false,
      sales: false,
    };
    const nextErrors: Record<AccountTabKey, string | null> = {
      viewing: null,
      saved: null,
      inquiries: null,
      sales: null,
    };

    const viewingCache = readAccountTabCache(userId, "viewing");
    if (viewingCache) {
      setViewingRequests(viewingCache.items);
      nextLoaded.viewing = true;
      nextRefreshed.viewing = isFreshAccountCache(viewingCache);
    } else {
      setViewingRequests([]);
    }

    const savedCache = readAccountTabCache(userId, "saved");
    if (savedCache) {
      setSavedProperties(savedCache.items);
      nextLoaded.saved = true;
      nextRefreshed.saved = isFreshAccountCache(savedCache);
    } else {
      setSavedProperties([]);
    }

    const inquiriesCache = readAccountTabCache(userId, "inquiries");
    if (inquiriesCache) {
      setInquiries(inquiriesCache.items);
      nextLoaded.inquiries = true;
      nextRefreshed.inquiries = isFreshAccountCache(inquiriesCache);
    } else {
      setInquiries([]);
    }

    const salesCache = readAccountTabCache(userId, "sales");
    if (salesCache) {
      setSalesRequests(salesCache.items);
      nextLoaded.sales = true;
      nextRefreshed.sales = isFreshAccountCache(salesCache);
    } else {
      setSalesRequests([]);
    }

    setLoadedTabs(nextLoaded);
    setRefreshedTabs(nextRefreshed);
    setTabError(nextErrors);
    setTabLoading({
      viewing: false,
      saved: false,
      inquiries: false,
      sales: false,
    });
  }, [isAccountPath, userId]);

  const applyTabData = (tab: AccountTabKey, items: Array<Record<string, unknown>>) => {
    if (tab === "viewing") {
      setViewingRequests(items);
      return;
    }
    if (tab === "saved") {
      setSavedProperties(items);
      return;
    }
    if (tab === "inquiries") {
      setInquiries(items);
      return;
    }
    setSalesRequests(items);
  };

  useEffect(() => {
    if (!userId) return;
    if (!isAccountPath) return;
    if (refreshedTabs[activeTab]) return;

    let active = true;
    const hasCachedData = loadedTabs[activeTab];
    if (!hasCachedData) {
      setTabLoading((current) => ({ ...current, [activeTab]: true }));
    }
    setTabError((current) => ({ ...current, [activeTab]: null }));

    const loaders = {
      viewing: () => withTimeout(getViewingRequestsForUser(userId), 15000),
      saved: () => withTimeout(getSavedPropertiesForUser(userId), 15000),
      inquiries: () => withTimeout(getInquiriesForUser(userId), 15000),
      sales: () => withTimeout(getOwnedPropertiesForUser(userId), 15000),
    } as const;

    loaders[activeTab]()
      .then((result) => {
        if (!active) return;
        applyTabData(activeTab, result.data);
        writeAccountTabCache(userId, activeTab, result.data);

        const message = result.error ?? null;
        setTabError((current) => ({ ...current, [activeTab]: message }));
        setLoadedTabs((current) => ({ ...current, [activeTab]: true }));
        setRefreshedTabs((current) => ({ ...current, [activeTab]: true }));
      })
      .catch((error) => {
        if (!active) return;
        if (!hasCachedData) {
          const message =
            error instanceof Error && error.message === "Request timed out."
              ? "Unable to refresh this section right now."
              : error instanceof Error
                ? error.message
                : "Unable to load this section.";
          applyTabData(activeTab, []);
          setTabError((current) => ({ ...current, [activeTab]: message }));
        }
      })
      .finally(() => {
        if (active) {
          setTabLoading((current) => ({ ...current, [activeTab]: false }));
        }
      });

    return () => {
      active = false;
    };
  }, [activeTab, isAccountPath, loadedTabs, refreshedTabs, userId]);

  useEffect(() => {
    if (!authToken || (!onboardingPending && profileRole !== "vendor_user" && pathname !== "/hub")) return;

    let active = true;
    const workspaceCacheVariant = `full:${activeVendorId ?? "default"}`;
    const cachedWorkspace = userId
      ? readWorkspaceCache<{
          vendor: {
            id: string;
            name: string;
            vendor_type: string;
            plan: string | null;
            description?: string | null;
            logo_url?: string | null;
            contact_phone?: string | null;
            contact_email?: string | null;
            facebook_url?: string | null;
            telegram_url?: string | null;
            viber_phone?: string | null;
            tiktok_url?: string | null;
            website_url?: string | null;
            billing_status?: string | null;
            public_storefront_enabled?: boolean;
            slug?: string | null;
            verified_status?: string | null;
          };
          membership: { role: string };
          workspaces?: Array<{
            vendor: {
              id: string;
              name: string;
              slug?: string | null;
              logo_url?: string | null;
              plan?: string | null;
              verified_status?: string | null;
            };
            membership: {
              role: string;
              status: string;
            };
          }>;
          limits?: {
            currentPlan?: { name: string };
            listingCount?: number;
            listingLimit?: number;
            livePropertyCount?: number;
            agentCount?: number;
            agentLimit?: number;
          };
        }>(userId, workspaceCacheVariant)
      : null;
    setVendorWorkspaceError(null);
    setVendorWorkspaceLoading(!cachedWorkspace);
    if (cachedWorkspace) {
      setVendorWorkspace(cachedWorkspace);
    }

    fetch("/api/vendor/workspace", {
      headers: buildVendorHeaders(false),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | {
              vendor?: {
                id: string;
                name: string;
                vendor_type: string;
                plan: string | null;
                description?: string | null;
                logo_url?: string | null;
                contact_phone?: string | null;
                contact_email?: string | null;
                facebook_url?: string | null;
                telegram_url?: string | null;
                viber_phone?: string | null;
                tiktok_url?: string | null;
                website_url?: string | null;
                billing_status?: string | null;
                public_storefront_enabled?: boolean;
                slug?: string | null;
                verified_status?: string | null;
              };
              membership?: { role: string };
              workspaces?: Array<{
                vendor: {
                  id: string;
                  name: string;
                  slug?: string | null;
                  logo_url?: string | null;
                  plan?: string | null;
                  verified_status?: string | null;
                };
                membership: {
                  role: string;
                  status: string;
                };
              }>;
              limits?: {
                currentPlan?: { name: string };
                listingCount?: number;
                listingLimit?: number;
                livePropertyCount?: number;
                agentCount?: number;
                agentLimit?: number;
              };
              error?: string;
            }
          | null;
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load vendor workspace.");
        }
        if (active) {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("kaiten_vendor_onboarding_pending");
          }
          setOnboardingPending(false);
          setVendorWorkspace(
            payload?.vendor && payload?.membership
              ? {
                  vendor: payload.vendor,
                  membership: payload.membership,
                  workspaces: payload.workspaces,
                  limits: payload.limits,
                }
              : null
          );
          if (userId && payload?.vendor?.id) {
            setActiveVendorId(payload.vendor.id);
            writeActiveVendorWorkspace(userId, payload.vendor.id);
          }
          if (userId && payload?.vendor && payload?.membership) {
            writeWorkspaceCache(userId, workspaceCacheVariant, {
              vendor: payload.vendor,
              membership: payload.membership,
              workspaces: payload.workspaces,
              limits: payload.limits,
            });
          }
          setVendorWorkspaceLoading(false);
        }
      })
      .catch((error) => {
        if (active) {
          setVendorWorkspaceError(error instanceof Error ? error.message : "Unable to load vendor workspace.");
          setVendorWorkspaceLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeVendorId, authToken, buildVendorHeaders, onboardingPending, pathname, profileRole, userId]);

  const closeDetails = () => {
    setActiveInquiry(null);
    setActiveSale(null);
  };

  const closeAppointmentEditor = () => {
    setSelectedAppointmentId(null);
    setAppointmentComposerMode(null);
    setAppointmentComposerPropertyLocked(false);
    setAppointmentEditorError(null);
    setAppointmentEditorSaving(false);
  };

  const openAppointmentEditor = (appointmentId: string) => {
    setAppointmentComposerMode("edit");
    setSelectedAppointmentId(appointmentId);
    setAppointmentEditorError(null);
  };

  const openAppointmentCreator = (propertyId?: string | null) => {
    setAppointmentComposerMode("create");
    setAppointmentComposerPropertyLocked(Boolean(propertyId));
    setSelectedAppointmentId(null);
    setAppointmentEditorStatus("requested");
    setAppointmentEditorAssignee("");
    setAppointmentEditorPropertyId(propertyId ?? "");
    setAppointmentEditorTitle("");
    setAppointmentEditorStartAt("");
    setAppointmentEditorClientName("");
    setAppointmentEditorClientPhone("");
    setAppointmentEditorNotes("");
    setAppointmentEditorError(null);
  };

  const handleAppointmentSave = async () => {
    if (!authToken) return;

    setAppointmentEditorSaving(true);
    setAppointmentEditorError(null);
    try {
      const isCreate = appointmentComposerMode === "create";
      const response = await fetch("/api/vendor/appointments/manage", {
        method: isCreate ? "POST" : "PATCH",
        headers: buildVendorHeaders(),
        body: JSON.stringify({
          ...(isCreate
            ? {}
            : {
                source: selectedAppointment?.source,
                id: selectedAppointment?.id,
              }),
          status: appointmentEditorStatus,
          assigned_staff_id: appointmentEditorAssignee || null,
          property_id: appointmentEditorPropertyId || null,
          title: appointmentEditorTitle || null,
          start_at: appointmentEditorStartAt || null,
          client_name: appointmentEditorClientName || null,
          client_phone: appointmentEditorClientPhone || null,
          notes: appointmentEditorNotes || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || `Unable to ${isCreate ? "create" : "update"} appointment.`);
      }

      closeAppointmentEditor();
      setAppointmentDashboardVersion((current) => current + 1);
    } catch (error) {
      setAppointmentEditorError(
        error instanceof Error
          ? error.message
          : `Unable to ${appointmentComposerMode === "create" ? "create" : "update"} appointment.`
      );
    } finally {
      setAppointmentEditorSaving(false);
    }
  };

  const handleAppointmentDelete = async () => {
    if (!authToken || !selectedAppointment || appointmentComposerMode !== "edit") return;

    setAppointmentEditorSaving(true);
    setAppointmentEditorError(null);
    try {
      const response = await fetch("/api/vendor/appointments/manage", {
        method: "DELETE",
        headers: buildVendorHeaders(),
        body: JSON.stringify({
          source: selectedAppointment.source,
          id: selectedAppointment.id,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to delete appointment.");
      }

      closeAppointmentEditor();
      setAppointmentDashboardVersion((current) => current + 1);
    } catch (error) {
      setAppointmentEditorError(error instanceof Error ? error.message : "Unable to delete appointment.");
    } finally {
      setAppointmentEditorSaving(false);
    }
  };

  const handleTeamInvite = async () => {
    if (!authToken || !teamInviteEmail.trim()) return;
    setTeamSavingInvite(true);
    setTeamError(null);
    try {
      const response = await fetch("/api/vendor/team", {
        method: "POST",
        headers: buildVendorHeaders(),
        body: JSON.stringify({
          email: teamInviteEmail.trim(),
          role: canInviteAdminSeats ? teamInviteRole : "agent",
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        invite?: {
          email: string;
          role: string;
          status: string;
          has_existing_account: boolean;
          expires_at: string | null;
        };
        error?: string;
      } | null;
      if (!response.ok || !payload?.invite) {
        throw new Error(payload?.error || t("vendor.team.inviteError"));
      }
      setTeamInvites((current) => [
        {
          id: `pending-${Date.now()}`,
          email: payload.invite?.email ?? teamInviteEmail.trim(),
          role: payload.invite?.role ?? teamInviteRole,
          status: payload.invite?.status ?? "pending",
          has_existing_account: Boolean(payload.invite?.has_existing_account),
          created_at: new Date().toISOString(),
          expires_at: payload.invite?.expires_at ?? null,
          last_sent_at: new Date().toISOString(),
          accepted_at: null,
        },
        ...current.filter((invite) => invite.email.toLowerCase() !== teamInviteEmail.trim().toLowerCase()),
      ]);
      setTeamInviteEmail("");
      setTeamInviteRole("agent");
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : t("vendor.team.inviteError"));
    } finally {
      setTeamSavingInvite(false);
    }
  };

  const currentVendorPlan = getVendorPlan(vendorWorkspace?.vendor.plan);
  const suggestedUpgrade = getUpgradePlan(vendorWorkspace?.vendor.plan);
  const storefrontReady = vendorWorkspace ? isVendorStorefrontSetupComplete(vendorWorkspace.vendor) : false;

  const hasAgencyBio = Boolean(vendorWorkspace?.vendor.description?.trim());
  const hasAgencyLogo = Boolean(vendorWorkspace?.vendor.logo_url?.trim());
  const hasAgencyContact = Boolean(
    vendorWorkspace?.vendor.contact_phone?.trim() || vendorWorkspace?.vendor.contact_email?.trim()
  );
  const hasSocialChannel = Boolean(
    vendorWorkspace?.vendor.facebook_url?.trim() ||
      vendorWorkspace?.vendor.telegram_url?.trim() ||
      vendorWorkspace?.vendor.viber_phone?.trim() ||
      vendorWorkspace?.vendor.tiktok_url?.trim() ||
      vendorWorkspace?.vendor.website_url?.trim()
  );
  const listingLimit = vendorWorkspace?.limits?.listingLimit ?? currentVendorPlan.listingLimit;
  const listingUsage = vendorWorkspace?.limits?.listingCount ?? 0;
  const liveListingCount = vendorWorkspace?.limits?.livePropertyCount ?? 0;
  const agentLimit = vendorWorkspace?.limits?.agentLimit ?? currentVendorPlan.agentLimit;
  const agentUsage = vendorWorkspace?.limits?.agentCount ?? 1;
  const profileReadinessItems = [
    { done: hasAgencyLogo, label: t("hub.logo") },
    { done: hasAgencyContact, label: t("hub.contact") },
    { done: hasAgencyBio, label: t("hub.bio") },
    { done: storefrontReady, label: t("hub.storefront") },
  ];
  const profileReadinessDoneCount = profileReadinessItems.filter((item) => item.done).length;
  const freeSettingsHref = "/hub/settings";
  const freeUpgradeHref = "/hub/upgrade";
  const workspaceOptions =
    vendorWorkspace?.workspaces?.length
      ? vendorWorkspace.workspaces
      : vendorWorkspace
        ? [
            {
              vendor: {
                id: vendorWorkspace.vendor.id,
                name: vendorWorkspace.vendor.name,
                slug: vendorWorkspace.vendor.slug,
                logo_url: vendorWorkspace.vendor.logo_url,
                plan: vendorWorkspace.vendor.plan,
                verified_status: vendorWorkspace.vendor.verified_status,
              },
              membership: {
                role: vendorWorkspace.membership.role,
                status: "active",
              },
            },
          ]
        : [];
  const currentWorkspaceOption =
    workspaceOptions.find((workspace) => workspace.vendor.id === (activeVendorId ?? vendorWorkspace?.vendor.id ?? "")) ??
    workspaceOptions[0] ??
    null;
  const currentHubMobileMeta = useMemo(() => {
    const workspaceName =
      currentWorkspaceOption?.vendor.name || vendorWorkspace?.vendor.name || t("header.agencyWorkspace");

    switch (hubSection) {
      case "manage-listings":
      case "listing-detail":
      case "bulk-upload":
        return {
          label: workspaceName,
          title: t("hub.manageListings"),
          image: undefined,
          icon: <Plus />,
        };
      case "appointments":
        return {
          label: workspaceName,
          title: t("hub.appointments"),
          image: undefined,
          icon: <Calendar />,
        };
      case "boostings":
        return {
          label: workspaceName,
          title: t("hub.boostings"),
          image: undefined,
          icon: <Megaphone />,
        };
      case "analytics":
        return {
          label: workspaceName,
          title: t("hub.analytics"),
          image: undefined,
          icon: <BarChart3 />,
        };
      case "lead-inbox":
        return {
          label: workspaceName,
          title: t("hub.leadInbox"),
          image: undefined,
          icon: <MessageSquareText />,
        };
      case "settings":
        return {
          label: workspaceName,
          title: t("hub.organizationSettings"),
          image: undefined,
          icon: <Settings />,
        };
      case "team":
        return {
          label: workspaceName,
          title: t("vendor.team.title"),
          image: undefined,
          icon: <Users2 />,
        };
      case "verification":
        return {
          label: workspaceName,
          title: t("agency.verification"),
          image: undefined,
          icon: <ShieldCheck />,
        };
      case "snapshot":
      default:
        return {
          label: t("header.agencyWorkspace"),
          title: workspaceName,
          image: currentWorkspaceOption?.vendor.logo_url || vendorWorkspace?.vendor.logo_url || undefined,
          icon: <Home />,
        };
    }
  }, [currentWorkspaceOption?.vendor.logo_url, currentWorkspaceOption?.vendor.name, hubSection, t, vendorWorkspace?.vendor.logo_url, vendorWorkspace?.vendor.name]);
  const handleWorkspaceChange = (nextVendorId: string) => {
    if (!userId || !nextVendorId || nextVendorId === activeVendorId) return;
    const nextWorkspace = workspaceOptions.find((workspace) => workspace.vendor.id === nextVendorId) ?? null;
    const nextWorkspaceRole = String(nextWorkspace?.membership.role ?? "").trim().toLowerCase();
    writeActiveVendorWorkspace(userId, nextVendorId);
    setActiveVendorId(nextVendorId);
    setSelectedHubProperty(null);
    setSelectedHubPropertyDetail(null);
    setSelectedAppointmentId(null);
    setAppointmentComposerMode(null);
    setTeamMembers([]);
    setVendorOverview(null);
    setAppointmentDashboard(null);
    setLeadInboxUnreadVersion((current) => current + 1);
    setAppointmentUnreadVersion((current) => current + 1);
    if (hubSection === "listing-detail") {
      setHubSection(nextWorkspaceRole === "owner" || nextWorkspaceRole === "admin" ? "snapshot" : "manage-listings");
    }
  };
  const activeTeamCount = teamMembers.filter((member) => member.status === "active").length;
  const ownerCount = teamMembers.filter((member) => member.role === "owner" && member.status === "active").length;
  const adminCount = teamMembers.filter((member) => member.role === "admin" && member.status === "active").length;
  const agentCount = teamMembers.filter((member) => member.role === "agent" && member.status === "active").length;
  const canManageTeamMember = (member: (typeof teamMembers)[number]) => {
    if (!canManageTeam) return false;
    if (workspaceRole === "owner") {
      return member.user_id !== userId;
    }
    return workspaceRole === "admin" && member.role === "agent" && member.user_id !== userId;
  };
  const storefrontChannels = [
    vendorWorkspace?.vendor.contact_phone,
    vendorWorkspace?.vendor.contact_email,
    vendorWorkspace?.vendor.facebook_url,
    vendorWorkspace?.vendor.telegram_url,
    vendorWorkspace?.vendor.viber_phone,
    vendorWorkspace?.vendor.tiktok_url,
    vendorWorkspace?.vendor.website_url,
  ].filter((value) => typeof value === "string" && value.trim()).length;
  const profileReadinessHref =
    profileReadinessDoneCount === profileReadinessItems.length ? freeSettingsHref : "/agency-setup";
  const hubChecklist = [
    {
      done: profileReadinessDoneCount === profileReadinessItems.length,
      title: t("hub.profileReadiness"),
      hint:
        profileReadinessDoneCount === profileReadinessItems.length
          ? t("hub.profileReadinessReady")
          : t("hub.profileReadinessProgress", {
              count: profileReadinessDoneCount,
              total: profileReadinessItems.length,
              summary: profileReadinessItems.map((item) => `${item.done ? "✓" : "○"} ${item.label}`).join("  •  "),
            }),
      href: profileReadinessHref,
      actionLabel: profileReadinessDoneCount === profileReadinessItems.length ? t("hub.review") : t("hub.complete"),
    },
    {
      done: hasSocialChannel,
      title: t("hub.channelReadiness"),
      hint: hasSocialChannel
        ? t("hub.channelReady")
        : t("hub.channelMissing"),
      href: freeSettingsHref,
      actionLabel: hasSocialChannel ? t("hub.manage") : t("hub.addChannel"),
    },
    {
      done: liveListingCount > 0,
      title: t("hub.firstLiveListing"),
      hint:
        liveListingCount > 0
          ? liveListingCount > 1
            ? t("hub.liveListingPlural", { count: liveListingCount })
            : t("hub.liveListingSingular", { count: liveListingCount })
          : t("hub.publishFirstListing"),
      href: "/request-sale",
      actionLabel: liveListingCount > 0 ? t("hub.manage") : t("hub.publishFirst"),
    },
  ];
  const starterChecklistComplete = hubChecklist.every((item) => item.done);
  const starterChecklistDoneCount = hubChecklist.filter((item) => item.done).length;
  const activeTabLoading = tabLoading[activeTab];
  const activeTabError = tabError[activeTab];
  const activeTabHasItems = useMemo(() => {
    if (activeTab === "viewing") return viewingRequests.length > 0;
    if (activeTab === "saved") return savedProperties.length > 0;
    if (activeTab === "inquiries") return inquiries.length > 0;
    return salesRequests.length > 0;
  }, [activeTab, inquiries.length, salesRequests.length, savedProperties.length, viewingRequests.length]);
  const labelize = (value: string | null | undefined) =>
    value
      ? value
          .split("_")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ")
      : "Unknown";
  const formatTeamRoleLabel = (value: string | null | undefined) => {
    if (value === "owner") return t("role.owner");
    if (value === "admin") return t("role.admin");
    if (value === "agent") return t("vendor.team.agent");
    if (value === "staff") return t("role.staff");
    if (value === "member") return t("role.member");
    return labelize(value);
  };
  const formatTeamStatusLabel = (value: string | null | undefined) => {
    if (value === "active") return t("vendor.team.active");
    if (value === "inactive") return t("vendor.team.inactive");
    return labelize(value);
  };
  const formatInviteStatusLabel = (value: string | null | undefined) => {
    if (value === "pending") return t("hub.inviteStatusPending");
    if (value === "accepted") return t("hub.inviteStatusAccepted");
    if (value === "expired") return t("hub.inviteStatusExpired");
    if (value === "revoked") return t("hub.inviteStatusRevoked");
    return labelize(value);
  };
  const getDealTypeLabel = (value: string | null | undefined) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (normalized === "sale") return t("listing.forSale");
    if (normalized === "rent") return t("listing.forRent");
    return labelize(value);
  };
  const getCompactDealTypeLabel = (value: string | null | undefined) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (normalized === "sale") return language === "en" ? "Sale" : t("listing.forSale");
    if (normalized === "rent") return language === "en" ? "Rent" : t("listing.forRent");
    return labelize(value);
  };
  const getListingStatusTone = (value: string | null | undefined) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (normalized === "active") return "status-success" as const;
    if (normalized === "reserved" || normalized === "paused" || normalized === "expired") return "status-warning" as const;
    if (normalized === "sold" || normalized === "rented" || normalized === "rejected") return "status-danger" as const;
    if (normalized === "draft" || normalized === "archived") return "status-muted" as const;
    return "neutral" as const;
  };
  const workspaceSnapshotView = useMemo(() => HUB_SNAPSHOT_TEMPLATE, []);
  const summaryPortfolioValue =
    vendorOverview?.metrics.totalValue ??
    (vendorWorkspace?.vendor.plan && vendorWorkspace.vendor.plan !== "free" ? HUB_SUMMARY_TEMPLATE.totalValue : 0);
  const summaryNextAppointmentTitle =
    vendorOverview?.nextAppointment?.title ??
    (vendorWorkspace?.vendor.plan && vendorWorkspace.vendor.plan !== "free"
      ? HUB_SUMMARY_TEMPLATE.nextAppointmentTitle
      : t("hub.noUpcoming"));
  const summaryNextAppointmentAt =
    vendorOverview?.nextAppointment?.start_at ??
    (vendorWorkspace?.vendor.plan && vendorWorkspace.vendor.plan !== "free"
      ? HUB_SUMMARY_TEMPLATE.nextAppointmentAt
      : null);
  const listingTypesSummary = useMemo(() => workspaceSnapshotView.listingTypes, [workspaceSnapshotView]);
  const salesByTypeSummary = useMemo(() => withOthers(workspaceSnapshotView.salesByType, 4), [workspaceSnapshotView]);
  const appointmentsByTypeSummary = useMemo(
    () => withOthers(workspaceSnapshotView.appointmentsByType, 4),
    [workspaceSnapshotView]
  );
  const priceRangesSummary = useMemo(() => workspaceSnapshotView.priceRangesByType.slice(0, 4), [workspaceSnapshotView]);
  const appointmentMonthDate = useMemo(() => {
    const base = new Date();
    return new Date(base.getFullYear(), base.getMonth() + appointmentMonthOffset, 1);
  }, [appointmentMonthOffset]);
  const appointmentMonthLabel = appointmentMonthDate.toLocaleString(locale, { month: "long", year: "numeric" });
  const appointmentDashboardAppointments = useMemo(
    () => appointmentDashboard?.appointments ?? [],
    [appointmentDashboard]
  );
  const appointmentStats = appointmentDashboard?.stats ?? { today: 0, unassigned: 0, upcoming: 0 };
  const appointmentWeekDays = useMemo(() => {
    const base = new Date();
    const startOfToday = new Date(base.getFullYear(), base.getMonth(), base.getDate());

    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(startOfToday);
      current.setDate(startOfToday.getDate() + index);
      const next = new Date(current);
      next.setDate(current.getDate() + 1);

      const count = appointmentDashboardAppointments.filter((appointment) => {
        if (!appointment.start_at) return false;
        const timestamp = new Date(appointment.start_at).getTime();
        return timestamp >= current.getTime() && timestamp < next.getTime();
      }).length;

      return {
        key: current.toISOString(),
        day: current.toLocaleDateString(locale, { weekday: "short" }),
        date: current.getDate(),
        active: count > 0,
        count,
      };
    });
  }, [appointmentDashboardAppointments, locale]);
  const appointmentMonthCells = useMemo(() => {
    const year = appointmentMonthDate.getFullYear();
    const month = appointmentMonthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const startDate = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 35 }, (_, index) => {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + index);
      const key = toLocalDateKey(current);
      const isCurrentMonth = current.getMonth() === month;
      const details = isCurrentMonth
        ? appointmentDashboardAppointments
            .filter((appointment) => appointment.start_at && toLocalDateKey(appointment.start_at) === key)
            .map((appointment) => ({
              id: appointment.id,
              source: appointment.source,
              property: appointment.property_title,
              assignee: appointment.assigned_staff_name || t("hub.unassigned"),
              time: appointment.start_at
                ? new Date(appointment.start_at).toLocaleTimeString(locale, {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : t("hub.unscheduled"),
            }))
        : [];
      const count = details.length;
      const isActive = isCurrentMonth && count > 0;
      return {
        key,
        day: current.getDate(),
        count,
        details,
        muted: !isCurrentMonth,
        active: isActive,
      };
    });
  }, [appointmentDashboardAppointments, appointmentMonthDate, locale, t]);
  const appointmentAssignments = useMemo(() => appointmentDashboard?.assignments ?? [], [appointmentDashboard]);
  const selectedStaffAssignment = useMemo(
    () => appointmentAssignments.find((staff) => staff.id === selectedAppointmentStaffId) ?? null,
    [appointmentAssignments, selectedAppointmentStaffId]
  );
  const selectedAppointment = useMemo(
    () => appointmentDashboardAppointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointmentDashboardAppointments, selectedAppointmentId]
  );
  const [appointmentReferenceNow, setAppointmentReferenceNow] = useState(0);

  useEffect(() => {
    if (!authToken || !selectedAppointment?.id || selectedAppointment.source !== "viewing_request" || !selectedAppointment.is_unread) {
      return;
    }

    setAppointmentDashboard((current) =>
      current
        ? {
            ...current,
            appointments: current.appointments.map((appointment) =>
              appointment.id === selectedAppointment.id ? { ...appointment, is_unread: false } : appointment
            ),
          }
        : current
    );

    void fetch("/api/vendor/viewing-requests/read", {
      method: "POST",
      headers: buildVendorHeaders(),
      body: JSON.stringify({ request_id: selectedAppointment.id }),
    })
      .then(() => {
        setAppointmentUnreadVersion((current) => current + 1);
      })
      .catch(() => undefined);
  }, [authToken, buildVendorHeaders, selectedAppointment]);

  useEffect(() => {
    setAppointmentReferenceNow(Date.now());
  }, [
    appointmentDashboardAppointments,
    selectedAppointmentStaffId,
    showPastStaffAppointments,
    appointmentMonthOffset,
  ]);

  const selectedStaffAppointments = useMemo(() => {
    if (!selectedAppointmentStaffId) return [];
    return appointmentDashboardAppointments
      .filter((appointment) => appointment.assigned_staff_id === selectedAppointmentStaffId)
      .filter((appointment) => {
        if (showPastStaffAppointments) return true;
        if (!appointment.start_at) return true;
        return new Date(appointment.start_at).getTime() >= appointmentReferenceNow;
      })
      .sort((left, right) => {
        const leftTime = left.start_at ? new Date(left.start_at).getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = right.start_at ? new Date(right.start_at).getTime() : Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      });
  }, [appointmentDashboardAppointments, appointmentReferenceNow, selectedAppointmentStaffId, showPastStaffAppointments]);
  const appointmentQueue = useMemo(
    () =>
      appointmentDashboardAppointments
        .filter((appointment) => {
          if (!appointment.start_at) return false;
          return new Date(appointment.start_at).getTime() >= appointmentReferenceNow;
        })
        .sort((left, right) => new Date(left.start_at ?? 0).getTime() - new Date(right.start_at ?? 0).getTime())
        .slice(0, 8)
        .map((appointment) => {
          const startAt = appointment.start_at ? new Date(appointment.start_at) : null;
          const referenceDate = new Date(appointmentReferenceNow);
          const isToday = startAt
            ? new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate()).getTime() ===
              new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()).getTime()
            : false;
          return {
            id: appointment.id,
            time: startAt
              ? startAt.toLocaleTimeString(locale, {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Unscheduled",
            dayLabel: startAt
              ? isToday
                ? t("hub.today")
                : startAt.toLocaleDateString(locale, { month: "short", day: "numeric" })
              : t("hub.tbd"),
            property: appointment.property_title,
            client: appointment.client_name,
            location: appointment.property_location,
            owner: appointment.assigned_staff_name || t("hub.unassigned"),
            status: labelize(appointment.status),
            rawStatus: appointment.status,
            assignedStaffId: appointment.assigned_staff_id,
            source: appointment.source,
            isUnread: Boolean(appointment.is_unread),
          };
        }),
    [appointmentDashboardAppointments, appointmentReferenceNow, locale, t]
  );
  const selectedPropertyAppointments = useMemo(() => {
    if (!selectedHubPropertyDetail) return [];
    return selectedHubPropertyDetail.appointments.map((appointment) => ({
      id: appointment.id,
      time: appointment.start_at
        ? new Date(appointment.start_at).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })
        : t("hub.unscheduled"),
      title: appointment.title || selectedHubPropertyDetail.property.title || t("hub.propertyViewing"),
      client: appointment.client_name || t("hub.buyer"),
      assignee: appointment.assigned_staff_name || t("hub.unassigned"),
      status: appointment.assigned_staff_id ? labelize(appointment.status) : t("hub.awaitingStaff"),
    }));
  }, [locale, selectedHubPropertyDetail, t]);
  const selectedPropertyStaff = useMemo(() => {
    if (!selectedHubPropertyDetail) return [];
    return selectedHubPropertyDetail.staff_summary;
  }, [selectedHubPropertyDetail]);
  const appointmentEditorStatusOptions = useMemo(
    () =>
      appointmentComposerMode === "edit" && selectedAppointment?.source === "viewing_request"
        ? [
            { value: "new", label: t("hub.status.new") },
            { value: "assigned", label: t("hub.status.assigned") },
            { value: "contacted", label: t("hub.status.contacted") },
            { value: "qualified", label: t("hub.status.qualified") },
            { value: "appointment_scheduled", label: t("hub.status.appointmentScheduled") },
            { value: "viewed", label: t("hub.status.viewed") },
            { value: "negotiation", label: t("hub.status.negotiation") },
            { value: "closed_won", label: t("hub.status.closedWon") },
            { value: "closed_lost", label: t("hub.status.closedLost") },
            { value: "unresponsive", label: t("hub.status.unresponsive") },
            { value: "spam", label: t("hub.status.spam") },
          ]
        : [
            { value: "requested", label: t("hub.status.requested") },
            { value: "confirmed", label: t("hub.status.confirmed") },
            { value: "completed", label: t("hub.status.completed") },
            { value: "cancelled", label: t("hub.status.cancelled") },
            { value: "no_show", label: t("hub.status.noShow") },
          ],
    [appointmentComposerMode, selectedAppointment?.source, t]
  );
  const appointmentEditorTimeOptions = useMemo(
    () => [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
    ],
    []
  );
  const appointmentEditorMeta = useMemo(
    () =>
      selectedAppointment
        ? {
            propertyTitle: selectedAppointment.property_title || t("hub.appointment"),
            propertyLocation: selectedAppointment.property_location || t("hub.unspecified"),
            startAt: selectedAppointment.start_at,
            clientName: selectedAppointment.client_name || t("hub.buyer"),
          }
        : null,
    [selectedAppointment, t]
  );

  useEffect(() => {
    if (appointmentPopupDay === null) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (appointmentMonthPopupRef.current?.contains(target ?? null)) return;
      setAppointmentPopupDay(null);
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [appointmentPopupDay]);

  useEffect(() => {
    setHubRailMobileOpen(false);
  }, [hubSection]);

  useEffect(() => {
    if (!selectedAppointment) {
      if (appointmentComposerMode !== "create") {
        setAppointmentEditorStatus("");
        setAppointmentEditorAssignee("");
        setAppointmentEditorPropertyId("");
        setAppointmentEditorTitle("");
        setAppointmentEditorStartAt("");
        setAppointmentEditorClientName("");
        setAppointmentEditorClientPhone("");
        setAppointmentEditorNotes("");
      }
      setAppointmentEditorError(null);
      setAppointmentEditorSaving(false);
      return;
    }
    setAppointmentEditorStatus(selectedAppointment.status || (selectedAppointment.source === "viewing_request" ? "new" : "requested"));
    setAppointmentEditorAssignee(selectedAppointment.assigned_staff_id || "");
    setAppointmentEditorPropertyId(selectedAppointment.property_id || "");
    setAppointmentEditorTitle(selectedAppointment.title || "");
    setAppointmentEditorStartAt(
      selectedAppointment.start_at ? new Date(selectedAppointment.start_at).toISOString().slice(0, 16) : ""
    );
    setAppointmentEditorClientName(selectedAppointment.client_name || "");
    setAppointmentEditorClientPhone(selectedAppointment.client_phone || "");
    setAppointmentEditorNotes(selectedAppointment.notes || "");
    setAppointmentEditorError(null);
  }, [appointmentComposerMode, selectedAppointment]);

  // Storefront completeness enforcement is handled in VendorShell.
  // `/hub` now shows an agency-selection/setup popup instead of redirecting immediately.

  if (!user && (loading || !profileReady)) {
    return (
      <div>
        <AccountHeader isVendor={false} />
        <PageShell>
          <Muted>{t("account.loading")}</Muted>
        </PageShell>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <AccountHeader isVendor={false} />
        <PageShell>
          <Muted>{t("account.loading")}</Muted>
        </PageShell>
      </div>
    );
  }

  const showVendorShellSkeleton =
    Boolean(user) &&
    isHubPath &&
    (profileRole === "vendor_user" || onboardingPending) &&
    vendorWorkspaceLoading &&
    !vendorWorkspace;

  return (
    <div>
      <AccountHeader isVendor={isHubPath} />
      <PageShell>
        {showVendorShellSkeleton ? (
          <VendorGrid>
            <VendorCard>
              <VendorSkeleton>
                <VendorSkeletonHeader>
                  <SkeletonBlock $height={56} $radius={18} style={{ width: 56, flex: "0 0 56px" }} />
                  <div style={{ display: "grid", gap: 10, flex: 1 }}>
                    <SkeletonBlock $height={24} style={{ width: "42%" }} />
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <SkeletonBlock $height={30} $radius={999} style={{ width: 72 }} />
                      <SkeletonBlock $height={30} $radius={999} style={{ width: 84 }} />
                    </div>
                  </div>
                </VendorSkeletonHeader>
                <VendorSkeletonStats>
                  <SkeletonBlock $height={92} $radius={18} />
                  <SkeletonBlock $height={92} $radius={18} />
                  <SkeletonBlock $height={92} $radius={18} />
                </VendorSkeletonStats>
                <SkeletonBlock $height={82} $radius={18} />
                <VendorSkeletonActions>
                  <SkeletonBlock $height={94} $radius={18} />
                  <SkeletonBlock $height={94} $radius={18} />
                </VendorSkeletonActions>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <SkeletonBlock $height={40} $radius={999} style={{ width: 132 }} />
                  <SkeletonBlock $height={40} $radius={999} style={{ width: 126 }} />
                </div>
              </VendorSkeleton>
            </VendorCard>
            <VendorCard>
              <VendorSkeleton>
                <SkeletonBlock $height={24} style={{ width: "38%" }} />
                <SkeletonBlock $height={96} $radius={18} />
                <SkeletonBlock $height={96} $radius={18} />
                <SkeletonBlock $height={96} $radius={18} />
              </VendorSkeleton>
            </VendorCard>
          </VendorGrid>
        ) : null}
        {!showVendorShellSkeleton &&
          user &&
          isHubPath &&
          (profileRole === "vendor_user" || onboardingPending || Boolean(vendorWorkspace?.vendor.id)) && (
          <>
            <HubPage
              closeMenuLabel={t("vendorShell.closeMenu")}
              openMenuLabel={t("vendorShell.openMenu")}
              mobileMeta={currentHubMobileMeta}
              hubRailExpanded={hubRailExpanded}
              hubRailMobileOpen={hubRailMobileOpen}
              setHubRailExpanded={setHubRailExpanded}
              setHubRailMobileOpen={setHubRailMobileOpen}
              navigation={
                <HubNavList>
                  {workspaceOptions.length > 0 && !canAccessHubSnapshot ? (
                    <HubNavButton
                      $active={workspaceMenuOpen}
                      $expanded={hubRailExpanded}
                      type="button"
                      aria-label={t("hub.openWorkspaceSwitcher")}
                      aria-expanded={workspaceMenuOpen}
                      onClick={() => {
                        setWorkspaceMenuOpen(true);
                        setHubRailMobileOpen(false);
                      }}
                    >
                      <HubNavIcon $active={workspaceMenuOpen} $image={currentWorkspaceOption?.vendor.logo_url || undefined}>
                        {!currentWorkspaceOption?.vendor.logo_url ? <Building2 /> : null}
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitleRow>
                          <HubNavTitle $active={workspaceMenuOpen}>{t("header.agencyWorkspace")}</HubNavTitle>
                        </HubNavTitleRow>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  ) : null}
                  {canAccessHubSnapshot ? (
                    <HubNavButton
                      $active={hubSection === "snapshot"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => updateHubSection("snapshot")}
                    >
                      <HubNavIcon $active={hubSection === "snapshot"} $image={vendorWorkspace?.vendor.logo_url || undefined}>
                        {!vendorWorkspace?.vendor.logo_url ? <Home /> : null}
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle $active={hubSection === "snapshot"}>{t("header.hub")}</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  ) : null}

                  {isFreeAgencyPlan && canManageListingOperations ? (
                    <HubNavItem $expanded={hubRailExpanded} href="/request-sale" onClick={() => setHubRailMobileOpen(false)}>
                      <HubNavIcon>
                        <Plus />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>{t("hub.manageListings")}</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavItem>
                  ) : (
                    <HubNavButton
                      $active={hubSection === "manage-listings" || hubSection === "listing-detail" || hubSection === "bulk-upload"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => updateHubSection("manage-listings")}
                    >
                      <HubNavIcon $active={hubSection === "manage-listings" || hubSection === "listing-detail" || hubSection === "bulk-upload"}>
                        <Plus />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle $active={hubSection === "manage-listings" || hubSection === "listing-detail" || hubSection === "bulk-upload"}>
                          {t("hub.manageListings")}
                        </HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  )}

                  {isFreeAgencyPlan ? (
                    <HubNavItem $expanded={hubRailExpanded} href={freeUpgradeHref} $disabled onClick={() => setHubRailMobileOpen(false)}>
                      <HubNavIcon>
                        <Calendar />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>{t("hub.appointments")}</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavItem>
                  ) : (
                    <HubNavButton
                      $active={hubSection === "appointments"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => updateHubSection("appointments")}
                    >
                      <HubNavIcon $active={hubSection === "appointments"}>
                        <Calendar />
                        {appointmentUnreadCount > 0 ? <HubNavIconBadge>{appointmentUnreadCount > 99 ? "99+" : appointmentUnreadCount}</HubNavIconBadge> : null}
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitleRow>
                          <HubNavTitle $active={hubSection === "appointments"}>{t("hub.appointments")}</HubNavTitle>
                        </HubNavTitleRow>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  )}

                  {canAccessBoostings ? (
                    <HubNavButton
                      $active={hubSection === "boostings"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => updateHubSection("boostings")}
                    >
                      <HubNavIcon $active={hubSection === "boostings"}>
                        <Megaphone />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle $active={hubSection === "boostings"}>{t("hub.boostings")}</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  ) : null}

                  {canAccessAnalytics ? (
                    <HubNavButton
                      $active={hubSection === "analytics"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => updateHubSection("analytics")}
                    >
                      <HubNavIcon $active={hubSection === "analytics"}>
                        <BarChart3 />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle $active={hubSection === "analytics"}>{t("hub.analytics")}</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  ) : null}

                  {canAccessLeadInbox ? (
                    <HubNavButton
                      $active={hubSection === "lead-inbox"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => updateHubSection("lead-inbox")}
                    >
                      <HubNavIcon $active={hubSection === "lead-inbox"}>
                        <MessageSquareText />
                        {leadInboxUnreadCount > 0 ? <HubNavIconBadge>{leadInboxUnreadCount > 99 ? "99+" : leadInboxUnreadCount}</HubNavIconBadge> : null}
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitleRow>
                          <HubNavTitle $active={hubSection === "lead-inbox"}>{t("hub.leadInbox")}</HubNavTitle>
                        </HubNavTitleRow>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  ) : null}

                  {canAccessSettings ? (
                    <HubNavButton
                      $active={hubSection === "settings"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => updateHubSection("settings")}
                    >
                      <HubNavIcon $active={hubSection === "settings"}>
                        <Settings />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle $active={hubSection === "settings"}>{t("hub.organizationSettings")}</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  ) : null}

                  {isFreeAgencyPlan ? (
                    <HubNavItem $expanded={hubRailExpanded} href={freeUpgradeHref} $disabled onClick={() => setHubRailMobileOpen(false)}>
                      <HubNavIcon>
                        <Users2 />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>{t("vendor.team.title")}</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavItem>
                  ) : canManageTeam ? (
                    <HubNavButton
                      $active={hubSection === "team"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => updateHubSection("team")}
                    >
                      <HubNavIcon $active={hubSection === "team"}>
                        <Users2 />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle $active={hubSection === "team"}>{t("vendor.team.title")}</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  ) : null}

                  {vendorWorkspace?.vendor.public_storefront_enabled && vendorWorkspace?.vendor.slug ? (
                    <HubNavItem $expanded={hubRailExpanded} href={`/agency/${vendorWorkspace.vendor.slug}`} onClick={() => setHubRailMobileOpen(false)}>
                      <HubNavIcon>
                        <Globe2 />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>{t("hub.viewPublicProfile")}</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavItem>
                  ) : null}

                  <HubNavButton
                    $expanded={hubRailExpanded}
                    type="button"
                    onClick={async () => {
                      setHubRailMobileOpen(false);
                      await logout();
                      router.push("/");
                    }}
                  >
                    <HubNavIcon>
                      <X />
                    </HubNavIcon>
                    <HubNavBody $expanded={hubRailExpanded}>
                      <HubNavTitle>{t("hub.signOut")}</HubNavTitle>
                    </HubNavBody>
                    <HubNavArrow $expanded={hubRailExpanded}>
                      <ArrowUpRight size={18} />
                    </HubNavArrow>
                  </HubNavButton>
                </HubNavList>
              }
            >
            {(canAccessHubSnapshot && (isFreeAgencyPlan || hubSection === "snapshot")) ? (
              <VendorCard>
                <StarterHeader>
                  <StarterTopRow>
                    <VendorHero>
                      <VendorIdentity>
                        <>
                          <VendorLogoBadge $image={currentWorkspaceOption?.vendor.logo_url || vendorWorkspace?.vendor.logo_url || undefined}>
                            {!currentWorkspaceOption?.vendor.logo_url && !vendorWorkspace?.vendor.logo_url ? <Building2 size={22} /> : null}
                          </VendorLogoBadge>
                          <VendorHero>
                            <VendorTitle>{currentWorkspaceOption?.vendor.name || vendorWorkspace?.vendor.name || t("hub.agencyAccount")}</VendorTitle>
                            {workspaceOptions.length > 0 ? (
                              <WorkspaceSwitchButton type="button" onClick={() => setWorkspaceMenuOpen(true)}>
                                {t("hub.switchAgency")}
                                <ArrowUpRight size={16} />
                              </WorkspaceSwitchButton>
                            ) : null}
                          </VendorHero>
                        </>
                      </VendorIdentity>
                    </VendorHero>

                      <StarterSummary>
                      <StarterSummaryItem>
                        <StarterSummaryLabel>{t("hub.listings")}</StarterSummaryLabel>
                        <StarterSummaryValue>
                          {listingUsage} / {listingLimit}
                        </StarterSummaryValue>
                      </StarterSummaryItem>
                      <StarterSummaryItem>
                        <StarterSummaryLabel>{t("hub.seats")}</StarterSummaryLabel>
                        <StarterSummaryValue>
                          {agentUsage} / {agentLimit}
                        </StarterSummaryValue>
                      </StarterSummaryItem>
                      <StarterSummaryBadge $mobileOrder={3}>
                        {canAccessVerification ? (
                          <VendorPillLink
                            href={isFreeAgencyPlan ? freeUpgradeHref : "/hub?section=verification"}
                            $tone={vendorWorkspace?.vendor.verified_status === "approved" ? "success" : "warning"}
                          >
                            {vendorWorkspace?.vendor.verified_status === "approved" ? <BadgeCheck size={14} /> : <ShieldCheck size={14} />}
                            <DesktopLabel>
                              {vendorWorkspace?.vendor.verified_status === "approved" ? t("agency.verifiedStatus") : t("agency.unverifiedStatus")}
                            </DesktopLabel>
                            <MobileLabel>
                              {vendorWorkspace?.vendor.verified_status === "approved" ? t("agency.verifiedShort") : t("agency.unverifiedShort")}
                            </MobileLabel>
                          </VendorPillLink>
                        ) : (
                          <AppointmentPill $tone={vendorWorkspace?.vendor.verified_status === "approved" ? "success" : "warning"}>
                            {vendorWorkspace?.vendor.verified_status === "approved" ? <BadgeCheck size={14} /> : <ShieldCheck size={14} />}
                            <DesktopLabel>
                              {vendorWorkspace?.vendor.verified_status === "approved" ? t("agency.verifiedStatus") : t("agency.unverifiedStatus")}
                            </DesktopLabel>
                            <MobileLabel>
                              {vendorWorkspace?.vendor.verified_status === "approved" ? t("agency.verifiedShort") : t("agency.unverifiedShort")}
                            </MobileLabel>
                          </AppointmentPill>
                        )}
                      </StarterSummaryBadge>
                      <StarterSummaryBadge $mobileOrder={4}>
                        {canAccessBilling ? (
                          <VendorPillLink href={isFreeAgencyPlan ? freeUpgradeHref : "/hub/upgrade"} $tone="warning">
                            <Sparkles size={14} />
                            {vendorWorkspace?.limits?.currentPlan?.name || currentVendorPlan.name}
                          </VendorPillLink>
                        ) : (
                          <AppointmentPill $tone="warning">
                            <Sparkles size={14} />
                            {vendorWorkspace?.limits?.currentPlan?.name || currentVendorPlan.name}
                          </AppointmentPill>
                        )}
                      </StarterSummaryBadge>
                    </StarterSummary>
                  </StarterTopRow>
                </StarterHeader>

                {vendorWorkspaceError ? <Muted>{vendorWorkspaceError}</Muted> : null}
              </VendorCard>
            ) : null}
            <VendorCardFill>
              <HubFeatureCard>
                {!starterChecklistComplete ? (
                  <>
                    <HubFeatureHeader>
                      <HubFeatureTop>
                        <HubFeatureTitle>{t("hub.nextSteps")}</HubFeatureTitle>
                        <HubProgressPill>
                          {t("hub.completeCount", { done: starterChecklistDoneCount, total: hubChecklist.length })}
                        </HubProgressPill>
                      </HubFeatureTop>
                      <HubFeatureCopy>{t("hub.finishBasics")}</HubFeatureCopy>
                    </HubFeatureHeader>
                    <HubChecklist>
                      {hubChecklist.map((item) => (
                        <HubChecklistRow key={item.title} href={item.href} $done={item.done}>
                          <div style={{ color: item.done ? "#0f766e" : "var(--color-muted)" }}>
                            {item.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                          </div>
                          <HubChecklistText>
                            <HubChecklistTitle>{item.title}</HubChecklistTitle>
                            <HubChecklistHint>{item.hint}</HubChecklistHint>
                          </HubChecklistText>
                          <HubChecklistAction>{item.actionLabel}</HubChecklistAction>
                        </HubChecklistRow>
                      ))}
                    </HubChecklist>
                  </>
                ) : (
                  <>
                    {canAccessHubSnapshot && (isFreeAgencyPlan || hubSection === "snapshot") ? (
                      <HubFeatureHeader>
                        <HubFeatureTitle>
                          {isFreeAgencyPlan
                            ? t("hub.premiumWorkspacePreview")
                            : t("hub.workspaceSnapshot")}
                        </HubFeatureTitle>
                        {isFreeAgencyPlan ? (
                          <HubFeatureCopy>
                            {t("hub.upgradeUnlockPreview")}
                          </HubFeatureCopy>
                        ) : null}
                      </HubFeatureHeader>
                    ) : null}
                    {canAccessHubSnapshot && isFreeAgencyPlan && hubSection !== "analytics" ? (
                    <HubFeaturePreview>
                        <HubFeaturePreviewGrid>
                          <HubFeaturePreviewItem>
                            <HubFeaturePreviewTop>
                              <span>{t("hub.leadOverview")}</span>
                              <MessageSquareText />
                            </HubFeaturePreviewTop>
                            <HubFeaturePreviewValue>{t("hub.lockedUntilUpgrade")}</HubFeaturePreviewValue>
                          </HubFeaturePreviewItem>
                          <HubFeaturePreviewItem>
                            <HubFeaturePreviewTop>
                              <span>{t("hub.salesPerformance")}</span>
                              <BarChart3 />
                            </HubFeaturePreviewTop>
                            <HubFeaturePreviewValue>{t("hub.lockedUntilUpgrade")}</HubFeaturePreviewValue>
                          </HubFeaturePreviewItem>
                          <HubFeaturePreviewItem>
                            <HubFeaturePreviewTop>
                              <span>{t("hub.viewingDemand")}</span>
                              <Calendar />
                            </HubFeaturePreviewTop>
                            <HubFeaturePreviewValue>{t("hub.lockedUntilUpgrade")}</HubFeaturePreviewValue>
                          </HubFeaturePreviewItem>
                          <HubFeaturePreviewItem>
                            <HubFeaturePreviewTop>
                              <span>{t("hub.teamResponse")}</span>
                              <Users2 />
                            </HubFeaturePreviewTop>
                            <HubFeaturePreviewValue>{t("hub.lockedUntilUpgrade")}</HubFeaturePreviewValue>
                          </HubFeaturePreviewItem>
                        </HubFeaturePreviewGrid>
                        {canAccessBilling ? (
                          <HubFeatureUpsellCard href={freeUpgradeHref}>
                            <HubFeatureUpsellHeader>
                              <HubFeatureLock>
                                <Lock size={18} />
                              </HubFeatureLock>
                              <HubChecklistTitle>{t("hub.upgradeRevealInsights")}</HubChecklistTitle>
                            </HubFeatureUpsellHeader>
                            <HubChecklistHint>
                              {t("hub.upgradeRevealInsightsCopy")}
                            </HubChecklistHint>
                          </HubFeatureUpsellCard>
                        ) : (
                          <HubFeaturePreviewItem>
                            <HubFeaturePreviewTop>
                              <span>{t("hub.premiumInsights")}</span>
                              <Lock />
                            </HubFeaturePreviewTop>
                            <HubFeaturePreviewValue>{t("hub.ownerUpgradeRequired")}</HubFeaturePreviewValue>
                          </HubFeaturePreviewItem>
                        )}
                        </HubFeaturePreview>
                    ) : hubSection === "boostings" && canAccessBoostings ? (
                      <WorkspaceSectionViewport>
                        <WorkspaceSectionScroller>
                          <VendorPromotionsView
                            embedded
                            vendorId={activeVendorId ?? vendorWorkspace?.vendor.id ?? null}
                            verified={vendorWorkspace?.vendor.verified_status === "approved"}
                            verificationHref="/hub?section=verification"
                            initialListingId={searchParams.get("listingId")}
                          />
                        </WorkspaceSectionScroller>
                      </WorkspaceSectionViewport>
                    ) : hubSection === "analytics" && canAccessAnalytics ? (
                      <WorkspaceSectionViewport>
                        <WorkspaceSectionScroller>
                          <HubAnalyticsContent embedded />
                        </WorkspaceSectionScroller>
                      </WorkspaceSectionViewport>
                    ) : hubSection === "manage-listings" ? (
                      <>
                        <VendorPropertiesView
                          embedded
                          hideHeader
                          title={t("hub.manageListings")}
                          subtitle={t("hub.manageListingsSubtitle")}
                          vendorId={activeVendorId ?? vendorWorkspace?.vendor.id ?? null}
                          onSelectProperty={(property) => {
                            setSelectedHubProperty(property);
                            updateHubSection("listing-detail");
                          }}
                        />
                        {canManageListingOperations ? (
                          <HubSectionFooter>
                            <CompactGhostButton
                              type="button"
                              onClick={() => {
                                updateHubSection("bulk-upload");
                              }}
                            >
                              <Upload size={16} />
                              <span>{t("hub.bulkUpload")}</span>
                            </CompactGhostButton>
                            {canManageListingOperations ? (
                              <HubSectionAction href="/request-sale">
                                <Plus size={16} />
                                <span>{t("hub.addPropertyListing")}</span>
                              </HubSectionAction>
                            ) : null}
                          </HubSectionFooter>
                        ) : null}
                      </>
                    ) : hubSection === "bulk-upload" && canAccessBulkUpload ? (
                      <WorkspaceSectionViewport>
                        <WorkspaceSectionScroller>
                          <VendorImportView
                            embedded
                            vendorId={activeVendorId ?? vendorWorkspace?.vendor.id ?? null}
                            onBack={() => {
                              updateHubSection("manage-listings");
                            }}
                          />
                        </WorkspaceSectionScroller>
                      </WorkspaceSectionViewport>
                    ) : hubSection === "listing-detail" && selectedHubProperty ? (
                      <HubListingDetailView
                        t={t}
                        locale={locale}
                        language={language}
                        detail={selectedHubPropertyDetail}
                        loading={selectedHubPropertyLoading}
                        error={selectedHubPropertyError}
                        canCreateAppointments={canCreateAppointments}
                        canManageListingOperations={canManageListingOperations}
                        canShowPromoteAction={
                          canManagePromotions &&
                          vendorWorkspace?.vendor.verified_status === "approved" &&
                          normalizeListingStatus(selectedHubPropertyDetail?.property.status) === "active"
                        }
                        deleting={selectedHubPropertyDeleting}
                        statusSaving={selectedHubPropertyStatusSaving}
                        statusError={selectedHubPropertyStatusError}
                        statusNotice={selectedHubPropertyStatusNotice}
                        hasStatusOptions={availableListingStatusOptions.length > 0}
                        appointments={selectedPropertyAppointments}
                        staff={selectedPropertyStaff}
                        onBack={() => {
                          updateHubSection("manage-listings");
                        }}
                        onScheduleAppointment={() => openAppointmentCreator(selectedHubPropertyDetail?.property.id ?? selectedHubProperty.id)}
                        onOpenStatusModal={() => {
                          setListingStatusModalOpen(true);
                          setSelectedHubPropertyStatusError(null);
                          setSelectedHubPropertyStatusNotice(null);
                        }}
                        onEditListing={() => router.push(`/hub/${selectedHubPropertyDetail?.property.id}/edit`)}
                        onOpenDeleteModal={() => {
                          setListingDeleteModalOpen(true);
                          setSelectedHubPropertyStatusError(null);
                          setSelectedHubPropertyStatusNotice(null);
                        }}
                        onPromoteListing={() => updateHubSection("boostings", { listingId: selectedHubPropertyDetail?.property.id ?? null })}
                        onOpenAppointmentEditor={openAppointmentEditor}
                        getListingStatusTone={getListingStatusTone}
                        getListingStatusLabel={getListingStatusLabel}
                        getDealTypeLabel={getDealTypeLabel}
                        getCompactDealTypeLabel={getCompactDealTypeLabel}
                        translateLocationName={translateLocationName}
                        formatArea={formatArea}
                      />
                    ) : hubSection === "lead-inbox" && canAccessLeadInbox ? (
                      <LeadInboxViewport>
                        <LeadInboxScroller>
                          <VendorInquiriesView
                            embedded
                            hideHeader
                            title={t("hub.leadInbox")}
                            subtitle={t("hub.leadInboxSubtitle")}
                            vendorId={activeVendorId ?? vendorWorkspace?.vendor.id ?? null}
                          />
                        </LeadInboxScroller>
                      </LeadInboxViewport>
                    ) : hubSection === "appointments" && canAccessAppointments ? (
                      <HubAppointmentsView
                        t={t}
                        appointmentStats={appointmentStats}
                        appointmentCalendarView={appointmentCalendarView}
                        appointmentMonthLabel={appointmentMonthLabel}
                        appointmentWeekDays={appointmentWeekDays}
                        appointmentMonthCells={appointmentMonthCells}
                        appointmentPopupDay={appointmentPopupDay}
                        appointmentMonthPopupRef={appointmentMonthPopupRef}
                        appointmentAssignments={appointmentAssignments}
                        appointmentDashboardLoading={appointmentDashboardLoading}
                        appointmentDashboardError={appointmentDashboardError}
                        hasAppointmentDashboard={Boolean(appointmentDashboard)}
                        appointmentQueue={appointmentQueue}
                        canManageTeam={canManageTeam}
                        canCreateAppointments={canCreateAppointments}
                        formatRoleLabel={labelize}
                        onSetAppointmentMonthOffset={(delta) => {
                          setAppointmentPopupDay(null);
                          setAppointmentMonthOffset((current) => current + delta);
                        }}
                        onSetAppointmentPopupDay={setAppointmentPopupDay}
                        onSetAppointmentCalendarView={setAppointmentCalendarView}
                        onSelectAssignment={(staffId) => {
                          setSelectedAppointmentStaffId(staffId);
                        }}
                        onCreateAppointment={() => openAppointmentCreator()}
                        onOpenAppointmentEditor={openAppointmentEditor}
                        onResetAssignmentHistory={() => {
                          setShowPastStaffAppointments(false);
                        }}
                      />
                    ) : hubSection === "settings" && canAccessSettings ? (
                      <WorkspaceSectionViewport>
                        <WorkspaceSectionScroller>
                          <WorkspaceSectionHeader>
                            <WorkspaceSectionTitleWrap>
                              <WorkspaceSectionTitle>{t("vendor.settings.title")}</WorkspaceSectionTitle>
                              <WorkspaceSectionCopy>{t("hub.coreWorkspaceControls")}</WorkspaceSectionCopy>
                            </WorkspaceSectionTitleWrap>
                          </WorkspaceSectionHeader>
                          <SettingsIndexGrid>
                            <SettingsIndexCard>
                              <SettingsIndexHeader>
                                <SettingsIndexTitleWrap>
                                  <SettingsIndexTitle>{t("hub.workspace")}</SettingsIndexTitle>
                                  <SettingsIndexCopy>{t("hub.planSeatsStatus")}</SettingsIndexCopy>
                                </SettingsIndexTitleWrap>
                                <AppointmentPill>
                                  <Users2 size={14} />
                                  {t("hub.seatsUsed", { count: activeTeamCount, limit: agentLimit })}
                                </AppointmentPill>
                              </SettingsIndexHeader>
                              <SettingsIndexRows>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Building2 size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("agency.label")}</SettingsIndexLabel>
                                  <SettingsIndexValue>{vendorWorkspace?.vendor.name || t("hub.agencyAccount")}</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Sparkles size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("vendor.plan.currentPlan")}</SettingsIndexLabel>
                                  <SettingsIndexValue>{vendorWorkspace?.limits?.currentPlan?.name || currentVendorPlan.name}</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><ShieldCheck size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("agency.verification")}</SettingsIndexLabel>
                                  <SettingsIndexValue>{labelize(vendorWorkspace?.vendor.verified_status || "not_requested")}</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Users2 size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("hub.control")}</SettingsIndexLabel>
                                  <SettingsIndexValue>{canManageTeam ? t("hub.ownerAdmin") : t("hub.viewOnly")}</SettingsIndexValue>
                                </SettingsIndexRow>
                              </SettingsIndexRows>
                              <SettingsIndexActions>
                                <GhostButton type="button" onClick={() => updateHubSection("team")}>
                                  {t("vendor.team.title")}
                                </GhostButton>
                                {canAccessBilling && suggestedUpgrade ? (
                                  <GhostButton type="button" onClick={() => router.push("/hub/upgrade")}>
                                    {t("analytics.upgradePlan")}
                                  </GhostButton>
                                ) : null}
                              </SettingsIndexActions>
                            </SettingsIndexCard>

                            <SettingsIndexCard>
                              <SettingsIndexHeader>
                                <SettingsIndexTitleWrap>
                                  <SettingsIndexTitle>{t("vendor.settings.storefront")}</SettingsIndexTitle>
                                  <SettingsIndexCopy>{t("hub.visibilityBrandingContact")}</SettingsIndexCopy>
                                </SettingsIndexTitleWrap>
                                <AppointmentPill $tone={vendorWorkspace?.vendor.public_storefront_enabled ? "success" : "warning"}>
                                  <Globe2 size={14} />
                                  {vendorWorkspace?.vendor.public_storefront_enabled ? t("hub.live") : t("hub.hidden")}
                                </AppointmentPill>
                              </SettingsIndexHeader>
                              <SettingsIndexRows>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Globe2 size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("vendor.settings.slug")}</SettingsIndexLabel>
                                  <SettingsIndexValue>
                                    {vendorWorkspace?.vendor.slug ? `/agency/${vendorWorkspace.vendor.slug}` : t("hub.notSetYet")}
                                  </SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><ImageIcon size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("hub.branding")}</SettingsIndexLabel>
                                  <SettingsIndexValue>
                                    {hasAgencyLogo ? t("hub.logoReady") : t("hub.logoMissing")} • {vendorWorkspace?.vendor.cover_image_url ? t("hub.coverReady") : t("hub.coverMissing")}
                                  </SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Phone size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("hub.contact")}</SettingsIndexLabel>
                                  <SettingsIndexValue>
                                    {vendorWorkspace?.vendor.contact_phone?.trim() || vendorWorkspace?.vendor.contact_email?.trim() || t("hub.notAddedYet")}
                                  </SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><MessageSquareText size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("vendor.settings.channels")}</SettingsIndexLabel>
                                  <SettingsIndexValue>{t("hub.activeCount", { count: storefrontChannels })}</SettingsIndexValue>
                                </SettingsIndexRow>
                              </SettingsIndexRows>
                              <SettingsIndexActions>
                                <CTAButton type="button" onClick={() => router.push("/hub/settings")}>
                                  {t("hub.edit")}
                                </CTAButton>
                                {vendorWorkspace?.vendor.public_storefront_enabled && vendorWorkspace?.vendor.slug ? (
                                  <GhostButton type="button" onClick={() => router.push(`/agency/${vendorWorkspace.vendor.slug}`)}>
                                    {t("account.view")}
                                  </GhostButton>
                                ) : null}
                              </SettingsIndexActions>
                            </SettingsIndexCard>

                            <SettingsIndexCard>
                              <SettingsIndexHeader>
                                <SettingsIndexTitleWrap>
                                  <SettingsIndexTitle>{t("hub.permissions")}</SettingsIndexTitle>
                                  <SettingsIndexCopy>{t("hub.roleAccess")}</SettingsIndexCopy>
                                </SettingsIndexTitleWrap>
                              </SettingsIndexHeader>
                              <SettingsIndexBullets>
                                <SettingsIndexBullet>
                                  <CheckCircle2 size={16} />
                                  <span><strong style={{ color: "var(--color-text)" }}>{t("role.owner")}:</strong> {t("hub.ownerFullControl")}</span>
                                </SettingsIndexBullet>
                                <SettingsIndexBullet>
                                  <CheckCircle2 size={16} />
                                  <span><strong style={{ color: "var(--color-text)" }}>{t("role.admin")}:</strong> {t("hub.adminPermissions")}</span>
                                </SettingsIndexBullet>
                                <SettingsIndexBullet>
                                  <Circle size={16} />
                                  <span><strong style={{ color: "var(--color-text)" }}>{t("vendor.team.agent")}:</strong> {t("hub.agentPermissions")}</span>
                                </SettingsIndexBullet>
                              </SettingsIndexBullets>
                              <SettingsIndexActions>
                                <GhostButton type="button" onClick={() => updateHubSection("team")}>
                                  {t("vendor.team.title")}
                                </GhostButton>
                              </SettingsIndexActions>
                            </SettingsIndexCard>

                            <SettingsIndexCard>
                              <SettingsIndexHeader>
                                <SettingsIndexTitleWrap>
                                  <SettingsIndexTitle>{t("hub.operations")}</SettingsIndexTitle>
                                  <SettingsIndexCopy>{t("hub.workflowDefaults")}</SettingsIndexCopy>
                                </SettingsIndexTitleWrap>
                              </SettingsIndexHeader>
                              <SettingsIndexRows>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Phone size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("hub.listingContact")}</SettingsIndexLabel>
                                  <SettingsIndexValue>{t("hub.agencyProfile")}</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Calendar size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("hub.assignments")}</SettingsIndexLabel>
                                  <SettingsIndexValue>{t("hub.manual")}</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Settings size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("hub.editor")}</SettingsIndexLabel>
                                  <SettingsIndexValue>{t("hub.storefrontEditor")}</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Users2 size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />{t("hub.teamSource")}</SettingsIndexLabel>
                                  <SettingsIndexValue>{t("hub.vendorMembers")}</SettingsIndexValue>
                                </SettingsIndexRow>
                              </SettingsIndexRows>
                              <SettingsIndexActions>
                                <GhostButton type="button" onClick={() => router.push("/hub/settings")}>
                                  {t("hub.configure")}
                                </GhostButton>
                              </SettingsIndexActions>
                            </SettingsIndexCard>
                          </SettingsIndexGrid>
                        </WorkspaceSectionScroller>
                      </WorkspaceSectionViewport>
                    ) : hubSection === "verification" && canAccessVerification ? (
                      <WorkspaceSectionViewport>
                        <WorkspaceSectionScroller>
                          <VendorVerificationView />
                        </WorkspaceSectionScroller>
                      </WorkspaceSectionViewport>
                    ) : hubSection === "team" && canManageTeam ? (
                      <WorkspaceSectionViewport>
                        <WorkspaceSectionScroller>
                          <DesktopOnlyBlock>
                            <WorkspaceSectionHeader>
                              <WorkspaceSectionTitleWrap>
                                <WorkspaceSectionTitle>{t("vendor.team.title")}</WorkspaceSectionTitle>
                                <WorkspaceSectionCopy>
                                  <DesktopOnly>{t("hub.teamSectionCopy")}</DesktopOnly>
                                  <MobileCompactCopy>Manage seats and roles.</MobileCompactCopy>
                                </WorkspaceSectionCopy>
                              </WorkspaceSectionTitleWrap>
                              <AppointmentPill>
                                <Users2 size={14} />
                                {t("hub.activeSeatsCount", { count: activeTeamCount, limit: agentLimit })}
                              </AppointmentPill>
                            </WorkspaceSectionHeader>
                          </DesktopOnlyBlock>
                          {teamError ? <HubFeatureCopy>{teamError}</HubFeatureCopy> : null}
                          <TeamSectionStack>
                            <TeamSummaryBar>
                              <TeamSummaryItem>
                                <TeamSummaryItemLabel>{t("hub.activeSeats")}</TeamSummaryItemLabel>
                                <TeamSummaryItemValue>
                                  {activeTeamCount} / {agentLimit}
                                </TeamSummaryItemValue>
                              </TeamSummaryItem>
                              <TeamSummaryItem>
                                <TeamSummaryItemLabel>{t("hub.roleMix")}</TeamSummaryItemLabel>
                                <TeamSummaryItemValue>
                                  {t("hub.roleMixValue", { owner: ownerCount, admin: adminCount, agent: agentCount })}
                                </TeamSummaryItemValue>
                              </TeamSummaryItem>
                              <DesktopOnlyBlock>
                                <TeamSummaryItem>
                                  <TeamSummaryItemLabel>{t("vendor.plan.currentPlan")}</TeamSummaryItemLabel>
                                  <TeamSummaryItemValue>{vendorWorkspace?.limits?.currentPlan?.name || currentVendorPlan.name}</TeamSummaryItemValue>
                                </TeamSummaryItem>
                              </DesktopOnlyBlock>
                            </TeamSummaryBar>
                            <TeamMobileActions>
                              <TeamMobileIconButton
                                type="button"
                                aria-label={t("vendor.team.addMember")}
                                onClick={() => setMobileTeamInviteOpen(true)}
                              >
                                <Plus size={17} />
                              </TeamMobileIconButton>
                              <TeamMobileIconButton
                                type="button"
                                aria-label={t("hub.pendingInvites")}
                                onClick={() => setMobilePendingInvitesOpen(true)}
                              >
                                <Mail size={16} />
                                {teamInvites.length ? <TeamMobileCount>{teamInvites.length}</TeamMobileCount> : null}
                              </TeamMobileIconButton>
                            </TeamMobileActions>
                            <DesktopOnlyBlock>
                              <WorkspacePanel>
                                <WorkspacePanelTitle>{t("vendor.team.addMember")}</WorkspacePanelTitle>
                                <WorkspacePanelCopy>
                                  <DesktopOnly>
                                    {canInviteAdminSeats
                                      ? t("hub.teamInviteOwnerCopy")
                                      : t("vendor.team.inviteCopyAdmin")}
                                  </DesktopOnly>
                                  <MobileCompactCopy>Invite a new team member.</MobileCompactCopy>
                                </WorkspacePanelCopy>
                                {canManageTeam ? (
                                  <TeamInviteGrid>
                                    <CompactTextInput
                                      type="email"
                                      value={teamInviteEmail}
                                      onChange={(event) => setTeamInviteEmail(event.target.value)}
                                      placeholder="member@example.com"
                                    />
                                    <CompactSelectWrap>
                                      <CustomSelect
                                        id="hub-team-role"
                                        name="hub-team-role"
                                        label={t("vendor.verification.role")}
                                        hideLabel
                                        value={teamInviteRole}
                                        onChange={setTeamInviteRole}
                                      >
                                        <option value="agent">{t("vendor.team.agent")}</option>
                                        {canInviteAdminSeats ? <option value="admin">{t("role.admin")}</option> : null}
                                        {canInviteAdminSeats ? <option value="owner">{t("role.owner")}</option> : null}
                                      </CustomSelect>
                                    </CompactSelectWrap>
                                    <CompactCTAButton
                                      type="button"
                                      onClick={() => void handleTeamInvite()}
                                      disabled={teamSavingInvite || !teamInviteEmail.trim()}
                                    >
                                      {teamSavingInvite ? t("vendor.team.sending") : t("vendor.team.sendInvite")}
                                    </CompactCTAButton>
                                  </TeamInviteGrid>
                                ) : (
                                  <WorkspaceSummaryHint>{t("hub.teamControlsLimited")}</WorkspaceSummaryHint>
                                )}
                              </WorkspacePanel>
                              <WorkspacePanel>
                                <WorkspacePanelTitle>{t("hub.pendingInvites")}</WorkspacePanelTitle>
                                <WorkspacePanelCopy>
                                  <DesktopOnly>{t("hub.pendingInvitesCopy")}</DesktopOnly>
                                  <MobileCompactCopy>Waiting for acceptance.</MobileCompactCopy>
                                </WorkspacePanelCopy>
                                <TeamMembersList>
                                  {teamInvites.length ? (
                                    teamInvites.map((invite) => (
                                      <TeamMemberCard key={invite.id}>
                                        <TeamMemberTop>
                                          <div style={{ display: "grid", gap: 4 }}>
                                            <TeamMemberName>{invite.email}</TeamMemberName>
                                            <TeamMemberMeta>
                                              {invite.has_existing_account ? t("hub.existingAccount") : t("hub.newAccountOnAcceptance")}
                                            </TeamMemberMeta>
                                            {invite.expires_at ? (
                                              <TeamMemberMeta>{t("hub.expiresOn", { date: new Date(invite.expires_at).toLocaleDateString() })}</TeamMemberMeta>
                                            ) : null}
                                          </div>
                                          <TeamMemberPills>
                                            <AppointmentPill>{formatTeamRoleLabel(invite.role)}</AppointmentPill>
                                            <AppointmentPill $tone={invite.status === "accepted" ? "success" : "warning"}>
                                              {formatInviteStatusLabel(invite.status)}
                                            </AppointmentPill>
                                          </TeamMemberPills>
                                        </TeamMemberTop>
                                      </TeamMemberCard>
                                    ))
                                  ) : (
                                    <HubFeatureCopy>{t("hub.noPendingInvites")}</HubFeatureCopy>
                                  )}
                                </TeamMembersList>
                              </WorkspacePanel>
                            </DesktopOnlyBlock>
                            <WorkspacePanel>
                              <WorkspacePanelTitle>{t("vendor.team.currentMembers")}</WorkspacePanelTitle>
                              <WorkspacePanelCopy>
                                <DesktopOnly>{t("hub.currentMembersCopy")}</DesktopOnly>
                              </WorkspacePanelCopy>
                              <TeamMembersList>
                                {toastMessage && <ToastMessage $type={toastMessage.type}>{toastMessage.message}</ToastMessage>}
                                {teamLoading ? (
                                  <>
                                    <TeamMemberCard>
                                      <SkeletonBlock $height={18} style={{ width: "40%" }} />
                                      <SkeletonBlock $height={14} style={{ width: "52%" }} />
                                      <SkeletonBlock $height={14} style={{ width: "30%" }} />
                                    </TeamMemberCard>
                                    <TeamMemberCard>
                                      <SkeletonBlock $height={18} style={{ width: "36%" }} />
                                      <SkeletonBlock $height={14} style={{ width: "46%" }} />
                                      <SkeletonBlock $height={14} style={{ width: "28%" }} />
                                    </TeamMemberCard>
                                    <TeamMemberCard>
                                      <SkeletonBlock $height={18} style={{ width: "44%" }} />
                                      <SkeletonBlock $height={14} style={{ width: "42%" }} />
                                      <SkeletonBlock $height={14} style={{ width: "32%" }} />
                                    </TeamMemberCard>
                                  </>
                                ) : teamMembers.length ? (
                                  teamMembers.map((member) => (
                                    <TeamMemberCard key={member.user_id}>
                                      <TeamMemberTop>
                                        <div style={{ display: "grid", gap: 4 }}>
                                          <TeamMemberName>{member.full_name || member.email || t("vendor.team.unnamed")}</TeamMemberName>
                                          <TeamMemberMeta>{member.email || t("vendor.team.noEmail")}</TeamMemberMeta>
                                          {member.phone ? <TeamMemberMeta>{member.phone}</TeamMemberMeta> : null}
                                        </div>
                                        <TeamMemberPills>
                                          <AppointmentPill>{formatTeamRoleLabel(member.role)}</AppointmentPill>
                                          <AppointmentPill $tone={member.status === "active" ? "success" : "neutral"}>
                                            {formatTeamStatusLabel(member.status)}
                                          </AppointmentPill>
                                        </TeamMemberPills>
                                      </TeamMemberTop>
                                      {canManageTeamMember(member) ? (
                                        <MemberActionsButton
                                          id={`member-actions-button-${member.user_id}`}
                                          type="button"
                                          onClick={() => undefined}
                                          aria-label={t("hub.memberActions")}
                                        >
                                          <MoreVertical size={18} />
                                        </MemberActionsButton>
                                      ) : null}
                                    </TeamMemberCard>
                                  ))
                                ) : (
                                  <HubFeatureCopy>{t("vendor.team.noMembers")}</HubFeatureCopy>
                                )}
                              </TeamMembersList>
                            </WorkspacePanel>
                          </TeamSectionStack>
                        </WorkspaceSectionScroller>
                      </WorkspaceSectionViewport>
                    ) : vendorOverviewLoading && !vendorOverview ? (
                      <HubInsightGrid>
                        {Array.from({ length: 6 }, (_, index) => (
                          <HubInsightCard key={`hub-insight-skeleton-${index}`}>
                            <HubInsightCardTop>
                              <SkeletonBlock $height={30} $radius={999} style={{ width: 132 }} />
                            </HubInsightCardTop>
                            <HubInsightBody>
                              <HubInsightCardInner>
                                <SkeletonBlock $height={26} style={{ width: index % 2 === 0 ? "48%" : "66%" }} />
                                <SkeletonBlock $height={16} style={{ width: "72%" }} />
                                <SkeletonBlock $height={16} style={{ width: "58%" }} />
                              </HubInsightCardInner>
                            </HubInsightBody>
                          </HubInsightCard>
                        ))}
                      </HubInsightGrid>
                    ) : vendorOverviewError || !vendorOverview ? (
                      <HubFeatureCopy>{vendorOverviewError ?? t("hub.workspaceInsightsUnavailable")}</HubFeatureCopy>
                    ) : (
                      <HubInsightGrid>
                        <HubInsightCard>
                          <HubInsightCardTop>
                            <HubInsightCardTitle>
                              <BarChart3 />
                              {t("hub.portfolioValue")}
                            </HubInsightCardTitle>
                          </HubInsightCardTop>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightCardValueCentered>
                                {formatCurrency(summaryPortfolioValue, "MMK", "MMK 0", language)}
                              </HubInsightCardValueCentered>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>

                        <HubInsightCard>
                          <HubInsightCardTop>
                            <HubInsightCardTitle>
                              <Calendar />
                              {t("hub.nextAppointment")}
                            </HubInsightCardTitle>
                          </HubInsightCardTop>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightHero>
                                <HubInsightHeroValue>{summaryNextAppointmentTitle}</HubInsightHeroValue>
                                {summaryNextAppointmentAt ? (
                                  <HubInsightHeroLabel>{new Date(summaryNextAppointmentAt).toLocaleString(locale)}</HubInsightHeroLabel>
                                ) : (
                                  <HubInsightHeroLabel>{t("hub.noAppointmentScheduled")}</HubInsightHeroLabel>
                                )}
                              </HubInsightHero>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>

                        <HubInsightCard>
                          <HubInsightHeaderRow>
                            <HubInsightCardTop>
                              <HubInsightCardTitle>
                                <TagIcon />
                                {t("hub.listingsByType")}
                              </HubInsightCardTitle>
                            </HubInsightCardTop>
                            <HubInsightFooterLink href="/hub?section=analytics">
                              <DesktopLabel>{t("hub.viewFullAnalytics")}</DesktopLabel>
                              <MobileLabel>{t("hub.viewFull")}</MobileLabel> <ArrowUpRight size={14} />
                            </HubInsightFooterLink>
                          </HubInsightHeaderRow>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightPieWrap>
                                <HubInsightStack>
                                  <HubInsightPie
                                    $gradient={`conic-gradient(${listingTypesSummary
                                      .map((item, index, list) => {
                                        const total = Math.max(1, list.reduce((sum, current) => sum + current.count, 0));
                                        const start = (list
                                          .slice(0, index)
                                          .reduce((sum, current) => sum + current.count, 0) /
                                          total) *
                                          100;
                                        const end = ((list
                                          .slice(0, index + 1)
                                          .reduce((sum, current) => sum + current.count, 0) /
                                          total) *
                                          100);
                                        return `${HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]} ${start}% ${end}%`;
                                      })
                                      .join(", ")})`}
                                  >
                                    <HubInsightPieCenter>{workspaceSnapshotView.metrics.totalProperties}</HubInsightPieCenter>
                                  </HubInsightPie>
                                  <HubInsightLegend>
                                    {listingTypesSummary.map((item, index) => (
                                      <HubInsightLegendRow key={item.key || index}>
                                        <HubInsightLegendDot $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]} />
                                        <span>{labelize(item.key)}</span>
                                        <HubInsightMiniCount>{item.count}</HubInsightMiniCount>
                                      </HubInsightLegendRow>
                                    ))}
                                  </HubInsightLegend>
                                </HubInsightStack>
                                <HubInsightHero>
                                  <HubInsightHeroValue>{workspaceSnapshotView.metrics.totalProperties}</HubInsightHeroValue>
                                  <HubInsightHeroLabel>{t("hub.totalActivePropertyRecords")}</HubInsightHeroLabel>
                                </HubInsightHero>
                              </HubInsightPieWrap>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>

                        <HubInsightCard>
                          <HubInsightHeaderRow>
                            <HubInsightCardTop>
                              <HubInsightCardTitle>
                                <BadgeCheck />
                                {t("hub.salesByType")}
                              </HubInsightCardTitle>
                            </HubInsightCardTop>
                            <HubInsightFooterLink href="/hub?section=analytics">
                              <DesktopLabel>{t("hub.viewFullAnalytics")}</DesktopLabel>
                              <MobileLabel>{t("hub.viewFull")}</MobileLabel> <ArrowUpRight size={14} />
                            </HubInsightFooterLink>
                          </HubInsightHeaderRow>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightHero>
                                <HubInsightHeroValue>
                                  {workspaceSnapshotView.metrics.soldProperties + workspaceSnapshotView.metrics.rentedProperties}
                                </HubInsightHeroValue>
                                <HubInsightHeroLabel>{t("hub.closedSaleOrRentOutcomes")}</HubInsightHeroLabel>
                              </HubInsightHero>
                              <HubInsightBarList>
                                {salesByTypeSummary.map((item, index, list) => {
                                  const max = Math.max(1, ...list.map((current) => current.count));
                                  const label = "label" in item && item.label ? item.label : labelize("key" in item ? item.key : undefined);
                                  return (
                                    <HubInsightBarRow key={item.key || label || index}>
                                      <HubInsightBarTrack>
                                        <HubInsightBarFill
                                          $width={(item.count / max) * 100}
                                          $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]}
                                        >
                                          <span>{label}</span>
                                          <span>{item.count}</span>
                                        </HubInsightBarFill>
                                      </HubInsightBarTrack>
                                    </HubInsightBarRow>
                                  );
                                })}
                              </HubInsightBarList>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>

                        <HubInsightCard>
                          <HubInsightHeaderRow>
                            <HubInsightCardTop>
                              <HubInsightCardTitle>
                                <BarChart3 />
                                {t("hub.priceRangeByType")}
                              </HubInsightCardTitle>
                            </HubInsightCardTop>
                            <HubInsightFooterLink href="/hub?section=analytics">
                              <DesktopLabel>{t("hub.viewFullAnalytics")}</DesktopLabel>
                              <MobileLabel>{t("hub.viewFull")}</MobileLabel> <ArrowUpRight size={14} />
                            </HubInsightFooterLink>
                          </HubInsightHeaderRow>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightRangeList>
                                {priceRangesSummary.map((item, index, list) => {
                                  if (!("min" in item) || !("max" in item) || !("currency" in item)) return null;
                                  const allMin = Math.min(...list.map((current) => current.min));
                                  const allMax = Math.max(...list.map((current) => current.max));
                                  const spread = Math.max(1, allMax - allMin);
                                  const left = ((item.min - allMin) / spread) * 100;
                                  const width = Math.max(8, ((item.max - item.min) / spread) * 100);
                                  return (
                                    <HubInsightRangeRow key={item.key}>
                                      <HubInsightRangeMeta>
                                        <span>{labelize(item.key)}</span>
                                        <HubInsightRangeValue>
                                          {formatCurrency(item.min, item.currency, "MMK 0", language)} -{" "}
                                          {formatCurrency(item.max, item.currency, "MMK 0", language)}
                                        </HubInsightRangeValue>
                                      </HubInsightRangeMeta>
                                      <HubInsightRangeTrack>
                                        <HubInsightRangeFill
                                          $left={left}
                                          $width={Math.min(100 - left, width)}
                                          $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]}
                                        />
                                      </HubInsightRangeTrack>
                                    </HubInsightRangeRow>
                                  );
                                })}
                              </HubInsightRangeList>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>

                        <HubInsightCard>
                          <HubInsightHeaderRow>
                            <HubInsightCardTop>
                              <HubInsightCardTitle>
                                <Clock />
                                {t("hub.appointmentsByType")}
                              </HubInsightCardTitle>
                            </HubInsightCardTop>
                            <HubInsightFooterLink href="/hub?section=analytics">
                              <DesktopLabel>{t("hub.viewFullAnalytics")}</DesktopLabel>
                              <MobileLabel>{t("hub.viewFull")}</MobileLabel> <ArrowUpRight size={14} />
                            </HubInsightFooterLink>
                          </HubInsightHeaderRow>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightHero>
                                <HubInsightHeroValue>{workspaceSnapshotView.metrics.appointmentsCount}</HubInsightHeroValue>
                                <HubInsightHeroLabel>{t("hub.scheduledViewingAppointments")}</HubInsightHeroLabel>
                              </HubInsightHero>
                              <HubInsightColumnWrap>
                                {appointmentsByTypeSummary.map((item, index, list) => {
                                  const max = Math.max(1, ...list.map((current) => current.count));
                                  return (
                                    <HubInsightColumn key={item.key || ("label" in item ? item.label : undefined) || index}>
                                      <HubInsightColumnBar
                                        $height={Math.max(18, (item.count / max) * 72)}
                                        $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]}
                                      />
                                      <HubInsightColumnLabel>
                                        {"label" in item && item.label ? item.label : labelize("key" in item ? item.key : undefined)}
                                      </HubInsightColumnLabel>
                                      <HubInsightMiniCount>{item.count}</HubInsightMiniCount>
                                    </HubInsightColumn>
                                  );
                                })}
                              </HubInsightColumnWrap>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>
                      </HubInsightGrid>
                    )}
                  </>
                )}
              </HubFeatureCard>
            </VendorCardFill>
            </HubPage>
          {workspaceMenuOpen && workspaceOptions.length > 0 ? (
            <ModalOverlay onClick={() => setWorkspaceMenuOpen(false)}>
              <ModalCard onClick={(event) => event.stopPropagation()}>
                <ModalHeader>
                  <div>
                    <ModalTitle>{t("hub.switchAgency")}</ModalTitle>
                    <WorkspaceSectionCopy>{t("hub.switchAgencyCopy")}</WorkspaceSectionCopy>
                  </div>
                  <GhostButton type="button" onClick={() => setWorkspaceMenuOpen(false)}>
                    {t("common.close")}
                  </GhostButton>
                </ModalHeader>
                <HeaderWorkspaceDropdown
                  style={{
                    position: "static",
                    minWidth: "unset",
                    width: "100%",
                    boxShadow: "none",
                  }}
                >
                  {workspaceOptions.map((workspace) => (
                    <HeaderWorkspaceItem
                      key={workspace.vendor.id}
                      type="button"
                      $active={(activeVendorId ?? workspaceOptions[0]?.vendor.id ?? "") === workspace.vendor.id}
                      onClick={() => {
                        if (workspace.vendor.id !== activeVendorId) {
                          handleWorkspaceChange(workspace.vendor.id);
                        }
                        setWorkspaceMenuOpen(false);
                      }}
                    >
                      <Building2 size={16} />
                      <div>
                        <strong>{workspace.vendor.name}</strong>
                        <span>{formatRoleLabel(workspace.membership.role)}</span>
                      </div>
                    </HeaderWorkspaceItem>
                  ))}
                </HeaderWorkspaceDropdown>
              </ModalCard>
            </ModalOverlay>
          ) : null}
          </>
        )}

        {isAccountPath && (
          <>
            {/* <PageSection> */}
              <HeaderRow>
                <ToolbarRow>
                  <TabBar>
                    <TabButton
                      type="button"
                      $active={activeTab === "viewing"}
                      onClick={() => setActiveTab("viewing")}
                    >
                      <DesktopOnly>{t("account.viewing")}</DesktopOnly>
                      <MobileOnly>
                        <Eye size={16} />
                        <span>{t("account.view")}</span>
                      </MobileOnly>
                    </TabButton>
                    <TabButton
                      type="button"
                      $active={activeTab === "saved"}
                      onClick={() => setActiveTab("saved")}
                    >
                      <DesktopOnly>{t("account.saved")}</DesktopOnly>
                      <MobileOnly>
                        <Heart size={16} />
                        <span>{t("account.savedShort")}</span>
                      </MobileOnly>
                    </TabButton>
                    <TabButton
                      type="button"
                      $active={activeTab === "inquiries"}
                      onClick={() => setActiveTab("inquiries")}
                    >
                      <DesktopOnly>{t("account.inquiries")}</DesktopOnly>
                      <MobileOnly>
                        <Mail size={16} />
                        <span>{t("account.inbox")}</span>
                      </MobileOnly>
                    </TabButton>
                    <TabButton
                      type="button"
                      $active={activeTab === "sales"}
                      onClick={() => setActiveTab("sales")}
                    >
                      <DesktopOnly>{t("account.sales")}</DesktopOnly>
                      <MobileOnly>
                        <TagIcon size={16} />
                        <span>{t("account.salesShort")}</span>
                      </MobileOnly>
                    </TabButton>
                  </TabBar>
                  <UtilityLink href="/settings" aria-label="Open settings">
                    <Settings size={16} />
                  </UtilityLink>
                </ToolbarRow>
              </HeaderRow>

              {loading || (!activeTabHasItems && activeTabLoading) ? (
                <Muted>{t("account.loading")}</Muted>
              ) : activeTabError && !activeTabHasItems ? (
                <Muted style={{ color: "var(--color-danger)" }}>{activeTabError}</Muted>
              ) : activeTab === "viewing" ? (
                viewingRequests.length ? (
                  <List>
                    {viewingRequests.map((request) => {
                      const property = request.property as Record<string, unknown> | undefined;
                      const propertyId = String(request.property_id ?? property?.id ?? "");
                      const title = (property?.title as string) || t("listing.property");
                      const location = [property?.township, property?.district]
                        .filter(Boolean)
                        .join(", ");
                      const imageUrl = property?.imageUrl as string | undefined;
                      const price = property?.price as number | undefined;
                      const currency = (property?.currency as string) || "MMK";
                      const typeLabel = formatPropertyTypeLabel(property?.property_type, t);
                      const dealLabel = formatDealTypeLabel(property?.deal_type, t);
                      const bedrooms = property?.bedrooms as number | undefined;
                      const bathrooms = property?.bathrooms as number | undefined;
                      const area = formatArea(property?.area_sqft, locale, t("listing.areaSqft"));
                      const requestedDate = formatDate(request.preferred_date, locale);
                      const requestedTime = formatTimeWindow(request.preferred_time_window, t);
                      const requestedLabel = [requestedDate, requestedTime]
                        .filter(Boolean)
                        .join(" | ");
                      const createdAt = formatDate(request.created_at, locale);
                      return (
                        <ImageCard
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
                          aria-label={`${t("account.view")} ${title}`}
                          $image={imageUrl}
                        >
                          <Thumbnail>
                            {imageUrl ? <img src={imageUrl} alt={title} /> : t("listing.noPhoto")}
                          </Thumbnail>
                          <ImageCardContent>
                            <TitleRow>
                              <TitleGroup>
                                <strong>{title}</strong>
                                {dealLabel ? <DealPill>{dealLabel}</DealPill> : null}
                              </TitleGroup>
                              <DesktopOnly>
                                <StatusRow>
                                  <StatusBadge>
                                    <BadgeCheck size={12} />
                                    {t("account.requested")}
                                  </StatusBadge>
                                  <span>{createdAt || t("account.requestedTbd")}</span>
                                </StatusRow>
                              </DesktopOnly>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {location || t("account.locationTbd")}
                            </IconLabel>
                            {/* <CardDivider /> */}
                            <DetailRow>
                              <IconLabel>
                                <Calendar />
                                {requestedLabel || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <TagIcon />
                                {formatCurrency(price, currency, undefined, language) || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRow>
                            <DetailRowHorizontal>
                              <IconLabel>
                                <Home />
                                {[typeLabel].filter(Boolean).join(" ") || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <BedDouble />
                                {bedrooms ?? t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Bath />
                                {bathrooms ?? t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Ruler />
                                {area || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRowHorizontal>
                          </ImageCardContent>
                        </ImageCard>
                      );
                    })}
                  </List>
                ) : (
                  <Muted>{t("account.noViewing")}</Muted>
                )
              ) : activeTab === "saved" ? (
                savedProperties.length ? (
                  <List>
                    {savedProperties.map((item) => {
                      const property = item.property as Record<string, unknown> | undefined;
                      const propertyId = String(item.property_id ?? property?.id ?? "");
                      const title = (property?.title as string) || t("listing.property");
                      const price = property?.price as number | undefined;
                      const currency = (property?.currency as string) || "MMK";
                      const location = [property?.township, property?.district]
                        .filter(Boolean)
                        .join(", ");
                      const imageUrl = property?.imageUrl as string | undefined;
                      const typeLabel = formatPropertyTypeLabel(property?.property_type, t);
                      const dealLabel = formatDealTypeLabel(property?.deal_type, t);
                      const bedrooms = property?.bedrooms as number | undefined;
                      const bathrooms = property?.bathrooms as number | undefined;
                      const area = formatArea(property?.area_sqft, locale, t("listing.areaSqft"));
                      const savedAt = formatDate(item.created_at, locale);
                      return (
                        <ImageCard
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
                          aria-label={`${t("account.view")} ${title}`}
                          $image={imageUrl}
                        >
                          <Thumbnail>
                            {imageUrl ? <img src={imageUrl} alt={title} /> : t("listing.noPhoto")}
                          </Thumbnail>
                          <ImageCardContent>
                            <TitleRow>
                              <TitleGroup>
                                <strong>{title}</strong>
                                {dealLabel ? <DealPill>{dealLabel}</DealPill> : null}
                              </TitleGroup>
                              <DesktopOnly>
                                <StatusRow>
                                  <StatusBadge>
                                    <BadgeCheck size={12} />
                                    {t("account.savedBadge")}
                                  </StatusBadge>
                                  <span>{savedAt || t("account.requestedTbd")}</span>
                                </StatusRow>
                              </DesktopOnly>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {location || t("account.locationTbd")}
                            </IconLabel>
                            {/* <CardDivider /> */}
                            <DetailRow>
                              <IconLabel>
                                <Calendar />
                                {savedAt || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <TagIcon />
                                {formatCurrency(price, currency, undefined, language) || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Home />
                                {[typeLabel].filter(Boolean).join(" ") || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRow>
                            <DetailRowHorizontal>
                              <IconLabel>
                                <BedDouble />
                                {bedrooms ?? t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Bath />
                                {bathrooms ?? t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Ruler />
                                {area || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRowHorizontal>
                           
                          </ImageCardContent>
                        </ImageCard>
                      );
                    })}
                  </List>
                ) : (
                  <Muted>{t("account.noSaved")}</Muted>
                )
              ) : activeTab === "inquiries" ? (
                <>
                  <ActionRow>
                    <TabAction type="button" onClick={() => router.push("/inquiries/new")}>
                      {t("account.newInquiry")}
                    </TabAction>
                  </ActionRow>
                  {inquiries.length ? (
                    <List>
                      {inquiries.map((item) => {
                        const needs = [];
                        if (item.need_parking) needs.push(t("account.needParking"));
                        if (item.need_lift) needs.push(t("account.needLift"));
                        if (item.need_solar) needs.push(t("account.needSolar"));
                        if (item.need_generator) needs.push(t("account.needGenerator"));
                        const timeline = formatTimelineLabel(item.timeline, t);
                        const budgetLabel = formatBudgetLabel(item.budget_range, item.deal_type, t);
                        const createdAt = formatDate(item.created_at, locale);
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
                            aria-label={t("account.viewInquiryDetails")}
                          >
                            <TitleRow>
                              <TitleGroup>
                                <strong>
                                  {formatInquiryDealLabel(item.deal_type, t)}{" "}
                                  {formatPropertyTypeLabel(item.property_type, t)}
                                </strong>
                              </TitleGroup>
                              <StatusRow>
                                <StatusBadge>
                                  <BadgeCheck size={12} />
                                  {t("account.inquiry")}
                                </StatusBadge>
                                <span>{createdAt || t("account.requestedTbd")}</span>
                              </StatusRow>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {[item.township, item.district, item.state_region]
                                .filter(Boolean)
                                .join(", ") || t("account.locationTbd")}
                            </IconLabel>
                            <CardDivider />
                            <DetailRow>
                              <IconLabel>
                                <TagIcon />
                                {budgetLabel || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Clock />
                                {timeline || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRow>
                            {needs.length ? (
                              <TagRow>
                                {needs.map((need) => (
                                  <Tag key={need}>{need}</Tag>
                                ))}
                              </TagRow>
                            ) : (
                              <Muted>{t("account.noSpecial")}</Muted>
                            )}
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Muted>{t("account.noInquiries")}</Muted>
                  )}
                  <FloatingAction type="button" onClick={() => router.push("/inquiries/new")}>
                    {t("account.newInquiry")}
                  </FloatingAction>
                </>
              ) : (
                <>
                  <ActionRow>
                    <TabAction
                      type="button"
                      onClick={() => router.push("/request-sale")}
                      disabled={salesRequests.length >= 1}
                    >
                      {t("account.newSale")}
                    </TabAction>
                  </ActionRow>
                  <InlineNotice $danger={salesRequests.length >= 1}>
                    {salesRequests.length >= 1
                      ? "1 / 1 listing used. Your current listing is already live."
                      : "You can publish 1 listing directly from this account."}
                  </InlineNotice>
                  {salesRequests.length ? (
                    <List>
                      {salesRequests.map((item) => {
                        const typeLabel = formatPropertyTypeLabel(item.property_type, t);
                        const dealLabel = formatDealTypeLabel(item.deal_type, t);
                        const createdAt = formatDate(item.created_at, locale);
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
                            aria-label={`${t("account.view")} ${t("account.saleRequest")}`}
                          >
                            <TitleRow>
                              <TitleGroup>
                                <strong>{String(item.title ?? t("account.saleRequest"))}</strong>
                                {dealLabel ? <DealPill>{dealLabel}</DealPill> : null}
                              </TitleGroup>
                              <StatusRow>
                                <StatusBadge>
                                  <BadgeCheck size={12} />
                                  {getListingStatusLabel(item.status)}
                                </StatusBadge>
                                <span>{createdAt || t("account.requestedTbd")}</span>
                              </StatusRow>
                            </TitleRow>
                            <IconLabel>
                              <MapPin />
                              {[item.township, item.district, item.state_region]
                                .filter(Boolean)
                                .join(", ") || t("account.locationTbd")}
                            </IconLabel>
                            <CardDivider />
                            <DetailRow>
                              <IconLabel>
                                <Calendar />
                                {createdAt || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <TagIcon />
                                {formatCurrency(item.price as number, item.currency as string, undefined, language) || t("account.requestedTbd")}
                              </IconLabel>
                              <IconLabel>
                                <Home />
                                {[typeLabel].filter(Boolean).join(" ") || t("account.requestedTbd")}
                              </IconLabel>
                            </DetailRow>
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : (
                    <Muted>{t("account.noSales")}</Muted>
                  )}
                  <FloatingAction type="button" onClick={() => router.push("/request-sale")}>
                    {t("account.newSale")}
                  </FloatingAction>
                </>
              )}
            {/* </PageSection> */}
          </>
        )}
      </PageShell>
      {mobileTeamInviteOpen ? (
        <ModalOverlay onClick={() => setMobileTeamInviteOpen(false)}>
          <TeamMobileModalCard onClick={(event) => event.stopPropagation()}>
            <TeamMobileModalHeader>
              <div>
                <ModalTitle>{t("vendor.team.addMember")}</ModalTitle>
                <ModalText>
                  {canInviteAdminSeats
                    ? t("hub.teamInviteOwnerCopy")
                    : t("vendor.team.inviteCopyAdmin")}
                </ModalText>
              </div>
              <ModalCloseIconButton
                type="button"
                onClick={() => setMobileTeamInviteOpen(false)}
                aria-label={t("account.close")}
              >
                <X size={16} />
              </ModalCloseIconButton>
            </TeamMobileModalHeader>
            {canManageTeam ? (
              <TeamInviteGrid>
                <CompactTextInput
                  type="email"
                  value={teamInviteEmail}
                  onChange={(event) => setTeamInviteEmail(event.target.value)}
                  placeholder="member@example.com"
                />
                <CompactSelectWrap>
                  <CustomSelect
                    id="hub-team-role-mobile"
                    name="hub-team-role-mobile"
                    label={t("vendor.verification.role")}
                    hideLabel
                    value={teamInviteRole}
                    onChange={setTeamInviteRole}
                  >
                    <option value="agent">{t("vendor.team.agent")}</option>
                    {canInviteAdminSeats ? <option value="admin">{t("role.admin")}</option> : null}
                    {canInviteAdminSeats ? <option value="owner">{t("role.owner")}</option> : null}
                  </CustomSelect>
                </CompactSelectWrap>
                <CompactCTAButton
                  type="button"
                  onClick={() => void handleTeamInvite()}
                  disabled={teamSavingInvite || !teamInviteEmail.trim()}
                >
                  {teamSavingInvite ? t("vendor.team.sending") : t("vendor.team.sendInvite")}
                </CompactCTAButton>
              </TeamInviteGrid>
            ) : (
              <WorkspaceSummaryHint>{t("hub.teamControlsLimited")}</WorkspaceSummaryHint>
            )}
          </TeamMobileModalCard>
        </ModalOverlay>
      ) : null}
      {mobilePendingInvitesOpen ? (
        <ModalOverlay onClick={() => setMobilePendingInvitesOpen(false)}>
          <TeamMobileModalCard onClick={(event) => event.stopPropagation()}>
            <TeamMobileModalHeader>
              <div>
                <ModalTitle>{t("hub.pendingInvites")}</ModalTitle>
                <ModalText>{t("hub.pendingInvitesCopy")}</ModalText>
              </div>
              <ModalCloseIconButton
                type="button"
                onClick={() => setMobilePendingInvitesOpen(false)}
                aria-label={t("account.close")}
              >
                <X size={16} />
              </ModalCloseIconButton>
            </TeamMobileModalHeader>
            <TeamMembersList>
              {teamInvites.length ? (
                teamInvites.map((invite) => (
                  <TeamMemberCard key={invite.id}>
                    <TeamMemberTop>
                      <div style={{ display: "grid", gap: 4 }}>
                        <TeamMemberName>{invite.email}</TeamMemberName>
                        <TeamMemberMeta>
                          {invite.has_existing_account ? t("hub.existingAccount") : t("hub.newAccountOnAcceptance")}
                        </TeamMemberMeta>
                        {invite.expires_at ? (
                          <TeamMemberMeta>{t("hub.expiresOn", { date: new Date(invite.expires_at).toLocaleDateString() })}</TeamMemberMeta>
                        ) : null}
                      </div>
                      <TeamMemberPills>
                        <AppointmentPill>{formatTeamRoleLabel(invite.role)}</AppointmentPill>
                        <AppointmentPill $tone={invite.status === "accepted" ? "success" : "warning"}>
                          {formatInviteStatusLabel(invite.status)}
                        </AppointmentPill>
                      </TeamMemberPills>
                    </TeamMemberTop>
                  </TeamMemberCard>
                ))
              ) : (
                <HubFeatureCopy>{t("hub.noPendingInvites")}</HubFeatureCopy>
              )}
            </TeamMembersList>
          </TeamMobileModalCard>
        </ModalOverlay>
      ) : null}
      {listingStatusModalOpen && selectedHubPropertyDetail ? (
        <ModalOverlay
          onClick={() => {
            if (selectedHubPropertyStatusSaving) return;
            setListingStatusModalOpen(false);
          }}
        >
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <ModalTitle>{t("hub.updateListingStatus")}</ModalTitle>
                <ModalText>{t("hub.updateListingStatusCopy")}</ModalText>
              </div>
              <GhostButton
                type="button"
                onClick={() => setListingStatusModalOpen(false)}
                aria-label={t("account.close")}
                disabled={selectedHubPropertyStatusSaving}
              >
                <X size={16} />
              </GhostButton>
            </ModalHeader>

            <ListingStatusSelectWrap>
              <CustomSelect
                id="hub-listing-status-modal"
                name="hub-listing-status-modal"
                label={t("hub.listingStatus")}
                hideLabel
                value={selectedHubPropertyStatus}
                onChange={(value) => {
                  setSelectedHubPropertyStatus(value as ListingStatus);
                  setSelectedHubPropertyStatusError(null);
                  setSelectedHubPropertyStatusNotice(null);
                }}
                disabled={selectedHubPropertyStatusSaving || !availableListingStatusOptions.length}
              >
                {availableListingStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {labelize(status)}
                  </option>
                ))}
              </CustomSelect>
            </ListingStatusSelectWrap>

            {selectedHubPropertyStatusError ? (
              <ListingStatusMessage $tone="danger">{selectedHubPropertyStatusError}</ListingStatusMessage>
            ) : null}

            <ModalActions>
              <GhostButton
                type="button"
                onClick={() => setListingStatusModalOpen(false)}
                disabled={selectedHubPropertyStatusSaving}
              >
                {t("listing.cancel")}
              </GhostButton>
              <PrimaryAction
                type="button"
                onClick={() => void handleHubPropertyStatusUpdate()}
                disabled={
                  selectedHubPropertyStatusSaving ||
                  !selectedHubPropertyStatus ||
                  selectedHubPropertyStatus === normalizeListingStatus(selectedHubPropertyDetail.property.status)
                }
              >
                {selectedHubPropertyStatusSaving ? t("hub.saving") : t("hub.updateStatus")}
              </PrimaryAction>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      ) : null}
      {listingDeleteModalOpen && selectedHubPropertyDetail ? (
        <ModalOverlay
          onClick={() => {
            if (selectedHubPropertyDeleting) return;
            setListingDeleteModalOpen(false);
          }}
        >
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <ModalTitle>{t("hub.deleteListing")}</ModalTitle>
                <ModalText>
                  {t("hub.deleteListingCopy", {
                    title: selectedHubPropertyDetail.property.title || t("hub.thisListing"),
                  })}
                </ModalText>
              </div>
              <GhostButton
                type="button"
                onClick={() => setListingDeleteModalOpen(false)}
                aria-label={t("account.close")}
                disabled={selectedHubPropertyDeleting}
              >
                <X size={16} />
              </GhostButton>
            </ModalHeader>

            {selectedHubPropertyStatusError ? (
              <ListingStatusMessage $tone="danger">{selectedHubPropertyStatusError}</ListingStatusMessage>
            ) : null}

            <ModalActions>
              <GhostButton
                type="button"
                onClick={() => setListingDeleteModalOpen(false)}
                disabled={selectedHubPropertyDeleting}
              >
                {t("listing.cancel")}
              </GhostButton>
              <PrimaryAction
                type="button"
                $danger
                onClick={() => void handleHubPropertyDelete()}
                disabled={selectedHubPropertyDeleting}
              >
                {selectedHubPropertyDeleting ? t("hub.deleting") : t("hub.deleteListing")}
              </PrimaryAction>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      ) : null}
      {activeInquiry && (
        <ModalOverlay onClick={closeDetails}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <strong>
                  {formatInquiryDealLabel(activeInquiry.deal_type, t)}{" "}
                  {formatPropertyTypeLabel(activeInquiry.property_type, t)}
                </strong>
              <Muted>
                {formatDate(activeInquiry.created_at, locale) || t("account.submittedTbd")}
              </Muted>
              </div>
              <GhostButton type="button" onClick={closeDetails} aria-label={t("account.close")}>
                <X size={16} />
              </GhostButton>
            </ModalHeader>
            <IconLabel>
              <MapPin />
              {[activeInquiry.township, activeInquiry.district, activeInquiry.state_region]
                .filter(Boolean)
                .join(", ") || t("account.locationTbd")}
            </IconLabel>
            <CardDivider />
            <DetailRow>
              <IconLabel>
                <TagIcon />
                {formatBudgetLabel(activeInquiry.budget_range, activeInquiry.deal_type, t) ||
                  t("account.budgetTbd")}
              </IconLabel>
              <IconLabel>
                <Clock />
                {formatTimelineLabel(activeInquiry.timeline, t) || t("account.timelineTbd")}
              </IconLabel>
            </DetailRow>
            {(() => {
              const needs = [];
              if (activeInquiry.need_parking) needs.push(t("account.needParking"));
              if (activeInquiry.need_lift) needs.push(t("account.needLift"));
              if (activeInquiry.need_solar) needs.push(t("account.needSolar"));
              if (activeInquiry.need_generator) needs.push(t("account.needGenerator"));
              return needs.length ? (
                <TagRow>
                  {needs.map((need) => (
                    <Tag key={need}>{need}</Tag>
                  ))}
                </TagRow>
              ) : (
                <Muted>{t("account.noSpecial")}</Muted>
              );
            })()}
            <ModalActions>
              <GhostButton type="button" onClick={closeDetails}>
                {t("account.close")}
              </GhostButton>
              <CTAButton
                type="button"
                onClick={() => {
                  closeDetails();
                  router.push(`/inquiries/new?editId=${String(activeInquiry.id ?? "")}`);
                }}
              >
                {t("account.editInquiry")}
              </CTAButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
      {appointmentComposerMode ? (
        <HubAppointmentEditorModal
          open={Boolean(selectedAppointment || appointmentComposerMode === "create")}
          t={t}
          locale={locale}
          mode={appointmentComposerMode}
          isReadOnlyLead={appointmentComposerMode === "edit" && selectedAppointment?.source === "viewing_request"}
          isPropertyLocked={appointmentComposerPropertyLocked}
          selectedAppointmentMeta={appointmentComposerMode === "edit" ? appointmentEditorMeta : null}
          propertyOptions={vendorPropertyOptions}
          statusOptions={appointmentEditorStatusOptions}
          timeOptions={appointmentEditorTimeOptions}
          appointmentAssignments={appointmentAssignments}
          propertyId={appointmentEditorPropertyId}
          status={appointmentEditorStatus}
          title={appointmentEditorTitle}
          startAt={appointmentEditorStartAt}
          clientName={appointmentEditorClientName}
          clientPhone={appointmentEditorClientPhone}
          assignee={appointmentEditorAssignee}
          notes={appointmentEditorNotes}
          saving={appointmentEditorSaving}
          error={appointmentEditorError}
          onClose={closeAppointmentEditor}
          onSave={() => void handleAppointmentSave()}
          onDelete={() => void handleAppointmentDelete()}
          onChangePropertyId={setAppointmentEditorPropertyId}
          onChangeStatus={setAppointmentEditorStatus}
          onChangeTitle={setAppointmentEditorTitle}
          onChangeStartAt={setAppointmentEditorStartAt}
          onChangeClientName={setAppointmentEditorClientName}
          onChangeClientPhone={setAppointmentEditorClientPhone}
          onChangeAssignee={setAppointmentEditorAssignee}
          onChangeNotes={setAppointmentEditorNotes}
        />
      ) : null}
      <HubStaffAppointmentsModal
        open={Boolean(selectedStaffAssignment)}
        t={t}
        locale={locale}
        assignment={selectedStaffAssignment}
        appointments={selectedStaffAppointments}
        showPast={showPastStaffAppointments}
        onClose={() => {
          setSelectedAppointmentStaffId(null);
          setShowPastStaffAppointments(false);
        }}
        onTogglePast={() => setShowPastStaffAppointments((value) => !value)}
        onOpenAppointment={(appointmentId) => {
          setSelectedAppointmentStaffId(null);
          setShowPastStaffAppointments(false);
          openAppointmentEditor(appointmentId);
        }}
        formatRoleLabel={labelize}
        formatStatusLabel={labelize}
      />
      {activeSale && (
        <ModalOverlay onClick={closeDetails}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div>
                <strong>{String(activeSale.title ?? t("account.saleRequest"))}</strong>
              <Muted>
                {formatDate(activeSale.created_at, locale) || t("account.submittedTbd")}
              </Muted>
              </div>
              <GhostButton type="button" onClick={closeDetails} aria-label={t("account.close")}>
                <X size={16} />
              </GhostButton>
            </ModalHeader>
            <IconLabel>
              <MapPin />
              {[activeSale.township, activeSale.district, activeSale.state_region]
                .filter(Boolean)
                .join(", ") || t("account.locationTbd")}
            </IconLabel>
            <CardDivider />
            <DetailRow>
              <IconLabel>
                <TagIcon />
                {formatCurrency(activeSale.price as number, activeSale.currency as string, undefined, language) || t("account.priceTbd")}
              </IconLabel>
              <IconLabel>
                <Home />
                {[formatDealTypeLabel(activeSale.deal_type, t), formatPropertyTypeLabel(activeSale.property_type, t)]
                  .filter(Boolean)
                  .join(" ") || t("account.typeTbd")}
              </IconLabel>
              <IconLabel>
                <BedDouble />
                {typeof activeSale.bedrooms === "number"
                  ? activeSale.bedrooms
                  : t("account.requestedTbd")}
              </IconLabel>
              <IconLabel>
                <Bath />
                {typeof activeSale.bathrooms === "number"
                  ? activeSale.bathrooms
                  : t("account.requestedTbd")}
              </IconLabel>
              <IconLabel>
                <Ruler />
                {formatArea(activeSale.area_sqft, locale, t("listing.areaSqft")) ||
                  t("account.requestedTbd")}
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
                {t("account.close")}
              </GhostButton>
              {activeSale.id ? (
                <CTAButton
                  type="button"
                  onClick={() => {
                    const propertyId = String(activeSale.id ?? "");
                    closeDetails();
                    if (propertyId) router.push(`/listing/${propertyId}`);
                  }}
                >
                  View live listing
                </CTAButton>
              ) : null}
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </div>
  );
}
