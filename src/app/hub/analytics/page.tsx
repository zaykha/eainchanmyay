"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Heart,
  Lock,
  MapPin,
  Sparkles,
  Users2,
  X,
} from "lucide-react";
import { MarketplaceHeader } from "@/features/site/shared/components/MarketplaceHeader";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";
import { readActiveVendorWorkspace, withActiveVendorHeaders } from "@/features/site/vendor/lib/active-context";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { CustomSelect } from "@/features/site/shared/components/form-controls/CustomSelect";
import { useI18n, type Translate } from "@/features/site/shared/lib/i18n";
import type { Language } from "@/features/site/shared/lib/i18n-config";
import { translateLocationName } from "@/features/site/shared/lib/myanmar-geo";

type WorkspacePayload = {
  vendor?: {
    id: string;
    name: string;
    plan: string | null;
  };
  error?: string;
};

type OverviewPayload = {
  metrics: {
    totalProperties: number;
    appointmentsCount: number;
    listingViewsCount: number;
    inquiryLeadCount: number;
    qualifiedLeadCount?: number;
    closedLeadCount?: number;
    leadConversionRate?: number;
    viewToLeadRate?: number;
  };
  listingTypes: Array<{ key: string; count: number }>;
  appointmentsByType: Array<{ key: string; count: number }>;
  marketInsights?: {
    topViewedListings?: Array<{
      property_id: string;
      title: string;
      township: string | null;
      status: string | null;
      views: number;
    }>;
  };
};

type FullAnalyticsPayload = {
  workspace: {
    vendorId: string;
    vendorName: string;
    plan: string;
  };
  generatedAt: string;
  filterOptions: {
    propertyTypes: string[];
    agents: Array<{ id: string; name: string }>;
    townships: string[];
    listingStatuses: string[];
  };
  liveDataFlags: {
    searchImpressionsTracked: boolean;
    listingCardClicksTracked: boolean;
    contactClicksTracked: boolean;
    promotionPerformanceTracked: boolean;
    appointmentNoShowsTracked: boolean;
    listingInquiryAttributionTracked: boolean;
  };
  items: {
    properties: Array<{
      id: string;
      title: string;
      propertyType: string;
      township: string | null;
      status: string;
      createdAt: string | null;
      agentId: string | null;
      agentName: string;
      coverImageUrl: string | null;
    }>;
    viewEvents: Array<{
      propertyId: string;
      viewedAt: string | null;
      source: string;
      propertyType: string;
      township: string | null;
      status: string;
      agentId: string | null;
    }>;
    leads: Array<{
      id: string;
      createdAt: string | null;
      status: string;
      pipelineStage: string;
      propertyType: string;
      township: string | null;
      agentId: string | null;
      agentName: string;
    }>;
    appointmentRequests: Array<{
      id: string;
      propertyId: string;
      createdAt: string | null;
      preferredDate: string | null;
      status: string;
      propertyType: string;
      township: string | null;
      listingStatus: string;
      agentId: string | null;
      agentName: string;
    }>;
    appointments: Array<{
      id: string;
      propertyId: string;
      startAt: string | null;
      status: string;
      propertyType: string;
      township: string | null;
      listingStatus: string;
      agentId: string | null;
      agentName: string;
    }>;
    savedProperties: Array<{
      propertyId: string;
      createdAt: string | null;
      propertyType: string;
      township: string | null;
      listingStatus: string;
      agentId: string | null;
    }>;
    promotions: Array<{
      id: string;
      listingId: string | null;
      promotionType: string;
      targetType: string;
      status: string;
      title: string;
      pricePer24h: number | null;
      startsAt: string | null;
      endsAt: string | null;
    }>;
  };
};

type DatePreset = "30d" | "90d" | "365d" | "all" | "custom";

const PAGE_ACCENT = "#e93d5d";
const SOFT_ACCENT = "#fff1f3";
const CHIP_TINT = "#ffe4e8";

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;

const Page = styled.main`
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(233, 61, 93, 0.12), transparent 28%),
    linear-gradient(180deg, #f8f8fb 0%, #f2f3f7 100%);
  color: var(--color-text);
  padding: 0 0 48px;
`;

const Shell = styled.div`
  width: min(1240px, calc(100% - 24px));
  margin: 0 auto;
  padding-top: 20px;
  display: grid;
  gap: 18px;
`;

const EmbeddedStack = styled.div`
  display: grid;
  gap: 18px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text);
  text-decoration: none;
  font-weight: 700;
`;

const StickyFilters = styled.section`
  position: sticky;
  top: 12px;
  z-index: 1;
  border-radius: 24px;
  padding: 16px;
  background: rgba(248, 249, 253, 0.96);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.1);
  display: grid;
  gap: 14px;
`;

const FilterTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileFilterLauncher = styled.button`
  display: none;

  @media (max-width: 768px) {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    border: 1px solid rgba(15, 23, 42, 0.1);
    background: #fff;
    color: var(--color-text);
    display: inline-grid;
    place-items: center;
    cursor: pointer;
    position: relative;
    flex: 0 0 42px;
  }
`;

const MobileFilterCount = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px rgba(248, 249, 253, 0.96);
`;

const FilterTitle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 800;
`;

const PresetRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    display: none;
  }
`;

const PresetButton = styled.button<{ $active?: boolean }>`
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid ${(props) => (props.$active ? "rgba(233, 61, 93, 0.28)" : "rgba(15, 23, 42, 0.08)")};
  background: ${(props) => (props.$active ? SOFT_ACCENT : "#fff")};
  color: ${(props) => (props.$active ? PAGE_ACCENT : "var(--color-text)")};
  font-weight: 700;
  cursor: pointer;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileFilterOverlay = styled.button<{ $open?: boolean }>`
  display: none;

  @media (max-width: 768px) {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 120;
    border: none;
    background: rgba(15, 23, 42, 0.42);
    opacity: ${(props) => (props.$open ? 1 : 0)};
    pointer-events: ${(props) => (props.$open ? "auto" : "none")};
    transition: opacity 180ms ease;
  }
`;

const MobileFilterSheet = styled.div<{ $open?: boolean }>`
  display: none;

  @media (max-width: 768px) {
    display: grid;
    gap: 14px;
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 130;
    padding: 16px;
    border-radius: 24px;
    border: 1px solid rgba(148, 163, 184, 0.24);
    background: rgba(248, 249, 253, 0.98);
    box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
    transform: translateY(${(props) => (props.$open ? "0" : "24px")});
    opacity: ${(props) => (props.$open ? 1 : 0)};
    pointer-events: ${(props) => (props.$open ? "auto" : "none")};
    transition:
      transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 180ms ease;
    max-height: 80dvh;
    overflow-y: auto;
    align-content: start;
  }
`;

const MobileFilterHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const MobileFilterTitle = styled.div`
  display: grid;
  gap: 4px;
`;

const MobileFilterClose = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #fff;
  color: var(--color-text);
  display: grid;
  place-items: center;
  cursor: pointer;
  flex: 0 0 36px;
`;

const MobilePresetRow = styled(PresetRow)`
  display: none;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileFilterGrid = styled(FilterGrid)`
  display: none;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: 1fr;
  }
`;

const FilterControlWrap = styled.div`
  .Control {
    min-height: 46px;
    padding-top: 14px;
    padding-bottom: 14px;
    border-radius: 16px;
    font-size: 0.95rem;
  }

  .SelectMenu {
    z-index: 3;
  }
`;

const DateFieldWrap = styled.div`
  position: relative;
`;

const DateLabel = styled.label<{ $filled?: boolean; $open?: boolean }>`
  position: absolute;
  left: 12px;
  top: ${(props) => (props.$filled || props.$open ? "-8px" : "14px")};
  font-size: ${(props) => (props.$filled || props.$open ? "11px" : "13px")};
  color: ${(props) => (props.$filled || props.$open ? "var(--color-primary)" : "var(--color-muted)")};
  background: var(--color-surface-2);
  padding: ${(props) => (props.$filled || props.$open ? "0 4px" : "0")};
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 1;
`;

const DateTrigger = styled.button`
  width: 100%;
  min-height: 44px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #f8fafc;
  padding: 0 14px;
  color: var(--color-text);
  font: inherit;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(235, 35, 64, 0.15);
  }
`;

const DateValue = styled.span<{ $muted?: boolean }>`
  color: ${(props) => (props.$muted ? "var(--color-muted)" : "var(--color-text)")};
`;

const DateOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 36, 0.4);
  display: grid;
  place-items: center;
  z-index: 110;
  padding: 16px;
`;

const DateCard = styled.div`
  width: min(420px, 100%);
  background: var(--color-surface-2);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  padding: 16px;
  display: grid;
  gap: 12px;
`;

const DateCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const DateNav = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 6px 10px;
  background: var(--color-surface);
  cursor: pointer;
  color: var(--color-text);
`;

const DateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

const DateDay = styled.button<{ $muted?: boolean; $active?: boolean }>`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 8px 0;
  background: ${(props) => (props.$active ? "color-mix(in srgb, var(--color-primary) 18%, transparent)" : "transparent")};
  color: ${(props) => (props.$active ? "var(--color-primary)" : props.$muted ? "var(--color-muted)" : "var(--color-text)")};
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary);
  }
`;

const Section = styled.section`
  border-radius: 28px;
  padding: 22px;
  background: linear-gradient(180deg, #f8f9fc 0%, #f3f5fa 100%);
  border: 1px solid rgba(148, 163, 184, 0.26);
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 18px;
`;

const SectionHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 1.1rem;
`;

const SectionCopy = styled.p`
  margin: 4px 0 0;
  color: var(--color-muted);
  line-height: 1.55;
`;

const NotePill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: ${CHIP_TINT};
  color: ${PAGE_ACCENT};
  font-size: 0.78rem;
  font-weight: 800;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 860px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const KpiCard = styled.div`
  border-radius: 22px;
  padding: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  display: grid;
  gap: 10px;
`;

const KpiLabel = styled.div`
  color: var(--color-muted);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const KpiValue = styled.div`
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 900;
  line-height: 1;
`;

const KpiHint = styled.div`
  font-size: 0.82rem;
  color: var(--color-muted);
  line-height: 1.45;
`;

const FunnelList = styled.div`
  display: grid;
  gap: 12px;
`;

const FunnelRow = styled.div`
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const FunnelLabel = styled.div`
  font-weight: 700;
`;

const Track = styled.div`
  height: 14px;
  border-radius: 999px;
  background: #e4e9f2;
  overflow: hidden;
`;

const Fill = styled.div<{ $width: number; $tint?: string }>`
  height: 100%;
  width: ${(props) => Math.max(6, Math.min(100, props.$width))}%;
  border-radius: inherit;
  background: ${(props) => props.$tint ?? `linear-gradient(135deg, ${PAGE_ACCENT} 0%, #ff7c95 100%)`};
`;

const FunnelValue = styled.div`
  font-weight: 800;
  white-space: nowrap;
`;

const SplitGrid = styled.div`
  display: grid;
  grid-template-columns: 1.25fr 0.95fr;
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const ListingOverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const ListingOverviewCard = styled.div`
  border-radius: 22px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  display: grid;
  gap: 10px;
`;

const ListingOverviewTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: rgba(255, 255, 255, 0.9);
`;

const ListingCardsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
`;

const ListingPerformanceCard = styled.div`
  border-radius: 22px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
  display: grid;
  gap: 12px;
`;

const ListingPerformanceBody = styled.div`
  display: grid;
  grid-template-columns: 188px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ListingPerformanceImage = styled.div<{ $image?: string }>`
  grid-row: 1 / span 2;
  min-height: 196px;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.12)),
    ${(props) => (props.$image ? `url("${props.$image}") center / cover no-repeat` : "linear-gradient(135deg, #eef2f8 0%, #dde5f0 100%)")};
  display: grid;
  place-items: center;
  color: #64748b;

  svg {
    opacity: 0.9;
  }

  @media (max-width: 720px) {
    grid-row: auto;
    min-height: 180px;
  }
`;

const ListingPerformanceMain = styled.div`
  display: grid;
  gap: 12px;
`;

const ListingPerformanceTop = styled.div`
  display: grid;
  gap: 12px;
`;

const ListingPerformanceTitleWrap = styled.div`
  display: grid;
  gap: 6px;

  strong {
    font-size: 0.98rem;
    line-height: 1.25;
  }
`;

const ListingPerformanceStats = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const ListingPerformanceStat = styled.div`
  min-width: 0;
  border-radius: 16px;
  padding: 10px 12px;
  background: #f5f7fb;
  border: 1px solid rgba(148, 163, 184, 0.22);
  display: grid;
  gap: 6px;
`;

const ListingPerformanceStatLabel = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  color: var(--color-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

const ListingPerformanceStatValue = styled.div`
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.1;
`;

const InlineButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: #fff;
  color: var(--color-text);
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PaginationRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Table = styled.table`
  width: 100%;
  min-width: 1040px;
  border-collapse: collapse;
  font-size: 0.92rem;
  background: rgba(255, 255, 255, 0.95);

  th,
  td {
    padding: 14px 16px;
    text-align: left;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
    vertical-align: top;
  }

  th {
    background: #eef2f8;
    font-size: 0.76rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-muted);
  }

  tr:last-child td {
    border-bottom: none;
  }
`;

const ListingMeta = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

const Pill = styled.span<{ $tone?: "neutral" | "accent" | "warning" | "soft" }>`
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 800;
  background: ${(props) =>
    props.$tone === "accent"
      ? SOFT_ACCENT
      : props.$tone === "warning"
        ? "#fff7ed"
        : props.$tone === "soft"
          ? "#eef2f8"
          : "#eef1f6"};
  color: ${(props) =>
    props.$tone === "accent" ? PAGE_ACCENT : props.$tone === "warning" ? "#c2410c" : "var(--color-muted)"};
  border: 1px solid
    ${(props) =>
      props.$tone === "accent"
        ? "rgba(233, 61, 93, 0.12)"
        : props.$tone === "warning"
          ? "rgba(251, 146, 60, 0.2)"
          : "rgba(148, 163, 184, 0.18)"};
`;

const Stack = styled.div`
  display: grid;
  gap: 10px;
`;

const PipelineRow = styled.div`
  display: grid;
  gap: 8px;
`;

const PipelineMeta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.9rem;
  font-weight: 700;
`;

const MiniList = styled.div`
  display: grid;
  gap: 10px;
`;

const MiniRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
`;

const MetricList = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const MetricBox = styled.div`
  border-radius: 20px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
  display: grid;
  gap: 6px;
`;

const MobileTopBar = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobilePresetScroller = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 2px 0 2px 1px;
    scrollbar-width: none;
    align-items: center;
    flex-wrap: nowrap;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const MobileOverviewStack = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: grid;
    gap: 12px;
  }
`;

const MobilePanel = styled(Section)`
  @media (max-width: 768px) {
    padding: 16px;
    gap: 14px;
    border-radius: 22px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  }
`;

const MobilePanelHead = styled.div`
  display: grid;
  gap: 4px;
`;

const MobilePanelTitle = styled.h2`
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.2;
`;

const MobilePanelCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.8rem;
  line-height: 1.4;
`;

const MobileKpiGrid = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
`;

const MobileKpiCard = styled.div`
  border-radius: 18px;
  padding: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: grid;
  gap: 6px;
  min-height: 88px;
  align-content: start;
`;

const MobileKpiLabel = styled.div`
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.2;
`;

const MobileKpiValue = styled.div`
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
`;

const MobileStatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const MobileStatusCard = styled.div`
  border-radius: 18px;
  padding: 12px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  display: grid;
  gap: 5px;
`;

const MobileStatusTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted);
`;

const MobileStatusValue = styled.div`
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.2;
`;

const MobileStatusCopy = styled.div`
  color: var(--color-muted);
  font-size: 0.76rem;
  line-height: 1.35;
`;

const MobileAccordionList = styled.div`
  display: grid;
  gap: 10px;
`;

const MobileAccordionCard = styled.div`
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.92);
  overflow: hidden;
`;

const MobileAccordionTrigger = styled.button<{ $open?: boolean }>`
  width: 100%;
  min-height: 52px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  text-align: left;

  svg {
    flex: 0 0 auto;
    transform: rotate(${(props) => (props.$open ? "180deg" : "0deg")});
    transition: transform 180ms ease;
  }
`;

const MobileAccordionTitleWrap = styled.div`
  display: grid;
  gap: 3px;
  min-width: 0;
`;

const MobileAccordionTitle = styled.div`
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.25;
`;

const MobileAccordionMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.76rem;
  line-height: 1.3;
`;

const MobileAccordionContent = styled.div<{ $open?: boolean }>`
  display: ${(props) => (props.$open ? "grid" : "none")};
  gap: 12px;
  padding: 0 14px 14px;
`;

const MobileEmptyState = styled.div`
  border-radius: 18px;
  padding: 14px;
  background: #fff;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  display: grid;
  gap: 4px;
`;

const MobileMetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const MobileMetricCard = styled.div`
  border-radius: 16px;
  padding: 12px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.18);
  display: grid;
  gap: 6px;
`;

const MobileRowList = styled.div`
  display: grid;
  gap: 8px;
`;

const MobileRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.16);
`;

const MobileRowLabel = styled.div`
  min-width: 0;
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.3;
`;

const MobileRowValue = styled.div`
  flex: 0 0 auto;
  font-size: 0.84rem;
  font-weight: 900;
  color: ${PAGE_ACCENT};
`;

const MobileIssueGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const MobileIssueCard = styled.div`
  border-radius: 16px;
  padding: 12px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.16);
  display: grid;
  gap: 4px;
`;

const MobileIssueTitle = styled.div`
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--color-muted);
  line-height: 1.3;
`;

const MobileIssueValue = styled.div`
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.1;
`;

const MobileIssueCopy = styled.div`
  color: var(--color-muted);
  font-size: 0.76rem;
  line-height: 1.35;
`;

const EmptyState = styled(Section)`
  justify-items: start;
`;

const SkeletonBlock = styled.div<{ $height?: number; $radius?: number }>`
  width: 100%;
  height: ${(props) => `${props.$height ?? 16}px`};
  border-radius: ${(props) => `${props.$radius ?? 14}px`};
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-surface-2) 92%, transparent) 0%,
    color-mix(in srgb, var(--color-outline) 34%, white) 50%,
    color-mix(in srgb, var(--color-surface-2) 92%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.35s linear infinite;
`;

const LockCard = styled(Section)`
  padding: 32px;
  text-align: left;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const PrimaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff4b6b 0%, #df274c 100%);
  color: #fff;
  text-decoration: none;
  font-weight: 800;
`;

const SecondaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.1);
  color: var(--color-text);
  text-decoration: none;
  font-weight: 800;
  background: #fff;
`;

function getLocale(language: Language) {
  return language === "mm" ? "my-MM" : language === "zh" ? "zh-CN" : language === "th" ? "th-TH" : "en-US";
}

function propertyKeyToTranslationKey(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const segments = normalized.split("_");
  const [first = "", ...rest] = segments;
  const camel = `${first}${rest.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join("")}`;
  return `property.${camel}` as const;
}

function labelize(value: string | null | undefined, t: Translate) {
  if (!value) return t("analytics.unknown");
  const propertyTranslationKey = propertyKeyToTranslationKey(value);
  if (propertyTranslationKey) {
    const translated = t(propertyTranslationKey);
    if (translated !== propertyTranslationKey) return translated;
  }
  const statusTranslationKey = `hub.status.${value}` as const;
  const translatedStatus = t(statusTranslationKey);
  if (translatedStatus !== statusTranslationKey) return translatedStatus;
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatNumber(value: number | null, language: Language, t: Translate) {
  if (value === null) return t("analytics.notAvailable");
  return new Intl.NumberFormat(getLocale(language)).format(value);
}

function formatPercent(value: number | null, t: Translate) {
  if (value === null) return t("analytics.notAvailable");
  return `${value.toFixed(1)}%`;
}

function parseDateOnly(value: string) {
  const parts = value.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

function formatDatePickerLabel(value: string | undefined, language: Language) {
  if (!value) return "";
  const parsed = parseDateOnly(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString(getLocale(language), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateLabel(value: string | null | undefined, language: Language, t: Translate) {
  if (!value) return t("analytics.notAvailable");
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return t("analytics.notAvailable");
  return parsed.toLocaleDateString(getLocale(language), {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const start = new Date(year, month, 1);
  const startDay = start.getDay();
  const first = new Date(year, month, 1 - startDay);
  const days: Array<{ date: Date; inMonth: boolean }> = [];

  for (let i = 0; i < 42; i += 1) {
    const current = new Date(first);
    current.setDate(first.getDate() + i);
    days.push({ date: current, inMonth: current.getMonth() === month });
  }

  return days;
}

function toDateString(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekdayLabels(language: Language) {
  const formatter = new Intl.DateTimeFormat(getLocale(language), { weekday: "short" });
  const sunday = new Date(Date.UTC(2024, 0, 7));
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(sunday);
    current.setUTCDate(sunday.getUTCDate() + index);
    return formatter.format(current);
  });
}

function AnalyticsDatePicker({
  id,
  label,
  value,
  onChange,
  language,
  t,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  language: Language;
  t: Translate;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDateOnly(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate ?? new Date());
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const monthLabel = currentMonth.toLocaleDateString(getLocale(language), {
    month: "long",
    year: "numeric",
  });
  const weekdayLabels = useMemo(() => getWeekdayLabels(language), [language]);

  return (
    <DateFieldWrap>
      <DateLabel htmlFor={id} $filled={Boolean(value)} $open={open}>
        {label}
      </DateLabel>
      <DateTrigger
        id={id}
        type="button"
        onClick={() => {
          setCurrentMonth(selectedDate ?? new Date());
          setOpen(true);
        }}
      >
        <DateValue $muted={!value}>{formatDatePickerLabel(value, language) || t("analytics.selectDate")}</DateValue>
        <ChevronDown size={16} />
      </DateTrigger>
      {open ? (
        <DateOverlay onClick={() => setOpen(false)}>
          <DateCard onClick={(event) => event.stopPropagation()}>
            <DateCardHeader>
              <DateNav type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                <ChevronLeft size={16} />
              </DateNav>
              <strong>{monthLabel}</strong>
              <DateNav type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                <ChevronRight size={16} />
              </DateNav>
            </DateCardHeader>
            <DateGrid>
              {weekdayLabels.map((day) => (
                <span
                  key={day}
                  style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--color-muted)", fontWeight: 600 }}
                >
                  {day}
                </span>
              ))}
              {days.map((item) => {
                const key = toDateString(item.date);
                return (
                  <DateDay
                    key={key}
                    type="button"
                    $muted={!item.inMonth}
                    $active={value === key}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                  >
                    {item.date.getDate()}
                  </DateDay>
                );
              })}
            </DateGrid>
          </DateCard>
        </DateOverlay>
      ) : null}
    </DateFieldWrap>
  );
}

function getDateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function inDateRange(value: string | null | undefined, startDate: string, endDate: string) {
  if (!value) return false;
  const key = value.slice(0, 10);
  if (!key) return false;
  return key >= startDate && key <= endDate;
}

function sortCountEntries<T extends { count: number }>(items: T[]) {
  return [...items].sort((left, right) => right.count - left.count);
}

export function HubAnalyticsContent({ embedded = false }: { embedded?: boolean }) {
  const { user, authToken, profileReady, profileRole } = useAppState();
  const { t, language } = useI18n();
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspacePayload["vendor"] | null>(null);
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [fullAnalytics, setFullAnalytics] = useState<FullAnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<DatePreset>("30d");
  const [startDate, setStartDate] = useState(getDateDaysAgo(30));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [propertyType, setPropertyType] = useState("all");
  const [agentId, setAgentId] = useState("all");
  const [listingStatus, setListingStatus] = useState("all");
  const [township, setTownship] = useState("all");
  const [analyticsStep, setAnalyticsStep] = useState<"overview" | "listing-performance">("overview");
  const [listingPage, setListingPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileShowAllPipeline, setMobileShowAllPipeline] = useState(false);
  const [mobileOpenSections, setMobileOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    pipeline: false,
    appointments: false,
    promotions: false,
    detailed: false,
  });

  const activeMobileFilterCount =
    (preset !== "30d" ? 1 : 0) +
    (propertyType !== "all" ? 1 : 0) +
    (agentId !== "all" ? 1 : 0) +
    (listingStatus !== "all" ? 1 : 0) +
    (township !== "all" ? 1 : 0);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const syncViewport = (event?: MediaQueryList | MediaQueryListEvent) => {
      setIsMobileViewport(event ? event.matches : mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);
    return () => mediaQuery.removeEventListener("change", syncViewport);
  }, []);

  useEffect(() => {
    if (!user) {
      setActiveVendorId(null);
      return;
    }
    setActiveVendorId(readActiveVendorWorkspace(user.id));
  }, [user]);

  useEffect(() => {
    if (preset === "custom") return;
    if (preset === "all") {
      setStartDate("2000-01-01");
      setEndDate(new Date().toISOString().slice(0, 10));
      return;
    }
    const days = preset === "30d" ? 30 : preset === "90d" ? 90 : 365;
    setStartDate(getDateDaysAgo(days));
    setEndDate(new Date().toISOString().slice(0, 10));
  }, [preset]);

  useEffect(() => {
    if (!profileReady) return;

    if (!user || !authToken || profileRole !== "vendor_user") {
      setLoading(false);
      setWorkspace(null);
      setOverview(null);
      setFullAnalytics(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const workspaceResponse = await fetch("/api/vendor/workspace?includeUsage=false", {
          headers: withActiveVendorHeaders(
            {
              Authorization: `Bearer ${authToken}`,
            },
            activeVendorId
          ),
        });
        const workspacePayload = (await workspaceResponse.json().catch(() => null)) as WorkspacePayload | null;

        if (!workspaceResponse.ok || !workspacePayload?.vendor?.id) {
          throw new Error(workspacePayload?.error ?? t("vendor.settings.loadingError"));
        }

        if (cancelled) return;
        setWorkspace(workspacePayload.vendor);

        const normalizedPlan = (workspacePayload.vendor.plan ?? "free").toLowerCase();
        if (normalizedPlan === "free") {
          setOverview(null);
          setFullAnalytics(null);
          return;
        }

        if (normalizedPlan === "pro") {
          const overviewResponse = await fetch("/api/vendor/overview", {
            headers: withActiveVendorHeaders(
              {
                Authorization: `Bearer ${authToken}`,
              },
              activeVendorId ?? workspacePayload.vendor.id
            ),
          });
          const overviewPayload = (await overviewResponse.json().catch(() => null)) as (OverviewPayload & { error?: string }) | null;
          if (!overviewResponse.ok || !overviewPayload) {
            throw new Error(overviewPayload?.error ?? t("analytics.unavailable"));
          }
          if (!cancelled) {
            setOverview(overviewPayload);
            setFullAnalytics(null);
          }
          return;
        }

        const analyticsResponse = await fetch("/api/vendor/analytics/full", {
          headers: withActiveVendorHeaders(
            {
              Authorization: `Bearer ${authToken}`,
            },
            activeVendorId ?? workspacePayload.vendor.id
          ),
        });
        const analyticsPayload = (await analyticsResponse.json().catch(() => null)) as (FullAnalyticsPayload & { error?: string }) | null;
        if (!analyticsResponse.ok || !analyticsPayload) {
          throw new Error(analyticsPayload?.error ?? t("analytics.unavailable"));
        }
        if (!cancelled) {
          setFullAnalytics(analyticsPayload);
          setOverview(null);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : t("analytics.unavailable"));
          setOverview(null);
          setFullAnalytics(null);
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
  }, [activeVendorId, authToken, profileReady, profileRole, t, user]);

  const fullView = useMemo(() => {
    if (!fullAnalytics) return null;

    const matchesListingFilters = (input: {
      propertyType?: string | null;
      township?: string | null;
      status?: string | null;
      agentId?: string | null;
    }) => {
      if (propertyType !== "all" && (input.propertyType ?? "unknown") !== propertyType) return false;
      if (township !== "all" && (input.township ?? "") !== township) return false;
      if (listingStatus !== "all" && (input.status ?? "unknown") !== listingStatus) return false;
      if (agentId !== "all" && (input.agentId ?? "") !== agentId) return false;
      return true;
    };

    const matchesLeadFilters = (input: {
      propertyType?: string | null;
      township?: string | null;
      agentId?: string | null;
    }) => {
      if (propertyType !== "all" && (input.propertyType ?? "unknown") !== propertyType) return false;
      if (township !== "all" && (input.township ?? "") !== township) return false;
      if (agentId !== "all" && (input.agentId ?? "") !== agentId) return false;
      return true;
    };

    const properties = fullAnalytics.items.properties.filter((property) =>
      matchesListingFilters({
        propertyType: property.propertyType,
        township: property.township,
        status: property.status,
        agentId: property.agentId,
      })
    );

    const propertyIds = new Set(properties.map((property) => property.id));

    const viewEvents = fullAnalytics.items.viewEvents.filter(
      (event) =>
        propertyIds.has(event.propertyId) &&
        matchesListingFilters({
          propertyType: event.propertyType,
          township: event.township,
          status: event.status,
          agentId: event.agentId,
        }) &&
        inDateRange(event.viewedAt, startDate, endDate)
    );

    const leads = fullAnalytics.items.leads.filter(
      (lead) =>
        matchesLeadFilters({
          propertyType: lead.propertyType,
          township: lead.township,
          agentId: lead.agentId,
        }) && inDateRange(lead.createdAt, startDate, endDate)
    );

    const appointmentRequests = fullAnalytics.items.appointmentRequests.filter(
      (request) =>
        propertyIds.has(request.propertyId) &&
        matchesListingFilters({
          propertyType: request.propertyType,
          township: request.township,
          status: request.listingStatus,
          agentId: request.agentId,
        }) &&
        inDateRange(request.createdAt, startDate, endDate)
    );

    const appointments = fullAnalytics.items.appointments.filter(
      (appointment) =>
        propertyIds.has(appointment.propertyId) &&
        matchesListingFilters({
          propertyType: appointment.propertyType,
          township: appointment.township,
          status: appointment.listingStatus,
          agentId: appointment.agentId,
        }) &&
        inDateRange(appointment.startAt, startDate, endDate)
    );

    const savedProperties = fullAnalytics.items.savedProperties.filter(
      (item) =>
        propertyIds.has(item.propertyId) &&
        matchesListingFilters({
          propertyType: item.propertyType,
          township: item.township,
          status: item.listingStatus,
          agentId: item.agentId,
        }) &&
        inDateRange(item.createdAt, startDate, endDate)
    );

    const viewsByProperty = viewEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.propertyId] = (acc[event.propertyId] ?? 0) + 1;
      return acc;
    }, {});

    const requestsByProperty = appointmentRequests.reduce<Record<string, number>>((acc, request) => {
      acc[request.propertyId] = (acc[request.propertyId] ?? 0) + 1;
      return acc;
    }, {});

    const appointmentsByProperty = appointments.reduce<Record<string, number>>((acc, appointment) => {
      acc[appointment.propertyId] = (acc[appointment.propertyId] ?? 0) + 1;
      return acc;
    }, {});

    const savesByProperty = savedProperties.reduce<Record<string, number>>((acc, item) => {
      acc[item.propertyId] = (acc[item.propertyId] ?? 0) + 1;
      return acc;
    }, {});

    const kpis = {
      totalListingViews: viewEvents.length,
      listingCardClicks: null,
      contactClicks: null,
      agencyInquiries: leads.length,
      savedProperties: savedProperties.length,
      appointmentRequests: appointmentRequests.length,
      conversionRate: viewEvents.length ? (leads.length / viewEvents.length) * 100 : 0,
      activeListings: properties.filter((property) => property.status === "active" || property.status === "reserved").length,
    };

    const funnel = [
      { key: "search_impressions", label: t("analytics.searchImpressions"), value: null },
      { key: "listing_card_clicks", label: t("analytics.listingCardClicks"), value: null },
      { key: "listing_detail_views", label: t("analytics.listingDetailViews"), value: viewEvents.length },
      { key: "saved_properties", label: t("analytics.savedProperties"), value: savedProperties.length },
      { key: "appointment_requests", label: t("analytics.appointmentRequests"), value: appointmentRequests.length },
      { key: "appointments", label: t("analytics.appointments"), value: appointments.length },
    ];

    const listingRows = properties.map((property) => {
      const views = viewsByProperty[property.id] ?? 0;
      const appointmentCount = appointmentsByProperty[property.id] ?? 0;
      return {
        ...property,
        views,
        cardClicks: null as number | null,
        contactClicks: null as number | null,
        saves: savesByProperty[property.id] ?? 0,
        appointments: appointmentCount,
        appointmentRequests: requestsByProperty[property.id] ?? 0,
        conversionRate: views ? (appointmentCount / views) * 100 : 0,
      };
    });

    const pipelineCounts = {
      new: 0,
      assigned: 0,
      contacted: 0,
      qualified: 0,
      appointment_scheduled: 0,
      viewed: 0,
      negotiation: 0,
      closed_won: 0,
      closed_lost: 0,
      unresponsive: 0,
      spam: 0,
    };

    for (const lead of leads) {
      if (lead.pipelineStage in pipelineCounts) {
        pipelineCounts[lead.pipelineStage as keyof typeof pipelineCounts] += 1;
      }
    }

    const appointmentsByType = sortCountEntries(
      Object.entries(
        appointments.reduce<Record<string, number>>((acc, appointment) => {
          acc[appointment.propertyType] = (acc[appointment.propertyType] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([key, count]) => ({ key, count }))
    );

    const mostRequestedListings = sortCountEntries(
      properties
        .map((property) => ({
          propertyId: property.id,
          title: property.title,
          count: requestsByProperty[property.id] ?? 0,
        }))
        .filter((item) => item.count > 0)
    ).slice(0, 5);

    return {
      properties,
      leads,
      savedProperties,
      appointmentRequests,
      appointments,
      kpis,
      funnel,
      listingRows: [...listingRows].sort((left, right) => right.views - left.views),
      pipelineCounts,
      appointmentStats: {
        totalRequests: appointmentRequests.length,
        confirmed: appointments.filter((appointment) => appointment.status === "confirmed" || appointment.status === "completed").length,
        completed: appointments.filter((appointment) => appointment.status === "completed").length,
        cancelled: appointments.filter((appointment) => appointment.status === "cancelled").length,
        noShows: null as number | null,
      },
      appointmentsByType,
      mostRequestedListings,
    };
  }, [agentId, endDate, fullAnalytics, listingStatus, propertyType, startDate, t, township]);

  const listingOverview = useMemo(() => {
    if (!fullView) {
      return {
        listingCount: 0,
        averageViews: 0,
        averageSaves: 0,
        requestRate: 0,
        topViewed: null,
        topSaved: null,
        topRequested: null,
      };
    }

    const listingCount = fullView.listingRows.length;
    const totalViews = fullView.listingRows.reduce((sum, row) => sum + row.views, 0);
    const totalSaves = fullView.listingRows.reduce((sum, row) => sum + row.saves, 0);
    const totalRequests = fullView.listingRows.reduce((sum, row) => sum + row.appointmentRequests, 0);

    return {
      listingCount,
      averageViews: listingCount ? totalViews / listingCount : 0,
      averageSaves: listingCount ? totalSaves / listingCount : 0,
      requestRate: totalViews ? (totalRequests / totalViews) * 100 : 0,
      topViewed: [...fullView.listingRows].sort((left, right) => right.views - left.views)[0] ?? null,
      topSaved: [...fullView.listingRows].sort((left, right) => right.saves - left.saves)[0] ?? null,
      topRequested: [...fullView.listingRows].sort((left, right) => right.appointmentRequests - left.appointmentRequests)[0] ?? null,
    };
  }, [fullView]);

  const mobileSummary = useMemo(() => {
    if (!fullView) return null;

    const mostlyEmpty =
      fullView.kpis.totalListingViews === 0 &&
      fullView.kpis.agencyInquiries === 0 &&
      fullView.kpis.savedProperties === 0 &&
      fullView.kpis.appointmentRequests === 0;

    const pipelineEntries = [
      ["new", fullView.pipelineCounts.new],
      ["assigned", fullView.pipelineCounts.assigned],
      ["contacted", fullView.pipelineCounts.contacted],
      ["qualified", fullView.pipelineCounts.qualified],
      ["appointment_scheduled", fullView.pipelineCounts.appointment_scheduled],
      ["viewed", fullView.pipelineCounts.viewed],
      ["negotiation", fullView.pipelineCounts.negotiation],
      ["closed_won", fullView.pipelineCounts.closed_won],
      ["closed_lost", fullView.pipelineCounts.closed_lost],
      ["unresponsive", fullView.pipelineCounts.unresponsive],
      ["spam", fullView.pipelineCounts.spam],
    ] as Array<[string, number]>;

    const prioritizedPipelineEntries = pipelineEntries
      .filter(([, count]) => count > 0)
      .sort((left, right) => right[1] - left[1]);

    const lowInteractionCount = fullView.listingRows.filter((row) => row.views === 0).length;
    const lowPerformanceCount = fullView.listingRows.filter((row) => row.views > 0 && row.appointmentRequests === 0).length;
    const listingIssueScore = fullView.listingRows.length
      ? Math.round(((lowInteractionCount + lowPerformanceCount) / Math.max(1, fullView.listingRows.length * 2)) * 100)
      : 0;

    return {
      mostlyEmpty,
      heroKpis: [
        { key: "leads", label: t("analytics.agencyInquiries"), value: formatNumber(fullView.kpis.agencyInquiries, language, t) },
        { key: "appointments", label: t("analytics.appointments"), value: formatNumber(fullView.appointments.length, language, t) },
        { key: "views", label: t("analytics.views"), value: formatNumber(fullView.kpis.totalListingViews, language, t) },
        { key: "conversion", label: t("analytics.conversion"), value: formatPercent(fullView.kpis.conversionRate, t) },
      ],
      statusCards: [
        {
          key: "active",
          title: t("analytics.activeListings"),
          value: formatNumber(fullView.kpis.activeListings, language, t),
          copy: t("analytics.currentPropertyRecords"),
        },
        {
          key: "views",
          title: t("analytics.totalListingViews"),
          value: formatNumber(fullView.kpis.totalListingViews, language, t),
          copy: fullView.kpis.totalListingViews === 0 ? t("analytics.mobileNoActivityBody") : t("analytics.liveFromPropertyViewEvents"),
        },
        {
          key: "appointments",
          title: t("analytics.appointmentRequests"),
          value: formatNumber(fullView.kpis.appointmentRequests, language, t),
          copy: fullView.appointmentStats.cancelled > 0 ? t("analytics.cancelledAppointments") : t("analytics.appointmentRequestsCopy"),
        },
      ],
      overviewRows: [
        {
          label: t("analytics.topViewedListing"),
          value: listingOverview.topViewed ? formatNumber(listingOverview.topViewed.views, language, t) : t("analytics.notAvailable"),
          copy: listingOverview.topViewed?.title ?? t("analytics.mobileNoDataShort"),
        },
        {
          label: t("analytics.mostSavedListing"),
          value: listingOverview.topSaved ? formatNumber(listingOverview.topSaved.saves, language, t) : t("analytics.notAvailable"),
          copy: listingOverview.topSaved?.title ?? t("analytics.mobileNoDataShort"),
        },
        {
          label: t("analytics.mostRequestedListing"),
          value: listingOverview.topRequested ? formatNumber(listingOverview.topRequested.appointmentRequests, language, t) : t("analytics.notAvailable"),
          copy: listingOverview.topRequested?.title ?? t("analytics.mobileNoDataShort"),
        },
      ],
      issueCards: [
        {
          key: "interaction",
          title: t("analytics.mobileLowListingInteraction"),
          value: formatNumber(lowInteractionCount, language, t),
          copy: t("analytics.mobileShortIssueCopy"),
        },
        {
          key: "performance",
          title: t("analytics.mobileLowListingPerformance"),
          value: formatNumber(lowPerformanceCount, language, t),
          copy: t("analytics.mobileShortIssueCopy"),
        },
        {
          key: "score",
          title: t("analytics.mobileAverageIssueScore"),
          value: `${listingIssueScore}%`,
          copy: t("analytics.mobileShortIssueCopy"),
        },
      ],
      pipelineEntries,
      prioritizedPipelineEntries,
      detailRows: [
        { label: t("analytics.savedProperties"), value: formatNumber(fullView.kpis.savedProperties, language, t) },
        { label: t("analytics.agencyInquiries"), value: formatNumber(fullView.kpis.agencyInquiries, language, t) },
        { label: t("analytics.appointmentRequests"), value: formatNumber(fullView.kpis.appointmentRequests, language, t) },
        { label: t("analytics.listingCardClicks"), value: formatNumber(fullView.kpis.listingCardClicks, language, t) },
        { label: t("analytics.contactClicks"), value: formatNumber(fullView.kpis.contactClicks, language, t) },
        { label: t("analytics.noShows"), value: formatNumber(fullView.appointmentStats.noShows, language, t) },
      ],
    };
  }, [fullView, language, listingOverview, t]);

  useEffect(() => {
    setListingPage(1);
  }, [agentId, analyticsStep, endDate, listingStatus, propertyType, startDate, township]);

  if (!profileReady || loading) {
    return embedded ? (
      <EmbeddedStack>
        <Section>
          <SectionHead>
            <div style={{ display: "grid", gap: 10, width: "100%" }}>
              <SkeletonBlock $height={24} style={{ width: "28%" }} />
              <SkeletonBlock $height={16} style={{ width: "46%" }} />
            </div>
          </SectionHead>
          <FilterGrid>
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonBlock key={`analytics-filter-skeleton-${index}`} $height={46} $radius={16} />
            ))}
          </FilterGrid>
        </Section>
        <Section>
          <SkeletonBlock $height={20} style={{ width: "22%" }} />
          <KpiGrid>
            {Array.from({ length: 6 }, (_, index) => (
              <SkeletonBlock key={`analytics-kpi-skeleton-${index}`} $height={118} $radius={20} />
            ))}
          </KpiGrid>
        </Section>
        <SplitGrid>
          <Section>
            <SkeletonBlock $height={20} style={{ width: "34%" }} />
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonBlock key={`analytics-funnel-skeleton-${index}`} $height={54} $radius={16} />
            ))}
          </Section>
          <Section>
            <SkeletonBlock $height={20} style={{ width: "30%" }} />
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonBlock key={`analytics-side-skeleton-${index}`} $height={72} $radius={18} />
            ))}
          </Section>
        </SplitGrid>
      </EmbeddedStack>
    ) : (
      <LoadingOverlay message={t("analytics.loading")} />
    );
  }

  const plan = (workspace?.plan ?? "free").toLowerCase();

  const content = (
    <>
      {error ? (
        <EmptyState>
          <SectionHead>
            <div>
              <SectionTitle>{t("analytics.unavailable")}</SectionTitle>
              <SectionCopy>{error}</SectionCopy>
            </div>
          </SectionHead>
        </EmptyState>
      ) : null}

      {!error && plan === "free" ? (
        <LockCard>
          <SectionHead>
            <div>
              <SectionTitle>{t("analytics.freeLockedTitle")}</SectionTitle>
              <SectionCopy>
                {t("analytics.freeLockedCopy")}
              </SectionCopy>
            </div>
            <NotePill>
              <Lock size={14} />
              {t("analytics.upgradeRequired")}
            </NotePill>
          </SectionHead>
          <ActionRow>
            <PrimaryLink href="/hub/upgrade">
                {t("analytics.upgradeToGrowth")}
              <ArrowUpRight size={16} />
            </PrimaryLink>
            {!embedded ? <SecondaryLink href="/hub">{t("analytics.returnToHub")}</SecondaryLink> : null}
          </ActionRow>
        </LockCard>
      ) : null}

      {!error && plan === "pro" && overview ? (
        <>
          <Section>
            <SectionHead>
              <div>
                <SectionTitle>{t("analytics.basicTitle")}</SectionTitle>
                <SectionCopy>
                  {t("analytics.basicCopy")}
                </SectionCopy>
              </div>
              <NotePill>
                <Sparkles size={14} />
                {t("analytics.growthUnlocks")}
              </NotePill>
            </SectionHead>
            <KpiGrid>
              <KpiCard>
                <KpiLabel>{t("analytics.totalListingViews")}</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.listingViewsCount, language, t)}</KpiValue>
                <KpiHint>{t("analytics.liveListingDetailTracking")}</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>{t("analytics.newInquiries")}</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.inquiryLeadCount, language, t)}</KpiValue>
                <KpiHint>{t("analytics.agencyLeadInboxVolume")}</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>{t("analytics.appointments")}</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.appointmentsCount, language, t)}</KpiValue>
                <KpiHint>{t("analytics.combinedAppointmentRecords")}</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>{t("analytics.activeListings")}</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.totalProperties, language, t)}</KpiValue>
                <KpiHint>{t("analytics.currentPropertyRecords")}</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>{t("analytics.qualifiedLeads")}</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.qualifiedLeadCount ?? null, language, t)}</KpiValue>
                <KpiHint>{t("analytics.liveCrmQualificationCount")}</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>{t("analytics.closedLeads")}</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.closedLeadCount ?? null, language, t)}</KpiValue>
                <KpiHint>{t("analytics.leadOutcomesClosed")}</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>{t("analytics.leadConversionRate")}</KpiLabel>
                <KpiValue>{formatPercent(overview.metrics.leadConversionRate ?? null, t)}</KpiValue>
                <KpiHint>{t("analytics.closedLeadsDividedByInquiries")}</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>{t("analytics.viewToLeadRate")}</KpiLabel>
                <KpiValue>{formatPercent(overview.metrics.viewToLeadRate ?? null, t)}</KpiValue>
                <KpiHint>{t("analytics.inquiryConversionFromViews")}</KpiHint>
              </KpiCard>
            </KpiGrid>
          </Section>

          <SplitGrid>
            <Section>
              <SectionHead>
                <div>
                  <SectionTitle>{t("analytics.listingTypes")}</SectionTitle>
                  <SectionCopy>{t("analytics.currentPropertyMix")}</SectionCopy>
                </div>
              </SectionHead>
              <Stack>
                {sortCountEntries(overview.listingTypes).map((item, index, list) => {
                  const max = Math.max(1, ...list.map((entry) => entry.count));
                  return (
                    <PipelineRow key={item.key}>
                      <PipelineMeta>
                        <span>{labelize(item.key, t)}</span>
                        <span>{formatNumber(item.count, language, t)}</span>
                      </PipelineMeta>
                      <Track>
                        <Fill $width={(item.count / max) * 100} $tint={index % 2 === 0 ? undefined : "#ff8ca3"} />
                      </Track>
                    </PipelineRow>
                  );
                })}
              </Stack>
            </Section>

            <Section>
              <SectionHead>
                <div>
                  <SectionTitle>{t("analytics.topViewedListings")}</SectionTitle>
                  <SectionCopy>{t("analytics.topViewedListingsCopy")}</SectionCopy>
                </div>
              </SectionHead>
              <MiniList>
                {(overview.marketInsights?.topViewedListings ?? []).slice(0, 5).map((item) => (
                  <MiniRow key={item.property_id}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong>{item.title}</strong>
                      <span style={{ color: "var(--color-muted)", fontSize: "0.86rem" }}>
                        {[
                          item.township ? translateLocationName(item.township, language) : null,
                          item.status ? labelize(item.status, t) : null,
                        ].filter(Boolean).join(" • ") || t("analytics.noLocation")}
                      </span>
                    </div>
                    <Pill $tone="accent">{t("analytics.viewsCount", { count: formatNumber(item.views, language, t) })}</Pill>
                  </MiniRow>
                ))}
              </MiniList>
            </Section>
          </SplitGrid>

          <LockCard>
            <SectionHead>
              <div>
                <SectionTitle>{t("analytics.upgradeFullTitle")}</SectionTitle>
                <SectionCopy>
                  {t("analytics.upgradeFullCopy")}
                </SectionCopy>
              </div>
            </SectionHead>
            <ActionRow>
              <PrimaryLink href="/hub/upgrade">
                {t("analytics.upgradePlan")}
                <ChevronRight size={16} />
              </PrimaryLink>
            </ActionRow>
          </LockCard>
        </>
      ) : null}

      {!error && fullAnalytics && fullView ? (
        <>
          {analyticsStep === "listing-performance" ? (
            <Section>
              <SectionHead>
                <div>
                  <SectionTitle>{t("analytics.listingPerformance")}</SectionTitle>
                  <SectionCopy>
                    {t("analytics.listingPerformanceCopy")}
                  </SectionCopy>
                </div>
                <InlineButton type="button" onClick={() => setAnalyticsStep("overview")}>
                  <ArrowLeft size={16} />
                  {t("analytics.backToOverview")}
                </InlineButton>
              </SectionHead>
              <FilterGrid>
                <FilterControlWrap>
                  <CustomSelect id="listing-detail-property-type" name="listing-detail-property-type" label={t("analytics.propertyType")} value={propertyType} onChange={setPropertyType}>
                    <option value="all">{t("analytics.all")}</option>
                    {fullAnalytics.filterOptions.propertyTypes.map((option) => (
                      <option key={option} value={option}>
                        {labelize(option, t)}
                      </option>
                    ))}
                  </CustomSelect>
                </FilterControlWrap>
                <FilterControlWrap>
                  <CustomSelect id="listing-detail-agent" name="listing-detail-agent" label={t("analytics.agent")} value={agentId} onChange={setAgentId}>
                    <option value="all">{t("analytics.allAgents")}</option>
                    {fullAnalytics.filterOptions.agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </CustomSelect>
                </FilterControlWrap>
                <FilterControlWrap>
                  <CustomSelect id="listing-detail-status" name="listing-detail-status" label={t("analytics.listingStatus")} value={listingStatus} onChange={setListingStatus}>
                    <option value="all">{t("analytics.allStatuses")}</option>
                    {fullAnalytics.filterOptions.listingStatuses.map((option) => (
                      <option key={option} value={option}>
                        {labelize(option, t)}
                      </option>
                    ))}
                  </CustomSelect>
                </FilterControlWrap>
                <FilterControlWrap>
                  <CustomSelect id="listing-detail-township" name="listing-detail-township" label={t("analytics.township")} value={township} onChange={setTownship}>
                    <option value="all">{t("analytics.all")}</option>
                    {fullAnalytics.filterOptions.townships.map((option) => (
                      <option key={option} value={option}>
                        {translateLocationName(option, language)}
                      </option>
                    ))}
                  </CustomSelect>
                </FilterControlWrap>
              </FilterGrid>
              <ListingCardsGrid>
                {fullView.listingRows.slice((listingPage - 1) * 8, listingPage * 8).map((row) => (
                  <ListingPerformanceCard key={row.id}>
                    <ListingPerformanceBody>
                      <ListingPerformanceImage $image={row.coverImageUrl ?? undefined}>
                        {!row.coverImageUrl ? <Building2 size={28} /> : null}
                      </ListingPerformanceImage>
                      <ListingPerformanceMain>
                        <ListingPerformanceTop>
                          <ListingPerformanceTitleWrap>
                            <strong>{row.title}</strong>
                            <ListingMeta>
                              <Pill $tone="soft">
                                <Building2 size={12} />
                                {labelize(row.propertyType, t)}
                              </Pill>
                              <Pill $tone="soft">
                                <MapPin size={12} />
                                {row.township ? translateLocationName(row.township, language) : t("analytics.unknown")}
                              </Pill>
                              <Pill $tone="accent">{row.agentName}</Pill>
                              <Pill $tone="accent">{labelize(row.status, t)}</Pill>
                            </ListingMeta>
                          </ListingPerformanceTitleWrap>
                        </ListingPerformanceTop>
                        <ListingPerformanceStats>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Eye size={13} />
                              {t("analytics.views")}
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.views, language, t)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Heart size={13} />
                              {t("analytics.saves")}
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.saves, language, t)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Calendar size={13} />
                              {t("analytics.requests")}
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.appointmentRequests, language, t)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <BadgeCheck size={13} />
                              {t("analytics.appointments")}
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.appointments, language, t)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Sparkles size={13} />
                              {t("analytics.listingCardClicks")}
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.cardClicks, language, t)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Users2 size={13} />
                              {t("analytics.contactClicks")}
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.contactClicks, language, t)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <ArrowUpRight size={13} />
                              {t("analytics.conversion")}
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatPercent(row.conversionRate, t)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Lock size={13} />
                              {t("hub.boostings")}
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{t("analytics.notAvailable")}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                        </ListingPerformanceStats>
                      </ListingPerformanceMain>
                    </ListingPerformanceBody>
                  </ListingPerformanceCard>
                ))}
              </ListingCardsGrid>
              <PaginationRow>
                <SectionCopy>
                  {t("analytics.showingListings", {
                    start: Math.min((listingPage - 1) * 8 + 1, fullView.listingRows.length),
                    end: Math.min(listingPage * 8, fullView.listingRows.length),
                    total: fullView.listingRows.length,
                  })}
                </SectionCopy>
                <ActionRow>
                  <InlineButton type="button" onClick={() => setListingPage((current) => Math.max(1, current - 1))} disabled={listingPage === 1}>
                    <ChevronLeft size={16} />
                    {t("common.back")}
                  </InlineButton>
                  <InlineButton
                    type="button"
                    onClick={() => setListingPage((current) => Math.min(Math.max(1, Math.ceil(fullView.listingRows.length / 8)), current + 1))}
                    disabled={listingPage >= Math.max(1, Math.ceil(fullView.listingRows.length / 8))}
                  >
                    {t("common.next")}
                    <ChevronRight size={16} />
                  </InlineButton>
                </ActionRow>
              </PaginationRow>
            </Section>
          ) : (
            <>
              <StickyFilters>
                <FilterTop>
                  <FilterTitle>
                    <Calendar size={16} />
                    {t("filter.searchFilters")}
                  </FilterTitle>
                  <MobileFilterLauncher type="button" aria-label={t("filter.searchFilters")} onClick={() => setMobileFiltersOpen(true)}>
                    <Filter size={18} />
                    {activeMobileFilterCount > 0 ? <MobileFilterCount>{activeMobileFilterCount}</MobileFilterCount> : null}
                  </MobileFilterLauncher>
                  <PresetRow>
                    {[
                      { value: "30d" as const, label: t("analytics.last30Days") },
                      { value: "90d" as const, label: t("analytics.last90Days") },
                      { value: "365d" as const, label: t("analytics.last12Months") },
                      { value: "all" as const, label: t("analytics.allTime") },
                    ].map((item) => (
                      <PresetButton key={item.value} type="button" $active={preset === item.value} onClick={() => setPreset(item.value)}>
                        {item.label}
                      </PresetButton>
                    ))}
                    <PresetButton type="button" $active={preset === "custom"} onClick={() => setPreset("custom")}>
                      {t("analytics.custom")}
                    </PresetButton>
                  </PresetRow>
                </FilterTop>
                <MobileTopBar>
                  <MobilePresetScroller>
                    {[
                      { value: "30d" as const, label: "30d" },
                      { value: "90d" as const, label: "90d" },
                      { value: "365d" as const, label: "12m" },
                      { value: "all" as const, label: "all" },
                    ].map((item) => (
                      <PresetButton key={`mobile-${item.value}`} type="button" $active={preset === item.value} onClick={() => setPreset(item.value)}>
                        {item.label}
                      </PresetButton>
                    ))}
                    <MobileFilterLauncher type="button" aria-label={t("filter.searchFilters")} onClick={() => setMobileFiltersOpen(true)}>
                      <Filter size={18} />
                      {activeMobileFilterCount > 0 ? <MobileFilterCount>{activeMobileFilterCount}</MobileFilterCount> : null}
                    </MobileFilterLauncher>
                  </MobilePresetScroller>
                </MobileTopBar>
                <FilterGrid>
                  <AnalyticsDatePicker
                    id="analytics-start-date"
                    label={t("analytics.startDate")}
                    value={startDate}
                    language={language}
                    t={t}
                    onChange={(nextValue) => {
                      setPreset("custom");
                      setStartDate(nextValue);
                    }}
                  />
                  <AnalyticsDatePicker
                    id="analytics-end-date"
                    label={t("analytics.endDate")}
                    value={endDate}
                    language={language}
                    t={t}
                    onChange={(nextValue) => {
                      setPreset("custom");
                      setEndDate(nextValue);
                    }}
                  />
                  <FilterControlWrap>
                    <CustomSelect id="analytics-property-type" name="analytics-property-type" label={t("analytics.propertyType")} value={propertyType} onChange={setPropertyType}>
                      <option value="all">{t("analytics.all")}</option>
                      {fullAnalytics.filterOptions.propertyTypes.map((option) => (
                        <option key={option} value={option}>
                          {labelize(option, t)}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                  <FilterControlWrap>
                    <CustomSelect id="analytics-agent" name="analytics-agent" label={t("analytics.agent")} value={agentId} onChange={setAgentId}>
                      <option value="all">{t("analytics.allAgents")}</option>
                      {fullAnalytics.filterOptions.agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                  <FilterControlWrap>
                    <CustomSelect id="analytics-listing-status" name="analytics-listing-status" label={t("analytics.listingStatus")} value={listingStatus} onChange={setListingStatus}>
                      <option value="all">{t("analytics.allStatuses")}</option>
                      {fullAnalytics.filterOptions.listingStatuses.map((option) => (
                        <option key={option} value={option}>
                          {labelize(option, t)}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                  <FilterControlWrap>
                    <CustomSelect id="analytics-township" name="analytics-township" label={t("analytics.township")} value={township} onChange={setTownship}>
                      <option value="all">{t("analytics.all")}</option>
                      {fullAnalytics.filterOptions.townships.map((option) => (
                        <option key={option} value={option}>
                          {translateLocationName(option, language)}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                </FilterGrid>
              </StickyFilters>
              <MobileFilterOverlay type="button" $open={mobileFiltersOpen} aria-label={t("filter.searchFilters")} onClick={() => setMobileFiltersOpen(false)} />
              <MobileFilterSheet $open={mobileFiltersOpen}>
                <MobileFilterHeader>
                  <MobileFilterTitle>
                    <FilterTitle>
                      <Filter size={16} />
                      {t("filter.searchFilters")}
                    </FilterTitle>
                    <SectionCopy>{t("analytics.kpiSummaryCopy")}</SectionCopy>
                  </MobileFilterTitle>
                  <MobileFilterClose type="button" aria-label={t("common.close")} onClick={() => setMobileFiltersOpen(false)}>
                    <X size={18} />
                  </MobileFilterClose>
                </MobileFilterHeader>
                <MobilePresetRow>
                  {[
                    { value: "30d" as const, label: t("analytics.last30Days") },
                    { value: "90d" as const, label: t("analytics.last90Days") },
                    { value: "365d" as const, label: t("analytics.last12Months") },
                    { value: "all" as const, label: t("analytics.allTime") },
                  ].map((item) => (
                    <PresetButton key={item.value} type="button" $active={preset === item.value} onClick={() => setPreset(item.value)}>
                      {item.label}
                    </PresetButton>
                  ))}
                  <PresetButton type="button" $active={preset === "custom"} onClick={() => setPreset("custom")}>
                    {t("analytics.custom")}
                  </PresetButton>
                </MobilePresetRow>
                <MobileFilterGrid>
                  <AnalyticsDatePicker
                    id="analytics-start-date-mobile"
                    label={t("analytics.startDate")}
                    value={startDate}
                    language={language}
                    t={t}
                    onChange={(nextValue) => {
                      setPreset("custom");
                      setStartDate(nextValue);
                    }}
                  />
                  <AnalyticsDatePicker
                    id="analytics-end-date-mobile"
                    label={t("analytics.endDate")}
                    value={endDate}
                    language={language}
                    t={t}
                    onChange={(nextValue) => {
                      setPreset("custom");
                      setEndDate(nextValue);
                    }}
                  />
                  <FilterControlWrap>
                    <CustomSelect id="analytics-property-type-mobile" name="analytics-property-type-mobile" label={t("analytics.propertyType")} value={propertyType} onChange={setPropertyType}>
                      <option value="all">{t("analytics.all")}</option>
                      {fullAnalytics.filterOptions.propertyTypes.map((option) => (
                        <option key={option} value={option}>
                          {labelize(option, t)}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                  <FilterControlWrap>
                    <CustomSelect id="analytics-agent-mobile" name="analytics-agent-mobile" label={t("analytics.agent")} value={agentId} onChange={setAgentId}>
                      <option value="all">{t("analytics.allAgents")}</option>
                      {fullAnalytics.filterOptions.agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                  <FilterControlWrap>
                    <CustomSelect id="analytics-listing-status-mobile" name="analytics-listing-status-mobile" label={t("analytics.listingStatus")} value={listingStatus} onChange={setListingStatus}>
                      <option value="all">{t("analytics.allStatuses")}</option>
                      {fullAnalytics.filterOptions.listingStatuses.map((option) => (
                        <option key={option} value={option}>
                          {labelize(option, t)}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                  <FilterControlWrap>
                    <CustomSelect id="analytics-township-mobile" name="analytics-township-mobile" label={t("analytics.township")} value={township} onChange={setTownship}>
                      <option value="all">{t("analytics.all")}</option>
                      {fullAnalytics.filterOptions.townships.map((option) => (
                        <option key={option} value={option}>
                          {translateLocationName(option, language)}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                </MobileFilterGrid>
              </MobileFilterSheet>
              {isMobileViewport && mobileSummary ? (
                <MobileOverviewStack>
                  <MobilePanel>
                    <MobilePanelHead>
                      <MobilePanelTitle>{t("analytics.kpiSummary")}</MobilePanelTitle>
                      <MobilePanelCopy>{t("analytics.mobileCompactSummaryCopy")}</MobilePanelCopy>
                    </MobilePanelHead>
                    {mobileSummary.mostlyEmpty ? (
                      <MobileEmptyState>
                        <strong>{t("analytics.mobileNoActivityTitle")}</strong>
                        <MobilePanelCopy>{t("analytics.mobileNoActivityBody")}</MobilePanelCopy>
                      </MobileEmptyState>
                    ) : (
                      <MobileKpiGrid>
                        {mobileSummary.heroKpis.map((item) => (
                          <MobileKpiCard key={item.key}>
                            <MobileKpiLabel>{item.label}</MobileKpiLabel>
                            <MobileKpiValue>{item.value}</MobileKpiValue>
                          </MobileKpiCard>
                        ))}
                      </MobileKpiGrid>
                    )}
                    <MobileStatusGrid>
                      {mobileSummary.statusCards.map((item) => (
                        <MobileStatusCard key={item.key}>
                          <MobileStatusTitle>{item.title}</MobileStatusTitle>
                          <MobileStatusValue>{item.value}</MobileStatusValue>
                          <MobileStatusCopy>{item.copy}</MobileStatusCopy>
                        </MobileStatusCard>
                      ))}
                    </MobileStatusGrid>
                  </MobilePanel>

                  <MobileAccordionList>
                    <MobileAccordionCard>
                      <MobileAccordionTrigger
                        type="button"
                        $open={mobileOpenSections.overview}
                        onClick={() => setMobileOpenSections((current) => ({ ...current, overview: !current.overview }))}
                      >
                        <MobileAccordionTitleWrap>
                          <MobileAccordionTitle>{t("analytics.mobileOverviewSection")}</MobileAccordionTitle>
                          <MobileAccordionMeta>{t("analytics.listingPerformanceOverviewCopy")}</MobileAccordionMeta>
                        </MobileAccordionTitleWrap>
                        <ChevronDown size={18} />
                      </MobileAccordionTrigger>
                      <MobileAccordionContent $open={mobileOpenSections.overview}>
                        <MobileIssueGrid>
                          {mobileSummary.issueCards.map((item) => (
                            <MobileIssueCard key={item.key}>
                              <MobileIssueTitle>{item.title}</MobileIssueTitle>
                              <MobileIssueValue>{item.value}</MobileIssueValue>
                              <MobileIssueCopy>{item.copy}</MobileIssueCopy>
                            </MobileIssueCard>
                          ))}
                        </MobileIssueGrid>
                        <MobileRowList>
                          {mobileSummary.overviewRows.map((item) => (
                            <MobileRow key={item.label}>
                              <div style={{ minWidth: 0, display: "grid", gap: 3 }}>
                                <MobileRowLabel>{item.label}</MobileRowLabel>
                                <MobilePanelCopy>{item.copy}</MobilePanelCopy>
                              </div>
                              <MobileRowValue>{item.value}</MobileRowValue>
                            </MobileRow>
                          ))}
                        </MobileRowList>
                        <InlineButton type="button" onClick={() => setAnalyticsStep("listing-performance")}>
                          <Building2 size={16} />
                          {t("analytics.viewListingPerformance")}
                        </InlineButton>
                      </MobileAccordionContent>
                    </MobileAccordionCard>

                    <MobileAccordionCard>
                      <MobileAccordionTrigger
                        type="button"
                        $open={mobileOpenSections.pipeline}
                        onClick={() => setMobileOpenSections((current) => ({ ...current, pipeline: !current.pipeline }))}
                      >
                        <MobileAccordionTitleWrap>
                          <MobileAccordionTitle>{t("analytics.leadPipeline")}</MobileAccordionTitle>
                          <MobileAccordionMeta>{t("analytics.mobileCompactPipelineCopy")}</MobileAccordionMeta>
                        </MobileAccordionTitleWrap>
                        <ChevronDown size={18} />
                      </MobileAccordionTrigger>
                      <MobileAccordionContent $open={mobileOpenSections.pipeline}>
                        {mobileSummary.prioritizedPipelineEntries.length ? (
                          <MobileRowList>
                            {(mobileShowAllPipeline
                              ? mobileSummary.pipelineEntries
                              : mobileSummary.prioritizedPipelineEntries.slice(0, 5)
                            ).map(([key, count]) => (
                              <MobileRow key={key}>
                                <MobileRowLabel>{labelize(key, t)}</MobileRowLabel>
                                <MobileRowValue>{formatNumber(count, language, t)}</MobileRowValue>
                              </MobileRow>
                            ))}
                          </MobileRowList>
                        ) : (
                          <MobileEmptyState>
                            <strong>{t("analytics.leadPipeline")}</strong>
                            <MobilePanelCopy>{t("analytics.mobileNoDataShort")}</MobilePanelCopy>
                          </MobileEmptyState>
                        )}
                        {mobileSummary.prioritizedPipelineEntries.length > 5 ? (
                          <InlineButton type="button" onClick={() => setMobileShowAllPipeline((current) => !current)}>
                            {mobileShowAllPipeline ? t("analytics.mobileShowFewerStatuses") : t("analytics.mobileShowAllStatuses")}
                          </InlineButton>
                        ) : null}
                      </MobileAccordionContent>
                    </MobileAccordionCard>

                    <MobileAccordionCard>
                      <MobileAccordionTrigger
                        type="button"
                        $open={mobileOpenSections.appointments}
                        onClick={() => setMobileOpenSections((current) => ({ ...current, appointments: !current.appointments }))}
                      >
                        <MobileAccordionTitleWrap>
                          <MobileAccordionTitle>{t("analytics.appointmentAnalytics")}</MobileAccordionTitle>
                          <MobileAccordionMeta>{t("analytics.appointmentAnalyticsCopy")}</MobileAccordionMeta>
                        </MobileAccordionTitleWrap>
                        <ChevronDown size={18} />
                      </MobileAccordionTrigger>
                      <MobileAccordionContent $open={mobileOpenSections.appointments}>
                        <MobileMetricGrid>
                          <MobileMetricCard>
                            <MobileKpiLabel>{t("analytics.totalAppointmentRequests")}</MobileKpiLabel>
                            <MobileKpiValue>{formatNumber(fullView.appointmentStats.totalRequests, language, t)}</MobileKpiValue>
                          </MobileMetricCard>
                          <MobileMetricCard>
                            <MobileKpiLabel>{t("analytics.confirmedAppointments")}</MobileKpiLabel>
                            <MobileKpiValue>{formatNumber(fullView.appointmentStats.confirmed, language, t)}</MobileKpiValue>
                          </MobileMetricCard>
                          <MobileMetricCard>
                            <MobileKpiLabel>{t("analytics.completedAppointments")}</MobileKpiLabel>
                            <MobileKpiValue>{formatNumber(fullView.appointmentStats.completed, language, t)}</MobileKpiValue>
                          </MobileMetricCard>
                          <MobileMetricCard>
                            <MobileKpiLabel>{t("analytics.cancelledAppointments")}</MobileKpiLabel>
                            <MobileKpiValue>{formatNumber(fullView.appointmentStats.cancelled, language, t)}</MobileKpiValue>
                          </MobileMetricCard>
                        </MobileMetricGrid>
                        <MobileRowList>
                          {fullView.mostRequestedListings.length ? fullView.mostRequestedListings.map((item) => (
                            <MobileRow key={item.propertyId}>
                              <MobileRowLabel>{item.title}</MobileRowLabel>
                              <MobileRowValue>{formatNumber(item.count, language, t)}</MobileRowValue>
                            </MobileRow>
                          )) : (
                            <MobileEmptyState>
                              <strong>{t("analytics.mostRequestedListings")}</strong>
                              <MobilePanelCopy>{t("analytics.mobileNoDataShort")}</MobilePanelCopy>
                            </MobileEmptyState>
                          )}
                        </MobileRowList>
                      </MobileAccordionContent>
                    </MobileAccordionCard>

                    <MobileAccordionCard>
                      <MobileAccordionTrigger
                        type="button"
                        $open={mobileOpenSections.promotions}
                        onClick={() => setMobileOpenSections((current) => ({ ...current, promotions: !current.promotions }))}
                      >
                        <MobileAccordionTitleWrap>
                          <MobileAccordionTitle>{t("analytics.promotionPerformance")}</MobileAccordionTitle>
                          <MobileAccordionMeta>{t("analytics.livePromotionRecords", { count: fullAnalytics.items.promotions.length })}</MobileAccordionMeta>
                        </MobileAccordionTitleWrap>
                        <ChevronDown size={18} />
                      </MobileAccordionTrigger>
                      <MobileAccordionContent $open={mobileOpenSections.promotions}>
                        {fullAnalytics.items.promotions.length ? (
                          <MobileRowList>
                            {fullAnalytics.items.promotions.map((item) => (
                              <MobileMetricCard key={item.id}>
                                <MobileRowLabel>{item.title}</MobileRowLabel>
                                <MobileRowList>
                                  <MobileRow>
                                    <MobileRowLabel>{t("analytics.impressions")}</MobileRowLabel>
                                    <MobileRowValue>{t("analytics.notAvailable")}</MobileRowValue>
                                  </MobileRow>
                                  <MobileRow>
                                    <MobileRowLabel>{t("analytics.clicks")}</MobileRowLabel>
                                    <MobileRowValue>{t("analytics.notAvailable")}</MobileRowValue>
                                  </MobileRow>
                                  <MobileRow>
                                    <MobileRowLabel>{t("analytics.conversion")}</MobileRowLabel>
                                    <MobileRowValue>{t("analytics.notAvailable")}</MobileRowValue>
                                  </MobileRow>
                                  <MobileRow>
                                    <MobileRowLabel>{t("analytics.status")}</MobileRowLabel>
                                    <MobileRowValue>{labelize(item.status, t)}</MobileRowValue>
                                  </MobileRow>
                                </MobileRowList>
                              </MobileMetricCard>
                            ))}
                          </MobileRowList>
                        ) : (
                          <MobileEmptyState>
                            <strong>{t("analytics.promotionPerformance")}</strong>
                            <MobilePanelCopy>{t("analytics.noPromotionRecords")}</MobilePanelCopy>
                          </MobileEmptyState>
                        )}
                      </MobileAccordionContent>
                    </MobileAccordionCard>

                    <MobileAccordionCard>
                      <MobileAccordionTrigger
                        type="button"
                        $open={mobileOpenSections.detailed}
                        onClick={() => setMobileOpenSections((current) => ({ ...current, detailed: !current.detailed }))}
                      >
                        <MobileAccordionTitleWrap>
                          <MobileAccordionTitle>{t("analytics.mobileDetailedMetrics")}</MobileAccordionTitle>
                          <MobileAccordionMeta>{t("analytics.untrackedMetricsMarked")}</MobileAccordionMeta>
                        </MobileAccordionTitleWrap>
                        <ChevronDown size={18} />
                      </MobileAccordionTrigger>
                      <MobileAccordionContent $open={mobileOpenSections.detailed}>
                        <MobileRowList>
                          {mobileSummary.detailRows.map((item) => (
                            <MobileRow key={item.label}>
                              <MobileRowLabel>{item.label}</MobileRowLabel>
                              <MobileRowValue>{item.value}</MobileRowValue>
                            </MobileRow>
                          ))}
                        </MobileRowList>
                      </MobileAccordionContent>
                    </MobileAccordionCard>
                  </MobileAccordionList>
                </MobileOverviewStack>
              ) : (
                <>
              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>{t("analytics.kpiSummary")}</SectionTitle>
                    <SectionCopy>{t("analytics.kpiSummaryCopy")}</SectionCopy>
                  </div>
                  <NotePill>
                    <Sparkles size={14} />
                    {t("analytics.untrackedMetricsMarked")}
                  </NotePill>
                </SectionHead>
                <KpiGrid>
                  <KpiCard>
                    <KpiLabel>{t("analytics.totalListingViews")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.totalListingViews, language, t)}</KpiValue>
                    <KpiHint>{t("analytics.liveFromPropertyViewEvents")}</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>{t("analytics.listingCardClicks")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.listingCardClicks, language, t)}</KpiValue>
                    <KpiHint>{t("analytics.todoCardClicks")}</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>{t("analytics.contactClicks")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.contactClicks, language, t)}</KpiValue>
                    <KpiHint>{t("analytics.todoContactClicks")}</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>{t("analytics.savedProperties")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.savedProperties, language, t)}</KpiValue>
                    <KpiHint>{t("analytics.savedPropertiesCopy")}</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>{t("analytics.agencyInquiries")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.agencyInquiries, language, t)}</KpiValue>
                    <KpiHint>{t("analytics.agencyInquiriesCopy")}</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>{t("analytics.appointmentRequests")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.appointmentRequests, language, t)}</KpiValue>
                    <KpiHint>{t("analytics.appointmentRequestsCopy")}</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>{t("analytics.conversionRate")}</KpiLabel>
                    <KpiValue>{formatPercent(fullView.kpis.conversionRate, t)}</KpiValue>
                    <KpiHint>{t("analytics.conversionRateCopy")}</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>{t("analytics.activeListings")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.activeListings, language, t)}</KpiValue>
                    <KpiHint>{t("analytics.activeListingsCopy")}</KpiHint>
                  </KpiCard>
                </KpiGrid>
              </Section>

              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>{t("analytics.listingInteractionFunnel")}</SectionTitle>
                    <SectionCopy>{t("analytics.listingInteractionFunnelCopy")}</SectionCopy>
                  </div>
                </SectionHead>
                <FunnelList>
                  {fullView.funnel.map((stage) => {
                    const maxValue = Math.max(1, ...fullView.funnel.map((item) => item.value ?? 0));
                    return (
                      <FunnelRow key={stage.key}>
                        <FunnelLabel>{stage.label}</FunnelLabel>
                        <Track>
                          <Fill $width={((stage.value ?? 0) / maxValue) * 100} />
                        </Track>
                        <FunnelValue>{stage.value === null ? t("analytics.notAvailable") : formatNumber(stage.value, language, t)}</FunnelValue>
                      </FunnelRow>
                    );
                  })}
                </FunnelList>
              </Section>

              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>{t("analytics.listingPerformance")}</SectionTitle>
                    <SectionCopy>{t("analytics.listingPerformanceOverviewCopy")}</SectionCopy>
                  </div>
                  <InlineButton type="button" onClick={() => setAnalyticsStep("listing-performance")}>
                    <Building2 size={16} />
                    {t("analytics.viewListingPerformance")}
                  </InlineButton>
                </SectionHead>
                <ListingOverviewGrid>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>{t("analytics.listingsInScope")}</strong>
                      <Pill $tone="accent">{formatNumber(listingOverview.listingCount, language, t)}</Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{t("analytics.listingsInScopeCopy")}</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>{t("analytics.averageViewsPerListing")}</strong>
                      <Pill $tone="accent">{formatNumber(listingOverview.averageViews, language, t)}</Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{t("analytics.averageViewsPerListingCopy")}</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>{t("analytics.averageSavesPerListing")}</strong>
                      <Pill $tone="accent">{formatNumber(listingOverview.averageSaves, language, t)}</Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{t("analytics.averageSavesPerListingCopy")}</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>{t("analytics.requestRate")}</strong>
                      <Pill $tone="accent">{formatPercent(listingOverview.requestRate, t)}</Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{t("analytics.requestRateCopy")}</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>{t("analytics.topViewedListing")}</strong>
                      <Pill $tone="accent">
                        <Eye size={12} />
                        {listingOverview.topViewed ? formatNumber(listingOverview.topViewed.views, language, t) : t("analytics.notAvailable")}
                      </Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{listingOverview.topViewed?.title ?? t("analytics.notAvailable")}</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>{t("analytics.mostSavedListing")}</strong>
                      <Pill $tone="accent">
                        <Heart size={12} />
                        {listingOverview.topSaved ? formatNumber(listingOverview.topSaved.saves, language, t) : t("analytics.notAvailable")}
                      </Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{listingOverview.topSaved?.title ?? t("analytics.notAvailable")}</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>{t("analytics.mostRequestedListing")}</strong>
                      <Pill $tone="accent">
                        <Calendar size={12} />
                        {listingOverview.topRequested ? formatNumber(listingOverview.topRequested.appointmentRequests, language, t) : t("analytics.notAvailable")}
                      </Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{listingOverview.topRequested?.title ?? t("analytics.notAvailable")}</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>{t("analytics.totalAppointments")}</strong>
                      <Pill $tone="accent">{formatNumber(fullView.appointments.length, language, t)}</Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{t("analytics.totalAppointmentsCopy")}</SectionCopy>
                  </ListingOverviewCard>
                </ListingOverviewGrid>
              </Section>

              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>{t("analytics.leadPipeline")}</SectionTitle>
                    <SectionCopy>{t("analytics.leadPipelineCopy")}</SectionCopy>
                  </div>
                </SectionHead>
                <Stack>
                  {(
                    [
                      ["new", fullView.pipelineCounts.new],
                      ["assigned", fullView.pipelineCounts.assigned],
                      ["contacted", fullView.pipelineCounts.contacted],
                      ["qualified", fullView.pipelineCounts.qualified],
                      ["appointment_scheduled", fullView.pipelineCounts.appointment_scheduled],
                      ["viewed", fullView.pipelineCounts.viewed],
                      ["negotiation", fullView.pipelineCounts.negotiation],
                      ["closed_won", fullView.pipelineCounts.closed_won],
                      ["closed_lost", fullView.pipelineCounts.closed_lost],
                      ["unresponsive", fullView.pipelineCounts.unresponsive],
                      ["spam", fullView.pipelineCounts.spam],
                    ] as Array<[string, number]>
                  ).map(([key, count]) => {
                    const max = Math.max(1, ...Object.values(fullView.pipelineCounts));
                    return (
                      <PipelineRow key={key}>
                        <PipelineMeta>
                          <span>{labelize(key, t)}</span>
                          <span>{formatNumber(count, language, t)}</span>
                        </PipelineMeta>
                        <Track>
                          <Fill $width={(count / max) * 100} />
                        </Track>
                      </PipelineRow>
                    );
                  })}
                </Stack>
              </Section>

              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>{t("analytics.appointmentAnalytics")}</SectionTitle>
                    <SectionCopy>{t("analytics.appointmentAnalyticsCopy")}</SectionCopy>
                  </div>
                </SectionHead>
                <MetricList>
                  <MetricBox>
                    <KpiLabel>{t("analytics.totalAppointmentRequests")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.appointmentStats.totalRequests, language, t)}</KpiValue>
                  </MetricBox>
                  <MetricBox>
                    <KpiLabel>{t("analytics.confirmedAppointments")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.appointmentStats.confirmed, language, t)}</KpiValue>
                  </MetricBox>
                  <MetricBox>
                    <KpiLabel>{t("analytics.completedAppointments")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.appointmentStats.completed, language, t)}</KpiValue>
                  </MetricBox>
                  <MetricBox>
                    <KpiLabel>{t("analytics.cancelledAppointments")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.appointmentStats.cancelled, language, t)}</KpiValue>
                  </MetricBox>
                  <MetricBox>
                    <KpiLabel>{t("analytics.noShows")}</KpiLabel>
                    <KpiValue>{formatNumber(fullView.appointmentStats.noShows, language, t)}</KpiValue>
                  </MetricBox>
                </MetricList>
                <SplitGrid>
                  <div>
                    <SectionTitle style={{ fontSize: "0.98rem" }}>{t("analytics.appointmentsByPropertyType")}</SectionTitle>
                    <MiniList style={{ marginTop: 12 }}>
                      {fullView.appointmentsByType.map((item) => (
                        <MiniRow key={item.key}>
                          <strong>{labelize(item.key, t)}</strong>
                          <Pill $tone="accent">{formatNumber(item.count, language, t)}</Pill>
                        </MiniRow>
                      ))}
                    </MiniList>
                  </div>
                  <div>
                    <SectionTitle style={{ fontSize: "0.98rem" }}>{t("analytics.mostRequestedListings")}</SectionTitle>
                    <MiniList style={{ marginTop: 12 }}>
                      {fullView.mostRequestedListings.map((item) => (
                        <MiniRow key={item.propertyId}>
                          <strong>{item.title}</strong>
                          <Pill $tone="accent">{t("analytics.requestsCount", { count: formatNumber(item.count, language, t) })}</Pill>
                        </MiniRow>
                      ))}
                    </MiniList>
                  </div>
                </SplitGrid>
              </Section>

              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>{t("analytics.promotionPerformance")}</SectionTitle>
                    <SectionCopy>{t("analytics.promotionPerformanceCopy")}</SectionCopy>
                  </div>
                  <NotePill>
                    <Users2 size={14} />
                    {t("analytics.livePromotionRecords", { count: fullAnalytics.items.promotions.length })}
                  </NotePill>
                </SectionHead>
                {fullAnalytics.items.promotions.length ? (
                  <TableWrap>
                    <Table>
                      <thead>
                        <tr>
                          <th>{t("analytics.promotion")}</th>
                          <th>{t("analytics.impressions")}</th>
                          <th>{t("analytics.clicks")}</th>
                          <th>{t("analytics.ctr")}</th>
                          <th>{t("analytics.leadsGenerated")}</th>
                          <th>{t("analytics.appointmentsGenerated")}</th>
                          <th>{t("analytics.status")}</th>
                          <th>{t("analytics.startDate")}</th>
                          <th>{t("analytics.endDate")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fullAnalytics.items.promotions.map((item) => (
                          <tr key={item.id}>
                            <td>{item.title}</td>
                            <td>{t("analytics.notAvailable")}</td>
                            <td>{t("analytics.notAvailable")}</td>
                            <td>{t("analytics.notAvailable")}</td>
                            <td>{t("analytics.notAvailable")}</td>
                            <td>{t("analytics.notAvailable")}</td>
                            <td>
                              <Pill>{labelize(item.status, t)}</Pill>
                            </td>
                            <td>{formatDateLabel(item.startsAt, language, t)}</td>
                            <td>{formatDateLabel(item.endsAt, language, t)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </TableWrap>
                ) : (
                  <EmptyState>
                    {t("analytics.noPromotionRecords")}
                  </EmptyState>
                )}
              </Section>
                </>
              )}
            </>
          )}
        </>
          ) : null}
    </>
  );

  if (embedded) {
    return <EmbeddedStack>{content}</EmbeddedStack>;
  }

  return (
    <Page>
      <MarketplaceHeader />
      <Shell>
        <BackLink href="/hub">
          <ArrowLeft size={16} />
          {t("analytics.returnToHub")}
        </BackLink>
        {content}
      </Shell>
    </Page>
  );
}

export default function HubAnalyticsPage() {
  return <HubAnalyticsContent />;
}
