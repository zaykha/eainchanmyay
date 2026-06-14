"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  BadgeCheck,
  Building2,
  Map,
  MapPin,
  Ruler,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import styled from "styled-components";
import { CustomSelect } from "@/features/site/shared/components/form-controls/CustomSelect";
import type { Listing, ListingFilters } from "@/features/site/shared/lib/data";
import { formatCurrency } from "@/features/site/shared/lib/format";
import {
  buildListingQuery,
  type ListingQueryBounds,
} from "@/features/site/shared/hooks/useInfiniteListings";
import { useI18n } from "@/features/site/shared/lib/i18n";
import { getDistricts, getStates, getTownships, translateLocationName } from "@/features/site/shared/lib/myanmar-geo";
import { formatPropertyTypeValue, propertyTypeDefinitions } from "@/lib/property-types";

const PropertyMapLeaflet = dynamic(() => import("./PropertyMapLeaflet"), {
  ssr: false,
  loading: () => <MapCanvas />,
});

type ListingsResponse = {
  data: Listing[];
  total: number;
  hasMore: boolean;
};

// TODO: add marker clustering when the project adopts a clustering package.
const MARKER_LIMIT = 100;

const Page = styled.div`
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(255, 123, 153, 0.12), transparent 26%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f8 100%);
  color: #172033;

  @media (max-width: 920px) {
    position: fixed;
    inset: 0;
    height: 100dvh;
    overflow: hidden;
    overscroll-behavior: none;
    touch-action: pan-x pan-y;
  }
`;

const Shell = styled.div`
  max-width: 1480px;
  margin: 0 auto;
  padding: 16px;
  height: 100%;

  @media (max-width: 920px) {
    padding: 0;
    height: 100dvh;
    overflow: hidden;
  }
`;

const DesktopLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(360px, 38%) minmax(0, 1fr);
  gap: 16px;
  height: calc(100vh - 32px);
  overflow: hidden;

  @media (max-width: 920px) {
    display: none;
  }
`;

const MobileLayout = styled.div`
  display: none;

  @media (max-width: 920px) {
    display: block;
    height: 100vh;
    overflow: hidden;
  }
`;

const Panel = styled.section`
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  overflow: hidden;
`;

const ListPanel = styled(Panel)`
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  min-height: 0;
`;

const MapPanel = styled(Panel)`
  position: relative;
  min-height: 0;
  background: #e8eef5;
`;

const PanelHeader = styled.div`
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 248, 252, 0.98));
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.84rem;
  color: #64748b;
  margin-bottom: 8px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.1;
`;

const SearchRow = styled.form`
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 8px;
  margin-top: 12px;
`;

const SearchInputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 46px;
  border-radius: 15px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
  color: #475569;

  svg {
    flex: 0 0 auto;
    display: block;
    color: #64748b;
  }

  input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    font: inherit;
    color: #172033;
    outline: none;
  }

  @media (max-width: 920px) {
    height: 40px;
    padding: 0 12px;
    gap: 6px;
    border-radius: 14px;

    input {
      font-size: 16px;
    }
  }
`;

const FilterBar = styled.div`
  padding: 10px 16px;
  display: grid;
  gap: 8px;
  background: rgba(244, 247, 251, 0.88);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
`;

const ChipRow = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
`;

const Chip = styled.button<{ $active?: boolean }>`
  border: 1px solid ${(props) => (props.$active ? "rgba(225, 29, 72, 0.28)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) => (props.$active ? "rgba(255, 235, 240, 0.95)" : "rgba(255, 255, 255, 0.96)")};
  color: ${(props) => (props.$active ? "#d61f55" : "#475569")};
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.82rem;
  white-space: nowrap;
  cursor: pointer;
  flex: 0 0 auto;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  height: 46px;
  padding: 0 15px;
  border-radius: 15px;
  border: 1px solid
    ${(props) => (props.$primary ? "rgba(225, 29, 72, 0.92)" : "rgba(148, 163, 184, 0.24)")};
  background: ${(props) =>
    props.$primary
      ? "linear-gradient(135deg, #ff4d73, #e11d48)"
      : "rgba(255, 255, 255, 0.96)"};
  color: ${(props) => (props.$primary ? "#fff" : "#172033")};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: ${(props) =>
    props.$primary ? "0 14px 28px rgba(225, 29, 72, 0.2)" : "0 8px 18px rgba(15, 23, 42, 0.06)"};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  @media (max-width: 920px) {
    height: 40px;
    min-width: 40px;
    padding: 0 11px;
    border-radius: 14px;
    box-shadow: ${(props) =>
      props.$primary ? "0 10px 22px rgba(225, 29, 72, 0.18)" : "0 6px 14px rgba(15, 23, 42, 0.05)"};
  }
`;

const IconLinkButton = styled(Link)<{ $primary?: boolean }>`
  height: 46px;
  min-width: 46px;
  padding: 0 13px;
  border-radius: 15px;
  border: 1px solid
    ${(props) => (props.$primary ? "rgba(225, 29, 72, 0.92)" : "rgba(148, 163, 184, 0.24)")};
  background: ${(props) =>
    props.$primary
      ? "linear-gradient(135deg, #ff4d73, #e11d48)"
      : "rgba(255, 255, 255, 0.96)"};
  color: ${(props) => (props.$primary ? "#fff" : "#172033")};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${(props) =>
    props.$primary ? "0 14px 28px rgba(225, 29, 72, 0.2)" : "0 8px 18px rgba(15, 23, 42, 0.06)"};

  @media (max-width: 920px) {
    height: 40px;
    min-width: 40px;
    padding: 0 11px;
    border-radius: 14px;
    box-shadow: ${(props) =>
      props.$primary ? "0 10px 22px rgba(225, 29, 72, 0.18)" : "0 6px 14px rgba(15, 23, 42, 0.05)"};
  }
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
`;

const SummaryCard = styled.div`
  background: linear-gradient(180deg, #ffffff, #f7f9fc);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 15px;
  padding: 10px 12px 9px;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.05);
`;

const SummaryValue = styled.div`
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1;
`;

const SummaryLabel = styled.div`
  margin-top: 6px;
  color: #64748b;
  font-size: 0.8rem;
`;

const ListScroller = styled.div`
  overflow-y: auto;
  padding: 8px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  background: rgba(244, 247, 251, 0.92);
  align-items: stretch;
`;

const ListingButton = styled.article<{ $selected?: boolean }>`
  position: relative;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  grid-template-areas:
    "image content"
    "image actions";
  gap: 8px;
  padding: 8px;
  border-radius: 18px;
  border: 1px solid
    ${(props) => (props.$selected ? "rgba(225, 29, 72, 0.34)" : "rgba(148, 163, 184, 0.18)")};
  background: ${(props) => (props.$selected ? "rgba(255, 241, 244, 0.94)" : "#fff")};
  box-shadow: ${(props) =>
    props.$selected ? "0 18px 30px rgba(225, 29, 72, 0.12)" : "0 12px 26px rgba(15, 23, 42, 0.05)"};
  cursor: pointer;
  align-self: start;
  min-height: 148px;
  width: 100%;
  overflow: visible;

  @media (max-width: 920px) {
    grid-template-areas:
      "image content"
      "actions actions";
  }
`;

const ListingImage = styled.div`
  grid-area: image;
  width: 112px;
  aspect-ratio: 1.05;
  border-radius: 16px;
  background: linear-gradient(135deg, #d7dde6, #b3c1d3);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const ListingContent = styled.div`
  grid-area: content;
  min-width: 0;
  display: grid;
  gap: 5px;
  align-content: start;
  min-height: 124px;
  padding-top: 10px;

  @media (max-width: 920px) {
    gap: 3px;
    min-height: auto;
    padding-top: 10px;
  }
`;

const ListingTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 96px;

  @media (max-width: 920px) {
    gap: 3px;
    padding-right: 84px;
  }
`;

const ListingTopMain = styled.div`
  min-width: 0;
`;

const ListingTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 920px) {
    font-size: 0.82rem;
  }
`;

const PriceLabel = styled.div`
  font-size: 0.95rem;
  font-weight: 800;
  color: #e11d48;
  white-space: nowrap;

  @media (max-width: 920px) {
    font-size: 0.8rem;
  }
`;

const MetaLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  color: #667085;
  font-size: 0.8rem;

  @media (max-width: 920px) {
    font-size: 0.72rem;
    gap: 3px;
  }
`;

const PreviewLocation = styled(MetaLine)`
  flex-wrap: nowrap;
  min-width: 0;
`;

const LocationText = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MiniPill = styled.span<{ $tone?: "accent" | "neutral" }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 800;
  background: ${(props) =>
    props.$tone === "accent" ? "rgba(255, 236, 240, 0.95)" : "rgba(241, 245, 249, 0.95)"};
  color: ${(props) => (props.$tone === "accent" ? "#d61f55" : "#475569")};
  border: 1px solid
    ${(props) =>
      props.$tone === "accent" ? "rgba(225, 29, 72, 0.18)" : "rgba(148, 163, 184, 0.18)"};

  @media (max-width: 920px) {
    gap: 4px;
    padding: 3px 6px;
    font-size: 0.62rem;
  }
`;

const FloatingDealPill = styled(MiniPill)`
  position: absolute;
  top: 0;
  right: 16px;
  transform: translateY(-50%);
  z-index: 2;
  background: linear-gradient(135deg, #ff4d73, #e11d48);
  color: #fff;
  border-color: rgba(225, 29, 72, 0.92);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);

  @media (max-width: 920px) {
    right: 20px;
  }
`;

const FloatingPropertyPill = styled(MiniPill)`
  position: absolute;
  top: 0;
  right: 72px;
  transform: translateY(-50%);
  z-index: 2;
  max-width: calc(100% - 116px);
  background: rgba(241, 245, 249, 0.98);
  color: #334155;
  border-color: rgba(148, 163, 184, 0.28);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 920px) {
    right: 72px;
    max-width: calc(100% - 116px);
  }
`;

const CompactInfoRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  min-width: 0;
  width: 100%;

  @media (max-width: 920px) {
    gap: 5px;
  }
`;

const CompactStats = styled.div`
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  min-width: 0;
  color: #475569;
  font-size: 0.72rem;

  @media (max-width: 920px) {
    gap: 5px;
    font-size: 0.68rem;
  }
`;

const CompactStat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
  white-space: nowrap;

  svg {
    flex: 0 0 auto;
  }
`;

const CardActions = styled.div`
  grid-area: actions;
  display: flex;
  width: 100%;
  gap: 6px;
  flex-wrap: nowrap;
  margin-top: 2px;
  padding-top: 0;

  @media (max-width: 920px) {
    margin-top: 0;
    gap: 6px;
  }
`;

const CardLink = styled(Link)<{ $accent?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 9px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.74rem;
  flex: 1 1 0;
  white-space: nowrap;
  border: 1px solid
    ${(props) => (props.$accent ? "rgba(225, 29, 72, 0.86)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) => (props.$accent ? "linear-gradient(135deg, #ff4d73, #e11d48)" : "#fff")};
  color: ${(props) => (props.$accent ? "#fff" : "#172033")};

  @media (max-width: 920px) {
    min-height: 28px;
    padding: 0 8px;
    border-radius: 9px;
    font-size: 0.7rem;
  }
`;

const MapCanvas = styled.div`
  position: absolute;
  inset: 0;
`;

const MapOverlayTop = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: center;
  z-index: 410;
  pointer-events: none;
`;

const SearchAreaButton = styled.button`
  pointer-events: auto;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(225, 29, 72, 0.85);
  background: linear-gradient(135deg, #ff4d73, #e11d48);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 18px 34px rgba(225, 29, 72, 0.24);
  cursor: pointer;

  @media (max-width: 920px) {
    min-height: 36px;
    padding: 0 16px;
    font-size: 0.92rem;
    box-shadow: 0 12px 24px rgba(225, 29, 72, 0.18);
  }
`;

const MapPreviewWrap = styled.div`
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  z-index: 400;
  display: flex;
  justify-content: center;
  pointer-events: none;

  @media (max-width: 920px) {
    left: 12px;
    right: 12px;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 118px);
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
`;

const MapPreviewCard = styled.div`
  pointer-events: auto;
  position: relative;
  width: min(420px, 100%);
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.18);
  padding: 8px;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 8px;

  @media (max-width: 920px) {
    position: relative;
    width: 100%;
    max-width: 100%;
    padding: 8px;
    border-radius: 20px;
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.16);
    grid-template-columns: 112px minmax(0, 1fr);
    gap: 8px;
  }
`;

const PreviewContent = styled.div`
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  display: grid;
  gap: 5px;
  align-content: start;
  padding-right: 84px;
  padding-top: 10px;

  @media (max-width: 920px) {
    gap: 3px;
    padding-right: 84px;
    padding-top: 10px;
  }
`;

const PreviewImage = styled(ListingImage)`
  grid-column: 1;
  grid-row: 1;
  align-self: start;
  width: 112px;

  @media (max-width: 920px) {
    width: 112px;
    border-radius: 16px;
  }
`;

const PreviewActions = styled(CardActions)`
  grid-area: auto;
  margin-top: 2px;
  padding-top: 0;
`;

const MobileListButton = styled.button`
  display: none;

  @media (max-width: 920px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(225, 29, 72, 0.9);
    background: linear-gradient(135deg, #ff4d73, #e11d48);
    color: #fff;
    font-weight: 800;
    box-shadow: 0 14px 26px rgba(225, 29, 72, 0.2);
    pointer-events: auto;
  }
`;

const EmptyState = styled.div`
  padding: 36px 20px;
  text-align: center;
  color: #64748b;
`;

const MobileTopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 420;
  padding: 12px 12px 0;
  display: grid;
  gap: 10px;
`;

const MobileTopCard = styled.div`
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
  padding: 8px;
`;

const MobileSearchRow = styled.form`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: 8px;
`;

const MobileSearchButton = styled(ActionButton)`
  padding: 0 12px;
`;

const FloatingListButton = styled.button`
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  z-index: 430;
  min-height: 52px;
  padding: 0 20px;
  border-radius: 999px;
  border: 1px solid rgba(225, 29, 72, 0.9);
  background: linear-gradient(135deg, #ff4d73, #e11d48);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 22px 44px rgba(225, 29, 72, 0.24);

  @media (max-width: 920px) {
    display: none;
  }
`;

const MobileListSheet = styled.div`
  position: fixed;
  inset: auto 0 0 0;
  z-index: 520;
  background: #f8fafc;
  border-radius: 28px 28px 0 0;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 -18px 44px rgba(15, 23, 42, 0.18);
  max-height: 72vh;
  display: grid;
  grid-template-rows: auto 1fr;
`;

const SheetHeader = styled.div`
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
`;

const SheetTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
`;

const SheetClose = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 22, 0.44);
  z-index: 500;
`;

const FilterDialog = styled.div`
  position: fixed;
  inset: auto 16px 16px;
  z-index: 540;
  background: #fff;
  border-radius: 26px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 26px 54px rgba(15, 23, 42, 0.18);
  padding: 18px;
  display: grid;
  gap: 14px;

  @media (min-width: 921px) {
    inset: 80px auto auto 50%;
    transform: translateX(-50%);
    width: min(720px, calc(100vw - 48px));
  }
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const FilterTitle = styled.h2`
  margin: 0;
  font-size: 1.05rem;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const NumberField = styled.label`
  display: grid;
  gap: 8px;
  color: #475569;
  font-size: 0.86rem;
  font-weight: 700;

  input {
    height: 50px;
    padding: 0 14px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.24);
    background: #fff;
    font: inherit;
    color: #172033;
    outline: none;
  }
`;

const FilterFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
`;

const SecondaryButton = styled(ActionButton)`
  background: #fff;
  color: #172033;
  border-color: rgba(148, 163, 184, 0.24);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
`;

const SkeletonGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const SkeletonCard = styled.div`
  height: 142px;
  border-radius: 22px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.74), rgba(241, 245, 249, 0.96), rgba(226, 232, 240, 0.74));
  background-size: 200% 100%;
  animation: shimmer 1.35s linear infinite;

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const propertyTypeOptions = [
  { value: "", labelKey: "filter.allTypes" },
  ...propertyTypeDefinitions.map((item) => ({ value: item.value, label: item.label })),
  { value: "house_land", labelKey: "property.houseLand" },
  { value: "commercial", labelKey: "property.commercial" },
  { value: "hotel_restaurant", labelKey: "property.hotelRestaurant" },
];

const hasCoordinates = (listing: Listing) =>
  typeof listing.latitude === "number" &&
  typeof listing.longitude === "number" &&
  Number.isFinite(listing.latitude) &&
  Number.isFinite(listing.longitude);

const buildBoundsKey = (bounds: ListingQueryBounds | null) =>
  bounds
    ? `${bounds.south.toFixed(4)}:${bounds.north.toFixed(4)}:${bounds.west.toFixed(4)}:${bounds.east.toFixed(4)}`
    : "none";

const normalizeCount = (count: number) => new Intl.NumberFormat("en-US").format(count);

const toOptionalNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildHomeSearchHref = (filters: ListingFilters) => {
  const params = new URLSearchParams(buildListingQuery(filters, { page: 1 }));
  params.delete("page");
  params.delete("pageSize");
  return params.toString() ? `/?${params.toString()}` : "/";
};

function MapListingCard({
  listing,
  selected,
  onSelect,
  registerRef,
  t,
  language,
}: {
  listing: Listing;
  selected: boolean;
  onSelect: () => void;
  registerRef?: (node: HTMLElement | null) => void;
  t: (key: string, params?: Record<string, string | number | null | undefined>) => string;
  language: string;
}) {
  const locationLine = [listing.township, listing.district || listing.city]
    .filter(Boolean)
    .map((part) => translateLocationName(String(part), language))
    .join(", ");
  const facts = [
    listing.bedrooms ? { key: "beds", icon: <BedDouble size={15} />, label: `${listing.bedrooms}` } : null,
    listing.bathrooms ? { key: "baths", icon: <Bath size={15} />, label: `${listing.bathrooms}` } : null,
    listing.areaSqft
      ? {
          key: "area",
          icon: <Ruler size={15} />,
          label: `${listing.areaSqft.toLocaleString(language === "mm" ? "my-MM" : "en-US")}`,
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; icon: ReactNode; label: string }>;

  return (
    <div
      ref={registerRef}
      style={{ display: "block", width: "100%" }}
    >
      <ListingButton
        $selected={selected}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
      >
        <FloatingPropertyPill>
          <Building2 size={13} />
          {formatPropertyTypeValue(listing.propertyType, t) || t("listing.property")}
        </FloatingPropertyPill>
        <FloatingDealPill>
          {listing.dealType ? (listing.dealType === "rent" ? t("listing.forRent") : t("listing.forSale")) : t("common.notAvailable")}
        </FloatingDealPill>
        <ListingImage>
          {listing.imageUrl ? <img src={listing.imageUrl} alt={listing.title} /> : null}
        </ListingImage>
        <ListingContent>
          <ListingTop>
            <ListingTopMain>
              <ListingTitle>{listing.title || t("listing.property")}</ListingTitle>
            </ListingTopMain>
            <PriceLabel>{formatCurrency(listing.price, listing.currency, t("listing.contactPrice"), language)}</PriceLabel>
            <CompactInfoRow>
              {facts.length ? (
                <CompactStats>
                  {facts.map((fact) => (
                    <CompactStat key={fact.key}>
                      {fact.icon}
                      {fact.label}
                    </CompactStat>
                  ))}
                </CompactStats>
              ) : null}
            </CompactInfoRow>
          </ListingTop>
          <PreviewLocation>
            <MapPin size={15} />
            <LocationText>
              {locationLine || (listing.stateRegion ? translateLocationName(listing.stateRegion, language) : "") || t("map.locationPending")}
            </LocationText>
          </PreviewLocation>
          {listing.verificationStatus === "approved" ? (
            <MetaLine>
              <MiniPill $tone="accent">
                <BadgeCheck size={14} />
                {t("agency.verifiedStatus")}
              </MiniPill>
            </MetaLine>
          ) : null}
          <PreviewActions onClick={(event) => event.stopPropagation()}>
            <CardLink href={`/listing/${listing.id}`}>{t("map.viewDetails")}</CardLink>
            <CardLink href={`/listing/${listing.id}#contact`} $accent>
              {t("map.contact")}
            </CardLink>
          </PreviewActions>
        </ListingContent>
      </ListingButton>
    </div>
  );
}

export default function PropertyMapView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useI18n();

  const initialQuery = searchParams.get("q") ?? "";
  const initialDealType = searchParams.get("deal") ?? "";
  const initialPropertyType = searchParams.get("type") ?? "";
  const initialStateRegion = searchParams.get("state") ?? "";
  const initialDistrict = searchParams.get("district") ?? "";
  const initialTownship = searchParams.get("township") ?? "";
  const initialMinPrice = searchParams.get("minPrice") ?? "";
  const initialMaxPrice = searchParams.get("maxPrice") ?? "";
  const initialBedrooms = searchParams.get("beds") ?? "";
  const initialBathrooms = searchParams.get("baths") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [searchDraft, setSearchDraft] = useState(initialQuery);
  const [dealType, setDealType] = useState(initialDealType);
  const [propertyType, setPropertyType] = useState(initialPropertyType);
  const [stateRegion, setStateRegion] = useState(initialStateRegion);
  const [district, setDistrict] = useState(initialDistrict);
  const [township, setTownship] = useState(initialTownship);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [bedrooms, setBedrooms] = useState(initialBedrooms);
  const [bathrooms, setBathrooms] = useState(initialBathrooms);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [appliedBounds, setAppliedBounds] = useState<ListingQueryBounds | null>(null);
  const [pendingBounds, setPendingBounds] = useState<ListingQueryBounds | null>(null);
  const [hasUserMovedMap, setHasUserMovedMap] = useState(false);
  const [mobilePropertyTypePillsVisible, setMobilePropertyTypePillsVisible] = useState(false);
  const requestIdRef = useRef(0);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const initialBoundsSeenRef = useRef(false);

  const filters = useMemo<ListingFilters>(
    () => ({
      query,
      dealType: dealType || undefined,
      propertyType: propertyType || undefined,
      stateRegion: stateRegion || undefined,
      district: district || undefined,
      township: township || undefined,
      minPrice: toOptionalNumber(minPrice),
      maxPrice: toOptionalNumber(maxPrice),
      bedrooms: toOptionalNumber(bedrooms),
      bathrooms: toOptionalNumber(bathrooms),
    }),
    [bathrooms, bedrooms, dealType, district, maxPrice, minPrice, propertyType, query, stateRegion, township]
  );

  const stateOptions = useMemo(() => getStates(), []);
  const districtOptions = useMemo(
    () => (stateRegion ? getDistricts(stateRegion) : []),
    [stateRegion]
  );
  const townshipOptions = useMemo(
    () => (stateRegion && district ? getTownships(stateRegion, district) : []),
    [district, stateRegion]
  );

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  const boundsKey = useMemo(() => buildBoundsKey(appliedBounds), [appliedBounds]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    const queryString = buildListingQuery(filters, {
      view: "map",
      page: 1,
      pageSize: 120,
      bounds: appliedBounds,
    });

    fetch(`/api/listings?${queryString}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(t("map.unableLoad"));
        }
        return (await response.json()) as ListingsResponse;
      })
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setListings(result.data ?? []);
        setTotal(result.total ?? 0);
      })
      .catch((fetchError: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setListings([]);
        setTotal(0);
        setError(fetchError instanceof Error ? fetchError.message : t("map.unableLoad"));
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      });
  }, [appliedBounds, boundsKey, filterKey, filters]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set("q", query.trim());
    if (dealType) nextParams.set("deal", dealType);
    if (propertyType) nextParams.set("type", propertyType);
    if (stateRegion) nextParams.set("state", stateRegion);
    if (district) nextParams.set("district", district);
    if (township) nextParams.set("township", township);
    if (minPrice) nextParams.set("minPrice", minPrice);
    if (maxPrice) nextParams.set("maxPrice", maxPrice);
    if (bedrooms) nextParams.set("beds", bedrooms);
    if (bathrooms) nextParams.set("baths", bathrooms);
    const nextUrl = nextParams.toString() ? `/properties/map?${nextParams.toString()}` : "/properties/map";
    router.replace(nextUrl);
  }, [bathrooms, bedrooms, dealType, district, maxPrice, minPrice, propertyType, query, router, stateRegion, township]);

  const mapListings = useMemo(() => listings.filter(hasCoordinates), [listings]);
  const markerListings = useMemo(() => mapListings.slice(0, MARKER_LIMIT), [mapListings]);
  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedId) ?? markerListings[0] ?? listings[0] ?? null,
    [listings, markerListings, selectedId]
  );
  const missingLocationCount = Math.max(0, listings.length - mapListings.length);
  const focusedMapListing = useMemo(
    () => (selectedListing && hasCoordinates(selectedListing) ? selectedListing : markerListings[0] ?? null),
    [markerListings, selectedListing]
  );
  const hasPendingAreaChange =
    pendingBounds !== null && buildBoundsKey(pendingBounds) !== buildBoundsKey(appliedBounds);
  const searchAreaVisible =
    hasPendingAreaChange && (!isMobileViewport ? true : hasUserMovedMap && !mobilePropertyTypePillsVisible);
  const homeHref = useMemo(() => buildHomeSearchHref(filters), [filters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 920px)");
    const sync = () => {
      setIsMobileViewport(media.matches);
      setViewportReady(true);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!selectedListing) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !listings.some((listing) => listing.id === selectedId)) {
      setSelectedId(selectedListing.id);
    }
  }, [listings, selectedId, selectedListing]);

  useEffect(() => {
    if (!selectedId) return;
    const target = cardRefs.current[selectedId];
    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const submitSearch = () => {
    setQuery(searchDraft);
  };

  const showMobilePropertyTypePills = () => {
    if (!isMobileViewport) return;
    setMobilePropertyTypePillsVisible(true);
  };

  const hideMobilePropertyTypePills = () => {
    if (!isMobileViewport) return;
    setMobilePropertyTypePillsVisible(false);
  };

  const handleBoundsChange = (nextBounds: ListingQueryBounds) => {
    setPendingBounds(nextBounds);
    if (!initialBoundsSeenRef.current) {
      initialBoundsSeenRef.current = true;
      return;
    }
    setHasUserMovedMap(true);
    setMobilePropertyTypePillsVisible(false);
  };

  const resetFilters = () => {
    setDealType("");
    setPropertyType("");
    setStateRegion("");
    setDistrict("");
    setTownship("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setBathrooms("");
    setAppliedBounds(null);
    setPendingBounds(null);
    setHasUserMovedMap(false);
  };

  const renderListContent = () => {
    if (loading) {
      return (
        <SkeletonGrid>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </SkeletonGrid>
      );
    }

    if (error) {
      return <EmptyState>{error}</EmptyState>;
    }

    if (!listings.length) {
      return <EmptyState>{t("map.noMatches")}</EmptyState>;
    }

    return listings.map((listing) => (
      <MapListingCard
        key={listing.id}
        listing={listing}
        selected={listing.id === selectedListing?.id}
        onSelect={() => {
          setSelectedId(listing.id);
          setMobileListOpen(false);
        }}
        t={t}
        language={language}
        registerRef={(node) => {
          cardRefs.current[listing.id] = node;
        }}
      />
    ));
  };

  const previewCard = selectedListing ? (
    <MapPreviewCard>
      <PreviewImage>{selectedListing.imageUrl ? <img src={selectedListing.imageUrl} alt={selectedListing.title || t("listing.property")} /> : null}</PreviewImage>
      <FloatingPropertyPill>
        <Building2 size={13} />
        {formatPropertyTypeValue(selectedListing.propertyType, t) || t("listing.property")}
      </FloatingPropertyPill>
      <FloatingDealPill>
        {selectedListing.dealType
          ? selectedListing.dealType === "rent"
            ? t("listing.forRent")
            : t("listing.forSale")
          : t("common.notAvailable")}
      </FloatingDealPill>
      <PreviewContent>
        <ListingTop>
          <ListingTopMain>
            <ListingTitle>{selectedListing.title || t("listing.property")}</ListingTitle>
          </ListingTopMain>
          <PriceLabel>{formatCurrency(selectedListing.price, selectedListing.currency, t("listing.contactPrice"), language)}</PriceLabel>
          <CompactInfoRow>
            <CompactStats>
              {selectedListing.bedrooms ? (
                <CompactStat>
                  <BedDouble size={isMobileViewport ? 12 : 15} />
                  {selectedListing.bedrooms}
                </CompactStat>
              ) : null}
              {selectedListing.bathrooms ? (
                <CompactStat>
                  <Bath size={isMobileViewport ? 12 : 15} />
                  {selectedListing.bathrooms}
                </CompactStat>
              ) : null}
              {selectedListing.areaSqft ? (
                <CompactStat>
                  <Ruler size={isMobileViewport ? 12 : 15} />
                  {selectedListing.areaSqft.toLocaleString(language === "mm" ? "my-MM" : "en-US")}
                </CompactStat>
              ) : null}
            </CompactStats>
          </CompactInfoRow>
        </ListingTop>
        <PreviewLocation>
          <MapPin size={15} />
          <LocationText>
            {[selectedListing.township, selectedListing.district || selectedListing.city]
              .filter(Boolean)
              .map((part) => translateLocationName(String(part), language))
              .join(", ") ||
              (selectedListing.stateRegion ? translateLocationName(selectedListing.stateRegion, language) : "") ||
              t("map.locationPending")}
          </LocationText>
        </PreviewLocation>
        <PreviewActions>
          <CardLink href={`/listing/${selectedListing.id}`}>{t("map.viewDetails")}</CardLink>
          <CardLink href={`/listing/${selectedListing.id}#contact`} $accent>
            {t("map.contact")}
          </CardLink>
        </PreviewActions>
      </PreviewContent>
    </MapPreviewCard>
  ) : null;

  return (
    <Page>
      <Shell>
        {viewportReady && !isMobileViewport ? (
        <DesktopLayout>
          <ListPanel>
            <PanelHeader>
              <BackLink href={homeHref}>
                <ArrowLeft size={16} />
                {t("map.backToSearch")}
              </BackLink>
              <Title>{t("map.discovery")}</Title>
              <SearchRow
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
                }}
              >
                <IconLinkButton href={homeHref} aria-label={t("map.backToSearch")} title={t("map.backToSearch")}>
                  <ArrowLeft size={18} />
                </IconLinkButton>
                <SearchInputWrap>
                  <Search size={19} />
                  <input
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    placeholder={t("map.searchPlaceholder")}
                  />
                </SearchInputWrap>
                <ActionButton type="submit" $primary>
                  <Search size={16} />
                  {t("map.search")}
                </ActionButton>
                <ActionButton type="button" onClick={() => setFilterOpen(true)}>
                  <SlidersHorizontal size={16} />
                  {t("home.filters")}
                </ActionButton>
              </SearchRow>
            </PanelHeader>

            <FilterBar>
              <ChipRow>
                <Chip $active={!dealType} onClick={() => setDealType("")}>
                  {t("filter.allDeals")}
                </Chip>
                <Chip $active={dealType === "sale"} onClick={() => setDealType("sale")}>
                  {t("home.buy")}
                </Chip>
                <Chip $active={dealType === "rent"} onClick={() => setDealType("rent")}>
                  {t("home.rent")}
                </Chip>
              </ChipRow>
              <ChipRow>
                <Chip $active={!propertyType} onClick={() => setPropertyType("")}>
                  {t("filter.allTypes")}
                </Chip>
                {propertyTypeDefinitions.slice(0, 8).map((item) => (
                  <Chip
                    key={item.value}
                    $active={propertyType === item.value}
                    onClick={() => setPropertyType((current) => (current === item.value ? "" : item.value))}
                  >
                    {item.label}
                  </Chip>
                ))}
              </ChipRow>
            </FilterBar>

            <SummaryRow>
              <SummaryCard>
                <SummaryValue>{normalizeCount(total)}</SummaryValue>
                <SummaryLabel>{t("map.totalResults")}</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryValue>{normalizeCount(markerListings.length)}</SummaryValue>
                <SummaryLabel>{t("map.mapMarkers")}</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryValue>{normalizeCount(missingLocationCount)}</SummaryValue>
                <SummaryLabel>{t("map.missingPins")}</SummaryLabel>
              </SummaryCard>
            </SummaryRow>

            <ListScroller>{renderListContent()}</ListScroller>
          </ListPanel>

          <MapPanel>
            <MapCanvas>
              <PropertyMapLeaflet
                key="desktop-map"
                listings={markerListings}
                selectedId={selectedListing?.id ?? null}
                onSelect={setSelectedId}
                onBoundsChange={handleBoundsChange}
                focusedListing={focusedMapListing}
              />
            </MapCanvas>
            {searchAreaVisible ? (
              <MapOverlayTop>
                <SearchAreaButton
                  type="button"
                  onClick={() => {
                    setAppliedBounds(pendingBounds);
                  }}
                >
                  {t("map.searchThisArea")}
                </SearchAreaButton>
              </MapOverlayTop>
            ) : null}
            <MapPreviewWrap>{previewCard}</MapPreviewWrap>
          </MapPanel>
        </DesktopLayout>
        ) : null}

        {viewportReady && isMobileViewport ? (
        <MobileLayout>
          <MapPanel style={{ minHeight: "100vh", borderRadius: 0, border: "none" }}>
            <MapCanvas>
              <PropertyMapLeaflet
                key="mobile-map"
                listings={markerListings}
                selectedId={selectedListing?.id ?? null}
                onSelect={setSelectedId}
                onBoundsChange={handleBoundsChange}
                focusedListing={focusedMapListing}
              />
            </MapCanvas>

            <MobileTopBar>
              <MobileTopCard>
                <MobileSearchRow
                  onSubmit={(event) => {
                    event.preventDefault();
                  }}
                >
                  <IconLinkButton href={homeHref} aria-label={t("map.backToSearch")} title={t("map.backToSearch")}>
                    <ArrowLeft size={18} />
                  </IconLinkButton>
                  <SearchInputWrap>
                    <Search size={19} />
                    <input
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      onFocus={showMobilePropertyTypePills}
                      onClick={showMobilePropertyTypePills}
                      onBlur={hideMobilePropertyTypePills}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                        }
                      }}
                      placeholder={t("map.searchProperties")}
                    />
                  </SearchInputWrap>
                  <ActionButton type="button" onClick={() => setFilterOpen(true)}>
                    <SlidersHorizontal size={16} />
                  </ActionButton>
                  <MobileSearchButton
                    type="button"
                    $primary
                    aria-label={t("map.search")}
                    onClick={submitSearch}
                  >
                    <Search size={16} />
                  </MobileSearchButton>
                </MobileSearchRow>
              </MobileTopCard>
              {mobilePropertyTypePillsVisible ? (
                <ChipRow>
                  <Chip $active={!propertyType} onClick={() => setPropertyType("")}>
                    {t("filter.allTypes")}
                  </Chip>
                  {propertyTypeDefinitions.slice(0, 6).map((item) => (
                    <Chip
                      key={item.value}
                      $active={propertyType === item.value}
                      onClick={() => setPropertyType((current) => (current === item.value ? "" : item.value))}
                    >
                      {formatPropertyTypeValue(item.value, t) || item.label}
                    </Chip>
                  ))}
                </ChipRow>
              ) : null}
            </MobileTopBar>

            {searchAreaVisible ? (
              <MapOverlayTop style={{ top: 92 }}>
                <SearchAreaButton
                  type="button"
                  onClick={() => {
                    setAppliedBounds(pendingBounds);
                    setHasUserMovedMap(false);
                  }}
                >
                  {t("map.searchThisArea")}
                </SearchAreaButton>
              </MapOverlayTop>
            ) : null}

            <MapPreviewWrap>
              {!mobileListOpen && isMobileViewport ? (
                <MobileListButton type="button" onClick={() => setMobileListOpen(true)}>
                  <Map size={14} />
                  {t("map.showList")}
                </MobileListButton>
              ) : null}
              {!mobileListOpen ? previewCard : null}
            </MapPreviewWrap>
          </MapPanel>
        </MobileLayout>
        ) : null}
      </Shell>

      {mobileListOpen && (
        <>
          <Overlay onClick={() => setMobileListOpen(false)} />
          <MobileListSheet>
            <SheetHeader>
              <SheetTitle>
                {t("map.resultsSummary", { total: normalizeCount(total), mapped: normalizeCount(markerListings.length) })}
              </SheetTitle>
              <SheetClose type="button" onClick={() => setMobileListOpen(false)}>
                <X size={18} />
              </SheetClose>
            </SheetHeader>
            <ListScroller style={{ padding: "16px", background: "#f8fafc" }}>{renderListContent()}</ListScroller>
          </MobileListSheet>
        </>
      )}

      {filterOpen && (
        <>
          <Overlay onClick={() => setFilterOpen(false)} />
          <FilterDialog>
            <FilterHeader>
              <FilterTitle>{t("filter.searchFilters")}</FilterTitle>
              <SheetClose type="button" onClick={() => setFilterOpen(false)}>
                <X size={18} />
              </SheetClose>
            </FilterHeader>
            <FilterGrid>
              <CustomSelect
                id="map-deal-type"
                name="map_deal_type"
                label={t("filter.dealType")}
                value={dealType}
                onChange={setDealType}
              >
                <option value="">{t("filter.allDeals")}</option>
                <option value="sale">{t("listing.forSale")}</option>
                <option value="rent">{t("listing.forRent")}</option>
              </CustomSelect>

              <CustomSelect
                id="map-property-type"
                name="map_property_type"
                label={t("filter.propertyType")}
                value={propertyType}
                onChange={setPropertyType}
              >
                {propertyTypeOptions.map((item) => (
                  <option key={item.value || "all"} value={item.value}>
                    {"labelKey" in item ? t(item.labelKey) : formatPropertyTypeValue(item.value, t) || item.label}
                  </option>
                ))}
              </CustomSelect>

              <CustomSelect
                id="map-state"
                name="map_state"
                label={t("filter.state")}
                value={stateRegion}
                onChange={(value) => {
                  setStateRegion(value);
                  setDistrict("");
                  setTownship("");
                }}
              >
                <option value="">{t("filter.allStates")}</option>
                {stateOptions.map((item) => (
                  <option key={item.pcode ?? item.name_en} value={item.name_en}>
                    {translateLocationName(item.name_en, language)}
                  </option>
                ))}
              </CustomSelect>

              <CustomSelect
                id="map-district"
                name="map_district"
                label={t("filter.district")}
                value={district}
                onChange={(value) => {
                  setDistrict(value);
                  setTownship("");
                }}
                disabled={!stateRegion}
              >
                <option value="">{t("filter.allDistricts")}</option>
                {districtOptions.map((item) => (
                  <option key={item.pcode ?? item.name_en} value={item.name_en}>
                    {translateLocationName(item.name_en, language)}
                  </option>
                ))}
              </CustomSelect>

              <CustomSelect
                id="map-township"
                name="map_township"
                label={t("filter.township")}
                value={township}
                onChange={setTownship}
                disabled={!district}
              >
                <option value="">{t("filter.allTownships")}</option>
                {townshipOptions.map((item) => (
                  <option key={item.pcode ?? item.name_en} value={item.name_en}>
                    {translateLocationName(item.name_en, language)}
                  </option>
                ))}
              </CustomSelect>

              <NumberField>
                {t("filter.min")} {t("filter.priceRange")}
                <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} inputMode="numeric" />
              </NumberField>

              <NumberField>
                {t("filter.max")} {t("filter.priceRange")}
                <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} inputMode="numeric" />
              </NumberField>

              <NumberField>
                {t("filter.bedrooms")}
                <input value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} inputMode="numeric" />
              </NumberField>

              <NumberField>
                {t("filter.bathrooms")}
                <input value={bathrooms} onChange={(event) => setBathrooms(event.target.value)} inputMode="numeric" />
              </NumberField>
            </FilterGrid>
            <FilterFooter>
              <SecondaryButton type="button" onClick={resetFilters}>
                {t("filter.clearFilters")}
              </SecondaryButton>
              <ActionButton
                type="button"
                $primary
                onClick={() => {
                  setAppliedBounds(null);
                  setPendingBounds(null);
                  setHasUserMovedMap(false);
                  setFilterOpen(false);
                }}
              >
                {t("filter.apply")}
              </ActionButton>
            </FilterFooter>
          </FilterDialog>
        </>
      )}
    </Page>
  );
}
