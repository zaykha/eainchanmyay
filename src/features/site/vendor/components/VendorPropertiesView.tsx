"use client";

import { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { formatPropertyTypeValue, propertyTypeDefinitions } from "@/lib/property-types";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  Filter,
  Home,
  Hotel,
  LandPlot,
  MapPin,
  Plus,
  Search,
  Store,
  Warehouse,
  X,
} from "lucide-react";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { withActiveVendorHeaders } from "@/features/site/vendor/lib/active-context";
import { formatCurrency } from "@/features/site/shared/lib/format";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";
import { CustomSelect } from "@/features/site/shared/components/form-controls/CustomSelect";
import { useI18n } from "@/features/site/shared/lib/i18n";

const Page = styled.div<{ $embedded?: boolean }>`
  display: grid;
  gap: ${(props) => (props.$embedded ? "16px" : "20px")};
   @media (max-width: 720px) {
    gap: 2px;
  }
`;

const Header = styled.div<{ $embedded?: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const Heading = styled.div`
  display: grid;
  gap: 6px;
`;

const Title = styled.h1<{ $embedded?: boolean }>`
  margin: 0;
  font-size: ${(props) => (props.$embedded ? "1.25rem" : "clamp(1.8rem, 3vw, 2.4rem)")};
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
`;

const Subtitle = styled.p<{ $embedded?: boolean }>`
  margin: 0;
  color: ${(props) => (props.$embedded ? "var(--color-muted)" : "#98a2b3")};
  line-height: 1.55;
`;

const ActionLink = styled(Link)<{ $embedded?: boolean }>`
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${(props) => (props.$embedded ? "var(--gradient)" : "linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%)")};
  color: white;
  font-weight: 700;
`;

const Filters = styled.form<{ $compact?: boolean }>`
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(3, minmax(0, 0.6fr));
  gap: 12px;

  .SelectTrigger,
  .SelectOption,
  .SelectGroupLabel {
    font-size: ${(props) => (props.$compact ? "0.88rem" : "0.98rem")};
  }

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const MobileFilterBar = styled.div`
  display: none;

  @media (max-width: 640px) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
  }
`;

const MobileFilterLauncher = styled.button<{ $embedded?: boolean }>`
  display: none;

  @media (max-width: 640px) {
    width: 46px;
    height: 46px;
    padding: 0;
    border-radius: 14px;
    border: 1px solid ${(props) => (props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.08)")};
    background: ${(props) => (props.$embedded ? "var(--color-surface)" : "#151b29")};
    color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
    display: inline-grid;
    place-items: center;
    cursor: pointer;
    position: relative;
  }
`;

const MobileFilterCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-primary) 14%, white);
  color: var(--color-primary);
  font-size: 0.72rem;
  font-weight: 800;

  @media (max-width: 640px) {
    position: absolute;
    top: -5px;
    right: -5px;
    box-shadow: 0 0 0 3px var(--color-surface);
  }
`;

const MobileFilterSummary = styled.div`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: -2px;
  }
`;

const MobileFilterPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface-2) 84%, white);
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 700;
`;

const MobileOnlyFilterFields = styled.div`
  display: contents;

  @media (max-width: 640px) {
    display: none;
  }
`;

const FilterSheetOverlay = styled.button<{ $open?: boolean }>`
  display: none;

  @media (max-width: 640px) {
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

const FilterSheet = styled.div<{ $open?: boolean }>`
  display: none;

  @media (max-width: 640px) {
    display: grid;
    gap: 14px;
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: 12px;
    z-index: 130;
    padding: 16px;
    border-radius: 24px;
    border: 1px solid var(--color-outline);
    background: var(--color-surface);
    box-shadow: 0 24px 64px rgba(15, 23, 42, 0.18);
    transform: translateY(${(props) => (props.$open ? "0" : "24px")});
    opacity: ${(props) => (props.$open ? 1 : 0)};
    pointer-events: ${(props) => (props.$open ? "auto" : "none")};
    transition:
      transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 180ms ease;
  }
`;

const FilterSheetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const FilterSheetTitle = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text);
  font-size: 0.94rem;
  font-weight: 800;
`;

const FilterSheetClose = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-text);
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const FilterSheetBody = styled.div`
  display: grid;
  gap: 12px;
`;

const FilterSheetActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const FilterSheetButton = styled.button<{ $primary?: boolean }>`
  min-height: 42px;
  border-radius: 14px;
  border: 1px solid ${(props) => (props.$primary ? "transparent" : "var(--color-outline)")};
  background: ${(props) => (props.$primary ? "var(--gradient)" : "var(--color-surface-2)")};
  color: ${(props) => (props.$primary ? "#fff" : "var(--color-text)")};
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
`;

const SearchField = styled.div<{ $embedded?: boolean }>`
  position: relative;
  min-width: 0;
`;

const Input = styled.input<{ $embedded?: boolean; $compact?: boolean }>`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid ${(props) => (props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.08)")};
  background: ${(props) => (props.$embedded ? "var(--color-surface)" : "#151b29")};
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
  padding: 0 52px 0 14px;
  width: 100%;
  font-size: ${(props) => (props.$compact ? "0.88rem" : "0.98rem")};
`;

const SearchButton = styled.button<{ $embedded?: boolean }>`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid ${(props) => (props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.08)")};
  background: ${(props) => (props.$embedded ? "var(--color-surface-2)" : "#1b2231")};
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    background 140ms ease,
    border-color 140ms ease,
    transform 140ms ease;

  &:hover {
    background: ${(props) => (props.$embedded ? "color-mix(in srgb, var(--color-surface-2) 88%, white)" : "#20293a")};
    border-color: color-mix(in srgb, var(--color-primary) 18%, var(--color-outline));
  }

  &:active {
    transform: translateY(-50%) scale(0.98);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    gap: 18px;
  }
`;

const EmbeddedViewport = styled.div`
  min-height: 640px;
  max-height: 640px;
  overflow: visible;
  display: grid;
  align-content: start;
`;

const EmbeddedScroller = styled.div`
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: visible;
  padding-top: 14px;
  padding-right: 6px;
  display: grid;
  align-content: start;
  gap: 14px;

  @media (max-width: 640px) {
    gap: 18px;
  }
`;

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;

const EmbeddedLoadingState = styled.div`
  min-height: 640px;
  border-radius: 24px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface-2) 72%, white);
  padding: 16px;
  display: grid;
  gap: 14px;
  align-content: start;
`;

const EmbeddedSkeletonCard = styled.div`
  border-radius: 22px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface-2) 84%, white);
  padding: 14px;
  display: grid;
  gap: 12px;
`;

const SkeletonBlock = styled.div<{ $height?: number; $radius?: number }>`
  width: 100%;
  height: ${(props) => `${props.$height ?? 16}px`};
  border-radius: ${(props) => `${props.$radius ?? 14}px`};
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--color-surface) 84%, transparent) 0%,
    color-mix(in srgb, var(--color-outline) 38%, white) 50%,
    color-mix(in srgb, var(--color-surface) 84%, transparent) 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.35s linear infinite;
`;

const EmbeddedCardButton = styled.button`
  display: grid;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
`;

const Card = styled.div<{ $embedded?: boolean }>`
  position: relative;
  border-radius: 22px;
  border: 1px solid ${(props) => (props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.08)")};
  background: ${(props) => (props.$embedded ? "var(--color-surface-2)" : "#151b29")};
  padding: ${(props) => (props.$embedded ? "18px 12px 12px" : "18px")};
  display: grid;
  gap: ${(props) => (props.$embedded ? "10px" : "14px")};
  overflow: ${(props) => (props.$embedded ? "visible" : "hidden")};
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--color-primary) 18%, var(--color-outline));
    box-shadow: var(--frame-shadow);
    background: ${(props) => (props.$embedded ? "color-mix(in srgb, var(--color-surface-2) 88%, white)" : "#192132")};
  }
`;

const EmbeddedCardRow = styled.div`
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr);
  gap: 12px;
  align-items: center;

  @media (max-width: 720px) {
    grid-template-columns: 132px minmax(0, 1fr);
  }

  @media (min-width: 641px) {
    grid-template-columns: 156px minmax(0, 1fr) auto;
  }
`;

const EmbeddedThumb = styled.div<{ $image?: string }>`
  width: 100%;
  min-height: 0;
  aspect-ratio: 3 / 2;
  border-radius: 14px;
  background: ${(props) =>
    props.$image ? `center / cover no-repeat url(${props.$image})` : "color-mix(in srgb, var(--color-surface) 92%, white)"};
  display: grid;
  place-items: center;
  color: var(--color-muted);
  overflow: hidden;
  position: relative;

  svg {
    width: 22px;
    height: 22px;
  }
`;

const EmbeddedCardBody = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
  align-content: start;
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const CardTitle = styled.h2<{ $embedded?: boolean }>`
  margin: 0;
  font-size: ${(props) => (props.$embedded ? "0.95rem" : "1.05rem")};
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: ${(props) => (props.$embedded ? 2 : 3)};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Meta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const EmbeddedPrice = styled.div`
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.2;
`;

const Pill = styled.span<{ $embedded?: boolean; $compact?: boolean; $tone?: "neutral" | "deal" | "price" | "status-success" | "status-warning" | "status-danger" | "status-muted" }>`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid
    ${(props) => {
      if (props.$tone === "deal") return props.$embedded ? "rgba(235, 35, 64, 0.14)" : "rgba(255, 146, 165, 0.18)";
      if (props.$tone === "price") return props.$embedded ? "rgba(59, 130, 246, 0.14)" : "rgba(120, 167, 255, 0.18)";
      if (props.$tone === "status-success") return props.$embedded ? "rgba(16, 185, 129, 0.14)" : "rgba(111, 232, 192, 0.18)";
      if (props.$tone === "status-warning") return props.$embedded ? "rgba(245, 158, 11, 0.18)" : "rgba(255, 210, 92, 0.2)";
      if (props.$tone === "status-danger") return props.$embedded ? "rgba(235, 35, 64, 0.14)" : "rgba(255, 146, 165, 0.18)";
      if (props.$tone === "status-muted") return props.$embedded ? "rgba(148, 163, 184, 0.2)" : "rgba(173, 184, 201, 0.16)";
      return props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.08)";
    }};
  background: ${(props) => {
    if (props.$tone === "deal") return props.$embedded ? "#fff1f3" : "rgba(255, 90, 118, 0.12)";
    if (props.$tone === "price") return props.$embedded ? "#eff6ff" : "rgba(59, 130, 246, 0.12)";
    if (props.$tone === "status-success") return props.$embedded ? "#ecfdf5" : "rgba(16, 185, 129, 0.12)";
    if (props.$tone === "status-warning") return props.$embedded ? "#fff7ed" : "rgba(245, 158, 11, 0.12)";
    if (props.$tone === "status-danger") return props.$embedded ? "#fff1f3" : "rgba(235, 35, 64, 0.12)";
    if (props.$tone === "status-muted") return props.$embedded ? "#f8fafc" : "rgba(148, 163, 184, 0.12)";
    return props.$embedded ? "color-mix(in srgb, var(--color-surface) 92%, white)" : "rgba(255, 255, 255, 0.06)";
  }};
  color: ${(props) => {
    if (props.$tone === "deal") return props.$embedded ? "#b4233a" : "#ffd6dd";
    if (props.$tone === "price") return props.$embedded ? "#1d4ed8" : "#dbeafe";
    if (props.$tone === "status-success") return props.$embedded ? "#0f766e" : "#d1fae5";
    if (props.$tone === "status-warning") return props.$embedded ? "#b45309" : "#fde68a";
    if (props.$tone === "status-danger") return props.$embedded ? "#b4233a" : "#ffd6dd";
    if (props.$tone === "status-muted") return props.$embedded ? "#64748b" : "#cbd5e1";
    return props.$embedded ? "var(--color-text)" : "#d9dfeb";
  }};
  display: inline-flex;
  align-items: center;
  font-size: ${(props) => (props.$compact ? "0.67rem" : props.$embedded ? "0.75rem" : "0.82rem")};
  font-weight: 600;
`;

const EmbeddedPill = styled(Pill)<{ $tone?: "neutral" | "deal" | "price" | "status-success" | "status-warning" | "status-danger" | "status-muted" }>`
  min-height: 24px;
  padding: 0 8px;
  font-size: ${(props) => (props.$compact ? "0.66rem" : "0.72rem")};
`;

const TypePill = styled(Pill)`
  @media (max-width: 640px) {
    display: none;
  }
`;

const IconPill = styled(Pill)`
  gap: 6px;

  svg {
    width: 13px;
    height: 13px;
    flex: 0 0 13px;
  }
`;

const Row = styled.div<{ $embedded?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: ${(props) => (props.$embedded ? "var(--color-muted)" : "#c7cfdd")};
`;

const Strong = styled.span<{ $embedded?: boolean }>`
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
  font-weight: 700;
`;

const Footer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const EmbeddedFooterMeta = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;
`;

const EmbeddedPillRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const EmbeddedFloatingPills = styled(EmbeddedPillRow)`
  position: absolute;
  top: 0;
  left: 12px;
  z-index: 2;
  transform: translateY(-50%);
`;

const EmbeddedFooterLine = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-muted);
  font-size: 0.78rem;
  line-height: 1.25;

  svg {
    width: 13px;
    height: 13px;
    flex: 0 0 13px;
  }
`;

const EmbeddedLeftStack = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const PropertyTypeTag = styled.div<{ $compact?: boolean }>`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 84px;
  align-self: stretch;
  padding: 8px 4px;
  border-left: 1px solid var(--color-outline);
  color: var(--color-muted);
  font-size: ${(props) => (props.$compact ? "0.68rem" : "0.74rem")};
  text-align: center;

  svg {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 640px) {
    display: none;
  }
`;

function PropertyTypeIcon({ type }: { type: string | null | undefined }) {
  const normalized = String(type ?? "").trim().toLowerCase();
  if (normalized === "land") return <LandPlot />;
  if (normalized === "house") return <Home />;
  if (["condo", "mini_condo", "apartment", "serviced_apartment"].includes(normalized)) return <Building2 />;
  if (["shop", "shop_office", "marketplace", "restaurant"].includes(normalized)) return <Store />;
  if (normalized === "office") return <BriefcaseBusiness />;
  if (normalized === "hotel") return <Hotel />;
  if (["warehouse", "industrial"].includes(normalized)) return <Warehouse />;
  return <Building2 />;
}

const EmptyCard = styled.div<{ $embedded?: boolean }>`
  border-radius: 24px;
  border: 1px dashed ${(props) => (props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.16)")};
  background: ${(props) => (props.$embedded ? "color-mix(in srgb, var(--color-surface-2) 72%, white)" : "rgba(255, 255, 255, 0.02)")};
  padding: 24px;
  color: ${(props) => (props.$embedded ? "var(--color-muted)" : "#97a0b2")};
  line-height: 1.65;
`;

const Notice = styled.div<{ $danger?: boolean; $embedded?: boolean }>`
  border-radius: 22px;
  border: 1px solid
    ${(props) =>
      props.$embedded
        ? props.$danger
          ? "rgba(255, 148, 148, 0.22)"
          : "rgba(255, 210, 92, 0.22)"
        : props.$danger
        ? "rgba(255, 148, 148, 0.22)"
        : "rgba(255, 210, 92, 0.22)"};
  background: ${(props) =>
    props.$embedded
      ? props.$danger
        ? "rgba(255, 148, 148, 0.08)"
        : "rgba(255, 210, 92, 0.08)"
      : props.$danger
      ? "rgba(255, 148, 148, 0.08)"
      : "rgba(255, 210, 92, 0.08)"};
  padding: 16px 18px;
  color: ${(props) =>
    props.$embedded
      ? props.$danger
        ? "#a61c2f"
        : "#7a5b00"
      : props.$danger
      ? "#ffd9df"
      : "#f2dfab"};
  line-height: 1.6;
`;

export type VendorPropertyItem = {
  id: string;
  title: string | null;
  deal_type: string | null;
  property_type: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  district: string | null;
  township: string | null;
  city: string | null;
  appointments_count: number;
  verification_status: string | null;
  cover_image_url?: string | null;
  state_region?: string | null;
  address_text?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
  floor_count?: number | null;
  room_count?: number | null;
  has_lift?: boolean | null;
  has_parking?: boolean | null;
};

type WorkspaceLimits = {
  limits?: {
    currentPlan?: {
      name: string;
    };
    listingCount?: number;
    listingLimit?: number;
    listingNearLimit?: boolean;
    listingOverLimit?: boolean;
    suggestedUpgrade?: {
      name: string;
      priceLabel: string;
    } | null;
  };
};

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDealTypeLabel(value: string | null | undefined, t: (key: string) => string) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "sale") return t("listing.forSale");
  if (normalized === "rent") return t("listing.forRent");
  return labelize(value);
}

function getListingStatusLabel(value: string | null | undefined, t: (key: string) => string) {
  const normalized = String(value ?? "").trim().toLowerCase();
  const key = normalized ? `vendor.properties.status.${normalized}` : "";
  const translated = key ? t(key) : "";
  if (translated && translated !== key) return translated;
  return labelize(value);
}

function getListingStatusTone(status: string | null | undefined) {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "active") return "status-success" as const;
  if (normalized === "reserved" || normalized === "paused" || normalized === "expired") return "status-warning" as const;
  if (normalized === "sold" || normalized === "rented" || normalized === "rejected") return "status-danger" as const;
  if (normalized === "draft" || normalized === "archived") return "status-muted" as const;
  return "neutral" as const;
}

type VendorPropertiesViewProps = {
  embedded?: boolean;
  hideHeader?: boolean;
  title?: string;
  subtitle?: string;
  onSelectProperty?: (property: VendorPropertyItem) => void;
  vendorId?: string | null;
};

export function VendorPropertiesView({
  embedded = false,
  hideHeader = false,
  title,
  subtitle,
  onSelectProperty,
  vendorId = null,
}: VendorPropertiesViewProps = {}) {
  const { authToken } = useAppState();
  const { t, language } = useI18n();
  const isMyanmar = language === "mm";
  const [items, setItems] = useState<VendorPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceLimits, setWorkspaceLimits] = useState<WorkspaceLimits["limits"] | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [dealType, setDealType] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((property) => {
      if (status && property.status !== status) return false;
      if (dealType && property.deal_type !== dealType) return false;
      if (propertyType && property.property_type !== propertyType) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        property.title,
        property.city,
        property.district,
        property.township,
        formatPropertyTypeValue(property.property_type, t),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [dealType, items, propertyType, query, status]);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [response, workspaceResponse] = await Promise.all([
          fetch("/api/vendor/properties", {
            headers: withActiveVendorHeaders(
              {
                Authorization: `Bearer ${authToken}`,
              },
              vendorId
            ),
          }),
          fetch("/api/vendor/workspace", {
            headers: withActiveVendorHeaders(
              {
                Authorization: `Bearer ${authToken}`,
              },
              vendorId
            ),
          }),
        ]);
        const payload = (await response.json()) as { items?: VendorPropertyItem[]; error?: string };
        const workspacePayload = (await workspaceResponse.json()) as WorkspaceLimits & { error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || t("vendor.properties.loadingError"));
        }
        if (!workspaceResponse.ok) {
          throw new Error(workspacePayload?.error || t("vendor.properties.limitError"));
        }
        if (!cancelled) {
          setItems(payload.items ?? []);
          setWorkspaceLimits(workspacePayload.limits ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("vendor.properties.loadingError"));
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
  }, [authToken, vendorId]);

  function applySearch() {
    setQuery(searchInput.trim());
  }

  function clearFilters() {
    setStatus("");
    setDealType("");
    setPropertyType("");
  }

  const resolvedTitle = title ?? t("vendor.properties.title");
  const resolvedSubtitle = subtitle ?? t("vendor.properties.subtitle");
  const recommendedUpgrade = workspaceLimits?.suggestedUpgrade
    ? t("vendor.properties.recommendedUpgrade", {
        name: workspaceLimits.suggestedUpgrade.name,
        price: workspaceLimits.suggestedUpgrade.priceLabel,
      })
    : "";
  const activeFilterCount = [status, dealType, propertyType].filter(Boolean).length;
  const mobileFilterPills = [
    status ? getListingStatusLabel(status, t) : null,
    dealType ? getDealTypeLabel(dealType, t) : null,
    propertyType ? formatPropertyTypeValue(propertyType, t) : null,
  ].filter(Boolean) as string[];

  if (loading) {
    return embedded ? (
      <EmbeddedLoadingState>
        {Array.from({ length: 4 }, (_, index) => (
          <EmbeddedSkeletonCard key={`properties-skeleton-${index}`}>
            <div style={{ display: "grid", gridTemplateColumns: "156px minmax(0, 1fr)", gap: 12, alignItems: "center" }}>
              <SkeletonBlock $height={104} $radius={16} />
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <SkeletonBlock $height={26} $radius={999} style={{ width: 72 }} />
                  <SkeletonBlock $height={26} $radius={999} style={{ width: 86 }} />
                </div>
                <SkeletonBlock $height={22} style={{ width: "56%" }} />
                <SkeletonBlock $height={16} style={{ width: "72%" }} />
                <SkeletonBlock $height={16} style={{ width: "42%" }} />
              </div>
            </div>
          </EmbeddedSkeletonCard>
        ))}
      </EmbeddedLoadingState>
    ) : (
      <LoadingOverlay message={t("vendor.properties.loading")} />
    );
  }

  return (
    <Page $embedded={embedded}>
      {!hideHeader ? (
        <Header $embedded={embedded}>
          <Heading>
            <Title $embedded={embedded}>{resolvedTitle}</Title>
            <Subtitle $embedded={embedded}>{resolvedSubtitle}</Subtitle>
          </Heading>
          <ActionLink $embedded={embedded} href="/request-sale">
            <Plus size={18} />
            <span>{t("vendor.properties.requestListing")}</span>
          </ActionLink>
        </Header>
      ) : null}

      {workspaceLimits?.listingNearLimit ? (
        <Notice $danger={workspaceLimits.listingOverLimit} $embedded={embedded}>
          {workspaceLimits.listingOverLimit
            ? t("vendor.properties.limitOver")
            : t("vendor.properties.limitNear", {
                count: workspaceLimits.listingCount ?? items.length,
                limit: workspaceLimits.listingLimit ?? items.length,
                upgrade: recommendedUpgrade,
              })}
        </Notice>
      ) : null}

      <Filters
        $compact={isMyanmar}
        onSubmit={(event) => {
          event.preventDefault();
          applySearch();
        }}
      >
        <MobileFilterBar>
          <SearchField $embedded={embedded}>
            <Input
              $embedded={embedded}
              $compact={isMyanmar}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("vendor.properties.searchPlaceholder")}
              aria-label={t("vendor.properties.searchAria")}
            />
            <SearchButton type="submit" $embedded={embedded} aria-label={t("vendor.properties.searchButtonAria")}>
              <Search />
            </SearchButton>
          </SearchField>
          <MobileFilterLauncher
            type="button"
            $embedded={embedded}
            aria-label={t("home.filters")}
            onClick={() => setMobileFiltersOpen(true)}
          >
            <Filter size={16} />
            {activeFilterCount > 0 ? <MobileFilterCount>{activeFilterCount}</MobileFilterCount> : null}
          </MobileFilterLauncher>
        </MobileFilterBar>
        <MobileOnlyFilterFields>
          <SearchField $embedded={embedded}>
            <Input
              $embedded={embedded}
              $compact={isMyanmar}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("vendor.properties.searchPlaceholder")}
              aria-label={t("vendor.properties.searchAria")}
            />
            <SearchButton type="submit" $embedded={embedded} aria-label={t("vendor.properties.searchButtonAria")}>
              <Search />
            </SearchButton>
          </SearchField>
          <CustomSelect
            id="vendor-property-status"
            name="vendor-property-status"
            label={t("vendor.properties.status")}
            value={status}
            onChange={setStatus}
            hideLabel
          >
            <option value="">{t("vendor.properties.allStatuses")}</option>
            <option value="draft">{t("vendor.properties.status.draft")}</option>
            <option value="active">{t("vendor.properties.status.active")}</option>
            <option value="paused">{t("vendor.properties.status.paused")}</option>
            <option value="reserved">{t("vendor.properties.status.reserved")}</option>
            <option value="sold">{t("vendor.properties.status.sold")}</option>
            <option value="rented">{t("vendor.properties.status.rented")}</option>
            <option value="expired">{t("vendor.properties.status.expired")}</option>
            <option value="archived">{t("vendor.properties.status.archived")}</option>
            <option value="rejected">{t("vendor.properties.status.rejected")}</option>
          </CustomSelect>
          <CustomSelect
            id="vendor-property-deal"
            name="vendor-property-deal"
            label={t("vendor.properties.deal")}
            value={dealType}
            onChange={setDealType}
            hideLabel
          >
            <option value="">{t("vendor.properties.allDeals")}</option>
            <option value="sale">{getDealTypeLabel("sale", t)}</option>
            <option value="rent">{getDealTypeLabel("rent", t)}</option>
          </CustomSelect>
          <CustomSelect
            id="vendor-property-type"
            name="vendor-property-type"
            label={t("vendor.properties.type")}
            value={propertyType}
            onChange={setPropertyType}
            hideLabel
          >
            <option value="">{t("vendor.properties.allTypes")}</option>
            {propertyTypeDefinitions.map((option) => (
              <option key={option.value} value={option.value}>
                {formatPropertyTypeValue(option.value, t)}
              </option>
            ))}
          </CustomSelect>
        </MobileOnlyFilterFields>
      </Filters>
      <MobileFilterSummary>
        {mobileFilterPills.map((pill) => (
          <MobileFilterPill key={pill}>{pill}</MobileFilterPill>
        ))}
      </MobileFilterSummary>
      <FilterSheetOverlay type="button" $open={mobileFiltersOpen} aria-label={t("home.filters")} onClick={() => setMobileFiltersOpen(false)} />
      <FilterSheet $open={mobileFiltersOpen}>
        <FilterSheetHeader>
          <FilterSheetTitle>
            <Filter size={16} />
            <span>{t("home.filters")}</span>
          </FilterSheetTitle>
          <FilterSheetClose type="button" aria-label={t("vendorShell.closeMenu")} onClick={() => setMobileFiltersOpen(false)}>
            <X size={16} />
          </FilterSheetClose>
        </FilterSheetHeader>
        <FilterSheetBody>
          <CustomSelect
            id="vendor-property-status-mobile"
            name="vendor-property-status-mobile"
            label={t("vendor.properties.status")}
            value={status}
            onChange={setStatus}
          >
            <option value="">{t("vendor.properties.allStatuses")}</option>
            <option value="draft">{t("vendor.properties.status.draft")}</option>
            <option value="active">{t("vendor.properties.status.active")}</option>
            <option value="paused">{t("vendor.properties.status.paused")}</option>
            <option value="reserved">{t("vendor.properties.status.reserved")}</option>
            <option value="sold">{t("vendor.properties.status.sold")}</option>
            <option value="rented">{t("vendor.properties.status.rented")}</option>
            <option value="expired">{t("vendor.properties.status.expired")}</option>
            <option value="archived">{t("vendor.properties.status.archived")}</option>
            <option value="rejected">{t("vendor.properties.status.rejected")}</option>
          </CustomSelect>
          <CustomSelect
            id="vendor-property-deal-mobile"
            name="vendor-property-deal-mobile"
            label={t("vendor.properties.deal")}
            value={dealType}
            onChange={setDealType}
          >
            <option value="">{t("vendor.properties.allDeals")}</option>
            <option value="sale">{getDealTypeLabel("sale", t)}</option>
            <option value="rent">{getDealTypeLabel("rent", t)}</option>
          </CustomSelect>
          <CustomSelect
            id="vendor-property-type-mobile"
            name="vendor-property-type-mobile"
            label={t("vendor.properties.type")}
            value={propertyType}
            onChange={setPropertyType}
          >
            <option value="">{t("vendor.properties.allTypes")}</option>
            {propertyTypeDefinitions.map((option) => (
              <option key={option.value} value={option.value}>
                {formatPropertyTypeValue(option.value, t)}
              </option>
            ))}
          </CustomSelect>
        </FilterSheetBody>
        <FilterSheetActions>
          <FilterSheetButton
            type="button"
            onClick={() => {
              clearFilters();
              setMobileFiltersOpen(false);
            }}
          >
            {t("filter.clearFilters")}
          </FilterSheetButton>
          <FilterSheetButton type="button" $primary onClick={() => setMobileFiltersOpen(false)}>
            {t("filter.apply")}
          </FilterSheetButton>
        </FilterSheetActions>
      </FilterSheet>

      {embedded ? (
        <EmbeddedViewport>
          <EmbeddedScroller>
            {error ? <EmptyCard $embedded>{error}</EmptyCard> : null}

            {!error && !filteredItems.length ? (
              <EmptyCard $embedded>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    color: "var(--color-text)",
                    fontWeight: 700,
                  }}
                >
                  <Filter size={16} />
                  <span>{t("vendor.properties.noMatchTitle")}</span>
                </div>
                {t("vendor.properties.noMatchCopy")}
              </EmptyCard>
            ) : null}

            {!!filteredItems.length && (
              <Grid>
                {filteredItems.map((property) => (
                  <Card key={property.id} $embedded>
                    <EmbeddedCardButton
                      type="button"
                      onClick={() => {
                        onSelectProperty?.(property);
                      }}
                        aria-label={`Open ${property.title || t("listing.property")} details`}
                    >
                      <EmbeddedFloatingPills>
                        <EmbeddedPill $embedded $compact={isMyanmar} $tone={getListingStatusTone(property.status)}>
                          {getListingStatusLabel(property.status, t)}
                        </EmbeddedPill>
                        <EmbeddedPill $embedded $compact={isMyanmar} $tone="deal">
                          {getDealTypeLabel(property.deal_type, t)}
                        </EmbeddedPill>
                        <EmbeddedPill $embedded $compact={isMyanmar} $tone="price">
                          {formatCurrency(property.price ?? undefined, property.currency ?? "MMK", t("listing.contactPrice"), language)}
                        </EmbeddedPill>
                      </EmbeddedFloatingPills>
                      <EmbeddedCardRow>
                        <EmbeddedThumb $image={property.cover_image_url || undefined}>
                          {!property.cover_image_url ? <Building2 /> : null}
                        </EmbeddedThumb>
                        <EmbeddedCardBody>
                          <EmbeddedLeftStack>
                            <CardTop>
                              <CardTitle $embedded>{property.title || t("vendor.properties.untitled")}</CardTitle>
                            </CardTop>
                            <EmbeddedFooterMeta>
                              <EmbeddedFooterLine>
                                <MapPin />
                                <span>{[property.district || property.city, property.township].filter(Boolean).join(" / ") || t("vendor.properties.unspecified")}</span>
                              </EmbeddedFooterLine>
                              <EmbeddedFooterLine>
                                <Calendar />
                                <span>{property.appointments_count} {t("vendor.properties.appointments")}</span>
                              </EmbeddedFooterLine>
                            </EmbeddedFooterMeta>
                          </EmbeddedLeftStack>
                        </EmbeddedCardBody>
                        <PropertyTypeTag $compact={isMyanmar}>
                          <PropertyTypeIcon type={property.property_type} />
                          <span>{formatPropertyTypeValue(property.property_type, t)}</span>
                        </PropertyTypeTag>
                      </EmbeddedCardRow>
                    </EmbeddedCardButton>
                  </Card>
                ))}
              </Grid>
            )}
          </EmbeddedScroller>
        </EmbeddedViewport>
      ) : (
        <>
          {error ? <EmptyCard>{error}</EmptyCard> : null}

          {!error && !items.length ? (
            <EmptyCard>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10, color: "#dbe2ef", fontWeight: 700 }}>
                <Filter size={16} />
                  <span>{t("vendor.properties.noMatchTitle")}</span>
                </div>
                {t("vendor.properties.noMatchCopy")}
              </EmptyCard>
            ) : null}

          {!!items.length && (
            <Grid>
              {items.map((property) => (
                <Card key={property.id}>
                  <CardTop>
                    <CardTitle>{property.title || t("vendor.properties.untitled")}</CardTitle>
                    <Pill $compact={isMyanmar} $tone={getListingStatusTone(property.status)}>{getListingStatusLabel(property.status, t)}</Pill>
                  </CardTop>
                  <Meta>
                    <Pill $compact={isMyanmar} $tone="deal">{getDealTypeLabel(property.deal_type, t)}</Pill>
                    <TypePill $compact={isMyanmar}>{formatPropertyTypeValue(property.property_type, t)}</TypePill>
                    <Pill $compact={isMyanmar} $tone={property.verification_status === "verified" || property.verification_status === "approved" ? "status-success" : "status-muted"}>
                      {`${t("vendor.properties.verification")}: ${labelize(property.verification_status)}`}
                    </Pill>
                  </Meta>
                  <Row>
                    <span>{t("vendor.properties.price")}</span>
                    <Strong>{formatCurrency(property.price ?? undefined, property.currency ?? "MMK", t("listing.contactPrice"), language)}</Strong>
                  </Row>
                  <Row>
                    <span>{t("vendor.properties.location")}</span>
                    <Strong>{[property.district || property.city, property.township].filter(Boolean).join(" / ") || t("vendor.properties.unspecified")}</Strong>
                  </Row>
                  <Footer>
                    <span style={{ color: "#9aa4b6" }}>{property.appointments_count} {t("vendor.properties.appointments")}</span>
                    <OpenLink href={`/vendor/properties/${property.id}`}>
                      <span>{t("vendor.properties.openWorkspace")}</span>
                      <ChevronRight size={16} />
                    </OpenLink>
                  </Footer>
                </Card>
              ))}
            </Grid>
          )}
        </>
      )}
    </Page>
  );
}
