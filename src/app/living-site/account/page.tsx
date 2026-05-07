"use client";

import { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Eye,
  Globe2,
  Heart,
  Home,
  Lock,
  Mail,
  Menu,
  MapPin,
  MessageSquareText,
  Plus,
  Ruler,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag as TagIcon,
  Users2,
  X,
} from "lucide-react";
import { useLanguage } from "@/app/living-site/components/Providers";
import { Panel } from "@/app/living-site/components/PageSection";
import { useAppState } from "@/app/living-site/lib/app-state";
import { readWorkspaceCache, writeWorkspaceCache } from "@/app/living-site/lib/vendor-workspace-cache";
import { formatCurrency } from "@/app/living-site/lib/format";
import {
  getInquiriesForUser,
  getOwnedPropertiesForUser,
  getSavedPropertiesForUser,
  getViewingRequestsForUser,
} from "@/app/living-site/lib/data";
import { useI18n } from "@/app/living-site/lib/i18n";
import { getUpgradePlan, getVendorPlan } from "@/lib/vendor-plans";
import { isVendorStorefrontSetupComplete } from "@/lib/vendor-storefront";
import { formatPropertyTypeValue } from "@/lib/property-types";

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

const VendorColumn = styled.div`
  display: grid;
  gap: 16px;
  align-content: start;
  align-self: stretch;
  grid-template-rows: auto minmax(0, 1fr);
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
`;

const VendorCardFill = styled(VendorCard)`
  align-self: start;
`;

const VendorActionRail = styled(VendorCard)<{ $expanded?: boolean }>`
  position: relative;
  align-self: stretch;
  overflow: visible;
  padding: 0;
  gap: 0;
  min-width: 84px;
  width: 84px;
  border: none;
  background: transparent;
  box-shadow: none;

  @media (max-width: 960px) {
    padding: 14px;
    width: auto;
    min-width: 0;
    border: 1px solid rgba(15, 23, 42, 0.08);
    background: var(--color-surface);
    box-shadow: var(--frame-shadow);
  }
`;

const HubRailSurface = styled.div<{ $expanded?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 5;
  width: ${(props) => (props.$expanded ? "248px" : "84px")};
  min-height: 100%;
  padding: 12px;
  border-radius: 28px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: ${(props) => (props.$expanded ? "0 18px 44px rgba(15, 23, 42, 0.12)" : "var(--frame-shadow)")};
  overflow: hidden;
  transition:
    width 180ms ease,
    box-shadow 180ms ease,
    background 180ms ease;
  will-change: width;

  @media (max-width: 960px) {
    position: relative;
    width: 100%;
    min-height: 0;
    padding: 0;
    border: none;
    background: transparent;
    box-shadow: none;
    overflow: visible;
  }
`;

const HubRailSpacer = styled.div`
  width: 84px;
  min-height: 100%;

  @media (max-width: 960px) {
    display: none;
  }
`;

const VendorHero = styled.div`
  display: grid;
  gap: 8px;
`;

const VendorTitle = styled.h2`
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2.1rem);
`;

const VendorMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

const VendorPill = styled.span<{ $tone?: "success" | "warning" | "neutral" }>`
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
`;

const VendorActionGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const VendorAction = styled(Link)`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 14px 16px;
  display: grid;
  gap: 6px;
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow-soft);
`;

const VendorActionTitle = styled.strong`
  color: var(--color-text);
`;

const VendorActionCopy = styled.span`
  color: var(--color-muted);
  line-height: 1.55;
  font-size: 0.92rem;
`;

const VendorSectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const StarterHeader = styled.div`
  display: grid;
  gap: 14px;
`;

const StarterGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StarterStat = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  padding: 12px 14px;
  background: var(--color-surface-2);
  display: grid;
  gap: 6px;
`;

const StarterStatTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-muted);

  svg {
    width: 16px;
    height: 16px;
  }
`;

const StarterStatValue = styled.div`
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-text);
`;

const HubFeatureCard = styled.div`
  position: relative;
  display: grid;
  gap: 14px;
  overflow: hidden;
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
`;

const HubInsightBody = styled.div`
  position: relative;
  min-height: 98px;
  border-radius: 14px;
  overflow: hidden;
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

const HubInsightCardCopy = styled.div`
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--color-muted);
`;

const HubInsightMiniList = styled.div`
  display: grid;
  gap: 8px;
`;

const HubInsightMiniRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.9rem;
  color: var(--color-text);
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

const HubInsightBlurBadge = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.46));
  pointer-events: none;
`;

const HubInsightBlurText = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 22%, var(--color-outline));
  background: rgba(255, 255, 255, 0.86);
  color: var(--color-primary);
  font-size: 0.88rem;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  text-align: center;
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

const HubInsightStack = styled.div`
  position: relative;
  display: grid;
  gap: 8px;
`;

const HubInsightStackTrack = styled.div`
  display: flex;
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in srgb, var(--color-surface) 92%, white);
  border: 1px solid var(--color-outline);
`;

const HubInsightStackSegment = styled.div<{ $width: number; $color: string }>`
  width: ${(props) => props.$width}%;
  background: ${(props) => props.$color};
  min-width: ${(props) => (props.$width > 0 ? "6px" : "0")};
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

const HubFeatureLock = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
`;

const StarterActionIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  display: grid;
  place-items: center;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const StarterActionLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-weight: 700;
  color: var(--color-text);
`;

const HubNavList = styled.div`
  display: grid;
  gap: 10px;
`;

const HubNavItem = styled(Link)<{ $disabled?: boolean; $expanded?: boolean }>`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  padding: 10px 12px;
  background: var(--color-surface);
  display: grid;
  grid-template-columns: 36px ${(props) => (props.$expanded ? "minmax(0,1fr) 18px" : "0px 0px")};
  align-items: center;
  justify-content: ${(props) => (props.$expanded ? "stretch" : "center")};
  gap: ${(props) => (props.$expanded ? "12px" : "0")};
  color: inherit;
  text-decoration: none;
  box-shadow: var(--shadow-soft);
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
    grid-template-columns: 36px minmax(0,1fr) 18px;
    gap: 12px;
    justify-content: stretch;
  }
`;

const HubNavButton = styled.button<{ $expanded?: boolean }>`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  padding: 10px 12px;
  background: var(--color-surface);
  display: grid;
  grid-template-columns: 36px ${(props) => (props.$expanded ? "minmax(0,1fr) 18px" : "0px 0px")};
  align-items: center;
  justify-content: ${(props) => (props.$expanded ? "stretch" : "center")};
  gap: ${(props) => (props.$expanded ? "12px" : "0")};
  color: inherit;
  box-shadow: var(--shadow-soft);
  cursor: pointer;
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
    grid-template-columns: 36px minmax(0,1fr) 18px;
    gap: 12px;
    justify-content: stretch;
  }
`;

const HubNavIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  color: var(--color-primary);
  display: grid;
  place-items: center;

  svg {
    width: 18px;
    height: 18px;
  }
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
  }
`;

const HubNavTitle = styled.strong`
  color: var(--color-text);
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

function AccountHeader({ isVendor }: { isVendor: boolean }) {
  const { user } = useAppState();
  const { t } = useI18n();
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const navLinks = [
    { label: "Articles", href: "/faq" },
    { label: "Our Partners", href: "/#partners" },
    { label: "Collections", href: "/#collections" },
  ];
  const languageOptions = [
    { value: "en", flag: "🇬🇧", name: "English", label: "Eng" },
    { value: "mm", flag: "🇲🇲", name: "Myanmar", label: "မြန်မာ" },
    { value: "zh", flag: "🇨🇳", name: "Chinese", label: "中文" },
    { value: "th", flag: "🇹🇭", name: "Thai", label: "ไทย" },
  ] as const;
  const activeLanguage =
    languageOptions.find((option) => option.value === language) ?? languageOptions[0];
  const accountLabel = !user ? "Sign in / Register" : isVendor ? "Hub" : "Account";
  const accountHref = !user ? "/auth" : isVendor ? "/hub" : "/account";

  return (
    <>
      <Header>
        <HeaderInner>
          <MobileMenuButton
            type="button"
            aria-label="Open navigation menu"
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
            <Link href={accountHref}>{accountLabel}</Link>
          </HeaderLinks>

          <HeaderActions>
            <LanguageTrigger
              type="button"
              aria-label="Open language selector"
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
              <MobileMenuTitle>Menu</MobileMenuTitle>
              <GhostButton type="button" onClick={() => setMobileMenuOpen(false)}>
                Close
              </GhostButton>
            </MobileMenuHeader>
            <MobileMenuLinks>
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
                <Muted>Choose the language for your marketplace experience.</Muted>
              </div>
              <GhostButton type="button" onClick={() => setLanguageOpen(false)}>
                Close
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
  if (normalized === "published") return "Live";
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
      slug?: string | null;
      verified_status?: string | null;
    };
    membership: {
      role: string;
    };
    limits?: {
      currentPlan?: {
        name: string;
      };
      listingCount?: number;
      listingLimit?: number;
      livePropertyCount?: number;
      agentCount?: number;
      agentLimit?: number;
    };
  } | null>(null);
  const [vendorWorkspaceError, setVendorWorkspaceError] = useState<string | null>(null);
  const [vendorWorkspaceLoading, setVendorWorkspaceLoading] = useState(false);
  const [vendorOverview, setVendorOverview] = useState<VendorOverviewPayload | null>(null);
  const [vendorOverviewLoading, setVendorOverviewLoading] = useState(false);
  const [vendorOverviewError, setVendorOverviewError] = useState<string | null>(null);

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
    if (!authToken || profileRole !== "vendor_user") {
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
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
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
  }, [authToken, profileRole, vendorWorkspace?.vendor.plan]);

  useEffect(() => {
    if (!profileReady || loading) return;
    if (!user) {
      router.replace("/auth");
      return;
    }
    if ((profileRole === "vendor_user" || onboardingPending || Boolean(vendorWorkspace?.vendor.id)) && pathname === "/account") {
      router.replace("/hub");
      return;
    }
    if (
      profileRole !== "vendor_user" &&
      !onboardingPending &&
      !vendorWorkspace?.vendor.id &&
      pathname === "/hub"
    ) {
      router.replace("/account");
    }
  }, [loading, onboardingPending, pathname, profileReady, profileRole, router, user, vendorWorkspace]);

  useEffect(() => {
    if (!userId || profileRole === "vendor_user") return;

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
  }, [profileRole, userId]);

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
    if (profileRole === "vendor_user") return;
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
  }, [activeTab, loadedTabs, profileRole, refreshedTabs, userId]);

  useEffect(() => {
    if (!authToken || (!onboardingPending && profileRole !== "vendor_user" && pathname !== "/hub")) return;

    let active = true;
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
          limits?: {
            currentPlan?: { name: string };
            listingCount?: number;
            listingLimit?: number;
            livePropertyCount?: number;
            agentCount?: number;
            agentLimit?: number;
          };
        }>(userId, "full")
      : null;
    setVendorWorkspaceError(null);
    setVendorWorkspaceLoading(!cachedWorkspace);
    if (cachedWorkspace) {
      setVendorWorkspace(cachedWorkspace);
    }

    fetch("/api/vendor/workspace", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
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
                  limits: payload.limits,
                }
              : null
          );
          if (userId && payload?.vendor && payload?.membership) {
            writeWorkspaceCache(userId, "full", {
              vendor: payload.vendor,
              membership: payload.membership,
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
  }, [authToken, onboardingPending, pathname, profileRole, userId]);

  const closeDetails = () => {
    setActiveInquiry(null);
    setActiveSale(null);
  };

  const currentVendorPlan = getVendorPlan(vendorWorkspace?.vendor.plan);
  const suggestedUpgrade = getUpgradePlan(vendorWorkspace?.vendor.plan);
  const isFreeAgencyPlan = vendorWorkspace?.vendor.plan === "free";
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
    { done: hasAgencyLogo, label: "Logo" },
    { done: hasAgencyContact, label: "Contact" },
    { done: hasAgencyBio, label: "Bio" },
    { done: storefrontReady, label: "Storefront" },
  ];
  const profileReadinessDoneCount = profileReadinessItems.filter((item) => item.done).length;
  const freeSettingsHref = "/hub/settings";
  const freeUpgradeHref = "/hub/upgrade";
  const profileReadinessHref =
    profileReadinessDoneCount === profileReadinessItems.length ? freeSettingsHref : "/agency-setup";
  const hubChecklist = [
    {
      done: profileReadinessDoneCount === profileReadinessItems.length,
      title: "Profile readiness",
      hint:
        profileReadinessDoneCount === profileReadinessItems.length
          ? "Logo, contact, bio, and storefront are all ready."
          : `${profileReadinessDoneCount}/${profileReadinessItems.length} complete: ${profileReadinessItems
              .map((item) => `${item.done ? "✓" : "○"} ${item.label}`)
              .join("  •  ")}`,
      href: profileReadinessHref,
      actionLabel: profileReadinessDoneCount === profileReadinessItems.length ? "Review" : "Complete",
    },
    {
      done: hasSocialChannel,
      title: "Channel readiness",
      hint: hasSocialChannel
        ? "At least one buyer channel is connected."
        : "Add Facebook, Telegram, Viber, TikTok, or a website so buyers have another way to reach you.",
      href: freeSettingsHref,
      actionLabel: hasSocialChannel ? "Manage" : "Add channel",
    },
    {
      done: liveListingCount > 0,
      title: "First live listing published",
      hint:
        liveListingCount > 0
          ? `${liveListingCount} live listing${liveListingCount > 1 ? "s are" : " is"} already visible to buyers.`
          : "Publish your first live listing to start receiving buyer attention.",
      href: "/request-sale",
      actionLabel: liveListingCount > 0 ? "Manage" : "Publish first",
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
  const workspaceSnapshotView = useMemo(() => {
    if (!vendorOverview) return HUB_SNAPSHOT_TEMPLATE;

    return {
      metrics:
        vendorOverview.metrics.totalProperties < 1
          ? HUB_SNAPSHOT_TEMPLATE.metrics
          : vendorOverview.metrics,
      nextAppointment: vendorOverview.nextAppointment ?? HUB_SNAPSHOT_TEMPLATE.nextAppointment,
      statusMix: vendorOverview.statusMix.length ? vendorOverview.statusMix : HUB_SNAPSHOT_TEMPLATE.statusMix,
      listingTypes: vendorOverview.listingTypes.length ? vendorOverview.listingTypes : HUB_SNAPSHOT_TEMPLATE.listingTypes,
      salesByType: vendorOverview.salesByType.length ? vendorOverview.salesByType : HUB_SNAPSHOT_TEMPLATE.salesByType,
      priceRangesByType: vendorOverview.priceRangesByType.some((item) => item.count >= 2)
        ? vendorOverview.priceRangesByType
        : HUB_SNAPSHOT_TEMPLATE.priceRangesByType,
      appointmentsByType: vendorOverview.appointmentsByType.length
        ? vendorOverview.appointmentsByType
        : HUB_SNAPSHOT_TEMPLATE.appointmentsByType,
    };
  }, [vendorOverview]);

  useEffect(() => {
    if (pathname === "/hub" && vendorWorkspace && !storefrontReady) {
      router.replace("/agency-setup");
    }
  }, [pathname, router, storefrontReady, vendorWorkspace]);

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
    pathname === "/hub" &&
    (profileRole === "vendor_user" || onboardingPending) &&
    vendorWorkspaceLoading &&
    !vendorWorkspace;

  return (
    <div>
      <AccountHeader isVendor={profileRole === "vendor_user"} />
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
          (profileRole === "vendor_user" || onboardingPending || Boolean(vendorWorkspace?.vendor.id)) && (
          <VendorGrid>
            <VendorActionRail
              data-hub-rail="true"
              $expanded={hubRailExpanded}
              onMouseEnter={() => setHubRailExpanded(true)}
              onMouseLeave={() => setHubRailExpanded(false)}
              onFocus={() => setHubRailExpanded(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setHubRailExpanded(false);
                }
              }}
            >
              <HubRailSurface $expanded={hubRailExpanded}>
                <HubNavList>
                <HubNavItem $expanded={hubRailExpanded} href={isFreeAgencyPlan ? "/request-sale" : "/vendor/properties"}>
                  <HubNavIcon>
                    <Plus />
                  </HubNavIcon>
                  <HubNavBody $expanded={hubRailExpanded}>
                    <HubNavTitle>Manage listings</HubNavTitle>
                  </HubNavBody>
                  <HubNavArrow $expanded={hubRailExpanded}>
                    <ArrowUpRight size={18} />
                    </HubNavArrow>
                  </HubNavItem>

                  {isFreeAgencyPlan ? (
                    <HubNavItem $expanded={hubRailExpanded} href={freeUpgradeHref} $disabled>
                      <HubNavIcon>
                        <Calendar />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>Appointment management</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavItem>
                  ) : (
                    <HubNavItem $expanded={hubRailExpanded} href="/vendor/viewing-requests">
                      <HubNavIcon>
                        <Calendar />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>Appointment management</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavItem>
                  )}

                  {!isFreeAgencyPlan ? (
                    <HubNavItem $expanded={hubRailExpanded} href="/vendor/inquiries">
                      <HubNavIcon>
                        <MessageSquareText />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>Lead inbox</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavItem>
                  ) : null}

                  <HubNavItem $expanded={hubRailExpanded} href={isFreeAgencyPlan ? freeSettingsHref : "/vendor/settings"}>
                    <HubNavIcon>
                      <Settings />
                    </HubNavIcon>
                    <HubNavBody $expanded={hubRailExpanded}>
                      <HubNavTitle>Organization settings</HubNavTitle>
                    </HubNavBody>
                    <HubNavArrow $expanded={hubRailExpanded}>
                      <ArrowUpRight size={18} />
                    </HubNavArrow>
                  </HubNavItem>

                  {isFreeAgencyPlan ? (
                    <HubNavItem $expanded={hubRailExpanded} href={freeUpgradeHref} $disabled>
                      <HubNavIcon>
                        <Users2 />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>Add members</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavItem>
                  ) : (vendorWorkspace?.membership.role === "owner" || vendorWorkspace?.membership.role === "admin") ? (
                    <HubNavItem $expanded={hubRailExpanded} href="/vendor/team">
                      <HubNavIcon>
                        <Users2 />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>Add members</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavItem>
                  ) : null}

                  {vendorWorkspace?.vendor.public_storefront_enabled && vendorWorkspace?.vendor.slug ? (
                    <HubNavItem $expanded={hubRailExpanded} href={`/agency/${vendorWorkspace.vendor.slug}`}>
                      <HubNavIcon>
                        <Globe2 />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>View public profile</HubNavTitle>
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
                      await logout();
                      router.push("/");
                    }}
                  >
                    <HubNavIcon>
                      <X />
                    </HubNavIcon>
                    <HubNavBody $expanded={hubRailExpanded}>
                      <HubNavTitle>Sign out</HubNavTitle>
                    </HubNavBody>
                    <HubNavArrow $expanded={hubRailExpanded}>
                      <ArrowUpRight size={18} />
                    </HubNavArrow>
                  </HubNavButton>
                </HubNavList>
              </HubRailSurface>
              <HubRailSpacer />
            </VendorActionRail>
            <VendorColumn>
            <VendorCard>
              <StarterHeader>
                <VendorIdentity>
                  <VendorLogoBadge $image={vendorWorkspace?.vendor.logo_url || undefined}>
                    {!vendorWorkspace?.vendor.logo_url ? <Building2 size={22} /> : null}
                  </VendorLogoBadge>
                  <VendorTitle>{vendorWorkspace?.vendor.name || "Agency account"}</VendorTitle>
                </VendorIdentity>
                <VendorMeta>
                  <VendorPillLink href={isFreeAgencyPlan ? freeUpgradeHref : "/vendor"} $tone="warning">
                    <Sparkles size={14} />
                    {vendorWorkspace?.limits?.currentPlan?.name || currentVendorPlan.name}
                  </VendorPillLink>
                  <VendorPill>{labelize(vendorWorkspace?.membership.role)}</VendorPill>
                  {isFreeAgencyPlan ? (
                    <VendorPillLink href={freeUpgradeHref} $tone="warning">
                      Upgrade
                    </VendorPillLink>
                  ) : null}
                  <VendorPillLink
                    href={isFreeAgencyPlan ? freeUpgradeHref : "/vendor/verification"}
                    $tone={vendorWorkspace?.vendor.verified_status === "approved" ? "success" : "warning"}
                  >
                    {vendorWorkspace?.vendor.verified_status === "approved" ? <BadgeCheck size={14} /> : <ShieldCheck size={14} />}
                    {vendorWorkspace?.vendor.verified_status === "approved" ? "Verified" : "Unverified"}
                  </VendorPillLink>
                  {vendorWorkspace?.vendor.verified_status === "approved" ? (
                    <VendorPill $tone="success">
                      <BadgeCheck size={14} />
                    </VendorPill>
                  ) : null}
                  {vendorWorkspace?.vendor.billing_status && vendorWorkspace.vendor.plan !== "free" ? (
                    <VendorPill $tone={vendorWorkspace.vendor.billing_status === "active" ? "success" : "warning"}>
                      {labelize(vendorWorkspace.vendor.billing_status)}
                    </VendorPill>
                  ) : null}
                </VendorMeta>
              </StarterHeader>

              {vendorWorkspaceError ? <Muted>{vendorWorkspaceError}</Muted> : null}

              <StarterGrid>
                <StarterStat>
                  <StarterStatTop>
                    <span>Listings</span>
                    <Building2 />
                  </StarterStatTop>
                  <StarterStatValue>
                    {listingUsage} / {listingLimit}
                  </StarterStatValue>
                </StarterStat>
                <StarterStat>
                  <StarterStatTop>
                    <span>Seats</span>
                    <Users2 />
                  </StarterStatTop>
                  <StarterStatValue>
                    {agentUsage} / {agentLimit}
                  </StarterStatValue>
                </StarterStat>
                <StarterStat>
                  <StarterStatTop>
                    <span>Storefront</span>
                    <Globe2 />
                  </StarterStatTop>
                  <StarterStatValue>
                    {vendorWorkspace?.vendor.public_storefront_enabled && vendorWorkspace?.vendor.slug
                      ? "Live"
                      : "Draft"}
                  </StarterStatValue>
                </StarterStat>
              </StarterGrid>
            </VendorCard>
            <VendorCardFill>
              <HubFeatureCard>
                {!starterChecklistComplete ? (
                  <>
                    <HubFeatureHeader>
                      <HubFeatureTop>
                        <HubFeatureTitle>Next steps</HubFeatureTitle>
                        <HubProgressPill>
                          {starterChecklistDoneCount}/{hubChecklist.length} complete
                        </HubProgressPill>
                      </HubFeatureTop>
                      <HubFeatureCopy>Finish these basics to make your agency profile ready for buyers.</HubFeatureCopy>
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
                    <HubFeatureHeader>
                      <HubFeatureTitle>{isFreeAgencyPlan ? "Premium workspace preview" : "Workspace snapshot"}</HubFeatureTitle>
                      {isFreeAgencyPlan ? (
                        <HubFeatureCopy>Upgrade to unlock live sales and lead overview inside your hub.</HubFeatureCopy>
                      ) : null}
                    </HubFeatureHeader>
                    {isFreeAgencyPlan ? (
                      <HubFeaturePreview>
                        <HubFeaturePreviewGrid>
                          <HubFeaturePreviewItem>
                            <HubFeaturePreviewTop>
                              <span>Lead overview</span>
                              <MessageSquareText />
                            </HubFeaturePreviewTop>
                            <HubFeaturePreviewValue>24 active conversations</HubFeaturePreviewValue>
                          </HubFeaturePreviewItem>
                          <HubFeaturePreviewItem>
                            <HubFeaturePreviewTop>
                              <span>Sales performance</span>
                              <BarChart3 />
                            </HubFeaturePreviewTop>
                            <HubFeaturePreviewValue>MMK 180L pipeline</HubFeaturePreviewValue>
                          </HubFeaturePreviewItem>
                          <HubFeaturePreviewItem>
                            <HubFeaturePreviewTop>
                              <span>Viewing demand</span>
                              <Calendar />
                            </HubFeaturePreviewTop>
                            <HubFeaturePreviewValue>12 appointments this week</HubFeaturePreviewValue>
                          </HubFeaturePreviewItem>
                          <HubFeaturePreviewItem>
                            <HubFeaturePreviewTop>
                              <span>Team response</span>
                              <Users2 />
                            </HubFeaturePreviewTop>
                            <HubFeaturePreviewValue>2h average first reply</HubFeaturePreviewValue>
                          </HubFeaturePreviewItem>
                        </HubFeaturePreviewGrid>
                        <HubFeatureUpsellCard href={freeUpgradeHref}>
                          <HubFeatureUpsellHeader>
                            <HubFeatureLock>
                              <Lock size={18} />
                            </HubFeatureLock>
                            <HubChecklistTitle>Upgrade to reveal premium insights</HubChecklistTitle>
                          </HubFeatureUpsellHeader>
                          <HubChecklistHint>
                            Sales stats, lead summaries, appointments, and team performance appear here once your plan is upgraded.
                          </HubChecklistHint>
                        </HubFeatureUpsellCard>
                      </HubFeaturePreview>
                    ) : vendorOverviewLoading && !vendorOverview ? (
                      <HubFeatureCopy>Loading workspace insights...</HubFeatureCopy>
                    ) : vendorOverviewError || !vendorOverview ? (
                      <HubFeatureCopy>{vendorOverviewError ?? "Workspace insights are unavailable right now."}</HubFeatureCopy>
                    ) : (
                      <HubInsightGrid>
                        <HubInsightCard>
                          <HubInsightCardTop>
                            <HubInsightCardTitle>
                              <BarChart3 />
                              Portfolio value
                            </HubInsightCardTitle>
                          </HubInsightCardTop>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightCardValueCentered>
                                {formatCurrency(workspaceSnapshotView.metrics.totalValue, "MMK", "MMK 0")}
                              </HubInsightCardValueCentered>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>

                        <HubInsightCard>
                          <HubInsightCardTop>
                            <HubInsightCardTitle>
                              <TagIcon />
                              Listings by type
                            </HubInsightCardTitle>
                          </HubInsightCardTop>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightHero>
                                <HubInsightHeroValue>{workspaceSnapshotView.metrics.totalProperties}</HubInsightHeroValue>
                                <HubInsightHeroLabel>Total active property records</HubInsightHeroLabel>
                              </HubInsightHero>
                              <HubInsightStack>
                                <HubInsightStackTrack>
                                  {workspaceSnapshotView.listingTypes.slice(0, 4).map((item, index) => {
                                    const total = Math.max(
                                      1,
                                      workspaceSnapshotView.listingTypes
                                        .slice(0, 4)
                                        .reduce((sum, current) => sum + current.count, 0)
                                    );
                                    return (
                                      <HubInsightStackSegment
                                        key={item.key}
                                        $width={(item.count / total) * 100}
                                        $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]}
                                      />
                                    );
                                  })}
                                </HubInsightStackTrack>
                                <HubInsightLegend>
                                  {workspaceSnapshotView.listingTypes.slice(0, 4).map((item, index) => (
                                    <HubInsightLegendRow key={item.key}>
                                      <HubInsightLegendDot $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]} />
                                      <span>{labelize(item.key)}</span>
                                      <HubInsightMiniCount>{item.count}</HubInsightMiniCount>
                                    </HubInsightLegendRow>
                                  ))}
                                </HubInsightLegend>
                              </HubInsightStack>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>

                        <HubInsightCard>
                          <HubInsightCardTop>
                            <HubInsightCardTitle>
                              <BadgeCheck />
                              Sales by type
                            </HubInsightCardTitle>
                          </HubInsightCardTop>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightHero>
                                <HubInsightHeroValue>
                                  {workspaceSnapshotView.metrics.soldProperties + workspaceSnapshotView.metrics.rentedProperties}
                                </HubInsightHeroValue>
                                <HubInsightHeroLabel>Closed sale or rent outcomes</HubInsightHeroLabel>
                              </HubInsightHero>
                              <HubInsightStack>
                                <HubInsightStackTrack>
                                  {workspaceSnapshotView.salesByType.slice(0, 4).map((item, index) => {
                                    const total = Math.max(
                                      1,
                                      workspaceSnapshotView.salesByType
                                        .slice(0, 4)
                                        .reduce((sum, current) => sum + current.count, 0)
                                    );
                                    return (
                                      <HubInsightStackSegment
                                        key={item.key}
                                        $width={(item.count / total) * 100}
                                        $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]}
                                      />
                                    );
                                  })}
                                </HubInsightStackTrack>
                                <HubInsightLegend>
                                  {workspaceSnapshotView.salesByType.slice(0, 4).map((item, index) => (
                                    <HubInsightLegendRow key={item.key}>
                                      <HubInsightLegendDot $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]} />
                                      <span>{labelize(item.key)}</span>
                                      <HubInsightMiniCount>{item.count}</HubInsightMiniCount>
                                    </HubInsightLegendRow>
                                  ))}
                                </HubInsightLegend>
                              </HubInsightStack>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>

                        <HubInsightCard>
                          <HubInsightCardTop>
                            <HubInsightCardTitle>
                              <BarChart3 />
                              Price range by type
                            </HubInsightCardTitle>
                          </HubInsightCardTop>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightMiniList>
                                {workspaceSnapshotView.priceRangesByType.slice(0, 4).map((item) => (
                                  <HubInsightMiniRow key={item.key}>
                                    <span>{labelize(item.key)}</span>
                                    <span>
                                      {formatCurrency(item.min, item.currency, "MMK 0")} -{" "}
                                      {formatCurrency(item.max, item.currency, "MMK 0")}
                                    </span>
                                  </HubInsightMiniRow>
                                ))}
                              </HubInsightMiniList>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>

                        <HubInsightCard>
                          <HubInsightCardTop>
                            <HubInsightCardTitle>
                              <Calendar />
                              Next appointment
                            </HubInsightCardTitle>
                          </HubInsightCardTop>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightCardValue>
                                {workspaceSnapshotView.nextAppointment?.title || "Upcoming appointment"}
                              </HubInsightCardValue>
                              <HubInsightCardCopy>
                                {workspaceSnapshotView.nextAppointment?.start_at
                                  ? new Date(workspaceSnapshotView.nextAppointment.start_at).toLocaleString(locale)
                                  : "No upcoming appointments scheduled yet."}
                              </HubInsightCardCopy>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>

                        <HubInsightCard>
                          <HubInsightCardTop>
                            <HubInsightCardTitle>
                              <Clock />
                              Appointments by type
                            </HubInsightCardTitle>
                          </HubInsightCardTop>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightHero>
                                <HubInsightHeroValue>{workspaceSnapshotView.metrics.appointmentsCount}</HubInsightHeroValue>
                                <HubInsightHeroLabel>Scheduled viewing appointments</HubInsightHeroLabel>
                              </HubInsightHero>
                              <HubInsightStack>
                                <HubInsightStackTrack>
                                  {workspaceSnapshotView.appointmentsByType.slice(0, 4).map((item, index) => {
                                    const total = Math.max(
                                      1,
                                      workspaceSnapshotView.appointmentsByType
                                        .slice(0, 4)
                                        .reduce((sum, current) => sum + current.count, 0)
                                    );
                                    return (
                                      <HubInsightStackSegment
                                        key={item.key}
                                        $width={(item.count / total) * 100}
                                        $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]}
                                      />
                                    );
                                  })}
                                </HubInsightStackTrack>
                                <HubInsightLegend>
                                  {workspaceSnapshotView.appointmentsByType.slice(0, 4).map((item, index) => (
                                    <HubInsightLegendRow key={item.key}>
                                      <HubInsightLegendDot $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]} />
                                      <span>{labelize(item.key)}</span>
                                      <HubInsightMiniCount>{item.count}</HubInsightMiniCount>
                                    </HubInsightLegendRow>
                                  ))}
                                </HubInsightLegend>
                              </HubInsightStack>
                            </HubInsightCardInner>
                          </HubInsightBody>
                        </HubInsightCard>
                      </HubInsightGrid>
                    )}
                  </>
                )}
              </HubFeatureCard>
            </VendorCardFill>
            </VendorColumn>
          </VendorGrid>
        )}

        {profileRole !== "vendor_user" && (
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
                                {formatCurrency(price, currency) || t("account.requestedTbd")}
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
                                {formatCurrency(price, currency) || t("account.requestedTbd")}
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
                                {formatCurrency(item.price as number, item.currency as string) || t("account.requestedTbd")}
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
                {formatCurrency(activeSale.price as number, activeSale.currency as string) || t("account.priceTbd")}
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
