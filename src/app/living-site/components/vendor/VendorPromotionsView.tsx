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
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { withActiveVendorHeaders } from "@/app/living-site/lib/active-context";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { formatCurrency } from "@/app/living-site/lib/format";
import { formatPropertyTypeValue } from "@/lib/property-types";
import { promotionProducts, type PromotionType } from "@/lib/vendor-promotions";

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;

const Page = styled.div<{ $embedded?: boolean }>`
  display: grid;
  gap: 18px;
  padding: ${(props) => (props.$embedded ? "0" : "20px")};
`;

const Shell = styled.div`
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: 28px;
  background: linear-gradient(180deg, #f8f9fc 0%, #f2f5fa 100%);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
`;

const Heading = styled.div`
  display: grid;
  gap: 6px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: clamp(1.35rem, 2vw, 1.9rem);
  color: var(--color-text);
`;

const Subtitle = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
  max-width: 760px;
`;

const SummaryRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Pill = styled.span<{ $tone?: "neutral" | "accent" | "warning" | "success" | "danger" }>`
  min-height: 31px;
  padding: 0 11px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.78rem;
  font-weight: 800;
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
`;

const Card = styled.section`
  border-radius: 24px;
  padding: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
  display: grid;
  gap: 14px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
`;

const CardTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
  color: var(--color-text);
`;

const CardCopy = styled.p`
  margin: 4px 0 0;
  color: var(--color-muted);
  line-height: 1.55;
`;

const Notice = styled.div<{ $tone?: "warning" | "success" | "danger" }>`
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
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

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
`;

const SearchableField = styled.div`
  position: relative;
  display: grid;
`;

const SearchableTrigger = styled.input`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #fff;
  color: var(--color-text);
  padding: 0 42px 0 14px;
  width: 100%;

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
`;

const SearchableOption = styled.button<{ $active?: boolean }>`
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
`;

const SearchableOptionMeta = styled.span`
  font-size: 0.76rem;
  color: var(--color-muted);
`;

const SearchableEmpty = styled.div`
  border-radius: 12px;
  padding: 12px;
  color: var(--color-muted);
  font-size: 0.82rem;
  background: #f8fafc;
`;

const Textarea = styled.textarea`
  min-height: 108px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #fff;
  color: var(--color-text);
  padding: 12px 14px;
  width: 100%;
  resize: vertical;
`;

const FullWidth = styled.div`
  grid-column: 1 / -1;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $primary?: boolean }>`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid ${(props) => (props.$primary ? "transparent" : "rgba(148, 163, 184, 0.28)")};
  background: ${(props) => (props.$primary ? "linear-gradient(135deg, #ff4b6b 0%, #df274c 100%)" : "#fff")};
  color: ${(props) => (props.$primary ? "#fff" : "var(--color-text)")};
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
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
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const SearchRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 12px;
  align-items: center;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
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
`;

const SearchInput = styled.input`
  border: 0;
  outline: none;
  background: transparent;
  width: 100%;
  min-width: 0;
  color: var(--color-text);
  font-size: 0.95rem;
`;

const FloatingField = styled.div`
  position: relative;
  display: grid;
  gap: 6px;
`;

const FloatingLabel = styled.label<{ $filled?: boolean }>`
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
`;

const FloatingInput = styled.input`
  width: 100%;
  padding: 14px 12px 14px;
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
`;

const FloatingTextarea = styled.textarea`
  width: 100%;
  padding: 14px 12px 14px;
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
`;

const TabRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const FilterTab = styled.button<{ $active?: boolean }>`
  height: 34px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid ${(props) => (props.$active ? "rgba(233, 61, 93, 0.26)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) => (props.$active ? "#fff1f4" : "#fff")};
  color: ${(props) => (props.$active ? "#e11d48" : "var(--color-text)")};
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
`;

const PrimaryButton = styled(Button)`
  box-shadow: 0 10px 22px rgba(223, 39, 76, 0.14);
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
`;

const ModalHeader = styled.div`
  padding: 22px 24px 16px;
  border-bottom: 1px solid rgba(233, 61, 93, 0.12);
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.4));
`;

const ModalBody = styled.div`
  padding: 18px 24px 24px;
  overflow-y: auto;
  display: grid;
  gap: 18px;
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
`;

const TypeTabs = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const TypeTab = styled.button<{ $active?: boolean }>`
  height: 40px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid ${(props) => (props.$active ? "rgba(233, 61, 93, 0.26)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) => (props.$active ? "linear-gradient(180deg, #fff0f5 0%, #ffe5ef 100%)" : "rgba(255,255,255,0.88)")};
  color: ${(props) => (props.$active ? "#e11d48" : "var(--color-text)")};
  font-size: 0.82rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 0 0 auto;
`;

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

const PlanCard = styled.button<{ $active?: boolean }>`
  border-radius: 18px;
  border: 1px solid ${(props) => (props.$active ? "rgba(233, 61, 93, 0.28)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) => (props.$active ? "linear-gradient(180deg, #fff4f8 0%, #ffeaf2 100%)" : "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)")};
  padding: 14px;
  text-align: left;
  display: grid;
  gap: 8px;
  box-shadow: ${(props) => (props.$active ? "0 14px 28px rgba(225, 29, 72, 0.08)" : "0 8px 18px rgba(15, 23, 42, 0.04)")};
  cursor: pointer;
  position: relative;
`;

const PlanTitle = styled.strong`
  color: var(--color-text);
  display: block;
`;

const PlanMeta = styled.span`
  color: var(--color-muted);
  font-size: 0.84rem;
  line-height: 1.45;
`;

const PlanTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
`;

const PlanIconWrap = styled.div<{ $active?: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: ${(props) => (props.$active ? "#ffe3ec" : "#f2f5fb")};
  color: ${(props) => (props.$active ? "#e11d48" : "#64748b")};
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
`;

const PlanSaving = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #0f766e;
  font-size: 0.78rem;
  font-weight: 700;
`;

const WordCounter = styled.div`
  color: var(--color-muted);
  font-size: 0.74rem;
  justify-self: end;
`;

const HeroFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const CalendarHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

const CalendarHeaderCell = styled.div`
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-align: center;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
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
`;

const PickerCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
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
`;

const SlotLegendDot = styled.span<{ $tone: "free" | "blocked" | "selected" }>`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
  background: ${(props) => (props.$tone === "free" ? "#ffffff" : props.$tone === "blocked" ? "#cbd5e1" : "#fb7185")};
  border: 1px solid rgba(148, 163, 184, 0.24);
`;

const ModalFooter = styled.div`
  padding: 14px 24px 22px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const PaymentWallOverlay = styled(ModalOverlay)`
  z-index: 2120;
`;

const PaymentWallShell = styled(ModalShell)`
  max-width: 680px;
  min-height: auto;
  background: linear-gradient(180deg, #fff7fb 0%, #ffffff 100%);
`;

const PaymentPlanCard = styled.div`
  border-radius: 18px;
  padding: 16px;
  border: 1px solid rgba(233, 61, 93, 0.18);
  background: linear-gradient(180deg, #fff1f5 0%, #ffffff 100%);
  display: grid;
  gap: 8px;
`;

const PaymentMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--color-muted);
  font-size: 0.84rem;
`;

const PaymentNotice = styled.div`
  border-radius: 16px;
  padding: 12px 14px;
  background: #f8fafc;
  color: var(--color-muted);
  font-size: 0.84rem;
  line-height: 1.55;
`;

const ListingSelectCard = styled.div`
  border-radius: 18px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #f8fafc;
  display: grid;
  gap: 10px;
`;

const ListingMini = styled.div`
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
`;

const ListingMiniImage = styled.div<{ $image?: string }>`
  height: 70px;
  border-radius: 16px;
  background:
    ${(props) => (props.$image ? `linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.16)), url("${props.$image}") center/cover no-repeat` : "#eef2f7")};
  display: grid;
  place-items: center;
  color: #64748b;
`;

const ListingMiniTitle = styled.strong`
  color: var(--color-text);
  display: block;
`;

const ListingMiniMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.5;
`;

const HeroTargetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
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
`;

const HeroTargetTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const HeroTargetIcon = styled.div<{ $active?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: ${(props) => (props.$active ? "var(--color-primary)" : "#64748b")};
  background: ${(props) => (props.$active ? "rgba(233, 61, 93, 0.12)" : "#f1f5f9")};
`;

const HeroTargetTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.98rem;
`;

const HeroTargetCopy = styled.div`
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.55;
`;

const HeroAgencyPreview = styled.div`
  border-radius: 20px;
  padding: 16px;
  border: 1px solid rgba(233, 61, 93, 0.16);
  background: linear-gradient(145deg, #fff6f8 0%, #fffafc 100%);
  display: grid;
  gap: 12px;
`;

const HeroAgencyPreviewTop = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
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
`;

const HeroAgencyPreviewName = styled.strong`
  color: var(--color-text);
  display: block;
  font-size: 1rem;
`;

const HeroAgencyPreviewMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #be123c;
  font-size: 0.84rem;
  font-weight: 700;
  margin-top: 4px;
`;

const HeroAgencyPreviewCopy = styled.div`
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.6;
`;

const PromotionList = styled.div`
  display: grid;
  gap: 12px;
`;

const PromotionRow = styled.div`
  border-radius: 20px;
  padding: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  display: grid;
  gap: 10px;
`;

const PromotionRowMain = styled.div`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  align-items: center;

  @media (max-width: 640px) {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 10px;
  }
`;

const PromotionThumb = styled.div<{ $image?: string }>`
  height: 72px;
  border-radius: 14px;
  background:
    ${(props) =>
      props.$image
        ? `linear-gradient(180deg, rgba(15, 23, 42, 0.04), rgba(15, 23, 42, 0.16)), url("${props.$image}") center/cover no-repeat`
        : "#eef2f7"};
  display: grid;
  place-items: center;
  color: #64748b;

  @media (max-width: 640px) {
    height: 62px;
  }
`;

const PromotionTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  flex-wrap: wrap;
`;

const PromotionTopRight = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const PromotionTitle = styled.strong`
  color: var(--color-text);
  display: block;
`;

const PromotionMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  color: var(--color-muted);
  font-size: 0.86rem;
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
`;

const Empty = styled.div`
  border-radius: 18px;
  padding: 16px;
  background: #f8fafc;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  color: var(--color-muted);
  line-height: 1.55;
`;

const SkeletonBlock = styled.div<{ $height?: number; $radius?: number }>`
  width: 100%;
  height: ${(props) => `${props.$height ?? 16}px`};
  border-radius: ${(props) => `${props.$radius ?? 14}px`};
  background: linear-gradient(
    90deg,
    #edf2f7 0%,
    #dfe7f1 50%,
    #edf2f7 100%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.35s linear infinite;
`;

const LockShell = styled.div`
  border-radius: 28px;
  padding: 28px;
  background: linear-gradient(180deg, #f8f9fc 0%, #f2f5fa 100%);
  border: 1px solid rgba(148, 163, 184, 0.24);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 16px;
`;

const LockHero = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 18px;
  background: #fff1f2;
  color: #e11d48;
  display: grid;
  place-items: center;
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

const promotionTypeTabs: Array<{ value: "all" | PromotionType; label: string }> = [
  { value: "all", label: "All" },
  { value: "hero_ad", label: "Hero Section Ad" },
  { value: "search_ranking", label: "Search Ranking" },
  { value: "listing_boost", label: "Boosting" },
];

const promotionStatusScopes = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "drafts", label: "Drafts" },
  { value: "history", label: "History" },
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

function formatDatePickerLabel(value: string | undefined) {
  const parsed = parseDateOnly(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString("en-US", {
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

function getPlanBadge(type: PromotionType, index: number, total: number) {
  if (index === 1) return { label: "Popular", tone: "accent" as const, icon: <Star size={11} /> };
  if (index === total - 1) return { label: "Best value", tone: "success" as const, icon: <Gem size={11} /> };
  return null;
}

function getPlanIcon(type: PromotionType) {
  if (type === "hero_ad") return <Crown size={16} />;
  if (type === "search_ranking") return <Search size={16} />;
  return <Sparkles size={16} />;
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
}: {
  value: string;
  blockedKeys: Set<string>;
  selectedRangeKeys: Set<string>;
  onChange: (value: string) => void;
}) {
  const selectedDate = value ? parseDateOnly(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate ?? new Date());
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const todayKey = formatDateKey(startOfDay(new Date()));
  const monthLabel = currentMonth.toLocaleDateString("en-US", {
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
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
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
              title={item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            >
              <CalendarDayInner>
                <span>{item.date.getDate()}</span>
                {isToday ? <CalendarTodayTag>Today</CalendarTodayTag> : null}
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
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
  const [data, setData] = useState<PromotionsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [paymentWallOpen, setPaymentWallOpen] = useState(false);
  const [createdPromotion, setCreatedPromotion] = useState<CreatedPromotionItem | null>(null);
  const [listQuery, setListQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | PromotionType>("all");
  const [statusScope, setStatusScope] = useState<(typeof promotionStatusScopes)[number]["value"]>("all");
  const [selectedType, setSelectedType] = useState<PromotionType>("hero_ad");
  const [heroTargetType, setHeroTargetType] = useState<"agency_profile" | "listing">("agency_profile");
  const [listingId, setListingId] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingPickerOpen, setListingPickerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPlanKey, setSelectedPlanKey] = useState("");
  const [startsAt, setStartsAt] = useState(() => formatDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [initialPrefillConsumed, setInitialPrefillConsumed] = useState(false);
  const [selectedHeroSlot, setSelectedHeroSlot] = useState<string>("Slot 1");
  const [selectedHeroStartKey, setSelectedHeroStartKey] = useState<string | null>(null);
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
          throw new Error((payload as { error?: string } | null)?.error || "Unable to load promotions.");
        }
        if (!active) return;
        setData(payload as PromotionsPayload);
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load promotions.");
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
    setListingSearch(selectedListing.title || "Untitled property");
  }, [listingPickerOpen, selectedListing]);

  useEffect(() => {
    if (!initialListingId || !eligibleListings.length || initialPrefillConsumed) return;
    const matchedListing = eligibleListings.find((item) => item.id === initialListingId);
    if (!matchedListing) return;
    setListingId(matchedListing.id);
    setListingSearch(matchedListing.title || "Untitled property");
    setSelectedType("listing_boost");
    setSelectedPlanKey(promotionPlanPresets.listing_boost[0].key);
    setCreatorOpen(true);
    setInitialPrefillConsumed(true);
  }, [eligibleListings, initialListingId, initialPrefillConsumed]);

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
      return lastHeroDay ? formatDatePickerLabel(lastHeroDay) : "Select plan and date";
    }
    const parsedHours = Number(selectedPlan?.durationHours ?? 0);
    const start = new Date(startsAt);
    if (!Number.isFinite(parsedHours) || !Number.isFinite(start.getTime())) return "N/A";
    return formatDateTime(new Date(start.getTime() + parsedHours * 60 * 60 * 1000).toISOString());
  }, [heroRangeKeyList, selectedPlan, selectedType, startsAt]);

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
      setSelectedHeroSlot("Slot 1");
      setSelectedHeroStartKey(null);
    } else {
      const matchedListing = eligibleListings.find((item) => item.id === prefillListingId);
      if (matchedListing) {
        setListingId(matchedListing.id);
        setListingSearch(matchedListing.title || "Untitled property");
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
      throw new Error((reloadPayload as { error?: string } | null)?.error || "Unable to refresh promotions.");
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
        throw new Error(payload?.error || "Unable to start promotion checkout.");
      }
      if (payload?.mode === "dinger" && payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }
      await returnToDrafts(payload?.message || "Dev payment complete. Promotion is now active.", "all");
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start promotion checkout.");
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
        throw new Error(payload?.error || "Unable to save promotion.");
      }
      setCreatedPromotion((payload as { item?: CreatedPromotionItem | null } | null)?.item ?? null);
      setSuccess(payload?.message || "Promotion saved as draft.");
      setTitle("");
      setDescription("");
      setSelectedPlanKey(promotionPlanPresets[selectedType][0].key);
      setPaymentWallOpen(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save promotion.");
    } finally {
      setSaving(false);
    }
  };

  if (!verified) {
    return (
      <Page $embedded={embedded}>
        <LockShell>
          <LockHero>
            <Lock size={24} />
          </LockHero>
          <Heading>
            <Title>Verification Required</Title>
            <Subtitle>Only verified agencies can purchase hero placements, search ranking, and listing boosts.</Subtitle>
          </Heading>
          <SummaryRow>
            <Pill $tone="warning">
              <BadgeCheck size={14} />
              Agency verification needed
            </Pill>
          </SummaryRow>
          <ButtonRow>
            {onBack ? (
              <Button type="button" onClick={onBack}>
                <ArrowLeft size={16} />
                <span>Back</span>
              </Button>
            ) : null}
            <ActionLink href={verificationHref}>
              <BadgeCheck size={16} />
              <span>Apply for Verification</span>
            </ActionLink>
          </ButtonRow>
        </LockShell>
      </Page>
    );
  }

  return (
    <Page $embedded={embedded}>
      <Shell>
        <Header>
          <Heading>
            <Title>Promote Listings</Title>
            <Subtitle>Manage hero ads, search ranking, and listing boosts for your active listings.</Subtitle>
          </Heading>
        </Header>

        {error ? <Notice $tone="danger">{error}</Notice> : null}
        {success ? <Notice $tone="success">{success}</Notice> : null}

        <Card>
          <TopBar>
            <SummaryRow>
              <Pill $tone="accent">
                <Megaphone size={14} />
                {eligibleListings.length} eligible listings
              </Pill>
              <Pill $tone="success">
                <CheckCircle2 size={14} />
                {activePromotions.length} active
              </Pill>
              <Pill $tone="warning">
                <Clock3 size={14} />
                {draftPromotions.length} drafts
              </Pill>
            </SummaryRow>
            <PrimaryButton type="button" $primary onClick={() => openCreator()}>
              <Plus size={16} />
              <span>Create promotion</span>
            </PrimaryButton>
          </TopBar>

          <SearchRow>
            <SearchField>
              <Search size={16} />
              <SearchInput
                value={listQuery}
                onChange={(event) => setListQuery(event.target.value)}
                placeholder="Search promotions or listing names"
              />
            </SearchField>
            <CustomSelect
              id="promotion-status-scope"
              name="promotion-status-scope"
              label="Promotion status scope"
              hideLabel
              value={statusScope}
              onChange={(value) => setStatusScope(value as (typeof promotionStatusScopes)[number]["value"])}
            >
              {promotionStatusScopes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </CustomSelect>
          </SearchRow>

          <TabRow>
            {promotionTypeTabs.map((tab) => (
              <FilterTab key={tab.value} type="button" $active={typeFilter === tab.value} onClick={() => setTypeFilter(tab.value)}>
                {tab.label}
              </FilterTab>
            ))}
          </TabRow>

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
            {!loading && !filteredPromotions.length ? <Empty>No promotions match these filters yet.</Empty> : null}
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
                              <PromotionTitle>{item.title || linkedListing?.title || "Untitled promotion"}</PromotionTitle>
                              <PromotionMeta>
                                <span>
                                  {promotionProducts.find((product) => product.type === item.promotion_type)?.label ||
                                    item.promotion_type ||
                                    "Promotion"}
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
                              <Pill $tone={statusTone(effectiveStatus)}>{effectiveStatus || "N/A"}</Pill>
                              {isPayablePromotionStatus(effectiveStatus) || effectiveStatus === "expired" ? (
                                <PromotionActionButton type="button" onClick={() => openPaymentWallForItem(item)}>
                                  <Megaphone size={14} />
                                  <span>{effectiveStatus === "expired" ? "Refresh boost" : "Pay now"}</span>
                                </PromotionActionButton>
                              ) : null}
                            </PromotionTopRight>
                          </PromotionTop>
                          <PromotionMeta>
                            <span>
                              <CalendarClock size={14} style={{ verticalAlign: "text-bottom", marginRight: 6 }} />
                              {formatDateTime(item.starts_at)}
                            </span>
                            <span>•</span>
                            <span>{formatCurrency(item.price_per_24h ?? undefined, "MMK", "N/A")} / 24h</span>
                            <span>•</span>
                            <span>{item.duration_hours ? `${item.duration_hours}h` : "N/A"}</span>
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

      {creatorOpen ? (
        <ModalOverlay>
          <ModalShell>
            <ModalHeader>
              <div>
                <Title style={{ fontSize: "1.3rem" }}>Create Promotion</Title>
                <Subtitle style={{ maxWidth: "none" }}>Choose what to promote, then pick a plan and schedule.</Subtitle>
              </div>
              <ModalClose type="button" onClick={closeCreator} aria-label="Close">
                <X size={18} />
              </ModalClose>
            </ModalHeader>

            <ModalBody>
              {noEligibleListings && selectedType !== "hero_ad" ? (
                <Empty>You need at least one active listing before purchasing this promotion.</Empty>
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
                    <span>{product.label}</span>
                  </TypeTab>
                ))}
              </TypeTabs>

              <FormGrid>
                {selectedType === "hero_ad" ? (
                  <FullWidth>
                    <div style={{ display: "grid", gap: 14 }}>
                      <div>
                        <CardTitle>What do you want to promote?</CardTitle>
                        <CardCopy style={{ marginTop: 6 }}>
                          Pick either your verified agency profile or one active listing for this hero slot.
                        </CardCopy>
                      </div>
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
                              <HeroTargetTitle>Agency profile</HeroTargetTitle>
                              <HeroTargetCopy>Lead with your brand, trust, and agency identity.</HeroTargetCopy>
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
                              <HeroTargetTitle>One listing</HeroTargetTitle>
                              <HeroTargetCopy>Feature one active listing directly in the homepage hero.</HeroTargetCopy>
                            </div>
                          </HeroTargetTop>
                        </HeroTargetCard>
                      </HeroTargetGrid>

                      {heroTargetType === "agency_profile" ? (
                        <HeroAgencyPreview>
                          <HeroAgencyPreviewTop>
                            <HeroAgencyPreviewLogo>
                              {(data?.workspace?.vendorName || "Agency")
                                .split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0]?.toUpperCase() ?? "")
                                .join("") || "AG"}
                            </HeroAgencyPreviewLogo>
                            <div>
                              <HeroAgencyPreviewName>{data?.workspace?.vendorName || "Your agency profile"}</HeroAgencyPreviewName>
                              <HeroAgencyPreviewMeta>
                                <ShieldCheck size={14} />
                                <span>Verified agency spotlight</span>
                              </HeroAgencyPreviewMeta>
                            </div>
                          </HeroAgencyPreviewTop>
                          <HeroAgencyPreviewCopy>
                            Buyers will land on your agency profile and see your listings, trust badge, and brand first.
                          </HeroAgencyPreviewCopy>
                        </HeroAgencyPreview>
                      ) : (
                        noEligibleListings ? (
                          <Empty>You need at least one active listing before using a listing hero placement.</Empty>
                        ) : (
                        <SearchableField
                          onBlur={() => {
                            setTimeout(() => {
                              setListingPickerOpen(false);
                              if (selectedListing) {
                                setListingSearch(selectedListing.title || "Untitled property");
                              } else if (!normalizedListingSearch) {
                                setListingSearch("");
                              }
                            }, 120);
                          }}
                        >
                          <FloatingField data-filled={Boolean(listingSearch)}>
                            <FloatingLabel htmlFor="promotion-listing-search" $filled>
                              Listing
                            </FloatingLabel>
                            <SearchableTrigger
                              id="promotion-listing-search"
                              value={listingSearch}
                              placeholder="Search or choose a listing"
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
                                      setListingSearch(item.title || "Untitled property");
                                      setListingPickerOpen(false);
                                    }}
                                  >
                                    <SearchableOptionTitle>{item.title || "Untitled property"}</SearchableOptionTitle>
                                    <SearchableOptionMeta>
                                      {formatPropertyTypeValue(item.property_type)} • {item.deal_type || "N/A"} •{" "}
                                      {item.township || item.city || "N/A"}
                                    </SearchableOptionMeta>
                                  </SearchableOption>
                                ))
                              ) : (
                                <SearchableEmpty>No matching listings found.</SearchableEmpty>
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
                    <Empty>You need at least one active listing before purchasing this promotion.</Empty>
                  ) : (
                  <SearchableField
                    onBlur={() => {
                      setTimeout(() => {
                        setListingPickerOpen(false);
                        if (selectedListing) {
                          setListingSearch(selectedListing.title || "Untitled property");
                        } else if (!normalizedListingSearch) {
                          setListingSearch("");
                        }
                      }, 120);
                    }}
                  >
                    <FloatingField data-filled={Boolean(listingSearch)}>
                      <FloatingLabel htmlFor="promotion-listing-search" $filled>
                        Listing
                      </FloatingLabel>
                      <SearchableTrigger
                        id="promotion-listing-search"
                        value={listingSearch}
                        placeholder="Search or choose a listing"
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
                                setListingSearch(item.title || "Untitled property");
                                setListingPickerOpen(false);
                              }}
                            >
                              <SearchableOptionTitle>{item.title || "Untitled property"}</SearchableOptionTitle>
                              <SearchableOptionMeta>
                                {formatPropertyTypeValue(item.property_type)} • {item.deal_type || "N/A"} •{" "}
                                {item.township || item.city || "N/A"}
                              </SearchableOptionMeta>
                            </SearchableOption>
                          ))
                        ) : (
                          <SearchableEmpty>No matching listings found.</SearchableEmpty>
                        )}
                      </SearchableMenu>
                    ) : null}
                  </SearchableField>
                  )
                )}

                <FloatingField data-filled={Boolean(title)}>
                  <FloatingLabel htmlFor="promotion-title" $filled={Boolean(title)}>
                    Title
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
                      Description
                    </FloatingLabel>
                    <FloatingTextarea
                      id="promotion-description"
                      value={description}
                      onChange={(event) => handleDescriptionChange(event.target.value)}
                    />
                    <WordCounter>{descriptionWordCount}/40 words</WordCounter>
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
                      <ListingMiniTitle>{selectedListing.title || "Untitled property"}</ListingMiniTitle>
                      <ListingMiniMeta>
                        {formatPropertyTypeValue(selectedListing.property_type)} • {selectedListing.deal_type || "N/A"} •{" "}
                        {selectedListing.township || selectedListing.city || "N/A"}
                      </ListingMiniMeta>
                      <ListingMiniMeta>
                        {formatCurrency(selectedListing.price ?? undefined, selectedListing.currency ?? "MMK", "Contact")}
                      </ListingMiniMeta>
                    </div>
                  </ListingMini>
                </ListingSelectCard>
              ) : null}

              <div>
                <CardTitle>Select a plan</CardTitle>
                <CardCopy style={{ marginTop: 6 }}>Choose a preset duration and daily rate.</CardCopy>
              </div>
              <PlanGrid>
                {promotionPlanPresets[selectedType].map((plan, index, allPlans) => {
                  const baseRate = allPlans[0]?.pricePer24h ?? plan.pricePer24h;
                  const savedPercent =
                    baseRate > plan.pricePer24h ? Math.round(((baseRate - plan.pricePer24h) / baseRate) * 100) : 0;
                  const badge = getPlanBadge(selectedType, index, allPlans.length);
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
                      <PlanTitle>{plan.label}</PlanTitle>
                      <PlanMeta>{formatCurrency(plan.pricePer24h, "MMK", "N/A")} / 24h</PlanMeta>
                      <PlanMeta>Total {formatCurrency(plan.totalPrice, "MMK", "N/A")}</PlanMeta>
                      {savedPercent > 0 ? (
                        <PlanSaving>
                          <Percent size={13} />
                          Save {savedPercent}%
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
                      <CardTitle>Hero slot availability</CardTitle>
                      <CardCopy>Select a slot, then choose a free start date for your chosen plan.</CardCopy>
                    </div>
                  </CardHeader>
                  <SlotLegend>
                    <span><SlotLegendDot $tone="free" /> Free</span>
                    <span><SlotLegendDot $tone="blocked" /> Blocked</span>
                    <span><SlotLegendDot $tone="selected" /> Selected</span>
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
                            label="Hero slot"
                            value={selectedHeroSlot}
                            onChange={(value) => setSelectedHeroSlot(value)}
                          >
                            {heroSlotLabels.map((slot) => (
                              <option key={slot} value={slot}>
                                {slot}
                              </option>
                            ))}
                          </CustomSelect>
                          <FloatingField data-filled={Boolean(selectedHeroStartKey)}>
                            <FloatingLabel htmlFor="hero-start-display" $filled={Boolean(selectedHeroStartKey)}>
                              Selected start
                            </FloatingLabel>
                            <FloatingInput
                              id="hero-start-display"
                              value={selectedHeroStartKey ? formatDatePickerLabel(selectedHeroStartKey) : "Choose below"}
                              readOnly
                            />
                          </FloatingField>
                          <FloatingField data-filled={Boolean(endsAtPreview)}>
                            <FloatingLabel htmlFor="hero-ends-at" $filled={Boolean(endsAtPreview)}>
                              Ends at
                            </FloatingLabel>
                            <FloatingInput id="hero-ends-at" value={endsAtPreview} readOnly />
                          </FloatingField>
                        </HeroFieldsGrid>
                        <HeroInlineCalendar
                          key={`${selectedHeroSlot}-${selectedHeroStartKey ?? "empty"}`}
                          value={selectedHeroStartKey || ""}
                          blockedKeys={blockedSet}
                          selectedRangeKeys={heroRangeKeys}
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
                    <span>Back</span>
                  </Button>
                ) : null}
              </ButtonRow>
              <ButtonRow>
                <Button type="button" onClick={closeCreator}>
                  <span>Cancel</span>
                </Button>
                <PrimaryButton
                  type="button"
                  $primary
                  onClick={() => void handleSubmit()}
                  disabled={saving || !selectedPlan || (listingRequired && !listingId) || (selectedType === "hero_ad" && !selectedHeroStartKey)}
                >
                  <Megaphone size={16} />
                  <span>{saving ? "Saving..." : "Create promotion"}</span>
                </PrimaryButton>
              </ButtonRow>
            </ModalFooter>
          </ModalShell>
        </ModalOverlay>
      ) : null}

      {paymentWallOpen && createdPromotion ? (
        <PaymentWallOverlay>
          <PaymentWallShell>
            <ModalHeader>
              <div>
                <Title style={{ fontSize: "1.22rem" }}>Promotion draft created</Title>
                <Subtitle style={{ maxWidth: "none" }}>The promotion is saved. Payment is the next step before activation.</Subtitle>
              </div>
              <ModalClose type="button" onClick={() => void returnToDrafts("Promotion saved as draft.")} aria-label="Close">
                <X size={18} />
              </ModalClose>
            </ModalHeader>
            <ModalBody>
              <PaymentPlanCard>
                <PromotionTitle>{createdPromotion.title || "Untitled promotion"}</PromotionTitle>
                <PaymentMeta>
                  <span>{promotionProducts.find((item) => item.type === createdPromotion.promotion_type)?.label || "Promotion"}</span>
                  <span>•</span>
                  <span>{selectedPlan?.label || "Selected plan"}</span>
                  <span>•</span>
                  <span>{formatCurrency(selectedPlan?.totalPrice ?? undefined, "MMK", "N/A")}</span>
                </PaymentMeta>
                <PaymentMeta>
                  <span>Status: {createdPromotion.status || "draft"}</span>
                  <span>•</span>
                  <span>{selectedType === "hero_ad" ? endsAtPreview : formatDateTime(startsAt)}</span>
                </PaymentMeta>
              </PaymentPlanCard>

              <PaymentNotice>
                Dev payment wall is enabled right now. Pressing pay will mark this promotion active for testing.
                Later, once Dinger keys are added and `ENABLE_PROMOTION_DINGER_CHECKOUT=true`, this same action will hand off to Dinger checkout.
              </PaymentNotice>
            </ModalBody>
            <ModalFooter>
              <ButtonRow>
                <Button type="button" onClick={() => void returnToDrafts("Promotion saved as draft.")} disabled={checkoutLoading}>
                  <span>Pay later</span>
                </Button>
              </ButtonRow>
              <ButtonRow>
                <PrimaryButton type="button" $primary onClick={() => void handlePromotionCheckout()} disabled={checkoutLoading}>
                  <Megaphone size={16} />
                  <span>{checkoutLoading ? "Preparing..." : "Pay now"}</span>
                </PrimaryButton>
              </ButtonRow>
            </ModalFooter>
          </PaymentWallShell>
        </PaymentWallOverlay>
      ) : null}
    </Page>
  );
}
