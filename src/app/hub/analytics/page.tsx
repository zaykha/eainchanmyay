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
  Heart,
  Lock,
  MapPin,
  Sparkles,
  Users2,
} from "lucide-react";
import { MarketplaceHeader } from "@/app/living-site/components/MarketplaceHeader";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { readActiveVendorWorkspace, withActiveVendorHeaders } from "@/app/living-site/lib/active-context";
import { useAppState } from "@/app/living-site/lib/app-state";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";

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
  };
  placeholders: {
    promotionPerformance: Array<{
      key: string;
      label: string;
      status: string;
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

  @media (max-width: 720px) {
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

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatNumber(value: number | null) {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number | null) {
  if (value === null) return "N/A";
  return `${value.toFixed(1)}%`;
}

function parseDateOnly(value: string) {
  const parts = value.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

function formatDatePickerLabel(value: string | undefined) {
  if (!value) return "";
  const parsed = parseDateOnly(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString("en-US", {
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

function AnalyticsDatePicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDateOnly(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate ?? new Date());
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

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
        <DateValue $muted={!value}>{formatDatePickerLabel(value) || "Select date"}</DateValue>
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
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
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
          throw new Error(workspacePayload?.error ?? "Unable to load vendor workspace.");
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
            throw new Error(overviewPayload?.error ?? "Unable to load basic analytics.");
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
          throw new Error(analyticsPayload?.error ?? "Unable to load full analytics.");
        }
        if (!cancelled) {
          setFullAnalytics(analyticsPayload);
          setOverview(null);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load analytics.");
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
  }, [activeVendorId, authToken, profileReady, profileRole, user]);

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
      { key: "search_impressions", label: "Search impressions", value: null },
      { key: "listing_card_clicks", label: "Listing card clicks", value: null },
      { key: "listing_detail_views", label: "Listing detail views", value: viewEvents.length },
      { key: "saved_properties", label: "Saved properties", value: savedProperties.length },
      { key: "appointment_requests", label: "Appointment requests", value: appointmentRequests.length },
      { key: "appointments", label: "Appointments", value: appointments.length },
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
  }, [agentId, endDate, fullAnalytics, listingStatus, propertyType, startDate, township]);

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
      <LoadingOverlay message="Loading agency analytics..." />
    );
  }

  const plan = (workspace?.plan ?? "free").toLowerCase();

  const content = (
    <>
      {error ? (
        <EmptyState>
          <SectionHead>
            <div>
              <SectionTitle>Analytics unavailable</SectionTitle>
              <SectionCopy>{error}</SectionCopy>
            </div>
          </SectionHead>
        </EmptyState>
      ) : null}

      {!error && plan === "free" ? (
        <LockCard>
          <SectionHead>
            <div>
              <SectionTitle>Full analytics are locked on Free</SectionTitle>
              <SectionCopy>
                The hub overview remains available, but live agency analytics, listing performance tables, and premium funnel views
                require a paid plan.
              </SectionCopy>
            </div>
            <NotePill>
              <Lock size={14} />
              Upgrade required
            </NotePill>
          </SectionHead>
          <ActionRow>
            <PrimaryLink href="/hub/upgrade">
              Upgrade to Growth
              <ArrowUpRight size={16} />
            </PrimaryLink>
            {!embedded ? <SecondaryLink href="/hub">Return to hub</SecondaryLink> : null}
          </ActionRow>
        </LockCard>
      ) : null}

      {!error && plan === "pro" && overview ? (
        <>
          <Section>
            <SectionHead>
              <div>
                <SectionTitle>Basic analytics</SectionTitle>
                <SectionCopy>
                  Pro currently exposes the existing live overview metrics. Full premium analytics, filters, and listing-level breakdowns
                  remain gated to Growth.
                </SectionCopy>
              </div>
              <NotePill>
                <Sparkles size={14} />
                Growth unlocks the full page
              </NotePill>
            </SectionHead>
            <KpiGrid>
              <KpiCard>
                <KpiLabel>Total listing views</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.listingViewsCount)}</KpiValue>
                <KpiHint>Live from listing detail view tracking.</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>New inquiries</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.inquiryLeadCount)}</KpiValue>
                <KpiHint>Agency lead inbox volume.</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>Appointments</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.appointmentsCount)}</KpiValue>
                <KpiHint>Combined appointment records already in the workspace.</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>Active listings</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.totalProperties)}</KpiValue>
                <KpiHint>Current property records in the workspace.</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>Qualified leads</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.qualifiedLeadCount ?? null)}</KpiValue>
                <KpiHint>Live CRM qualification count.</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>Closed leads</KpiLabel>
                <KpiValue>{formatNumber(overview.metrics.closedLeadCount ?? null)}</KpiValue>
                <KpiHint>Lead outcomes recorded as closed.</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>Lead conversion rate</KpiLabel>
                <KpiValue>{formatPercent(overview.metrics.leadConversionRate ?? null)}</KpiValue>
                <KpiHint>Closed leads divided by total inquiries.</KpiHint>
              </KpiCard>
              <KpiCard>
                <KpiLabel>View-to-lead rate</KpiLabel>
                <KpiValue>{formatPercent(overview.metrics.viewToLeadRate ?? null)}</KpiValue>
                <KpiHint>Inquiry conversion from tracked listing views.</KpiHint>
              </KpiCard>
            </KpiGrid>
          </Section>

          <SplitGrid>
            <Section>
              <SectionHead>
                <div>
                  <SectionTitle>Listing types</SectionTitle>
                  <SectionCopy>Current property mix from the overview endpoint.</SectionCopy>
                </div>
              </SectionHead>
              <Stack>
                {sortCountEntries(overview.listingTypes).map((item, index, list) => {
                  const max = Math.max(1, ...list.map((entry) => entry.count));
                  return (
                    <PipelineRow key={item.key}>
                      <PipelineMeta>
                        <span>{labelize(item.key)}</span>
                        <span>{formatNumber(item.count)}</span>
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
                  <SectionTitle>Top viewed listings</SectionTitle>
                  <SectionCopy>Most viewed properties available on Pro.</SectionCopy>
                </div>
              </SectionHead>
              <MiniList>
                {(overview.marketInsights?.topViewedListings ?? []).slice(0, 5).map((item) => (
                  <MiniRow key={item.property_id}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <strong>{item.title}</strong>
                      <span style={{ color: "var(--color-muted)", fontSize: "0.86rem" }}>
                        {[item.township, item.status ? labelize(item.status) : null].filter(Boolean).join(" • ") || "No location"}
                      </span>
                    </div>
                    <Pill $tone="accent">{formatNumber(item.views)} views</Pill>
                  </MiniRow>
                ))}
              </MiniList>
            </Section>
          </SplitGrid>

          <LockCard>
            <SectionHead>
              <div>
                <SectionTitle>Upgrade for full analytics</SectionTitle>
                <SectionCopy>
                  Growth unlocks sticky filters, listing performance tables, lead pipeline analytics, appointment breakdowns, and premium
                  promotion reporting slots.
                </SectionCopy>
              </div>
            </SectionHead>
            <ActionRow>
              <PrimaryLink href="/hub/upgrade">
                Upgrade plan
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
                  <SectionTitle>Listing performance</SectionTitle>
                  <SectionCopy>
                    Generic agency inquiries are not tied to listings, so this drill-in focuses on views, saves, requests, appointments, and conversion.
                  </SectionCopy>
                </div>
                <InlineButton type="button" onClick={() => setAnalyticsStep("overview")}>
                  <ArrowLeft size={16} />
                  Back to overview
                </InlineButton>
              </SectionHead>
              <FilterGrid>
                <FilterControlWrap>
                  <CustomSelect id="listing-detail-property-type" name="listing-detail-property-type" label="Property type" value={propertyType} onChange={setPropertyType}>
                    <option value="all">All</option>
                    {fullAnalytics.filterOptions.propertyTypes.map((option) => (
                      <option key={option} value={option}>
                        {labelize(option)}
                      </option>
                    ))}
                  </CustomSelect>
                </FilterControlWrap>
                <FilterControlWrap>
                  <CustomSelect id="listing-detail-agent" name="listing-detail-agent" label="Agent" value={agentId} onChange={setAgentId}>
                    <option value="all">All agents</option>
                    {fullAnalytics.filterOptions.agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </CustomSelect>
                </FilterControlWrap>
                <FilterControlWrap>
                  <CustomSelect id="listing-detail-status" name="listing-detail-status" label="Listing status" value={listingStatus} onChange={setListingStatus}>
                    <option value="all">All statuses</option>
                    {fullAnalytics.filterOptions.listingStatuses.map((option) => (
                      <option key={option} value={option}>
                        {labelize(option)}
                      </option>
                    ))}
                  </CustomSelect>
                </FilterControlWrap>
                <FilterControlWrap>
                  <CustomSelect id="listing-detail-township" name="listing-detail-township" label="Township" value={township} onChange={setTownship}>
                    <option value="all">All</option>
                    {fullAnalytics.filterOptions.townships.map((option) => (
                      <option key={option} value={option}>
                        {option}
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
                                {labelize(row.propertyType)}
                              </Pill>
                              <Pill $tone="soft">
                                <MapPin size={12} />
                                {row.township ?? "Unknown"}
                              </Pill>
                              <Pill $tone="accent">{row.agentName}</Pill>
                              <Pill $tone="accent">{labelize(row.status)}</Pill>
                            </ListingMeta>
                          </ListingPerformanceTitleWrap>
                        </ListingPerformanceTop>
                        <ListingPerformanceStats>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Eye size={13} />
                              Views
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.views)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Heart size={13} />
                              Saves
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.saves)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Calendar size={13} />
                              Requests
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.appointmentRequests)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <BadgeCheck size={13} />
                              Appointments
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.appointments)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Sparkles size={13} />
                              Card clicks
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.cardClicks)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Users2 size={13} />
                              Contact clicks
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatNumber(row.contactClicks)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <ArrowUpRight size={13} />
                              Conversion
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>{formatPercent(row.conversionRate)}</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                          <ListingPerformanceStat>
                            <ListingPerformanceStatLabel>
                              <Lock size={13} />
                              Boost
                            </ListingPerformanceStatLabel>
                            <ListingPerformanceStatValue>N/A</ListingPerformanceStatValue>
                          </ListingPerformanceStat>
                        </ListingPerformanceStats>
                      </ListingPerformanceMain>
                    </ListingPerformanceBody>
                  </ListingPerformanceCard>
                ))}
              </ListingCardsGrid>
              <PaginationRow>
                <SectionCopy>
                  Showing {Math.min((listingPage - 1) * 8 + 1, fullView.listingRows.length)}-
                  {Math.min(listingPage * 8, fullView.listingRows.length)} of {fullView.listingRows.length} listings
                </SectionCopy>
                <ActionRow>
                  <InlineButton type="button" onClick={() => setListingPage((current) => Math.max(1, current - 1))} disabled={listingPage === 1}>
                    <ChevronLeft size={16} />
                    Previous
                  </InlineButton>
                  <InlineButton
                    type="button"
                    onClick={() => setListingPage((current) => Math.min(Math.max(1, Math.ceil(fullView.listingRows.length / 8)), current + 1))}
                    disabled={listingPage >= Math.max(1, Math.ceil(fullView.listingRows.length / 8))}
                  >
                    Next
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
                    Filters
                  </FilterTitle>
                  <PresetRow>
                    {[
                      { value: "30d" as const, label: "30 days" },
                      { value: "90d" as const, label: "90 days" },
                      { value: "365d" as const, label: "12 months" },
                      { value: "all" as const, label: "All time" },
                    ].map((item) => (
                      <PresetButton key={item.value} type="button" $active={preset === item.value} onClick={() => setPreset(item.value)}>
                        {item.label}
                      </PresetButton>
                    ))}
                    <PresetButton type="button" $active={preset === "custom"} onClick={() => setPreset("custom")}>
                      Custom
                    </PresetButton>
                  </PresetRow>
                </FilterTop>
                <FilterGrid>
                  <AnalyticsDatePicker
                    id="analytics-start-date"
                    label="Start date"
                    value={startDate}
                    onChange={(nextValue) => {
                      setPreset("custom");
                      setStartDate(nextValue);
                    }}
                  />
                  <AnalyticsDatePicker
                    id="analytics-end-date"
                    label="End date"
                    value={endDate}
                    onChange={(nextValue) => {
                      setPreset("custom");
                      setEndDate(nextValue);
                    }}
                  />
                  <FilterControlWrap>
                    <CustomSelect id="analytics-property-type" name="analytics-property-type" label="Property type" value={propertyType} onChange={setPropertyType}>
                      <option value="all">All</option>
                      {fullAnalytics.filterOptions.propertyTypes.map((option) => (
                        <option key={option} value={option}>
                          {labelize(option)}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                  <FilterControlWrap>
                    <CustomSelect id="analytics-agent" name="analytics-agent" label="Agent" value={agentId} onChange={setAgentId}>
                      <option value="all">All agents</option>
                      {fullAnalytics.filterOptions.agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                  <FilterControlWrap>
                    <CustomSelect id="analytics-listing-status" name="analytics-listing-status" label="Listing status" value={listingStatus} onChange={setListingStatus}>
                      <option value="all">All statuses</option>
                      {fullAnalytics.filterOptions.listingStatuses.map((option) => (
                        <option key={option} value={option}>
                          {labelize(option)}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                  <FilterControlWrap>
                    <CustomSelect id="analytics-township" name="analytics-township" label="Township" value={township} onChange={setTownship}>
                      <option value="all">All</option>
                      {fullAnalytics.filterOptions.townships.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </CustomSelect>
                  </FilterControlWrap>
                </FilterGrid>
              </StickyFilters>

              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>KPI summary</SectionTitle>
                    <SectionCopy>Growth-only agency KPIs with live records where current tracking exists.</SectionCopy>
                  </div>
                  <NotePill>
                    <Sparkles size={14} />
                    Untracked metrics are explicitly marked
                  </NotePill>
                </SectionHead>
                <KpiGrid>
                  <KpiCard>
                    <KpiLabel>Total listing views</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.totalListingViews)}</KpiValue>
                    <KpiHint>Live from `property_view_events`.</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>Listing card clicks</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.listingCardClicks)}</KpiValue>
                    <KpiHint>TODO: instrument card-click events before exposing live numbers.</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>Contact clicks</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.contactClicks)}</KpiValue>
                    <KpiHint>TODO: instrument contact CTA events before exposing live numbers.</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>Saved properties</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.savedProperties)}</KpiValue>
                    <KpiHint>Buyer save activity tied directly to listings.</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>Agency inquiries</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.agencyInquiries)}</KpiValue>
                    <KpiHint>Generic agency inquiries are tracked at workspace level, not per listing.</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>Appointment requests</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.appointmentRequests)}</KpiValue>
                    <KpiHint>Live from viewing request records.</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>Conversion rate</KpiLabel>
                    <KpiValue>{formatPercent(fullView.kpis.conversionRate)}</KpiValue>
                    <KpiHint>Current calculation uses agency inquiries divided by tracked listing views.</KpiHint>
                  </KpiCard>
                  <KpiCard>
                    <KpiLabel>Active listings</KpiLabel>
                    <KpiValue>{formatNumber(fullView.kpis.activeListings)}</KpiValue>
                    <KpiHint>Published properties matching the current non-date filters.</KpiHint>
                  </KpiCard>
                </KpiGrid>
              </Section>

              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>Listing interaction funnel</SectionTitle>
                    <SectionCopy>Listing-specific flow uses views, saves, and appointment actions. Generic agency inquiries are excluded from listing attribution.</SectionCopy>
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
                        <FunnelValue>{stage.value === null ? "N/A" : formatNumber(stage.value)}</FunnelValue>
                      </FunnelRow>
                    );
                  })}
                </FunnelList>
              </Section>

              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>Listing performance</SectionTitle>
                    <SectionCopy>
                      A true overview of listing health across the current filters. Open the listing performance view for the full paginated listing breakdown.
                    </SectionCopy>
                  </div>
                  <InlineButton type="button" onClick={() => setAnalyticsStep("listing-performance")}>
                    <Building2 size={16} />
                    View listing performance
                  </InlineButton>
                </SectionHead>
                <ListingOverviewGrid>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>Listings in scope</strong>
                      <Pill $tone="accent">{formatNumber(listingOverview.listingCount)}</Pill>
                    </ListingOverviewTop>
                    <SectionCopy>Published and filtered listings included in this overview.</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>Average views per listing</strong>
                      <Pill $tone="accent">{formatNumber(listingOverview.averageViews)}</Pill>
                    </ListingOverviewTop>
                    <SectionCopy>Live detail-view average across listings in the current scope.</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>Average saves per listing</strong>
                      <Pill $tone="accent">{formatNumber(listingOverview.averageSaves)}</Pill>
                    </ListingOverviewTop>
                    <SectionCopy>Saved-property activity averaged across matching listings.</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>Request rate</strong>
                      <Pill $tone="accent">{formatPercent(listingOverview.requestRate)}</Pill>
                    </ListingOverviewTop>
                    <SectionCopy>Viewing requests divided by tracked listing views.</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>Top viewed listing</strong>
                      <Pill $tone="accent">
                        <Eye size={12} />
                        {listingOverview.topViewed ? formatNumber(listingOverview.topViewed.views) : "N/A"}
                      </Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{listingOverview.topViewed?.title ?? "N/A"}</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>Most saved listing</strong>
                      <Pill $tone="accent">
                        <Heart size={12} />
                        {listingOverview.topSaved ? formatNumber(listingOverview.topSaved.saves) : "N/A"}
                      </Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{listingOverview.topSaved?.title ?? "N/A"}</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>Most requested listing</strong>
                      <Pill $tone="accent">
                        <Calendar size={12} />
                        {listingOverview.topRequested ? formatNumber(listingOverview.topRequested.appointmentRequests) : "N/A"}
                      </Pill>
                    </ListingOverviewTop>
                    <SectionCopy>{listingOverview.topRequested?.title ?? "N/A"}</SectionCopy>
                  </ListingOverviewCard>
                  <ListingOverviewCard>
                    <ListingOverviewTop>
                      <strong>Total appointments</strong>
                      <Pill $tone="accent">{formatNumber(fullView.appointments.length)}</Pill>
                    </ListingOverviewTop>
                    <SectionCopy>Confirmed appointment volume tied to listings in this filtered scope.</SectionCopy>
                  </ListingOverviewCard>
                </ListingOverviewGrid>
              </Section>

              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>Lead pipeline</SectionTitle>
                    <SectionCopy>Generic agency inquiries stay here at workspace level, while listing performance focuses on listing-linked signals only.</SectionCopy>
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
                          <span>{labelize(key)}</span>
                          <span>{formatNumber(count)}</span>
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
                    <SectionTitle>Appointment analytics</SectionTitle>
                    <SectionCopy>Confirmed appointments reflect live appointment records. No-shows remain unavailable until tracking exists.</SectionCopy>
                  </div>
                </SectionHead>
                <MetricList>
                  <MetricBox>
                    <KpiLabel>Total appointment requests</KpiLabel>
                    <KpiValue>{formatNumber(fullView.appointmentStats.totalRequests)}</KpiValue>
                  </MetricBox>
                  <MetricBox>
                    <KpiLabel>Confirmed appointments</KpiLabel>
                    <KpiValue>{formatNumber(fullView.appointmentStats.confirmed)}</KpiValue>
                  </MetricBox>
                  <MetricBox>
                    <KpiLabel>Completed appointments</KpiLabel>
                    <KpiValue>{formatNumber(fullView.appointmentStats.completed)}</KpiValue>
                  </MetricBox>
                  <MetricBox>
                    <KpiLabel>Cancelled appointments</KpiLabel>
                    <KpiValue>{formatNumber(fullView.appointmentStats.cancelled)}</KpiValue>
                  </MetricBox>
                  <MetricBox>
                    <KpiLabel>No-shows</KpiLabel>
                    <KpiValue>{formatNumber(fullView.appointmentStats.noShows)}</KpiValue>
                  </MetricBox>
                </MetricList>
                <SplitGrid>
                  <div>
                    <SectionTitle style={{ fontSize: "0.98rem" }}>Appointments by property type</SectionTitle>
                    <MiniList style={{ marginTop: 12 }}>
                      {fullView.appointmentsByType.map((item) => (
                        <MiniRow key={item.key}>
                          <strong>{labelize(item.key)}</strong>
                          <Pill $tone="accent">{formatNumber(item.count)}</Pill>
                        </MiniRow>
                      ))}
                    </MiniList>
                  </div>
                  <div>
                    <SectionTitle style={{ fontSize: "0.98rem" }}>Most requested listings</SectionTitle>
                    <MiniList style={{ marginTop: 12 }}>
                      {fullView.mostRequestedListings.map((item) => (
                        <MiniRow key={item.propertyId}>
                          <strong>{item.title}</strong>
                          <Pill $tone="accent">{formatNumber(item.count)} requests</Pill>
                        </MiniRow>
                      ))}
                    </MiniList>
                  </div>
                </SplitGrid>
              </Section>

              <Section>
                <SectionHead>
                  <div>
                    <SectionTitle>Promotion performance</SectionTitle>
                    <SectionCopy>
                      Promotion inventory is present so the layout is ready, but impressions, clicks, CTR, and generated leads remain unavailable until
                      paid placement tracking is implemented.
                    </SectionCopy>
                  </div>
                  <NotePill>
                    <Users2 size={14} />
                    Placeholder section, no fake metrics
                  </NotePill>
                </SectionHead>
                <TableWrap>
                  <Table>
                    <thead>
                      <tr>
                        <th>Promotion</th>
                        <th>Impressions</th>
                        <th>Clicks</th>
                        <th>CTR</th>
                        <th>Leads generated</th>
                        <th>Appointments generated</th>
                        <th>Status</th>
                        <th>Start date</th>
                        <th>End date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fullAnalytics.placeholders.promotionPerformance.map((item) => (
                        <tr key={item.key}>
                          <td>{item.label}</td>
                          <td>N/A</td>
                          <td>N/A</td>
                          <td>N/A</td>
                          <td>N/A</td>
                          <td>N/A</td>
                          <td>
                            <Pill>N/A</Pill>
                          </td>
                          <td>N/A</td>
                          <td>N/A</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </TableWrap>
              </Section>
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
          Back to hub
        </BackLink>
        {content}
      </Shell>
    </Page>
  );
}

export default function HubAnalyticsPage() {
  return (
    <Page>
      <MarketplaceHeader />
      <Shell>
        <BackLink href="/hub">
          <ArrowLeft size={16} />
          Back to hub
        </BackLink>
        <HubAnalyticsContent />
      </Shell>
    </Page>
  );
}
