"use client";

import { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Crown,
  Gem,
  House,
  ImageIcon,
  LayoutTemplate,
  Lock,
  Megaphone,
  Percent,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { withActiveVendorHeaders } from "@/features/site/vendor/lib/active-context";
import { CustomSelect } from "@/features/site/shared/components/form-controls/CustomSelect";
import { formatCurrency } from "@/features/site/shared/lib/format";
import { formatPropertyTypeValue } from "@/lib/property-types";
import { promotionProducts, type PromotionType } from "@/lib/vendor-promotions";
import { useI18n } from "@/features/site/shared/lib/i18n";
import { DesktopOnly } from "../../public/HomePageClient";

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
`;

const Page = styled.div < { $embedded?: boolean } > `
  display: grid;
  gap: 18px;
  padding: ${(props) => (props.$embedded ? "0" : "20px")};
  min-width: 0;

  @media (max-width: 640px) {
    gap: 14px;
    padding: ${(props) => (props.$embedded ? "0" : "12px")};
  }
`;

const Shell = styled.div`
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: 28px;
  background: linear-gradient(180deg, #f8f9fc 0%, #f2f5fa 100%);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
  min-width: 0;

  @media (max-width: 640px) {
    gap: 14px;
    padding: 0px;
    border-radius: 0px;
    border: none;
    background: none;
    box-shadow: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 640px) {
    gap: 10px;
  }
`;

const Heading = styled.div`
  display: grid;
  gap: 6px;
  min-width: 0;
  @media (max-width: 640px) {
    display:flex;
    width: 100%;
    justify-content: space-between;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.25rem, 2vw, 1.9rem);
  color: var(--color-text);
  line-height: 1.25;

  @media (max-width: 640px) {
    font-size: 1.18rem;
    line-height: 1.35;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
  max-width: 760px;

  @media (max-width: 640px) {
    display: none;
  }
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 640px) {
    gap: 8px;
  }
`;

const Pill = styled.span < { $tone?: "neutral" | "accent" | "warning" | "success" | "danger" } > `
  min-height: 31px;
  padding: 0 11px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.25;
  white-space: nowrap;
  border: 1px solid
    ${(props) =>
    props.$tone === "accent"
      ? "rgba(233, 61, 93, 0.18)"
      : props.$tone === "warning"
        ? "rgba(245, 158, 11, 0.2)"
        : props.$tone === "success"
          ? "rgba(34, 197, 94, 0.18)"
          : props.$tone === "danger"
            ? "rgba(244, 63, 94, 0.18)"
            : "rgba(148, 163, 184, 0.22)"};
  background: ${(props) =>
    props.$tone === "accent"
      ? "#fff1f3"
      : props.$tone === "warning"
        ? "#fff7ed"
        : props.$tone === "success"
          ? "#ecfdf3"
          : props.$tone === "danger"
            ? "#fff1f2"
            : "#eef2f8"};
  color: ${(props) =>
    props.$tone === "accent"
      ? "#e11d48"
      : props.$tone === "warning"
        ? "#b45309"
        : props.$tone === "success"
          ? "#15803d"
          : props.$tone === "danger"
            ? "#be123c"
            : "var(--color-muted)"};

  svg {
    flex: 0 0 auto;
  }

  @media (max-width: 640px) {
    min-height: 28px;
    padding: 0 9px;
    font-size: 0.7rem;
    white-space: normal;
    text-align: center;
  }
`;

const Card = styled.section`
  border-radius: 24px;
  padding: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  display: grid;
  gap: 14px;
  min-width: 0;
  overflow: visible;

  @media (max-width: 640px) {
    border-radius: 16px;
    padding: 10px;
    gap: 8px;
    box-shadow: none;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: var(--color-text);
  line-height: 1.35;

  @media (max-width: 640px) {
    font-size: 0.96rem;
  }
`;

const CardCopy = styled.p`
  margin: 4px 0 0;
  color: var(--color-muted);
  line-height: 1.55;

  @media (max-width: 640px) {
    font-size: 0.84rem;

    &.mobile-hide {
      display: none;
    }
  }
`;

const Notice = styled.div < { $tone?: "warning" | "success" | "danger" } > `
  border-radius: 18px;
  padding: 14px 16px;
  line-height: 1.55;
  border: 1px solid
    ${(props) =>
    props.$tone === "danger"
      ? "rgba(244, 63, 94, 0.18)"
      : props.$tone === "success"
        ? "rgba(34, 197, 94, 0.18)"
        : "rgba(251, 191, 36, 0.24)"};
  background: ${(props) =>
    props.$tone === "danger"
      ? "#fff1f2"
      : props.$tone === "success"
        ? "#ecfdf3"
        : "#fff9eb"};
  color: ${(props) =>
    props.$tone === "danger"
      ? "#be123c"
      : props.$tone === "success"
        ? "#15803d"
        : "#92400e"};

  @media (max-width: 640px) {
    border-radius: 16px;
    padding: 12px 14px;
    font-size: 0.84rem;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #fff;
  color: var(--color-text);
  padding: 0 14px;
  width: 100%;
  min-width: 0;
`;

const SearchableField = styled.div`
  position: relative;
  display: grid;
  min-width: 0;
`;

const SearchableTrigger = styled.input`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #fff;
  color: var(--color-text);
  padding: 0 42px 0 14px;
  width: 100%;
  min-width: 0;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(235, 35, 64, 0.15);
  }
`;

const SearchableFieldIcon = styled(Search)`
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-muted);
  pointer-events: none;
`;

const SearchableMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 90;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  box-shadow: 0 18px 40px rgba(9, 15, 28, 0.12);
  padding: 8px;
  display: grid;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;

  @media (max-width: 640px) {
    position: fixed;
    inset: auto 12px 16px 12px;
    max-height: min(360px, 70dvh);
    z-index: 2200;
  }
`;

const SearchableOption = styled.button < { $active?: boolean } > `
  border: 0;
  background: ${(props) => (props.$active ? "rgba(235, 35, 64, 0.1)" : "transparent")};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  text-align: left;
  border-radius: 12px;
  padding: 11px 12px;
  display: grid;
  gap: 4px;
  cursor: pointer;

  &:hover {
    background: rgba(235, 35, 64, 0.08);
    color: var(--color-primary);
  }
`;

const SearchableOptionTitle = styled.span`
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.35;
`;

const SearchableOptionMeta = styled.span`
  font-size: 0.76rem;
  color: var(--color-muted);
  line-height: 1.4;
`;

const SearchableEmpty = styled.div`
  border-radius: 12px;
  padding: 12px;
  color: var(--color-muted);
  font-size: 0.82rem;
  background: #f8fafc;
  line-height: 1.45;
`;

const Textarea = styled.textarea`
  min-height: 108px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #fff;
  color: var(--color-text);
  padding: 12px 14px;
  width: 100%;
  min-width: 0;
  resize: vertical;
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 640px) {
    width: 100%;
    gap: 8px;

    > * {
      flex: 1 1 0;
      min-width: 0;
    }
  }
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid ${(props) => (props.$primary ? "transparent" : "rgba(148, 163, 184, 0.28)")};
  background: ${(props) =>
    props.$primary ? "linear-gradient(135deg, #ff4b6b 0%, #df274c 100%)" : "#fff"};
  color: ${(props) => (props.$primary ? "#fff" : "var(--color-text)")};
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  line-height: 1.25;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    min-height: 38px;
    padding: 0 12px;
    font-size: 0.78rem;
  }
`;

const ActionLink = styled.a`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, #ff4b6b 0%, #df274c 100%);
  color: #fff;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  line-height: 1.25;

  @media (max-width: 640px) {
    min-height: 46px;
    width: 100%;
  }
`;

const PrimaryActionLink = styled(ActionLink)`
  box-shadow: 0 10px 22px rgba(223, 39, 76, 0.14);
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 640px) {
    align-items: stretch;

    > ${SummaryRow} {
      width: 100%;
    }

    > button {
      width: 100%;
    }
  }
`;

const SearchRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 12px;
  align-items: center;
  min-width: 0;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    display: none;
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

const MobileFilterLauncher = styled.button`
  display: none;

  @media (max-width: 640px) {
    width: 46px;
    height: 46px;
    padding: 0;
    border-radius: 14px;
    border: 1px solid rgba(148, 163, 184, 0.22);
    background: #fff;
    color: var(--color-text);
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
    box-shadow: 0 0 0 3px #fff;
  }
`;

const MobileFilterSummary = styled.div`
  display: none;

  @media (max-width: 640px) {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: -4px;
  }
`;

const MobileFilterPill = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #fff;
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 700;
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
    border: 1px solid rgba(148, 163, 184, 0.22);
    background: #fff;
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
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #f8fafc;
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
  border: 1px solid ${(props) => (props.$primary ? "transparent" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) => (props.$primary ? "var(--gradient)" : "#f8fafc")};
  color: ${(props) => (props.$primary ? "#fff" : "var(--color-text)")};
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
`;

const SearchField = styled.label`
  min-height: 46px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #fff;
  padding: 0 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-muted);
  min-width: 0;

  svg {
    flex: 0 0 auto;
  }

  @media (max-width: 640px) {
    min-height: 44px;
    border-radius: 14px;
  }
`;

const SearchInput = styled.input`
  border: 0;
  outline: none;
  background: transparent;
  width: 100%;
  min-width: 0;
  color: var(--color-text);
  font-size: 0.95rem;

  @media (max-width: 640px) {
    font-size: 0.86rem;
  }
`;

const FloatingField = styled.div`
  position: relative;
  display: grid;
  gap: 6px;
  min-width: 0;
`;

const FloatingLabel = styled.label < { $filled?: boolean } > `
  position: absolute;
  left: 12px;
  top: ${(props) => (props.$filled ? "-8px" : "14px")};
  font-size: ${(props) => (props.$filled ? "11px" : "13px")};
  color: ${(props) => (props.$filled ? "var(--color-primary)" : "var(--color-muted)")};
  background: ${(props) => (props.$filled ? "#f8fafc" : "transparent")};
  padding: ${(props) => (props.$filled ? "0 4px" : "0")};
  transition: all 0.2s ease;
  pointer-events: none;
  z-index: 1;
  line-height: 1.25;
`;

const FloatingInput = styled.input`
  width: 100%;
  min-width: 0;
  padding: 14px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  background: #f8fafc;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.2;
  outline: none;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(235, 35, 64, 0.15);
  }

  @media (max-width: 640px) {
    padding: 11px 10px;
    border-radius: 10px;
    font-size: 13px;
  }
`;

const FloatingTextarea = styled.textarea`
  width: 100%;
  min-width: 0;
  padding: 14px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  background: #f8fafc;
  color: var(--color-text);
  font-size: 14px;
  line-height: 1.45;
  outline: none;
  resize: none;
  min-height: 104px;
  max-height: 104px;
  overflow-y: auto;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(235, 35, 64, 0.15);
  }

  @media (max-width: 640px) {
    min-height: 72px;
    max-height: 72px;
    padding: 11px 10px;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.35;
  }
`;

const TabRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 640px) {
    display: none;
  }
`;

const FilterTab = styled.button < { $active?: boolean } > `
  height: 34px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid
    ${(props) => (props.$active ? "rgba(233, 61, 93, 0.26)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) => (props.$active ? "#fff1f4" : "#fff")};
  color: ${(props) => (props.$active ? "#e11d48" : "var(--color-text)")};
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;

  @media (max-width: 640px) {
    flex: 0 0 auto;
    height: 32px;
    padding: 0 12px;
    font-size: 0.76rem;
  }
`;

const PrimaryButton = styled(Button)`
  box-shadow: 0 10px 22px rgba(223, 39, 76, 0.14);
  @media (max-width: 640px) {
    display: none;
  }
`;

const PrimaryMobileButton = styled(Button)`
  display:none;

  @media (max-width: 640px) {
    width: min-content;
    min-height: 32px;
    height: auto;
    padding: 7px 10px;
    font-size: 0.72rem;
    border-radius: 10px;
    border: 1px solid rgba(233, 61, 93, 0.2);
    background: linear-gradient(135deg, #ffedf3 0%, #ffe1ea 100%);
    color: #e11d48;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    white-space: nowrap;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(6px);
  display: grid;
  place-items: center;
  padding: 16px;

  @media (max-width: 640px) {
    padding: 0;
    align-items: end;
    place-items: end stretch;
  }
`;

const ModalShell = styled.div`
  width: min(1120px, 100%);
  height: min(920px, calc(100vh - 32px));
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(255, 214, 228, 0.7), transparent 24%),
    linear-gradient(180deg, #fff7fa 0%, #f6f8fc 48%, #eef3fa 100%);
  border: 1px solid rgba(233, 61, 93, 0.16);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.22);
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  min-width: 0;

  @media (max-width: 640px) {
    width: 100%;
    height: calc(100dvh - 8px);
    max-height: none;
    border-radius: 20px 20px 0 0;
    border-bottom: 0;
  }
`;

const ModalHeader = styled.div`
  padding: 22px 24px 16px;
  border-bottom: 1px solid rgba(233, 61, 93, 0.12);
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.4));
  min-width: 0;

  @media (max-width: 640px) {
    padding: 12px 14px 10px;
    gap: 10px;

    ${Title} {
      font-size: 1.05rem !important;
      line-height: 1.25;
    }

    ${Subtitle} {
      display: none;
    }
  }
`;

const ModalBody = styled.div`
  padding: 18px 24px 24px;
  overflow-y: auto;
  display: grid;
  gap: 18px;
  min-width: 0;

  @media (max-width: 640px) {
    padding: 12px 12px 14px;
    gap: 10px;
  }
`;

const ModalClose = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #fff;
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: 0 0 auto;

  @media (max-width: 640px) {
    width: 36px;
    height: 36px;
  }
`;

const TypeTabs = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 640px) {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: thin;
  }
`;

const TypeTab = styled.button < { $active?: boolean } > `
  height: 40px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid
    ${(props) => (props.$active ? "rgba(233, 61, 93, 0.26)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) =>
    props.$active
      ? "linear-gradient(180deg, #fff0f5 0%, #ffe5ef 100%)"
      : "rgba(255,255,255,0.88)"};
  color: ${(props) => (props.$active ? "#e11d48" : "var(--color-text)")};
  font-size: 0.82rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 0 0 auto;
  white-space: nowrap;

  @media (max-width: 640px) {
    height: 38px;
    padding: 0 13px;
    font-size: 0.76rem;
  }
`;

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
`;

const PlanCard = styled.button<{ $active?: boolean }>`
  border-radius: 18px;
  border: 1px solid
    ${(props) => (props.$active ? "rgba(233, 61, 93, 0.28)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) =>
    props.$active
      ? "linear-gradient(180deg, #fff4f8 0%, #ffeaf2 100%)"
      : "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)"};
  padding: 14px;
  text-align: left;
  display: grid;
  gap: 8px;
  box-shadow: ${(props) =>
    props.$active ? "0 14px 28px rgba(225, 29, 72, 0.08)" : "0 8px 18px rgba(15, 23, 42, 0.04)"};
  cursor: pointer;
  position: relative;
  min-width: 0;

  @media (max-width: 640px) {
    border-radius: 14px;
    padding: 9px;
    gap: 5px;
  }
`;

const PlanTitle = styled.strong`
  color: var(--color-text);
  display: block;
  line-height: 1.35;

  @media (max-width: 640px) {
    font-size: 0.78rem;
    line-height: 1.2;
  }
`;

const PlanMeta = styled.span`
  color: var(--color-muted);
  font-size: 0.84rem;
  line-height: 1.45;

  @media (max-width: 640px) {
    font-size: 0.66rem;
    line-height: 1.25;
  }
`;

const PlanTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  min-width: 0;
`;

const PlanIconWrap = styled.div<{ $active?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: ${(props) => (props.$active ? "#ffe3ec" : "#f2f5fb")};
  color: ${(props) => (props.$active ? "#e11d48" : "#64748b")};
  flex: 0 0 auto;

  @media (max-width: 640px) {
    width: 28px;
    height: 28px;
    border-radius: 9px;

    svg {
      width: 14px;
      height: 14px;
    }
  }
`;

const PlanBadge = styled.span<{ $tone?: "accent" | "success" | "warning" }>`
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 800;
  line-height: 1.2;
  border: 1px solid
    ${(props) =>
      props.$tone === "accent"
        ? "rgba(233, 61, 93, 0.18)"
        : props.$tone === "success"
          ? "rgba(34, 197, 94, 0.18)"
          : "rgba(245, 158, 11, 0.22)"};
  background: ${(props) =>
    props.$tone === "accent" ? "#fff1f4" : props.$tone === "success" ? "#ecfdf3" : "#fff7ed"};
  color: ${(props) =>
    props.$tone === "accent" ? "#e11d48" : props.$tone === "success" ? "#15803d" : "#b45309"};

  @media (max-width: 640px) {
    min-height: 18px;
    padding: 0 6px;
    font-size: 0.56rem;

    svg {
      width: 9px;
      height: 9px;
    }
  }
`;

const PlanSaving = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.3;

  @media (max-width: 640px) {
    font-size: 0.62rem;
    gap: 4px;

    svg {
      width: 10px;
      height: 10px;
    }
  }
`;

const WordCounter = styled.div`
  color: var(--color-muted);
  font-size: 0.74rem;
  justify-self: end;
  line-height: 1.35;

  @media (max-width: 640px) {
    font-size: 0.66rem;
    margin-top: -3px;
  }
`;

const HeroFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    gap: 8px;
  }
`;

const CalendarHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;

  @media (max-width: 640px) {
    gap: 4px;
  }
`;

const CalendarHeaderCell = styled.div`
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.2;

  @media (max-width: 640px) {
    font-size: 0.6rem;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;

  @media (max-width: 640px) {
    gap: 4px;
  }
`;

const CalendarDay = styled.button<{
  $state: "free" | "blocked" | "selected" | "range";
  $inMonth: boolean;
  $past: boolean;
  $today: boolean;
}>`
  min-height: 40px;
  border-radius: 10px;
  border: 1px solid
    ${(props) =>
      props.$past
        ? "rgba(148, 163, 184, 0.14)"
        : props.$state === "blocked"
          ? "rgba(148, 163, 184, 0.16)"
          : props.$state === "selected"
            ? "rgba(233, 61, 93, 0.26)"
            : props.$state === "range"
              ? "rgba(244, 114, 182, 0.2)"
              : props.$today
                ? "rgba(233, 61, 93, 0.28)"
                : "rgba(148, 163, 184, 0.16)"};
  background: ${(props) =>
    props.$past
      ? "#f1f5f9"
      : props.$state === "blocked"
        ? "#eef2f7"
        : props.$state === "selected"
          ? "#ffe1eb"
          : props.$state === "range"
            ? "#fff1f6"
            : props.$inMonth
              ? "#fff"
              : "#f8fafc"};
  color: ${(props) =>
    props.$past
      ? "#b8c2d6"
      : props.$state === "blocked"
        ? "#94a3b8"
        : props.$state === "selected"
          ? "#be123c"
          : props.$state === "range"
            ? "#be185d"
            : props.$inMonth
              ? "var(--color-text)"
              : "#b6c0d4"};
  font-size: 0.72rem;
  font-weight: 800;
  display: grid;
  place-items: center;
  cursor: ${(props) => (props.$state === "blocked" || props.$past ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.$state === "blocked" || props.$past ? 0.72 : 1)};

  @media (max-width: 640px) {
    min-height: 30px;
    border-radius: 8px;
    font-size: 0.6rem;
  }
`;

const CalendarDayInner = styled.div`
  display: grid;
  justify-items: center;
  gap: 1px;
  line-height: 1;
`;

const CalendarTodayTag = styled.span`
  font-size: 0.54rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  text-transform: uppercase;

  @media (max-width: 640px) {
    font-size: 0.48rem;
  }
`;

const PickerCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  min-width: 0;

  @media (max-width: 640px) {
    align-items: flex-start;
  }
`;

const PickerNav = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 6px 10px;
  background: #fff;
  cursor: pointer;
  color: var(--color-text);
`;

const SlotLegend = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--color-muted);
  font-size: 0.74rem;
  line-height: 1.35;

  @media (max-width: 640px) {
    gap: 8px;
    font-size: 0.68rem;
  }
`;

const SlotLegendDot = styled.span < { $tone: "free" | "blocked" | "selected" } > `
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
  background: ${(props) =>
    props.$tone === "free" ? "#ffffff" : props.$tone === "blocked" ? "#cbd5e1" : "#fb7185"};
  border: 1px solid rgba(148, 163, 184, 0.24);
`;

const ModalFooter = styled.div`
  padding: 14px 24px 22px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.76);

  @media (max-width: 640px) {
    padding: 10px 12px 12px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;
const MobileHidden = styled.div`
  @media (max-width: 640px) {
    display: none;
  }
`;
const PaymentWallOverlay = styled(ModalOverlay)`
  z-index: 2120;
`;

const PaymentWallShell = styled(ModalShell)`
  max-width: 680px;
  min-height: auto;
  background: linear-gradient(180deg, #fff7fb 0%, #ffffff 100%);

  @media (max-width: 640px) {
    height: auto;
    max-height: calc(100dvh - 12px);
  }
`;

const PaymentPlanCard = styled.div`
  border-radius: 18px;
  padding: 16px;
  border: 1px solid rgba(233, 61, 93, 0.18);
  background: linear-gradient(180deg, #fff1f5 0%, #ffffff 100%);
  display: grid;
  gap: 8px;
  min-width: 0;

  @media (max-width: 640px) {
    padding: 14px;
  }
`;

const PaymentMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--color-muted);
  font-size: 0.84rem;
  line-height: 1.45;

  @media (max-width: 640px) {
    font-size: 0.76rem;
  }
`;

const PaymentNotice = styled.div`
  border-radius: 16px;
  padding: 12px 14px;
  background: #f8fafc;
  color: var(--color-muted);
  font-size: 0.84rem;
  line-height: 1.55;

  @media (max-width: 640px) {
    font-size: 0.78rem;
  }
`;

const ListingSelectCard = styled.div`
  border-radius: 18px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #f8fafc;
  display: grid;
  gap: 10px;
  min-width: 0;
`;

const ListingMini = styled.div`
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;

  @media (max-width: 640px) {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 10px;
  }

  @media (max-width: 360px) {
    grid-template-columns: 1fr;
  }
`;

const ListingMiniImage = styled.div < { $image?: string } > `
  height: 70px;
  border-radius: 16px;
  background: ${(props) =>
    props.$image
      ? `linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.16)), url("${props.$image}") center/cover no-repeat`
      : "#eef2f7"};
  display: grid;
  place-items: center;
  color: #64748b;

  @media (max-width: 640px) {
    height: 62px;
    border-radius: 14px;
  }
`;

const ListingMiniTitle = styled.strong`
  color: var(--color-text);
  display: block;
  line-height: 1.35;
`;

const ListingMiniMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.5;

  @media (max-width: 640px) {
    font-size: 0.78rem;
  }
`;

const HeroTargetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  min-width: 0;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
`;

const HeroTargetCard = styled.button<{ $active?: boolean }>`
  border-radius: 20px;
  border: 1px solid
    ${(props) => (props.$active ? "rgba(233, 61, 93, 0.24)" : "rgba(148, 163, 184, 0.18)")};
  background: ${(props) =>
    props.$active
      ? "linear-gradient(180deg, #fff1f4 0%, #ffffff 100%)"
      : "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)"};
  padding: 16px;
  display: grid;
  gap: 10px;
  text-align: left;
  box-shadow: ${(props) => (props.$active ? "0 18px 34px rgba(233, 61, 93, 0.08)" : "none")};
  min-width: 0;
  cursor: pointer;

  @media (max-width: 640px) {
    border-radius: 15px;
    padding: 9px;
    gap: 6px;
  }
`;

const HeroTargetTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;

  @media (max-width: 640px) {
    align-items: center;
    justify-content: flex-start;
    gap: 7px;
  }
`;

const HeroTargetIcon = styled.div<{ $active?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: ${(props) => (props.$active ? "var(--color-primary)" : "#64748b")};
  background: ${(props) => (props.$active ? "rgba(233, 61, 93, 0.12)" : "#f1f5f9")};
  flex: 0 0 auto;

  @media (max-width: 640px) {
    width: 30px;
    height: 30px;
    border-radius: 10px;

    svg {
      width: 15px;
      height: 15px;
    }
  }
`;

const HeroTargetTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.98rem;
  line-height: 1.35;

  @media (max-width: 640px) {
    font-size: 0.76rem;
    line-height: 1.2;
  }
`;

const HeroTargetCopy = styled.div`
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.55;

  @media (max-width: 640px) {
    display: none;
  }
`;

const HeroAgencyPreview = styled.div`
  border-radius: 20px;
  padding: 16px;
  border: 1px solid rgba(233, 61, 93, 0.16);
  background: linear-gradient(145deg, #fff6f8 0%, #fffafc 100%);
  display: grid;
  gap: 12px;
  min-width: 0;

  @media (max-width: 640px) {
    border-radius: 15px;
    padding: 10px;
    gap: 7px;
  }
`;

const HeroAgencyPreviewTop = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const HeroAgencyPreviewLogo = styled.div`
  width: 54px;
  height: 54px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #e63b5d, #be123c);
  color: #fff;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  flex: 0 0 auto;

  @media (max-width: 640px) {
    width: 38px;
    height: 38px;
    border-radius: 12px;
    font-size: 0.88rem;
  }
`;

const HeroAgencyPreviewName = styled.strong`
  color: var(--color-text);
  display: block;
  font-size: 1rem;
  line-height: 1.35;

  @media (max-width: 640px) {
    font-size: 0.86rem;
    line-height: 1.25;
  }
`;

const HeroAgencyPreviewMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #be123c;
  font-size: 0.84rem;
  font-weight: 700;
  margin-top: 4px;
  line-height: 1.3;

  @media (max-width: 640px) {
    font-size: 0.72rem;
    margin-top: 2px;
    gap: 4px;

    svg {
      width: 12px;
      height: 12px;
    }
  }
`;

const HeroAgencyPreviewCopy = styled.div`
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.6;

  @media (max-width: 640px) {
    display: none;
  }
`;

const PromotionList = styled.div`
  display: grid;
  gap: 12px;
  min-width: 0;

  @media (max-width: 640px) {
    gap: 10px;
  }
`;

const PromotionRow = styled.div`
  border-radius: 20px;
  padding: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: grid;
  gap: 10px;
  min-width: 0;

  @media (max-width: 640px) {
    border-radius: 18px;
    padding: 12px;
  }
`;

const PromotionRowMain = styled.div`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  min-width: 0;

  @media (max-width: 640px) {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 10px;
    align-items: start;
  }

  @media (max-width: 380px) {
    grid-template-columns: 1fr;
  }
`;

const PromotionThumb = styled.div < { $image?: string } > `
  height: 72px;
  border-radius: 14px;
  background: ${(props) =>
    props.$image
      ? `linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.16)), url("${props.$image}") center/cover no-repeat`
      : "#eef2f7"};
  display: grid;
  place-items: center;
  color: #64748b;
  overflow: hidden;

  @media (max-width: 640px) {
    height: 62px;
    border-radius: 13px;
  }

  @media (max-width: 380px) {
    height: 150px;
  }
`;

const PromotionTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  flex-wrap: wrap;
  min-width: 0;

  @media (max-width: 640px) {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }
`;

const PromotionTopRight = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;

  @media (max-width: 640px) {
    justify-content: flex-start;
  }
`;

const PromotionTitle = styled.strong`
  color: var(--color-text);
  display: block;
  line-height: 1.35;
  overflow-wrap: anywhere;

  @media (max-width: 640px) {
    font-size: 0.92rem;
  }
`;

const PromotionMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--color-muted);
  font-size: 0.86rem;
  line-height: 1.45;
  min-width: 0;

  svg {
    flex: 0 0 auto;
  }

  @media (max-width: 640px) {
    gap: 6px;
    font-size: 0.76rem;
  }
`;

const PromotionActionButton = styled.button`
  height: 31px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid rgba(233, 61, 93, 0.2);
  background: linear-gradient(135deg, #ffedf3 0%, #ffe1ea 100%);
  color: #e11d48;
  font-size: 0.76rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  white-space: nowrap;

  @media (max-width: 640px) {
    min-height: 32px;
    height: auto;
    padding: 7px 10px;
    font-size: 0.72rem;
  }
`;

const Empty = styled.div`
  border-radius: 18px;
  padding: 16px;
  background: #f8fafc;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  color: var(--color-muted);
  line-height: 1.55;

  @media (max-width: 640px) {
    padding: 14px;
    font-size: 0.84rem;
  }
`;

const SkeletonBlock = styled.div < { $height?: number; $radius?: number } > `
  width: 100%;
  height: ${(props) => `${props.$height ?? 16}px`};
  border-radius: ${(props) => `${props.$radius ?? 14}px`};
  background: linear-gradient(90deg, #edf2f7 0%, #dfe7f1 50%, #edf2f7 100%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.35s linear infinite;
`;

const LockShell = styled.div`
  width: min(760px, 100%);
  margin: 0 auto;
  border-radius: 28px;
  padding: 28px;
  background: linear-gradient(180deg, #f8f9fc 0%, #f2f5fa 100%);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 14px;
  align-content: start;
  min-width: 0;

  @media (max-width: 640px) {
    border-radius: 24px;
    padding: 18px;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
  }
`;

const LockStateWrap = styled.div`
  min-height: min(640px, calc(100vh - 220px));
  display: grid;
  align-items: center;

  @media (max-width: 640px) {
    min-height: auto;
    align-items: start;
  }
`;

const LockHero = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: #fff1f2;
  color: #e11d48;
  display: grid;
  place-items: center;
  flex: 0 0 auto;

  @media (max-width: 640px) {
    width: 48px;
    height: 48px;
    border-radius: 16px;
  }
`;

const LockHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;

  @media (max-width: 640px) {
    align-items: flex-start;
    gap: 12px;
  }
`;

const LockCopy = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
`;

type EligibleListing = {
  id: string;
  title: string | null;
  property_type: string | null;
  deal_type: string | null;
  price: number | null;
  currency: string | null;
  township: string | null;
  city: string | null;
  status: string | null;
  cover_image_url: string | null;
};

type PromotionItem = {
  id: string;
  listing_id: string | null;
  promotion_type: string | null;
  target_type: string | null;
  status: string | null;
  title: string | null;
  description: string | null;
  banner_image_url: string | null;
  target_url: string | null;
  price_per_24h: number | null;
  price_paid: number | null;
  duration_hours: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
};

type PromotionsPayload = {
  workspace?: {
    vendorId?: string | null;
    vendorName?: string | null;
    vendorSlug?: string | null;
    verifiedStatus?: string | null;
    membershipRole?: string | null;
  };
  eligibleListings: EligibleListing[];
  items: PromotionItem[];
  helperPreview?: {
    heroRotationTodo?: string;
    searchRankingTodo?: string;
    listingBoostTodo?: string;
  };
};

type CreatedPromotionItem = {
  id: string;
  title: string | null;
  promotion_type: string | null;
  status: string | null;
  price_per_24h: number | null;
  duration_hours: number | null;
};

function isPayablePromotionStatus(status: string | null | undefined) {
  return status === "draft" || status === "pending_payment";
}

function isPromotionWindowExpired(value: string | null | undefined) {
  if (!value) return false;
  const endsAt = new Date(value);
  if (!Number.isFinite(endsAt.getTime())) return false;
  return endsAt.getTime() < Date.now();
}

function getEffectivePromotionStatus(item: Pick<PromotionItem, "status" | "starts_at" | "ends_at">) {
  if (item.status === "active" && isPromotionWindowExpired(item.ends_at)) {
    return "expired";
  }
  return item.status ?? null;
}

type Props = {
  embedded?: boolean;
  vendorId: string | null;
  verified: boolean;
  verificationHref?: string;
  initialListingId?: string | null;
  onBack?: () => void;
};

function productIcon(type: PromotionType) {
  if (type === "hero_ad") return <LayoutTemplate size={18} />;
  if (type === "search_ranking") return <Search size={18} />;
  return <Sparkles size={18} />;
}

const promotionTypeTabs: Array<{ value: "all" | PromotionType; labelKey: string }> = [
  { value: "all", labelKey: "vendor.promotions.type.all" },
  { value: "hero_ad", labelKey: "vendor.promotions.type.heroAd" },
  { value: "search_ranking", labelKey: "vendor.promotions.type.searchRanking" },
  { value: "listing_boost", labelKey: "vendor.promotions.type.listingBoost" },
];

const promotionStatusScopes = [
  { value: "all", labelKey: "vendor.promotions.scope.all" },
  { value: "active", labelKey: "vendor.promotions.scope.active" },
  { value: "drafts", labelKey: "vendor.promotions.scope.drafts" },
  { value: "history", labelKey: "vendor.promotions.scope.history" },
] as const;

const promotionPlanPresets: Record<
  PromotionType,
  Array<{ key: string; label: string; durationHours: number; pricePer24h: number; totalPrice: number }>
> = {
  hero_ad: [
    { key: "hero-24", label: "24 hours", durationHours: 24, pricePer24h: 120000, totalPrice: 120000 },
    { key: "hero-72", label: "3 days", durationHours: 72, pricePer24h: 110000, totalPrice: 330000 },
    { key: "hero-120", label: "5 days", durationHours: 120, pricePer24h: 105000, totalPrice: 525000 },
    { key: "hero-168", label: "1 week", durationHours: 168, pricePer24h: 98000, totalPrice: 686000 },
  ],
  search_ranking: [
    { key: "search-24", label: "24 hours", durationHours: 24, pricePer24h: 45000, totalPrice: 45000 },
    { key: "search-72", label: "3 days", durationHours: 72, pricePer24h: 42000, totalPrice: 126000 },
    { key: "search-120", label: "5 days", durationHours: 120, pricePer24h: 40000, totalPrice: 200000 },
    { key: "search-168", label: "1 week", durationHours: 168, pricePer24h: 38000, totalPrice: 266000 },
  ],
  listing_boost: [
    { key: "boost-24", label: "24 hours", durationHours: 24, pricePer24h: 70000, totalPrice: 70000 },
    { key: "boost-72", label: "3 days", durationHours: 72, pricePer24h: 66000, totalPrice: 198000 },
    { key: "boost-120", label: "5 days", durationHours: 120, pricePer24h: 62000, totalPrice: 310000 },
    { key: "boost-168", label: "1 week", durationHours: 168, pricePer24h: 59000, totalPrice: 413000 },
  ],
};

const heroSlotLabels = ["Slot 1", "Slot 2", "Slot 3", "Slot 4"] as const;
const heroSlotBlockedOffsets: Record<string, number[]> = {
  "Slot 1": [1, 2, 6, 10],
  "Slot 2": [0, 5, 9, 10, 11],
  "Slot 3": [3, 4, 8, 13],
  "Slot 4": [2, 7, 8, 12],
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateOnly(value: string | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateString(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function formatDatePickerLabel(value: string | undefined, locale: string) {
  const parsed = parseDateOnly(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildHeroAvailabilityDays() {
  const start = startOfDay(new Date());
  return Array.from({ length: 90 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: formatDateKey(date),
      label: String(date.getDate()),
      weekday: date.getDay(),
      date,
    };
  });
}

function getPlanBadge(t: (key: string) => string, index: number, total: number) {
  if (index === 1) return { label: t("vendor.promotions.badge.popular"), tone: "accent" as const, icon: <Star size={11} /> };
  if (index === total - 1) return { label: t("vendor.promotions.badge.bestValue"), tone: "success" as const, icon: <Gem size={11} /> };
  return null;
}

function getPlanIcon(type: PromotionType) {
  if (type === "hero_ad") return <Crown size={16} />;
  if (type === "search_ranking") return <Search size={16} />;
  return <Sparkles size={16} />;
}

function getPromotionTypeLabel(type: PromotionType | "all", t: (key: string) => string) {
  if (type === "hero_ad") return t("vendor.promotions.type.heroAd");
  if (type === "search_ranking") return t("vendor.promotions.type.searchRanking");
  if (type === "listing_boost") return t("vendor.promotions.type.listingBoost");
  return t("vendor.promotions.type.all");
}

function getPlanLabel(key: string, t: (key: string) => string) {
  if (key.endsWith("-24")) return t("vendor.promotions.plan.24h");
  if (key.endsWith("-72")) return t("vendor.promotions.plan.3d");
  if (key.endsWith("-120")) return t("vendor.promotions.plan.5d");
  if (key.endsWith("-168")) return t("vendor.promotions.plan.1w");
  return key;
}

function getHeroSlotLabel(slot: (typeof heroSlotLabels)[number], t: (key: string, params?: Record<string, string | number>) => string) {
  const index = heroSlotLabels.indexOf(slot) + 1;
  return t("vendor.promotions.slot", { index });
}

function collectHeroRangeKeys(
  days: Array<{ key: string; label: string; weekday: number; date: Date }>,
  startKey: string,
  blockedKeys: Set<string>,
  requiredDays: number
) {
  const startIndex = days.findIndex((day) => day.key === startKey);
  if (startIndex < 0 || blockedKeys.has(startKey)) return [];
  const selected: string[] = [];
  for (let index = startIndex; index < days.length; index += 1) {
    const day = days[index];
    if (!day || blockedKeys.has(day.key)) continue;
    selected.push(day.key);
    if (selected.length >= requiredDays) break;
  }
  return selected;
}

function HeroInlineCalendar({
  value,
  blockedKeys,
  selectedRangeKeys,
  onChange,
  weekdayLabels,
  todayLabel,
  locale,
}: {
  value: string;
  blockedKeys: Set<string>;
  selectedRangeKeys: Set<string>;
  onChange: (value: string) => void;
  weekdayLabels: string[];
  todayLabel: string;
  locale: string;
}) {
  const selectedDate = value ? parseDateOnly(value) : null;
  const [currentMonth, setCurrentMonth] = useState < Date > (selectedDate ?? new Date());
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const todayKey = formatDateKey(startOfDay(new Date()));
  const monthLabel = currentMonth.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <Card style={{ gap: 10, padding: 14 }}>
      <PickerCardHeader>
        <PickerNav type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
          <ChevronLeft size={16} />
        </PickerNav>
        <strong>{monthLabel}</strong>
        <PickerNav type="button" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
          <ChevronRight size={16} />
        </PickerNav>
      </PickerCardHeader>
      <CalendarHeader>
        {weekdayLabels.map((day) => (
          <CalendarHeaderCell key={day}>{day}</CalendarHeaderCell>
        ))}
      </CalendarHeader>
      <CalendarGrid>
        {days.map((item) => {
          const key = toDateString(item.date);
          const isBlocked = blockedKeys.has(key);
          const isPast = key < todayKey;
          const isToday = key === todayKey;
          const isSelectedStart = value === key;
          const isSelectedRange = selectedRangeKeys.has(key);
          return (
            <CalendarDay
              key={key}
              type="button"
              $inMonth={item.inMonth}
              $past={isPast}
              $today={isToday}
              $state={isBlocked ? "blocked" : isSelectedStart ? "selected" : isSelectedRange ? "range" : "free"}
              onClick={() => {
                if (isBlocked || isPast) return;
                onChange(key);
              }}
              disabled={isBlocked || isPast}
              title={item.date.toLocaleDateString(locale, { month: "short", day: "numeric" })}
            >
              <CalendarDayInner>
                <span>{item.date.getDate()}</span>
                {isToday ? <CalendarTodayTag>{todayLabel}</CalendarTodayTag> : null}
              </CalendarDayInner>
            </CalendarDay>
          );
        })}
      </CalendarGrid>
    </Card>
  );
}

function statusTone(status: string | null | undefined) {
  if (status === "active") return "success" as const;
  if (status === "expired" || status === "cancelled") return "danger" as const;
  if (status === "draft" || status === "pending_payment" || status === "pending_activation") return "warning" as const;
  return "neutral" as const;
}

function getPromotionStatusLabel(
  status: string | null | undefined,
  t: (key: string) => string
) {
  if (status === "active") return t("vendor.promotions.status.active");
  if (status === "expired") return t("vendor.promotions.status.expired");
  if (status === "draft") return t("vendor.promotions.status.draft");
  if (status === "pending_payment") return t("vendor.promotions.status.pendingPayment");
  if (status === "pending_activation") return t("vendor.promotions.status.pendingActivation");
  if (status === "paused") return t("vendor.promotions.status.paused");
  if (status === "cancelled") return t("vendor.promotions.status.cancelled");
  return t("vendor.promotions.notAvailable");
}

function formatDateTime(value: string | null | undefined, locale: string, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDateTimeInput(value: Date) {
  const next = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return next.toISOString().slice(0, 16);
}

export function VendorPromotionsView({
  embedded,
  vendorId,
  verified,
  verificationHref = "/hub?section=verification",
  initialListingId = null,
  onBack,
}: Props) {
  const { authToken } = useAppState();
  const { t, language } = useI18n();
  const locale = language === "mm" ? "my-MM" : language === "zh" ? "zh-CN" : language === "th" ? "th-TH" : "en-US";
  const [data, setData] = useState < PromotionsPayload | null > (null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState < string | null > (null);
  const [success, setSuccess] = useState < string | null > (null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [paymentWallOpen, setPaymentWallOpen] = useState(false);
  const [createdPromotion, setCreatedPromotion] = useState < CreatedPromotionItem | null > (null);
  const [listQuery, setListQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState < "all" | PromotionType > ("all");
  const [statusScope, setStatusScope] = useState < (typeof promotionStatusScopes)[number]["value"] > ("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [selectedType, setSelectedType] = useState < PromotionType > ("hero_ad");
  const [heroTargetType, setHeroTargetType] = useState < "agency_profile" | "listing" > ("agency_profile");
  const [listingId, setListingId] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingPickerOpen, setListingPickerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlanKey, setSelectedPlanKey] = useState("");
  const [startsAt, setStartsAt] = useState(() => formatDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [initialPrefillConsumed, setInitialPrefillConsumed] = useState(false);
  const [selectedHeroSlot, setSelectedHeroSlot] = useState < string > ("Slot 1");
  const [selectedHeroStartKey, setSelectedHeroStartKey] = useState < string | null > (null);
  const canManagePromotions = data?.workspace?.membershipRole === "owner";
  const selectedPlan =
    promotionPlanPresets[selectedType].find((plan) => plan.key === selectedPlanKey) ?? promotionPlanPresets[selectedType][0];
  const planDays = Math.max(1, Math.round((selectedPlan?.durationHours ?? 24) / 24));
  const descriptionWordCount = description.trim() ? description.trim().split(/\s+/).filter(Boolean).length : 0;
  const heroAvailabilityDays = useMemo(() => buildHeroAvailabilityDays(), []);
  const selectedHeroBlockedKeys = useMemo(
    () =>
      new Set(
        (heroSlotBlockedOffsets[selectedHeroSlot] ?? [])
          .map((offset) => heroAvailabilityDays[offset]?.key)
          .filter(Boolean) as string[]
      ),
    [heroAvailabilityDays, selectedHeroSlot]
  );
  const heroRangeKeyList = useMemo(() => {
    if (!selectedHeroStartKey) return [];
    return collectHeroRangeKeys(heroAvailabilityDays, selectedHeroStartKey, selectedHeroBlockedKeys, planDays);
  }, [heroAvailabilityDays, planDays, selectedHeroBlockedKeys, selectedHeroStartKey]);
  const heroRangeKeys = useMemo(() => {
    return new Set(heroRangeKeyList);
  }, [heroRangeKeyList]);
  const calendarWeekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const sunday = new Date(Date.UTC(2024, 0, 7));
    return Array.from({ length: 7 }, (_, index) => {
      const current = new Date(sunday);
      current.setUTCDate(sunday.getUTCDate() + index);
      return formatter.format(current);
    });
  }, [locale]);

  useEffect(() => {
    if (!authToken || !vendorId || !verified) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetch("/api/vendor/promotions", {
      headers: withActiveVendorHeaders(
        {
          Authorization: `Bearer ${authToken}`,
        },
        vendorId
      ),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as PromotionsPayload | { error?: string } | null;
        if (!response.ok || !payload || "error" in payload) {
          throw new Error((payload as { error?: string } | null)?.error || t("vendor.promotions.loadingError"));
        }
        if (!active) return;
        setData(payload as PromotionsPayload);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : t("vendor.promotions.loadingError"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authToken, vendorId, verified]);

  const eligibleListings = data?.eligibleListings ?? [];
  const selectedListing = eligibleListings.find((item) => item.id === listingId) ?? null;
  const normalizedListingSearch = listingSearch.trim().toLowerCase();
  const listingOptions = useMemo(() => {
    const source = normalizedListingSearch
      ? eligibleListings.filter((item) => {
        const haystack = [
          item.title,
          item.township,
          item.city,
          item.property_type ? formatPropertyTypeValue(item.property_type) : "",
          item.deal_type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedListingSearch);
      })
      : eligibleListings;
    return source.slice(0, normalizedListingSearch ? 16 : 12);
  }, [eligibleListings, normalizedListingSearch]);

  useEffect(() => {
    if (!selectedListing) {
      if (!listingPickerOpen) setListingSearch("");
      return;
    }
    setListingSearch(selectedListing.title || t("vendor.promotions.untitledProperty"));
  }, [listingPickerOpen, selectedListing]);

  useEffect(() => {
    if (!canManagePromotions || !initialListingId || !eligibleListings.length || initialPrefillConsumed) return;
    const matchedListing = eligibleListings.find((item) => item.id === initialListingId);
    if (!matchedListing) return;
    setListingId(matchedListing.id);
    setListingSearch(matchedListing.title || t("vendor.promotions.untitledProperty"));
    setSelectedType("listing_boost");
    setSelectedPlanKey(promotionPlanPresets.listing_boost[0].key);
    setCreatorOpen(true);
    setInitialPrefillConsumed(true);
  }, [canManagePromotions, eligibleListings, initialListingId, initialPrefillConsumed, t]);

  useEffect(() => {
    if (!selectedPlan) return;
    setSelectedPlanKey(selectedPlan.key);
  }, [selectedType]);

  useEffect(() => {
    if (selectedType !== "hero_ad") {
      setSelectedHeroStartKey(null);
      return;
    }
    if (!selectedHeroStartKey) return;
    const validRange = collectHeroRangeKeys(heroAvailabilityDays, selectedHeroStartKey, selectedHeroBlockedKeys, planDays);
    const isValid = validRange.length === planDays;
    if (!isValid) {
      setSelectedHeroStartKey(null);
    }
  }, [heroAvailabilityDays, planDays, selectedHeroBlockedKeys, selectedHeroStartKey, selectedType]);

  useEffect(() => {
    if (selectedType !== "hero_ad") return;
    if (heroTargetType !== "agency_profile") return;
    setListingId("");
    setListingSearch("");
    setListingPickerOpen(false);
  }, [heroTargetType, selectedType]);

  const endsAtPreview = useMemo(() => {
    if (selectedType === "hero_ad") {
      const lastHeroDay = heroRangeKeyList[heroRangeKeyList.length - 1];
      return lastHeroDay ? formatDatePickerLabel(lastHeroDay, locale) : t("vendor.promotions.selectPlanAndDate");
    }
    const parsedHours = Number(selectedPlan?.durationHours ?? 0);
    const start = new Date(startsAt);
    if (!Number.isFinite(parsedHours) || !Number.isFinite(start.getTime())) return t("vendor.promotions.notAvailable");
    return formatDateTime(new Date(start.getTime() + parsedHours * 60 * 60 * 1000).toISOString(), locale, t("vendor.promotions.notAvailable"));
  }, [heroRangeKeyList, locale, selectedPlan, selectedType, startsAt, t]);

  const activePromotions = useMemo(
    () => (data?.items ?? []).filter((item) => getEffectivePromotionStatus(item) === "active"),
    [data]
  );
  const draftPromotions = useMemo(
    () =>
      (data?.items ?? []).filter((item) =>
        getEffectivePromotionStatus(item) === "draft" ||
        getEffectivePromotionStatus(item) === "pending_payment" ||
        getEffectivePromotionStatus(item) === "pending_activation" ||
        getEffectivePromotionStatus(item) === "paused"
      ),
    [data]
  );
  const listingRequired = selectedType === "hero_ad" ? heroTargetType === "listing" : true;
  const noEligibleListings = !eligibleListings.length;
  const filteredPromotions = useMemo(() => {
    const query = listQuery.trim().toLowerCase();
    const listingMap = new Map(eligibleListings.map((item) => [item.id, item]));
    return (data?.items ?? []).filter((item) => {
      const effectiveStatus = getEffectivePromotionStatus(item);
      if (typeFilter !== "all" && item.promotion_type !== typeFilter) return false;
      if (statusScope === "active" && effectiveStatus !== "active") return false;
      if (
        statusScope === "drafts" &&
        effectiveStatus !== "draft" &&
        effectiveStatus !== "pending_payment" &&
        effectiveStatus !== "pending_activation" &&
        effectiveStatus !== "paused"
      ) {
        return false;
      }
      if (statusScope === "history" && effectiveStatus !== "expired" && effectiveStatus !== "cancelled") return false;
      if (!query) return true;
      const linkedListing = item.listing_id ? listingMap.get(item.listing_id) : null;
      const haystack = [
        item.title,
        item.description,
        item.promotion_type,
        effectiveStatus,
        linkedListing?.title,
        linkedListing?.township,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [data, eligibleListings, listQuery, statusScope, typeFilter]);
  const activeFilterCount = Number(statusScope !== "all") + Number(typeFilter !== "all");
  const mobileFilterPills = [
    statusScope !== "all" ? t(promotionStatusScopes.find((option) => option.value === statusScope)?.labelKey ?? "") : null,
    typeFilter !== "all" ? t(promotionTypeTabs.find((tab) => tab.value === typeFilter)?.labelKey ?? "") : null,
  ].filter(Boolean) as string[];

  const openCreator = (prefillListingId?: string | null) => {
    setCreatedPromotion(null);
    if (!prefillListingId) {
      setSelectedType("hero_ad");
      setHeroTargetType("agency_profile");
      setSelectedPlanKey(promotionPlanPresets.hero_ad[0].key);
      setListingId("");
      setListingSearch("");
      setTitle("");
      setDescription("");
      setStartsAt(formatDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)));
      setSelectedHeroSlot(heroSlotLabels[0]);
      setSelectedHeroStartKey(null);
    } else {
      const matchedListing = eligibleListings.find((item) => item.id === prefillListingId);
      if (matchedListing) {
        setListingId(matchedListing.id);
        setListingSearch(matchedListing.title || t("vendor.promotions.untitledProperty"));
        setSelectedType("listing_boost");
        setHeroTargetType("listing");
        setSelectedPlanKey(promotionPlanPresets.listing_boost[0].key);
      }
    }
    setCreatorOpen(true);
  };

  const closeCreator = () => {
    setCreatorOpen(false);
  };

  const returnToDrafts = async (message?: string, scope: (typeof promotionStatusScopes)[number]["value"] = "drafts") => {
    setCreatorOpen(false);
    setPaymentWallOpen(false);
    setCreatedPromotion(null);
    setStatusScope(scope);
    setTypeFilter("all");
    if (message) setSuccess(message);
    if (!authToken || !vendorId) return;
    const reload = await fetch("/api/vendor/promotions", {
      headers: withActiveVendorHeaders(
        {
          Authorization: `Bearer ${authToken}`,
        },
        vendorId
      ),
    });
    const reloadPayload = (await reload.json().catch(() => null)) as PromotionsPayload | { error?: string } | null;
    if (!reload.ok || !reloadPayload || "error" in reloadPayload) {
      throw new Error((reloadPayload as { error?: string } | null)?.error || t("vendor.promotions.loadingError"));
    }
    setData(reloadPayload as PromotionsPayload);
  };

  const handleDescriptionChange = (value: string) => {
    const words = value.trim() ? value.trim().split(/\s+/).filter(Boolean) : [];
    if (words.length <= 40) {
      setDescription(value);
      return;
    }
    const trimmed = words.slice(0, 40).join(" ");
    setDescription(trimmed);
  };

  const handleHeroDaySelect = (slot: string, dayKey: string) => {
    const blockedSet = new Set(
      (heroSlotBlockedOffsets[slot] ?? []).map((offset) => heroAvailabilityDays[offset]?.key).filter(Boolean) as string[]
    );
    const nextRange = collectHeroRangeKeys(heroAvailabilityDays, dayKey, blockedSet, planDays);
    if (nextRange.length !== planDays) return;
    setSelectedHeroSlot(slot);
    setSelectedHeroStartKey(dayKey);
    const startDate = new Date(`${dayKey}T09:00`);
    setStartsAt(formatDateTimeInput(startDate));
  };

  const openPaymentWallForItem = (item: PromotionItem) => {
    setCreatedPromotion({
      id: item.id,
      title: item.title,
      promotion_type: item.promotion_type,
      status: item.status,
      price_per_24h: item.price_per_24h,
      duration_hours: item.duration_hours,
    });
    setPaymentWallOpen(true);
  };

  const handlePromotionCheckout = async () => {
    if (!authToken || !vendorId || !createdPromotion?.id) return;
    setCheckoutLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/vendor/promotions/checkout", {
        method: "POST",
        headers: withActiveVendorHeaders(
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          vendorId
        ),
        body: JSON.stringify({
          promotionId: createdPromotion.id,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; checkoutUrl?: string | null; mode?: string; message?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || t("vendor.promotions.checkoutError"));
      }
      if (payload?.mode === "dinger" && payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }
      await returnToDrafts(payload?.message || t("vendor.promotions.devPaymentComplete"), "all");
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : t("vendor.promotions.checkoutError"));
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!authToken || !vendorId || !selectedPlan) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/vendor/promotions", {
        method: "POST",
        headers: withActiveVendorHeaders(
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          vendorId
        ),
        body: JSON.stringify({
          promotion_type: selectedType,
          target_type: selectedType === "hero_ad" ? heroTargetType : "listing",
          listing_id: listingRequired ? listingId || null : null,
          title: title.trim() || null,
          description: description.trim() || null,
          duration_hours: Number(selectedPlan.durationHours),
          price_per_24h: Number(selectedPlan.pricePer24h),
          starts_at: selectedType === "hero_ad" ? startsAt : new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16),
          target_url: null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || t("vendor.promotions.saveError"));
      }
      setCreatedPromotion((payload as { item?: CreatedPromotionItem | null } | null)?.item ?? null);
      setSuccess(payload?.message || t("vendor.promotions.savedDraft"));
      setTitle("");
      setDescription("");
      setSelectedPlanKey(promotionPlanPresets[selectedType][0].key);
      setPaymentWallOpen(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t("vendor.promotions.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (!verified) {
    return (
      <Page $embedded={embedded}>
        <LockStateWrap>
          <LockShell>
            <LockHeaderRow>
              <LockHero>
                <Lock size={24} />
              </LockHero>
              <LockCopy>
                <Title>{t("vendor.promotions.lockTitle")}</Title>
                <Subtitle>{t("vendor.promotions.lockCopy")}</Subtitle>
              </LockCopy>
            </LockHeaderRow>
            <SummaryRow>
              <Pill $tone="warning">
                <BadgeCheck size={14} />
                {t("vendor.promotions.agencyVerificationNeeded")}
              </Pill>
              {!canManagePromotions ? (
                <Pill $tone="warning">
                  <ShieldCheck size={14} />
                  {t("vendor.promotions.ownerVerificationRequired")}
                </Pill>
              ) : null}
            </SummaryRow>
            <ButtonRow>
              <PrimaryActionLink href={verificationHref}>
                <BadgeCheck size={16} />
                <span>{canManagePromotions ? t("vendor.promotions.goToVerification") : t("vendor.promotions.viewVerification")}</span>
              </PrimaryActionLink>
              {onBack ? (
                <Button type="button" onClick={onBack}>
                  <ArrowLeft size={16} />
                  <span>{t("vendor.promotions.back")}</span>
                </Button>
              ) : null}
            </ButtonRow>
          </LockShell>
        </LockStateWrap>
      </Page>
    );
  }

  return (
    <Page $embedded={embedded}>
      <Shell>
        <Header>
          <Heading>
            <Title>{t("vendor.promotions.title")}</Title>
            <Subtitle>{t("vendor.promotions.subtitle")}</Subtitle>
            {canManagePromotions ? (
              <PrimaryMobileButton type="button" $primary onClick={() => openCreator()}>
                <Plus size={16} />
                <span>promotion</span>
              </PrimaryMobileButton>
            ) : null}
          </Heading>
        </Header>

        {error ? <Notice $tone="danger">{error}</Notice> : null}
        {success ? <Notice $tone="success">{success}</Notice> : null}

        <Card>
          <TopBar>
            <SummaryRow>
              <Pill $tone="accent">
                <Megaphone size={14} />
                {t("vendor.promotions.eligibleListings", { count: eligibleListings.length })}
              </Pill>
              <Pill $tone="success">
                <CheckCircle2 size={14} />
                {t("vendor.promotions.active", { count: activePromotions.length })}
              </Pill>
              <Pill $tone="warning">
                <Clock3 size={14} />
                {t("vendor.promotions.drafts", { count: draftPromotions.length })}
              </Pill>
            </SummaryRow>
            {canManagePromotions ? (
              <PrimaryButton type="button" $primary onClick={() => openCreator()}>
                <Plus size={16} />
                <span>{t("vendor.promotions.create")}</span>
              </PrimaryButton>
            ) : null}
          </TopBar>

          <MobileFilterBar>
            <SearchField>
              <Search size={16} />
              <SearchInput
                value={listQuery}
                onChange={(event) => setListQuery(event.target.value)}
                placeholder={t("vendor.promotions.searchPlaceholder")}
                aria-label={t("vendor.promotions.searchPlaceholder")}
              />
            </SearchField>
            <MobileFilterLauncher type="button" aria-label={t("home.filters")} onClick={() => setMobileFiltersOpen(true)}>
              <Filter size={16} />
              {activeFilterCount > 0 ? <MobileFilterCount>{activeFilterCount}</MobileFilterCount> : null}
            </MobileFilterLauncher>
          </MobileFilterBar>
          <MobileFilterSummary>
            {mobileFilterPills.map((pill) => (
              <MobileFilterPill key={pill}>{pill}</MobileFilterPill>
            ))}
          </MobileFilterSummary>

          <SearchRow>
            <SearchField>
              <Search size={16} />
              <SearchInput
                value={listQuery}
                onChange={(event) => setListQuery(event.target.value)}
                placeholder={t("vendor.promotions.searchPlaceholder")}
              />
            </SearchField>
            <DesktopOnly>
              <CustomSelect
                id="promotion-status-scope"
                name="promotion-status-scope"
                label={t("vendor.promotions.statusScope")}
                hideLabel
                value={statusScope}
                onChange={(value) => setStatusScope(value as (typeof promotionStatusScopes)[number]["value"])}
              >
                {promotionStatusScopes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </CustomSelect>
            </DesktopOnly>
          </SearchRow>

          <TabRow>
            {promotionTypeTabs.map((tab) => (
              <FilterTab key={tab.value} type="button" $active={typeFilter === tab.value} onClick={() => setTypeFilter(tab.value)}>
                {t(tab.labelKey)}
              </FilterTab>
            ))}
          </TabRow>
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
                id="promotion-status-scope-mobile"
                name="promotion-status-scope-mobile"
                label={t("vendor.promotions.statusScope")}
                value={statusScope}
                onChange={(value) => setStatusScope(value as (typeof promotionStatusScopes)[number]["value"])}
              >
                {promotionStatusScopes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </CustomSelect>
              <CustomSelect
                id="promotion-type-filter-mobile"
                name="promotion-type-filter-mobile"
                label={t("vendor.properties.type")}
                value={typeFilter}
                onChange={(value) => setTypeFilter(value as "all" | PromotionType)}
              >
                {promotionTypeTabs.map((tab) => (
                  <option key={tab.value} value={tab.value}>
                    {t(tab.labelKey)}
                  </option>
                ))}
              </CustomSelect>
            </FilterSheetBody>
            <FilterSheetActions>
              <FilterSheetButton
                type="button"
                onClick={() => {
                  setStatusScope("all");
                  setTypeFilter("all");
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

          <PromotionList>
            {loading
              ? Array.from({ length: 4 }, (_, index) => (
                <PromotionRow key={`promotion-skeleton-${index}`}>
                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "grid", gap: 8, flex: 1 }}>
                        <SkeletonBlock $height={18} style={{ width: "42%" }} />
                        <SkeletonBlock $height={14} style={{ width: "64%" }} />
                      </div>
                      <SkeletonBlock $height={28} $radius={999} style={{ width: 88 }} />
                    </div>
                    <SkeletonBlock $height={14} style={{ width: "58%" }} />
                  </div>
                </PromotionRow>
              ))
              : null}
            {!loading && !filteredPromotions.length ? <Empty>{t("vendor.promotions.noMatch")}</Empty> : null}
            {!loading
              ? filteredPromotions.map((item) => {
                const effectiveStatus = getEffectivePromotionStatus(item);
                const linkedListing = item.listing_id ? eligibleListings.find((listing) => listing.id === item.listing_id) : null;
                return (
                  <PromotionRow key={item.id}>
                    <PromotionRowMain>
                      <PromotionThumb $image={linkedListing?.cover_image_url || undefined}>
                        {!linkedListing?.cover_image_url ? <ImageIcon size={18} /> : null}
                      </PromotionThumb>
                      <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
                        <PromotionTop>
                          <div>
                            <PromotionTitle>{item.title || linkedListing?.title || t("vendor.promotions.untitled")}</PromotionTitle>
                            <PromotionMeta>
                              <span>
                                {(item.promotion_type ? getPromotionTypeLabel(item.promotion_type as PromotionType, t) : null) ||
                                  item.promotion_type ||
                                  t("vendor.promotions.productFallback")}
                              </span>
                              {linkedListing?.title ? (
                                <>
                                  <span>•</span>
                                  <span>{linkedListing.title}</span>
                                </>
                              ) : null}
                            </PromotionMeta>
                          </div>
                          <PromotionTopRight>
                            <Pill $tone={statusTone(effectiveStatus)}>{getPromotionStatusLabel(effectiveStatus, t)}</Pill>
                            {canManagePromotions && (isPayablePromotionStatus(effectiveStatus) || effectiveStatus === "expired") ? (
                              <PromotionActionButton type="button" onClick={() => openPaymentWallForItem(item)}>
                                <Megaphone size={14} />
                                <span>{effectiveStatus === "expired" ? t("vendor.promotions.refreshBoost") : t("vendor.promotions.payNow")}</span>
                              </PromotionActionButton>
                            ) : null}
                          </PromotionTopRight>
                        </PromotionTop>
                        <PromotionMeta>
                          <span>
                            <CalendarClock size={14} style={{ verticalAlign: "text-bottom", marginRight: 6 }} />
                            {formatDateTime(item.starts_at, locale, t("vendor.promotions.notAvailable"))}
                          </span>
                          <span>•</span>
                          <span>{t("vendor.promotions.per24h", { amount: formatCurrency(item.price_per_24h ?? undefined, "MMK", t("vendor.promotions.notAvailable"), language) })}</span>
                          <span>•</span>
                          <span>{item.duration_hours ? t("vendor.promotions.hours", { count: item.duration_hours }) : t("vendor.promotions.notAvailable")}</span>
                        </PromotionMeta>
                      </div>
                    </PromotionRowMain>
                  </PromotionRow>
                );
              })
              : null}
          </PromotionList>
        </Card>
      </Shell>

      {creatorOpen && canManagePromotions ? (
        <ModalOverlay>
          <ModalShell>
            <ModalHeader>
              <div>
                <Title style={{ fontSize: "1.3rem" }}>{t("vendor.promotions.createTitle")}</Title>
                <Subtitle style={{ maxWidth: "none" }}>{t("vendor.promotions.createCopy")}</Subtitle>
              </div>
              <ModalClose type="button" onClick={closeCreator} aria-label={t("common.close")}>
                <X size={18} />
              </ModalClose>
            </ModalHeader>

            <ModalBody>
              {noEligibleListings && selectedType !== "hero_ad" ? (
                <Empty>{t("vendor.promotions.needActiveListing")}</Empty>
              ) : null}

              <TypeTabs>
                {promotionProducts.map((product) => (
                  <TypeTab
                    key={product.type}
                    type="button"
                    $active={selectedType === product.type}
                    onClick={() => {
                      setSelectedType(product.type);
                      if (product.type === "hero_ad") {
                        setHeroTargetType("agency_profile");
                      }
                    }}
                  >
                    {productIcon(product.type)}
                    <span>{getPromotionTypeLabel(product.type, t)}</span>
                  </TypeTab>
                ))}
              </TypeTabs>

              <FormGrid>
                {selectedType === "hero_ad" ? (
                  <FullWidth>
                    <div style={{ display: "grid", gap: 14 }}>
                      <MobileHidden>
                        <CardTitle>{t("vendor.promotions.whatToPromote")}</CardTitle>
                        <CardCopy style={{ marginTop: 6 }}>
                          {t("vendor.promotions.whatToPromoteCopy")}
                        </CardCopy>
                      </MobileHidden>
                      <HeroTargetGrid>
                        <HeroTargetCard
                          type="button"
                          $active={heroTargetType === "agency_profile"}
                          onClick={() => setHeroTargetType("agency_profile")}
                        >
                          <HeroTargetTop>
                            <HeroTargetIcon $active={heroTargetType === "agency_profile"}>
                              <Building2 size={18} />
                            </HeroTargetIcon>
                            <div>
                              <HeroTargetTitle>{t("listing.agencyProfile")}</HeroTargetTitle>
                              <HeroTargetCopy>{t("vendor.promotions.heroAgencyProfileCopy")}</HeroTargetCopy>
                            </div>
                          </HeroTargetTop>
                        </HeroTargetCard>
                        <HeroTargetCard
                          type="button"
                          $active={heroTargetType === "listing"}
                          onClick={() => setHeroTargetType("listing")}
                        >
                          <HeroTargetTop>
                            <HeroTargetIcon $active={heroTargetType === "listing"}>
                              <House size={18} />
                            </HeroTargetIcon>
                            <div>
                              <HeroTargetTitle>{t("vendor.promotions.oneListing")}</HeroTargetTitle>
                              <HeroTargetCopy>{t("vendor.promotions.heroOneListingCopy")}</HeroTargetCopy>
                            </div>
                          </HeroTargetTop>
                        </HeroTargetCard>
                      </HeroTargetGrid>

                      {heroTargetType === "agency_profile" ? (
                        <HeroAgencyPreview>
                          <HeroAgencyPreviewTop>
                            <HeroAgencyPreviewLogo>
                              {(data?.workspace?.vendorName || t("agency.label"))
                                .split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase() ?? "")
                                .join("") || "AG"}
                            </HeroAgencyPreviewLogo>
                            <div>
                              <HeroAgencyPreviewName>{data?.workspace?.vendorName || t("vendor.promotions.yourAgencyProfile")}</HeroAgencyPreviewName>
                              <HeroAgencyPreviewMeta>
                                <ShieldCheck size={14} />
                                <span>{t("home.verifiedAgencySpotlight")}</span>
                              </HeroAgencyPreviewMeta>
                            </div>
                          </HeroAgencyPreviewTop>
                          <HeroAgencyPreviewCopy>
                            {t("vendor.promotions.heroAgencyPreviewCopy")}
                          </HeroAgencyPreviewCopy>
                        </HeroAgencyPreview>
                      ) : (
                        noEligibleListings ? (
                          <Empty>{t("vendor.promotions.needActiveListingHero")}</Empty>
                        ) : (
                          <SearchableField
                            onBlur={() => {
                              setTimeout(() => {
                                setListingPickerOpen(false);
                                if (selectedListing) {
                                  setListingSearch(selectedListing.title || t("vendor.promotions.untitledProperty"));
                                } else if (!normalizedListingSearch) {
                                  setListingSearch("");
                                }
                              }, 120);
                            }}
                          >
                            <FloatingField data-filled={Boolean(listingSearch)}>
                              <FloatingLabel htmlFor="promotion-listing-search" $filled>
                                {t("listing.property")}
                              </FloatingLabel>
                              <SearchableTrigger
                                id="promotion-listing-search"
                                value={listingSearch}
                                placeholder={t("vendor.promotions.searchOrChooseListing")}
                                onFocus={() => setListingPickerOpen(true)}
                                onChange={(event) => {
                                  setListingSearch(event.target.value);
                                  setListingId("");
                                  setListingPickerOpen(true);
                                }}
                                disabled={noEligibleListings}
                              />
                              <SearchableFieldIcon size={16} />
                            </FloatingField>
                            {listingPickerOpen && !noEligibleListings ? (
                              <SearchableMenu>
                                {listingOptions.length ? (
                                  listingOptions.map((item) => (
                                    <SearchableOption
                                      key={item.id}
                                      type="button"
                                      $active={item.id === listingId}
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        setListingId(item.id);
                                        setListingSearch(item.title || t("vendor.promotions.untitledProperty"));
                                        setListingPickerOpen(false);
                                      }}
                                    >
                                      <SearchableOptionTitle>{item.title || t("vendor.promotions.untitledProperty")}</SearchableOptionTitle>
                                      <SearchableOptionMeta>
                                        {formatPropertyTypeValue(item.property_type, t)} • {item.deal_type || t("vendor.promotions.notAvailable")} •{" "}
                                        {item.township || item.city || t("vendor.promotions.notAvailable")}
                                      </SearchableOptionMeta>
                                    </SearchableOption>
                                  ))
                                ) : (
                                  <SearchableEmpty>{t("vendor.promotions.noMatchingListings")}</SearchableEmpty>
                                )}
                              </SearchableMenu>
                            ) : null}
                          </SearchableField>
                        )
                      )}
                    </div>
                  </FullWidth>
                ) : (
                  noEligibleListings ? (
                    <Empty>{t("vendor.promotions.needActiveListing")}</Empty>
                  ) : (
                    <SearchableField
                      onBlur={() => {
                        setTimeout(() => {
                          setListingPickerOpen(false);
                          if (selectedListing) {
                            setListingSearch(selectedListing.title || t("vendor.promotions.untitledProperty"));
                          } else if (!normalizedListingSearch) {
                            setListingSearch("");
                          }
                        }, 120);
                      }}
                    >
                      <FloatingField data-filled={Boolean(listingSearch)}>
                        <FloatingLabel htmlFor="promotion-listing-search" $filled>
                          {t("listing.property")}
                        </FloatingLabel>
                        <SearchableTrigger
                          id="promotion-listing-search"
                          value={listingSearch}
                          placeholder={t("vendor.promotions.searchOrChooseListing")}
                          onFocus={() => setListingPickerOpen(true)}
                          onChange={(event) => {
                            setListingSearch(event.target.value);
                            setListingId("");
                            setListingPickerOpen(true);
                          }}
                          disabled={noEligibleListings}
                        />
                        <SearchableFieldIcon size={16} />
                      </FloatingField>
                      {listingPickerOpen && !noEligibleListings ? (
                        <SearchableMenu>
                          {listingOptions.length ? (
                            listingOptions.map((item) => (
                              <SearchableOption
                                key={item.id}
                                type="button"
                                $active={item.id === listingId}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setListingId(item.id);
                                  setListingSearch(item.title || t("vendor.promotions.untitledProperty"));
                                  setListingPickerOpen(false);
                                }}
                              >
                                <SearchableOptionTitle>{item.title || t("vendor.promotions.untitledProperty")}</SearchableOptionTitle>
                                <SearchableOptionMeta>
                                  {formatPropertyTypeValue(item.property_type, t)} • {item.deal_type || t("vendor.promotions.notAvailable")} •{" "}
                                  {item.township || item.city || t("vendor.promotions.notAvailable")}
                                </SearchableOptionMeta>
                              </SearchableOption>
                            ))
                          ) : (
                            <SearchableEmpty>{t("vendor.promotions.noMatchingListings")}</SearchableEmpty>
                          )}
                        </SearchableMenu>
                      ) : null}
                    </SearchableField>
                  )
                )}

                <FloatingField data-filled={Boolean(title)}>
                  <FloatingLabel htmlFor="promotion-title" $filled={Boolean(title)}>
                    {t("vendor.promotions.titleField")}
                  </FloatingLabel>
                  <FloatingInput
                    id="promotion-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </FloatingField>

                <FullWidth>
                  <FloatingField data-filled={Boolean(description)}>
                    <FloatingLabel htmlFor="promotion-description" $filled={Boolean(description)}>
                      {t("listing.description")}
                    </FloatingLabel>
                    <FloatingTextarea
                      id="promotion-description"
                      value={description}
                      onChange={(event) => handleDescriptionChange(event.target.value)}
                    />
                    <WordCounter>{t("vendor.promotions.words", { count: descriptionWordCount, limit: 40 })}</WordCounter>
                  </FloatingField>
                </FullWidth>
              </FormGrid>

              {selectedListing && listingRequired ? (
                <ListingSelectCard>
                  <ListingMini>
                    <ListingMiniImage $image={selectedListing.cover_image_url || undefined}>
                      {!selectedListing.cover_image_url ? <ImageIcon size={18} /> : null}
                    </ListingMiniImage>
                    <div>
                      <ListingMiniTitle>{selectedListing.title || t("vendor.promotions.untitledProperty")}</ListingMiniTitle>
                      <ListingMiniMeta>
                        {formatPropertyTypeValue(selectedListing.property_type, t)} • {selectedListing.deal_type || t("vendor.promotions.notAvailable")} •{" "}
                        {selectedListing.township || selectedListing.city || t("vendor.promotions.notAvailable")}
                      </ListingMiniMeta>
                      <ListingMiniMeta>
                        {formatCurrency(selectedListing.price ?? undefined, selectedListing.currency ?? "MMK", t("listing.contactPrice"), language)}
                      </ListingMiniMeta>
                    </div>
                  </ListingMini>
                </ListingSelectCard>
              ) : null}

              <div>
                <CardTitle>{t("vendor.promotions.selectPlan")}</CardTitle>
                <CardCopy className="mobile-hide" style={{ marginTop: 6 }}>
                  {t("vendor.promotions.selectPlanCopy")}
                </CardCopy>
              </div>
              <PlanGrid>
                {promotionPlanPresets[selectedType].map((plan, index, allPlans) => {
                  const baseRate = allPlans[0]?.pricePer24h ?? plan.pricePer24h;
                  const savedPercent =
                    baseRate > plan.pricePer24h ? Math.round(((baseRate - plan.pricePer24h) / baseRate) * 100) : 0;
                  const badge = getPlanBadge(t, index, allPlans.length);
                  return (
                    <PlanCard
                      key={plan.key}
                      type="button"
                      $active={selectedPlanKey === plan.key || (!selectedPlanKey && selectedPlan.key === plan.key)}
                      onClick={() => setSelectedPlanKey(plan.key)}
                    >
                      <PlanTop>
                        <PlanIconWrap $active={selectedPlanKey === plan.key || (!selectedPlanKey && selectedPlan.key === plan.key)}>
                          {getPlanIcon(selectedType)}
                        </PlanIconWrap>
                        {badge ? (
                          <PlanBadge $tone={badge.tone}>
                            {badge.icon}
                            {badge.label}
                          </PlanBadge>
                        ) : null}
                      </PlanTop>
                      <PlanTitle>{getPlanLabel(plan.key, t)}</PlanTitle>
                      <PlanMeta>{t("vendor.promotions.per24h", { amount: formatCurrency(plan.pricePer24h, "MMK", t("vendor.promotions.notAvailable"), language) })}</PlanMeta>
                      <PlanMeta>{t("vendor.promotions.totalPrice", { amount: formatCurrency(plan.totalPrice, "MMK", t("vendor.promotions.notAvailable"), language) })}</PlanMeta>
                      {savedPercent > 0 ? (
                        <PlanSaving>
                          <Percent size={13} />
                          {t("vendor.promotions.savePercent", { percent: savedPercent })}
                        </PlanSaving>
                      ) : null}
                    </PlanCard>
                  );
                })}
              </PlanGrid>

              {selectedType === "hero_ad" ? (
                <Card>
                  <CardHeader>
                    <div>
                      <CardTitle>{t("vendor.promotions.heroSlotAvailability")}</CardTitle>
                      <CardCopy>{t("vendor.promotions.heroSlotAvailabilityCopy")}</CardCopy>
                    </div>
                  </CardHeader>
                  <SlotLegend>
                    <span><SlotLegendDot $tone="free" /> {t("vendor.promotions.free")}</span>
                    <span><SlotLegendDot $tone="blocked" /> {t("vendor.promotions.blocked")}</span>
                    <span><SlotLegendDot $tone="selected" /> {t("vendor.promotions.selected")}</span>
                  </SlotLegend>
                  {(() => {
                    const blockedSet = new Set(
                      (heroSlotBlockedOffsets[selectedHeroSlot] ?? [])
                        .map((offset) => heroAvailabilityDays[offset]?.key)
                        .filter(Boolean) as string[]
                    );
                    return (
                      <>
                        <HeroFieldsGrid>
                          <CustomSelect
                            id="hero-slot"
                            name="hero-slot"
                            label={t("vendor.promotions.heroSlot")}
                            value={selectedHeroSlot}
                            onChange={(value) => setSelectedHeroSlot(value)}
                          >
                            {heroSlotLabels.map((slot) => (
                              <option key={slot} value={slot}>
                                {getHeroSlotLabel(slot, t)}
                              </option>
                            ))}
                          </CustomSelect>
                          <FloatingField data-filled={Boolean(selectedHeroStartKey)}>
                            <FloatingLabel htmlFor="hero-start-display" $filled={Boolean(selectedHeroStartKey)}>
                              {t("vendor.promotions.selectedStart")}
                            </FloatingLabel>
                            <FloatingInput
                              id="hero-start-display"
                              value={selectedHeroStartKey ? formatDatePickerLabel(selectedHeroStartKey, locale) : t("vendor.promotions.chooseBelow")}
                              readOnly
                            />
                          </FloatingField>
                          <FloatingField data-filled={Boolean(endsAtPreview)}>
                            <FloatingLabel htmlFor="hero-ends-at" $filled={Boolean(endsAtPreview)}>
                              {t("vendor.promotions.endsAt")}
                            </FloatingLabel>
                            <FloatingInput id="hero-ends-at" value={endsAtPreview} readOnly />
                          </FloatingField>
                        </HeroFieldsGrid>
                        <HeroInlineCalendar
                          key={`${selectedHeroSlot}-${selectedHeroStartKey ?? "empty"}`}
                          value={selectedHeroStartKey || ""}
                          blockedKeys={blockedSet}
                          selectedRangeKeys={heroRangeKeys}
                          weekdayLabels={calendarWeekdayLabels}
                          todayLabel={t("hub.today")}
                          locale={locale}
                          onChange={(value) => handleHeroDaySelect(selectedHeroSlot, value)}
                        />
                      </>
                    );
                  })()}
                </Card>
              ) : null}
            </ModalBody>

            <ModalFooter>
              <ButtonRow>
                {onBack ? (
                  <Button type="button" onClick={onBack}>
                    <ArrowLeft size={16} />
                    <span>{t("vendor.promotions.back")}</span>
                  </Button>
                ) : null}
              </ButtonRow>
              <ButtonRow>
                <Button type="button" onClick={closeCreator}>
                  <span>{t("vendor.promotions.cancel")}</span>
                </Button>
                <Button
                  type="button"
                  $primary
                  onClick={() => void handleSubmit()}
                  disabled={saving || !selectedPlan || (listingRequired && !listingId) || (selectedType === "hero_ad" && !selectedHeroStartKey)}
                >
                  <Megaphone size={16} />
                  <span>{saving ? t("vendor.promotions.saving") : t("vendor.promotions.create")}</span>
                </Button>
              </ButtonRow>
            </ModalFooter>
          </ModalShell>
        </ModalOverlay>
      ) : null}

      {paymentWallOpen && createdPromotion && canManagePromotions ? (
        <PaymentWallOverlay>
          <PaymentWallShell>
            <ModalHeader>
              <div>
                <Title style={{ fontSize: "1.22rem" }}>{t("vendor.promotions.draftCreated")}</Title>
                <Subtitle style={{ maxWidth: "none" }}>{t("vendor.promotions.draftCreatedCopy")}</Subtitle>
              </div>
              <ModalClose type="button" onClick={() => void returnToDrafts(t("vendor.promotions.savedDraft"))} aria-label={t("common.close")}>
                <X size={18} />
              </ModalClose>
            </ModalHeader>
            <ModalBody>
              <PaymentPlanCard>
                <PromotionTitle>{createdPromotion.title || t("vendor.promotions.untitled")}</PromotionTitle>
                <PaymentMeta>
                  <span>{(createdPromotion.promotion_type ? getPromotionTypeLabel(createdPromotion.promotion_type as PromotionType, t) : null) || t("vendor.promotions.productFallback")}</span>
                  <span>•</span>
                  <span>{selectedPlan ? getPlanLabel(selectedPlan.key, t) : t("vendor.promotions.selectedPlan")}</span>
                  <span>•</span>
                  <span>{formatCurrency(selectedPlan?.totalPrice ?? undefined, "MMK", t("vendor.promotions.notAvailable"), language)}</span>
                </PaymentMeta>
                <PaymentMeta>
                  <span>{t("vendor.promotions.statusLabel", { status: getPromotionStatusLabel(createdPromotion.status || "draft", t) })}</span>
                  <span>•</span>
                  <span>{selectedType === "hero_ad" ? endsAtPreview : formatDateTime(startsAt, locale, t("vendor.promotions.notAvailable"))}</span>
                </PaymentMeta>
              </PaymentPlanCard>

              <PaymentNotice>
                {t("vendor.promotions.paymentNotice")}
              </PaymentNotice>
            </ModalBody>
            <ModalFooter>
              <ButtonRow>
                <Button type="button" onClick={() => void returnToDrafts(t("vendor.promotions.savedDraft"))} disabled={checkoutLoading}>
                  <span>{t("vendor.promotions.payLater")}</span>
                </Button>
              </ButtonRow>
              <ButtonRow>
                <PrimaryButton type="button" $primary onClick={() => void handlePromotionCheckout()} disabled={checkoutLoading}>
                  <Megaphone size={16} />
                  <span>{checkoutLoading ? t("vendor.promotions.preparing") : t("vendor.promotions.payNow")}</span>
                </PrimaryButton>
              </ButtonRow>
            </ModalFooter>
          </PaymentWallShell>
        </PaymentWallOverlay>
      ) : null}
    </Page>
  );
}
