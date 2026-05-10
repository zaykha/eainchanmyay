"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  ChevronLeft,
  ChevronRight,
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
  MessageSquareText,
  Phone,
  Plus,
  Ruler,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  Users2,
  X,
} from "lucide-react";
import { useLanguage } from "@/app/living-site/components/Providers";
import { Panel } from "@/app/living-site/components/PageSection";
import { useAppState } from "@/app/living-site/lib/app-state";
import { supabase } from "@/app/living-site/lib/supabaseClient";
import {
  deriveActiveContextFromPath,
  readActiveContext,
  readActiveVendorWorkspace,
  withActiveVendorHeaders,
  writeActiveContext,
  writeActiveVendorWorkspace,
} from "@/app/living-site/lib/active-context";
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
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import {
  VendorPropertiesView,
  type VendorPropertyItem,
} from "@/app/living-site/components/vendor/VendorPropertiesView";
import { VendorInquiriesView } from "@/app/living-site/components/vendor/VendorInquiriesView";
import { VendorVerificationView } from "@/app/living-site/components/vendor/VendorVerificationView";

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

type AppointmentDatePickerProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
  locale: string;
  disabled?: boolean;
};

function AppointmentDatePicker({ name, value, onChange, locale, disabled }: AppointmentDatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDateOnly(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate ?? new Date());
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const monthLabel = currentMonth.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <AppointmentDateTrigger
        type="button"
        name={name}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setCurrentMonth(selectedDate ?? new Date());
          setOpen(true);
        }}
      >
        <AppointmentSelectValue $muted={!value}>
          {formatDatePickerLabel(value, locale) || "Select date"}
        </AppointmentSelectValue>
      </AppointmentDateTrigger>
      {open && (
        <AppointmentCalendarOverlay onClick={() => setOpen(false)}>
          <AppointmentCalendarCard onClick={(event) => event.stopPropagation()}>
            <AppointmentCalendarHeader>
              <AppointmentCalendarNav
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                disabled={disabled}
              >
                Prev
              </AppointmentCalendarNav>
              <strong>{monthLabel}</strong>
              <AppointmentCalendarNav
                type="button"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                disabled={disabled}
              >
                Next
              </AppointmentCalendarNav>
            </AppointmentCalendarHeader>
            <AppointmentCalendarGrid>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <span
                  key={day}
                  style={{
                    textAlign: "center",
                    fontSize: "0.75rem",
                    color: "var(--color-muted)",
                    fontWeight: 600,
                  }}
                >
                  {day}
                </span>
              ))}
              {days.map((item) => {
                const key = toDateString(item.date);
                const active = value === key;
                return (
                  <AppointmentCalendarDay
                    key={key}
                    type="button"
                    $muted={!item.inMonth}
                    $active={active}
                    onClick={() => {
                      if (disabled) return;
                      onChange(key);
                      setOpen(false);
                    }}
                  >
                    {item.date.getDate()}
                  </AppointmentCalendarDay>
                );
              })}
            </AppointmentCalendarGrid>
          </AppointmentCalendarCard>
        </AppointmentCalendarOverlay>
      )}
    </>
  );
}

function toLocalDateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(
    2,
    "0"
  )}`;
}

function parseDateOnly(value: string) {
  const parts = value.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
}

function formatDatePickerLabel(value: string | undefined, locale: string) {
  if (!value) return "";
  const parsed = parseDateOnly(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString(locale, {
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

function getDatePart(value: string) {
  if (!value) return "";
  return value.slice(0, 10);
}

function getTimePart(value: string) {
  if (!value) return "";
  const normalized = value.includes("T") ? value.split("T")[1] : value;
  return normalized.slice(0, 5);
}

function combineDateAndTime(date: string, time: string) {
  if (!date) return "";
  return `${date}T${time || "09:00"}`;
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

const HUB_APPOINTMENT_CALENDAR_DAYS = [
  { day: "Mon", date: 5, active: false, count: 0 },
  { day: "Tue", date: 6, active: false, count: 1 },
  { day: "Wed", date: 7, active: false, count: 0 },
  { day: "Thu", date: 8, active: true, count: 3 },
  { day: "Fri", date: 9, active: false, count: 4 },
  { day: "Sat", date: 10, active: false, count: 2 },
  { day: "Sun", date: 11, active: false, count: 0 },
];

const HUB_APPOINTMENT_MONTH_COUNTS: Record<number, number> = {
  2: 1,
  6: 1,
  8: 3,
  9: 4,
  10: 2,
  14: 1,
  16: 2,
  21: 1,
  23: 2,
  28: 1,
};

const HUB_APPOINTMENT_MONTH_DETAILS: Record<
  number,
  Array<{
    property: string;
    assignee: string;
    time: string;
  }>
> = {
  2: [{ property: "Condo viewing with buyer", assignee: "Mya Mya", time: "10:30 AM" }],
  6: [{ property: "Owner follow-up call", assignee: "Ei Ei", time: "2:00 PM" }],
  8: [
    { property: "Condo viewing with buyer", assignee: "Mya Mya", time: "10:30 AM" },
    { property: "Land site walk-through", assignee: "Ei Ei", time: "3:30 PM" },
    { property: "Evening buyer callback", assignee: "Ko Ko", time: "6:15 PM" },
  ],
  9: [
    { property: "House follow-up inspection", assignee: "Ko Ko", time: "1:00 PM" },
    { property: "Owner document review", assignee: "Ei Ei", time: "2:30 PM" },
    { property: "Broker handoff", assignee: "Mya Mya", time: "4:00 PM" },
    { property: "Late buyer check-in", assignee: "Ko Ko", time: "7:00 PM" },
  ],
  10: [
    { property: "Shop office key handover", assignee: "Ko Ko", time: "11:00 AM" },
    { property: "Route planning", assignee: "Ei Ei", time: "4:45 PM" },
  ],
  14: [{ property: "Warehouse site visit", assignee: "Ko Ko", time: "9:00 AM" }],
  16: [
    { property: "Team check-in", assignee: "Ei Ei", time: "10:00 AM" },
    { property: "Seller briefing", assignee: "Mya Mya", time: "1:30 PM" },
  ],
  21: [{ property: "Buyer reconfirmation", assignee: "Ei Ei", time: "12:00 PM" }],
  23: [
    { property: "Condo viewing", assignee: "Mya Mya", time: "11:30 AM" },
    { property: "House negotiation", assignee: "Ko Ko", time: "4:30 PM" },
  ],
  28: [{ property: "Land plot revisit", assignee: "Ei Ei", time: "3:00 PM" }],
};

const HUB_APPOINTMENT_QUEUE = [
  {
    time: "10:30 AM",
    property: "Condo viewing with buyer",
    location: "Tamwe",
    client: "Ko Aung",
    owner: "Mya Mya",
    status: "Confirmed",
  },
  {
    time: "1:00 PM",
    property: "House follow-up inspection",
    location: "Mayangone",
    client: "Daw Ei",
    owner: "Ko Ko",
    status: "Awaiting staff",
  },
  {
    time: "3:30 PM",
    property: "Land site walk-through",
    location: "Bago",
    client: "U Min",
    owner: "Ei Ei",
    status: "Confirmed",
  },
  {
    time: "5:15 PM",
    property: "Shop office key handover",
    location: "Lanmadaw",
    client: "Moe Zay",
    owner: "Ko Ko",
    status: "Needs owner note",
  },
];

const HUB_APPOINTMENT_ASSIGNMENT_PREVIEW = [
  { name: "Mya Mya", assignedCount: 3, unassignedShare: 1 },
  { name: "Ko Ko", assignedCount: 2, unassignedShare: 0 },
  { name: "Ei Ei", assignedCount: 1, unassignedShare: 0 },
];

function withOthers<T extends { count: number }>(items: T[], limit = 4): Array<T | (Omit<T, "count"> & { key?: string; count: number; label?: string })> {
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

const HeaderWorkspaceMenu = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
`;

const HeaderWorkspaceTrigger = styled.button`
  min-height: 64px;
  max-width: min(460px, 76vw);
  padding: 12px 16px 12px 12px;
  border-radius: 20px;
  border: 1px solid var(--color-outline);
  background: rgba(255, 255, 255, 0.96);
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  box-shadow: var(--shadow-soft);
  text-align: left;

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 720px) {
    max-width: min(340px, 86vw);
    min-height: 58px;
  }
`;

const HeaderWorkspaceTriggerAvatar = styled.div<{ $image?: string }>`
  width: 42px;
  height: 42px;
  border-radius: 999px;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  color: var(--color-primary);
  background:
    ${(props) =>
      props.$image
        ? `center / cover no-repeat url("${props.$image}")`
        : "color-mix(in srgb, var(--color-primary) 10%, white)"};
  overflow: hidden;

  svg {
    width: 18px;
    height: 18px;
  }
`;

const HeaderWorkspaceTriggerBody = styled.div`
  min-width: 0;
  display: grid;
  gap: 2px;
  flex: 1 1 auto;

  strong {
    font-size: 1.04rem;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 0.82rem;
    line-height: 1.2;
    color: var(--color-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const HeaderWorkspaceTriggerChevron = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
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
    gap: 8px;
  }
`;

const StarterSummaryItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 88px;
`;

const StarterSummaryLabel = styled.div`
  color: var(--color-muted);
  font-size: 0.76rem;
  line-height: 1.2;
`;

const StarterSummaryValue = styled.div`
  color: var(--color-text);
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.2;
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

const AppointmentLayout = styled.div`
  display: grid;
  gap: 14px;
`;

const AppointmentTopGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 14px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const AppointmentCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 24px;
  background: color-mix(in srgb, var(--color-surface-2) 72%, white);
  padding: 16px;
  display: grid;
  gap: 12px;
  align-content: start;
`;

const AppointmentCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const AppointmentCardTitleWrap = styled.div`
  display: grid;
  gap: 4px;
`;

const AppointmentCardTitle = styled.h3`
  margin: 0;
  font-size: 0.94rem;
  color: var(--color-text);
`;

const AppointmentCardCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.8rem;
  line-height: 1.4;
`;

const AppointmentCardHeaderRight = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
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
`;

const AppointmentStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const AppointmentCalendarSplit = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(180px, 1fr);
  gap: 14px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const AppointmentStatsColumn = styled.div`
  display: grid;
  gap: 10px;
`;

const AppointmentStat = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 10px 12px;
  display: grid;
  gap: 4px;
`;

const AppointmentStatLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const AppointmentStatValue = styled.strong`
  color: var(--color-text);
  font-size: 0.92rem;
`;

const AppointmentToggleRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  background: var(--color-surface);
`;

const AppointmentToggleButton = styled.button<{ $active?: boolean }>`
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 0;
  background: ${(props) => (props.$active ? "var(--gradient)" : "transparent")};
  color: ${(props) => (props.$active ? "#fff" : "var(--color-text)")};
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
`;

const AppointmentMonthNav = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const AppointmentMonthButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  display: grid;
  place-items: center;
  cursor: pointer;
`;

const AppointmentMonthLabel = styled.strong`
  color: var(--color-text);
  font-size: 0.84rem;
`;

const AppointmentWeekScroller = styled.div`
  overflow-x: auto;
  padding-bottom: 4px;
`;

const AppointmentWeekRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  min-width: 720px;
`;

const AppointmentMonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

const AppointmentMonthWeekdays = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

const AppointmentMonthWeekday = styled.div`
  padding: 0 4px;
  color: var(--color-muted);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  text-align: center;
`;

const AppointmentMonthCell = styled.div<{ $muted?: boolean; $active?: boolean }>`
  min-height: 48px;
  border: 1px solid
    ${(props) =>
      props.$active ? "color-mix(in srgb, var(--color-primary) 18%, var(--color-outline))" : "var(--color-outline)"};
  border-radius: 18px;
  background: ${(props) => (props.$active ? "#fff7f8" : "var(--color-surface)")};
  padding: 7px 8px;
  display: grid;
  align-content: start;
  justify-items: start;
  gap: 6px;
  opacity: ${(props) => (props.$muted ? 0.45 : 1)};
  cursor: ${(props) => (props.$active ? "pointer" : "default")};
  position: relative;
`;

const AppointmentDayCell = styled.div<{ $active?: boolean }>`
  border: 1px solid
    ${(props) =>
      props.$active ? "color-mix(in srgb, var(--color-primary) 18%, var(--color-outline))" : "var(--color-outline)"};
  border-radius: 18px;
  background: ${(props) => (props.$active ? "#fff7f8" : "var(--color-surface)")};
  padding: 12px;
  display: grid;
  gap: 8px;
`;

const AppointmentDayName = styled.span`
  color: var(--color-muted);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const AppointmentDayDate = styled.strong`
  color: var(--color-text);
  font-size: 0.86rem;
`;

const AppointmentCount = styled.span<{ $active?: boolean }>`
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-muted)")};
  font-size: 0.78rem;
  font-weight: 700;
`;

const AppointmentMonthCount = styled.span<{ $active?: boolean }>`
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-muted)")};
  font-size: 0.76rem;
  font-weight: 700;
`;

const AppointmentDot = styled.span<{ $active?: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-muted)")};
`;

const AppointmentMonthPopup = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 5;
  min-width: 220px;
  max-width: 260px;
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: #fff;
  box-shadow: var(--frame-shadow);
  padding: 12px;
  display: grid;
  gap: 8px;
`;

const AppointmentMonthPopupTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.84rem;
`;

const AppointmentMonthPopupList = styled.div`
  display: grid;
  gap: 6px;
`;

const AppointmentMonthPopupItem = styled.div`
  text-align: left;
  width: 100%;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid var(--color-outline);
  border-radius: 14px;
  background: var(--color-surface);
  padding: 8px 10px;
  display: grid;
  gap: 3px;
`;

const AppointmentMonthPopupProperty = styled.strong`
  color: var(--color-text);
  font-size: 0.8rem;
  line-height: 1.35;
`;

const AppointmentMonthPopupMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.76rem;
  line-height: 1.35;
`;

const AppointmentAssignmentList = styled.div`
  display: grid;
  gap: 10px;
  max-height: 206px;
  overflow-y: auto;
  padding-right: 4px;
  align-content: start;
`;

const AppointmentAssignmentRow = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 14px;
  background: var(--color-surface);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: transform 140ms ease, border-color 140ms ease, box-shadow 140ms ease, background 140ms ease;

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--color-primary) 24%, var(--color-outline));
    box-shadow: var(--shadow-soft);
    background: color-mix(in srgb, var(--color-surface) 88%, white);
  }
`;

const AppointmentAssignmentTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const AppointmentAssignmentName = styled.strong`
  color: var(--color-text);
  font-size: 0.86rem;
`;

const AppointmentAssignmentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-muted);
  font-size: 0.74rem;
  flex-wrap: wrap;
`;

const AppointmentQueueList = styled.div`
  display: grid;
  gap: 10px;
  max-height: 372px;
  overflow-y: auto;
  padding-right: 4px;
  align-content: start;
`;

const AppointmentQueueRow = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 14px 16px;
  width: 100%;
  text-align: left;
  cursor: pointer;
  display: grid;
  grid-template-columns: 92px minmax(0, 1.4fr) minmax(0, 0.8fr) auto;
  gap: 14px;
  align-items: center;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const AppointmentQueueTime = styled.div`
  display: grid;
  gap: 4px;
`;

const AppointmentQueueTimeValue = styled.strong`
  color: var(--color-text);
  font-size: 0.96rem;
`;

const AppointmentQueueTimeLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const AppointmentQueueMain = styled.div`
  display: grid;
  gap: 6px;
`;

const AppointmentQueueTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.94rem;
  line-height: 1.3;
`;

const AppointmentQueueMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-muted);
  font-size: 0.8rem;
  flex-wrap: wrap;
`;

const AppointmentQueueSide = styled.div`
  display: grid;
  gap: 4px;
`;

const AppointmentQueueSideLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const AppointmentQueueSideValue = styled.strong`
  color: var(--color-text);
  font-size: 0.84rem;
`;

const StaffAppointmentsModalBody = styled.div`
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 10px;
  align-content: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const StaffAppointmentsPanel = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-surface-2) 84%, white);
  padding: 12px;
  display: grid;
  gap: 8px;
  min-height: 0;
`;

const StaffAppointmentsPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const StaffAppointmentsPanelTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.94rem;
`;

const StaffAppointmentsPanelCopy = styled.span`
  color: var(--color-muted);
  font-size: 0.8rem;
  line-height: 1.4;
`;

const StaffAppointmentsList = styled.div`
  min-height: 0;
  overflow-y: auto;
  display: grid;
  gap: 5px;
  padding-right: 4px;
`;

const StaffAppointmentsRow = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 8px 10px;
  display: grid;
  gap: 4px;
`;

const StaffAppointmentsRowTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const StaffAppointmentsRowTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.84rem;
  line-height: 1.3;
`;

const StaffAppointmentsRowMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
  color: var(--color-muted);
  font-size: 0.74rem;
`;

const StaffAppointmentsAside = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-surface-2) 84%, white);
  padding: 12px;
  display: grid;
  align-content: start;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
`;

const StaffAppointmentsToggle = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${(props) =>
      props.$active ? "color-mix(in srgb, var(--color-primary) 28%, var(--color-outline))" : "var(--color-outline)"};
  border-radius: 999px;
  padding: 7px 11px;
  background: ${(props) => (props.$active ? "#fff1f3" : "var(--color-surface)")};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  font-weight: 700;
  cursor: pointer;
`;

const StaffAppointmentsSummary = styled.div`
  display: grid;
  gap: 8px;
`;

const StaffAppointmentsSummaryRow = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const StaffAppointmentsSummaryLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.8rem;
`;

const StaffAppointmentsSummaryValue = styled.strong`
  color: var(--color-text);
  font-size: 0.9rem;
`;

const AppointmentClickable = styled.button`
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
`;

const AppointmentEditorMeta = styled.div`
  display: grid;
  gap: 10px;
`;

const AppointmentEditorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-muted);
  font-size: 0.9rem;
  flex-wrap: wrap;
`;

const AppointmentEditorGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const AppointmentEditorSections = styled.div`
  display: grid;
  gap: 16px;
`;

const AppointmentEditorSection = styled.section`
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: color-mix(in srgb, var(--color-surface-2) 84%, white);
`;

const AppointmentEditorSectionHeader = styled.div`
  display: grid;
  gap: 4px;
`;

const AppointmentEditorSectionTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.98rem;
`;

const AppointmentEditorSectionCopy = styled.span`
  color: var(--color-muted);
  font-size: 0.86rem;
  line-height: 1.45;
`;

const AppointmentEditorLabel = styled.div`
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const AppointmentEditorField = styled.div`
  display: grid;
  gap: 8px;
`;

const AppointmentEditorInput = styled.input`
  width: 100%;
  height: 50px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 16px;
  font: inherit;
  outline: none;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 18%, transparent);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const DangerButton = styled.button`
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, var(--color-outline));
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: color-mix(in srgb, var(--color-primary) 8%, white);
  color: var(--color-primary);
  font-weight: 700;
  cursor: pointer;
`;

const AppointmentTextArea = styled.textarea`
  min-height: 108px;
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 14px 16px;
  resize: vertical;
  font: inherit;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 18%, transparent);
  }
`;

const AppointmentSelectValue = styled.span<{ $muted?: boolean }>`
  color: ${(props) => (props.$muted ? "var(--color-muted)" : "var(--color-text)")};
  font-size: 0.95rem;
  line-height: 1.2;
`;

const AppointmentDateTrigger = styled.button`
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  padding: 0 16px;
  background: var(--color-surface);
  color: var(--color-text);
  height: 50px;
  text-align: left;
  cursor: pointer;
  outline: none;
  display: flex;
  align-items: center;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 25%, transparent);
  }
`;

const AppointmentCalendarOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 36, 0.4);
  display: grid;
  place-items: center;
  z-index: 110;
  padding: 16px;
`;

const AppointmentCalendarCard = styled.div`
  width: min(420px, 100%);
  background: var(--color-surface-2);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  padding: 16px;
  display: grid;
  gap: 12px;
`;

const AppointmentCalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const AppointmentCalendarNav = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 6px 10px;
  background: var(--color-surface);
  cursor: pointer;
  color: var(--color-text);
`;

const AppointmentCalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

const AppointmentCalendarDay = styled.button<{ $muted?: boolean; $active?: boolean }>`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 8px 0;
  background: ${(props) =>
    props.$active ? "color-mix(in srgb, var(--color-primary) 18%, transparent)" : "transparent"};
  color: ${(props) =>
    props.$active ? "var(--color-primary)" : props.$muted ? "var(--color-muted)" : "var(--color-text)"};
  cursor: pointer;
  font-weight: 600;
`;

const ListingDetailViewport = styled(HubSectionViewport)``;

const ListingDetailScroller = styled(HubSectionScroller)``;

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

const WorkspaceGrid = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const WorkspacePanel = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 22px;
  background: color-mix(in srgb, var(--color-surface-2) 78%, white);
  padding: 16px;
  display: grid;
  gap: 14px;
`;

const WorkspacePanelTitle = styled.strong`
  color: var(--color-text);
  font-size: 1rem;
`;

const WorkspacePanelCopy = styled.span`
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.5;
`;

const WorkspaceSummaryList = styled.div`
  display: grid;
  gap: 10px;
`;

const WorkspaceSummaryRow = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 12px 14px;
  display: grid;
  gap: 4px;
`;

const WorkspaceSummaryLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const WorkspaceSummaryValue = styled.strong`
  color: var(--color-text);
  font-size: 0.98rem;
  line-height: 1.4;
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
`;

const TeamSectionStack = styled.div`
  display: grid;
  gap: 14px;
`;

const TeamSummaryBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
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
`;

const TeamSummaryItemLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const TeamSummaryItemValue = styled.strong`
  color: var(--color-text);
  font-size: 0.92rem;
`;

const RolePolicyGrid = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const RolePolicyCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 14px;
  display: grid;
  gap: 10px;
`;

const RolePolicyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const RolePolicyTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.94rem;
`;

const RolePolicyList = styled.div`
  display: grid;
  gap: 7px;
`;

const RolePolicyItem = styled.div`
  color: var(--color-muted);
  font-size: 0.84rem;
  line-height: 1.45;
  display: flex;
  align-items: flex-start;
  gap: 8px;
`;

const OrgSettingsLayout = styled.div`
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const OrgIdentityCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 24px;
  background: color-mix(in srgb, var(--color-surface-2) 82%, white);
  padding: 18px;
  display: grid;
  gap: 16px;
`;

const OrgIdentityTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
`;

const OrgIdentityMain = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

const OrgIdentityLogo = styled.div<{ $image?: string }>`
  width: 68px;
  height: 68px;
  border-radius: 20px;
  border: 1px solid var(--color-outline);
  background: ${(props) =>
    props.$image ? `center / cover no-repeat url("${props.$image}")` : "color-mix(in srgb, var(--color-surface) 88%, white)"};
  color: var(--color-text);
  display: grid;
  place-items: center;
  overflow: hidden;
  flex: 0 0 auto;
`;

const OrgIdentityText = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;
`;

const OrgIdentityName = styled.h4`
  margin: 0;
  color: var(--color-text);
  font-size: 1.36rem;
  line-height: 1.1;
`;

const OrgIdentitySlug = styled.div`
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.4;
  word-break: break-word;
`;

const OrgIdentityMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const OrgActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const OrgSnapshotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const OrgSnapshotCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 14px;
  display: grid;
  gap: 8px;
`;

const OrgSnapshotLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.76rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

const OrgSnapshotValue = styled.strong`
  color: var(--color-text);
  font-size: 0.98rem;
  line-height: 1.4;
`;

const OrgSnapshotHint = styled.span`
  color: var(--color-muted);
  font-size: 0.82rem;
  line-height: 1.45;
`;

const OrgChannelTags = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const OrgChannelTag = styled.span`
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface-2) 80%, white);
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
`;

const OrgRoleColumn = styled.div`
  display: grid;
  gap: 12px;
`;

const OrgRoleHeader = styled.div`
  display: grid;
  gap: 4px;
`;

const OrgRoleTitle = styled.h4`
  margin: 0;
  color: var(--color-text);
  font-size: 1.18rem;
`;

const OrgRoleCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.9rem;
  line-height: 1.5;
`;

const OrgRoleStack = styled.div`
  display: grid;
  gap: 10px;
`;

const OrgRoleCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 14px;
  display: grid;
  gap: 10px;
`;

const OrgRoleCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
`;

const OrgRoleCardTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.95rem;
`;

const OrgRoleBulletList = styled.div`
  display: grid;
  gap: 7px;
`;

const OrgRoleBullet = styled.div`
  color: var(--color-muted);
  font-size: 0.83rem;
  line-height: 1.45;
  display: flex;
  align-items: flex-start;
  gap: 8px;
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
`;

const CompactSelectWrap = styled.div`
  .Control {
    min-height: 46px;
    padding-top: 0;
    padding-bottom: 0;
    border-radius: 16px;
    font-size: 0.96rem;
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

const CompactCTAButton = styled(CTAButton)`
  min-height: 46px;
  padding: 0 18px;
  border-radius: 16px;
  font-size: 0.94rem;
`;

const TeamMembersList = styled.div`
  display: grid;
  gap: 10px;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
`;

const TeamMemberCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 12px 14px;
  display: grid;
  gap: 10px;
`;

const TeamMemberTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const TeamMemberName = styled.strong`
  color: var(--color-text);
  font-size: 0.96rem;
`;

const TeamMemberMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.82rem;
  line-height: 1.45;
`;

const TeamMemberControls = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const ListingDetailHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const ListingDetailBack = styled.button`
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
`;

const ListingDetailTitleWrap = styled.div`
  display: grid;
  gap: 4px;
`;

const ListingDetailTitle = styled.h3`
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-text);
`;

const ListingDetailCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.45;
`;

const ListingDetailHero = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 0.95fr) minmax(0, 1.05fr);
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const ListingDetailImage = styled.div<{ $image?: string }>`
  min-height: 260px;
  border-radius: 24px;
  border: 1px solid var(--color-outline);
  background: ${(props) =>
    props.$image ? `center / cover no-repeat url(${props.$image})` : "color-mix(in srgb, var(--color-surface) 92%, white)"};
  display: grid;
  place-items: center;
  color: var(--color-muted);
  overflow: hidden;
`;

const ListingDetailInfo = styled.div`
  display: grid;
  gap: 14px;
  border: 1px solid var(--color-outline);
  border-radius: 24px;
  background: color-mix(in srgb, var(--color-surface-2) 72%, white);
  padding: 18px;
`;

const ListingDetailPills = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const ListingDetailPrice = styled.div`
  color: var(--color-text);
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.1;
`;

const ListingDetailMetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const ListingDetailMetaCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 12px 14px;
  display: grid;
  gap: 5px;
`;

const ListingDetailMetaLabel = styled.span`
  color: var(--color-muted);
  font-size: 0.76rem;
`;

const ListingDetailMetaValue = styled.strong`
  color: var(--color-text);
  font-size: 0.9rem;
`;

const ListingDetailLower = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const ListingDetailCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 24px;
  background: color-mix(in srgb, var(--color-surface-2) 72%, white);
  padding: 18px;
  display: grid;
  gap: 14px;
`;

const ListingDetailSectionTitle = styled.h4`
  margin: 0;
  color: var(--color-text);
  font-size: 0.98rem;
`;

const ListingAppointmentList = styled.div`
  display: grid;
  gap: 10px;
`;

const ListingAppointmentRow = styled.div`
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

const ListingAppointmentTime = styled.strong`
  color: var(--color-text);
  font-size: 0.9rem;
`;

const ListingAppointmentMain = styled.div`
  display: grid;
  gap: 4px;
`;

const ListingAppointmentTitle = styled.strong`
  color: var(--color-text);
  font-size: 0.88rem;
`;

const ListingAppointmentMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.78rem;
  line-height: 1.4;
`;

const ListingStaffList = styled.div`
  display: grid;
  gap: 10px;
`;

const ListingStaffRow = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 18px;
  background: var(--color-surface);
  padding: 12px 14px;
  display: grid;
  gap: 5px;
`;

const ListingStaffName = styled.strong`
  color: var(--color-text);
  font-size: 0.88rem;
`;

const ListingStaffMeta = styled.div`
  color: var(--color-muted);
  font-size: 0.78rem;
  line-height: 1.4;
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
  overflow: visible;
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

const HubInsightPieWrap = styled.div`
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
`;

const HubInsightPie = styled.div<{ $gradient: string }>`
  width: 96px;
  height: 96px;
  border-radius: 999px;
  background: ${(props) => props.$gradient};
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);

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

const HubInsightBarList = styled.div`
  display: grid;
  gap: 8px;
`;

const HubInsightBarRow = styled.div`
  display: grid;
  gap: 0;
`;

const HubInsightBarMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-size: 0.88rem;
  color: var(--color-text);
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

const HubNavItem = styled(Link)<{ $active?: boolean; $disabled?: boolean; $expanded?: boolean }>`
  border: 1px solid
    ${(props) =>
      props.$active
        ? "color-mix(in srgb, var(--color-primary) 30%, var(--color-outline))"
        : "var(--color-outline)"};
  border-radius: 16px;
  padding: 10px 12px;
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
    grid-template-columns: 36px minmax(0,1fr) 18px;
    gap: 12px;
    justify-content: stretch;
  }
`;

const HubNavButton = styled.button<{ $active?: boolean; $expanded?: boolean }>`
  border: 1px solid
    ${(props) =>
      props.$active
        ? "color-mix(in srgb, var(--color-primary) 30%, var(--color-outline))"
        : "var(--color-outline)"};
  border-radius: 16px;
  padding: 10px 12px;
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
    grid-template-columns: 36px minmax(0,1fr) 18px;
    gap: 12px;
    justify-content: stretch;
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

const AppointmentUnreadDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-primary) 14%, transparent);
  flex: 0 0 auto;
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

const HubNavTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const HubNavTitle = styled.strong<{ $active?: boolean }>`
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
`;

const HubNavBadge = styled.span`
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1;
  flex: 0 0 auto;
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

const AppointmentModalCard = styled(ModalCard)`
  height: min(760px, calc(100vh - 48px));
  overflow-y: auto;
  overscroll-behavior: contain;
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.14);

  &::after {
    display: none;
  }
`;

const StaffAppointmentsModalCard = styled(ModalCard)`
  width: min(1120px, 96vw);
  max-width: 1120px;
  max-height: 70vh;
  overflow-y: auto;
  align-content: start;
  box-shadow: 0 24px 54px rgba(15, 23, 42, 0.14);

  &::after {
    display: none;
  }
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
  const hasWorkspaceAccess = profileReady && profileRole === "vendor_user";
  const accountLabel = !user ? "Sign in / Register" : isVendor ? "Hub" : "Account";
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
            {user && hasWorkspaceAccess ? (
              <ContextSwitch>
                <ContextButton type="button" aria-label="Open account and workspace switcher">
                  <span>Hub</span>
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
                    <strong>Personal account</strong>
                    <span>Saved listings, inquiries, and requests</span>
                  </ContextMenuItem>
                  <ContextMenuItem
                    href="/hub"
                    $active={activeContext === "vendor"}
                    onClick={() => {
                      writeActiveContext("vendor");
                      setActiveContext("vendor");
                    }}
                  >
                    <strong>Agency workspace</strong>
                    <span>Listings, appointments, leads, and team</span>
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
                    Personal account
                  </Link>
                  <Link
                    href="/hub"
                    onClick={() => {
                      writeActiveContext("vendor");
                      setActiveContext("vendor");
                      setMobileMenuOpen(false);
                    }}
                  >
                    Agency workspace
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
  const [hubSection, setHubSection] = useState<
    "snapshot" | "analytics" | "manage-listings" | "lead-inbox" | "appointments" | "listing-detail" | "team" | "settings" | "verification"
  >("snapshot");
  const searchParams = useSearchParams();
  const [selectedHubProperty, setSelectedHubProperty] = useState<VendorPropertyItem | null>(null);
  const [selectedHubPropertyDetail, setSelectedHubPropertyDetail] = useState<HubPropertyDetailPayload | null>(null);
  const [selectedHubPropertyLoading, setSelectedHubPropertyLoading] = useState(false);
  const [selectedHubPropertyError, setSelectedHubPropertyError] = useState<string | null>(null);
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
  const [appointmentComposerPropertyLocked, setAppointmentComposerPropertyLocked] = useState(false);
  const [vendorPropertyOptions, setVendorPropertyOptions] = useState<VendorPropertyItem[]>([]);
  const [vendorPropertyOptionsLoading, setVendorPropertyOptionsLoading] = useState(false);
  const [selectedAppointmentStaffId, setSelectedAppointmentStaffId] = useState<string | null>(null);
  const [showPastStaffAppointments, setShowPastStaffAppointments] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const workspaceMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const section = searchParams.get("section");
    if (
      section === "snapshot" ||
      section === "analytics" ||
      section === "manage-listings" ||
      section === "lead-inbox" ||
      section === "appointments" ||
      section === "verification" ||
      section === "team" ||
      section === "settings"
    ) {
      setHubSection(section);
    }
  }, [searchParams]);
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
  const [teamSavingUserId, setTeamSavingUserId] = useState<string | null>(null);
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

  useEffect(() => {
    if (!workspaceMenuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!workspaceMenuRef.current?.contains(event.target as Node)) {
        setWorkspaceMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [workspaceMenuOpen]);

  const buildVendorHeaders = (contentType = true) =>
    withActiveVendorHeaders(
      {
        ...(contentType ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${authToken}`,
      },
      activeVendorId
    );

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
  }, [activeVendorId, authToken, profileRole, vendorWorkspace?.vendor.plan]);

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
  }, [activeVendorId, authToken, leadInboxUnreadVersion, profileRole, vendorWorkspace?.vendor.plan]);

  useEffect(() => {
    if (!authToken || profileRole !== "vendor_user") {
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
  }, [activeVendorId, appointmentUnreadVersion, authToken, profileRole]);

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
  }, [activeVendorId, authToken, hubSection, selectedHubProperty?.id]);

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
          throw new Error(payload?.error || "Unable to load team.");
        }
        if (!cancelled) {
          setTeamMembers(payload?.members ?? []);
          setTeamInvites(payload?.invites ?? []);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setTeamError(error instanceof Error ? error.message : "Unable to load team.");
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
  }, [activeVendorId, authToken, hubSection]);

  useEffect(() => {
    const shouldLoadAppointmentDashboard = appointmentComposerMode || hubSection === "appointments";
    if (!authToken || !shouldLoadAppointmentDashboard) {
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
  }, [activeVendorId, Boolean(appointmentComposerMode), appointmentDashboardVersion, authToken, hubSection === "appointments"]);

  useEffect(() => {
    if (!authToken || profileRole !== "vendor_user") {
      setVendorPropertyOptions([]);
      setVendorPropertyOptionsLoading(false);
      return;
    }

    let active = true;
    setVendorPropertyOptionsLoading(true);

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
      })
      .finally(() => {
        if (active) {
          setVendorPropertyOptionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activeVendorId, authToken, profileRole]);

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
  }, [activeVendorId, authToken, onboardingPending, pathname, profileRole, userId]);

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
    setAppointmentEditorStatus("scheduled");
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
          role: teamInviteRole,
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
        throw new Error(payload?.error || "Unable to send team invite.");
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
      setTeamError(error instanceof Error ? error.message : "Unable to send team invite.");
    } finally {
      setTeamSavingInvite(false);
    }
  };

  const handleTeamMemberUpdate = async (memberUserId: string, role: string, status: string) => {
    if (!authToken) return;
    setTeamSavingUserId(memberUserId);
    setTeamError(null);
    try {
      const response = await fetch("/api/vendor/team", {
        method: "PATCH",
        headers: buildVendorHeaders(),
        body: JSON.stringify({
          user_id: memberUserId,
          role,
          status,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to update team member.");
      }
      setTeamMembers((current) =>
        current.map((member) =>
          member.user_id === memberUserId
            ? {
                ...member,
                role,
                status,
              }
            : member
        )
      );
    } catch (error) {
      setTeamError(error instanceof Error ? error.message : "Unable to update team member.");
    } finally {
      setTeamSavingUserId(null);
    }
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
  const canManageTeam = vendorWorkspace?.membership.role === "owner" || vendorWorkspace?.membership.role === "admin";
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
  const handleWorkspaceChange = (nextVendorId: string) => {
    if (!userId || !nextVendorId || nextVendorId === activeVendorId) return;
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
      setHubSection("snapshot");
    }
  };
  const activeTeamCount = teamMembers.filter((member) => member.status === "active").length;
  const ownerCount = teamMembers.filter((member) => member.role === "owner" && member.status === "active").length;
  const adminCount = teamMembers.filter((member) => member.role === "admin" && member.status === "active").length;
  const agentCount = teamMembers.filter((member) => member.role === "agent" && member.status === "active").length;
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
  const workspaceSnapshotView = useMemo(() => HUB_SNAPSHOT_TEMPLATE, []);
  const summaryPortfolioValue =
    vendorOverview?.metrics.totalValue ??
    (vendorWorkspace?.vendor.plan && vendorWorkspace.vendor.plan !== "free" ? HUB_SUMMARY_TEMPLATE.totalValue : 0);
  const summaryNextAppointmentTitle =
    vendorOverview?.nextAppointment?.title ??
    (vendorWorkspace?.vendor.plan && vendorWorkspace.vendor.plan !== "free"
      ? HUB_SUMMARY_TEMPLATE.nextAppointmentTitle
      : "No upcoming");
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
  const appointmentDashboardAppointments = appointmentDashboard?.appointments ?? [];
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
              assignee: appointment.assigned_staff_name || "Unassigned",
              time: appointment.start_at
                ? new Date(appointment.start_at).toLocaleTimeString(locale, {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Unscheduled",
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
  }, [appointmentDashboardAppointments, appointmentMonthDate, locale]);
  const appointmentAssignments = useMemo(() => appointmentDashboard?.assignments ?? [], [appointmentDashboard]);
  const selectedStaffAssignment = useMemo(
    () => appointmentAssignments.find((staff) => staff.id === selectedAppointmentStaffId) ?? null,
    [appointmentAssignments, selectedAppointmentStaffId]
  );
  const selectedAppointment = useMemo(
    () => appointmentDashboardAppointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null,
    [appointmentDashboardAppointments, selectedAppointmentId]
  );

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
  }, [activeVendorId, authToken, selectedAppointment?.id, selectedAppointment?.is_unread, selectedAppointment?.source]);
  const selectedStaffAppointments = useMemo(() => {
    if (!selectedAppointmentStaffId) return [];
    const now = Date.now();
    return appointmentDashboardAppointments
      .filter((appointment) => appointment.assigned_staff_id === selectedAppointmentStaffId)
      .filter((appointment) => {
        if (showPastStaffAppointments) return true;
        if (!appointment.start_at) return true;
        return new Date(appointment.start_at).getTime() >= now;
      })
      .sort((left, right) => {
        const leftTime = left.start_at ? new Date(left.start_at).getTime() : Number.MAX_SAFE_INTEGER;
        const rightTime = right.start_at ? new Date(right.start_at).getTime() : Number.MAX_SAFE_INTEGER;
        return leftTime - rightTime;
      });
  }, [appointmentDashboardAppointments, selectedAppointmentStaffId, showPastStaffAppointments]);
  const appointmentQueue = useMemo(
    () =>
      appointmentDashboardAppointments
        .filter((appointment) => {
          if (!appointment.start_at) return false;
          return new Date(appointment.start_at).getTime() >= Date.now();
        })
        .sort((left, right) => new Date(left.start_at ?? 0).getTime() - new Date(right.start_at ?? 0).getTime())
        .slice(0, 8)
        .map((appointment) => {
          const startAt = appointment.start_at ? new Date(appointment.start_at) : null;
          const isToday = startAt
            ? new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate()).getTime() ===
              new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
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
                ? "Today"
                : startAt.toLocaleDateString(locale, { month: "short", day: "numeric" })
              : "TBD",
            property: appointment.property_title,
            client: appointment.client_name,
            location: appointment.property_location,
            owner: appointment.assigned_staff_name || "Unassigned",
            status: labelize(appointment.status),
            rawStatus: appointment.status,
            assignedStaffId: appointment.assigned_staff_id,
            source: appointment.source,
            isUnread: Boolean(appointment.is_unread),
          };
        }),
    [appointmentDashboardAppointments, locale]
  );
  const selectedPropertyAppointments = useMemo(() => {
    if (!selectedHubPropertyDetail) return [];
    return selectedHubPropertyDetail.appointments.map((appointment) => ({
      id: appointment.id,
      time: appointment.start_at
        ? new Date(appointment.start_at).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })
        : "Unscheduled",
      title: appointment.title || selectedHubPropertyDetail.property.title || "Property viewing",
      client: appointment.client_name || "Buyer",
      assignee: appointment.assigned_staff_name || "Unassigned",
      status: appointment.assigned_staff_id ? labelize(appointment.status) : "Awaiting staff",
    }));
  }, [locale, selectedHubPropertyDetail]);
  const selectedPropertyStaff = useMemo(() => {
    if (!selectedHubPropertyDetail) return [];
    return selectedHubPropertyDetail.staff_summary;
  }, [selectedHubPropertyDetail]);

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
    setAppointmentEditorStatus(selectedAppointment.status || (selectedAppointment.source === "viewing_request" ? "new" : "scheduled"));
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
                  <HubNavButton
                    $active={hubSection === "snapshot"}
                    $expanded={hubRailExpanded}
                    type="button"
                    onClick={() => setHubSection("snapshot")}
                  >
                    <HubNavIcon $active={hubSection === "snapshot"} $image={vendorWorkspace?.vendor.logo_url || undefined}>
                      {!vendorWorkspace?.vendor.logo_url ? <Home /> : null}
                    </HubNavIcon>
                    <HubNavBody $expanded={hubRailExpanded}>
                      <HubNavTitle $active={hubSection === "snapshot"}>Hub</HubNavTitle>
                    </HubNavBody>
                    <HubNavArrow $expanded={hubRailExpanded}>
                      <ArrowUpRight size={18} />
                    </HubNavArrow>
                  </HubNavButton>

                  {isFreeAgencyPlan ? (
                    <HubNavItem $expanded={hubRailExpanded} href="/request-sale">
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
                  ) : (
                    <HubNavButton
                      $active={hubSection === "manage-listings" || hubSection === "listing-detail"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => setHubSection("manage-listings")}
                    >
                      <HubNavIcon $active={hubSection === "manage-listings" || hubSection === "listing-detail"}>
                        <Plus />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle $active={hubSection === "manage-listings" || hubSection === "listing-detail"}>
                          Manage listings
                        </HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  )}

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
                    <HubNavButton
                      $active={hubSection === "appointments"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => setHubSection("appointments")}
                    >
                      <HubNavIcon $active={hubSection === "appointments"}>
                        <Calendar />
                        {appointmentUnreadCount > 0 ? <HubNavIconBadge>{appointmentUnreadCount > 99 ? "99+" : appointmentUnreadCount}</HubNavIconBadge> : null}
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitleRow>
                          <HubNavTitle $active={hubSection === "appointments"}>Appointment management</HubNavTitle>
                        </HubNavTitleRow>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  )}

                  <HubNavButton
                    $active={hubSection === "analytics"}
                    $expanded={hubRailExpanded}
                    type="button"
                    onClick={() => setHubSection("analytics")}
                  >
                    <HubNavIcon $active={hubSection === "analytics"}>
                      <BarChart3 />
                    </HubNavIcon>
                    <HubNavBody $expanded={hubRailExpanded}>
                      <HubNavTitle $active={hubSection === "analytics"}>Analytics</HubNavTitle>
                    </HubNavBody>
                    <HubNavArrow $expanded={hubRailExpanded}>
                      <ArrowUpRight size={18} />
                    </HubNavArrow>
                  </HubNavButton>

                  {!isFreeAgencyPlan ? (
                    <HubNavButton
                      $active={hubSection === "lead-inbox"}
                      $expanded={hubRailExpanded}
                      type="button"
                      onClick={() => setHubSection("lead-inbox")}
                    >
                      <HubNavIcon $active={hubSection === "lead-inbox"}>
                        <MessageSquareText />
                        {leadInboxUnreadCount > 0 ? <HubNavIconBadge>{leadInboxUnreadCount > 99 ? "99+" : leadInboxUnreadCount}</HubNavIconBadge> : null}
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitleRow>
                          <HubNavTitle $active={hubSection === "lead-inbox"}>Lead inbox</HubNavTitle>
                        </HubNavTitleRow>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
                  ) : null}

                  <HubNavButton
                    $active={hubSection === "settings"}
                    $expanded={hubRailExpanded}
                    type="button"
                    onClick={() => setHubSection("settings")}
                  >
                    <HubNavIcon $active={hubSection === "settings"}>
                      <Settings />
                    </HubNavIcon>
                    <HubNavBody $expanded={hubRailExpanded}>
                      <HubNavTitle $active={hubSection === "settings"}>Organization settings</HubNavTitle>
                    </HubNavBody>
                    <HubNavArrow $expanded={hubRailExpanded}>
                      <ArrowUpRight size={18} />
                    </HubNavArrow>
                  </HubNavButton>

                  {isFreeAgencyPlan ? (
                    <HubNavItem $expanded={hubRailExpanded} href={freeUpgradeHref} $disabled>
                      <HubNavIcon>
                        <Users2 />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle>Team</HubNavTitle>
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
                      onClick={() => setHubSection("team")}
                    >
                      <HubNavIcon $active={hubSection === "team"}>
                        <Users2 />
                      </HubNavIcon>
                      <HubNavBody $expanded={hubRailExpanded}>
                        <HubNavTitle $active={hubSection === "team"}>Team</HubNavTitle>
                      </HubNavBody>
                      <HubNavArrow $expanded={hubRailExpanded}>
                        <ArrowUpRight size={18} />
                      </HubNavArrow>
                    </HubNavButton>
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
            {(isFreeAgencyPlan || hubSection === "snapshot") ? (
              <VendorCard>
                <StarterHeader>
                  <StarterTopRow>
                    <VendorHero>
                      <VendorIdentity>
                        {workspaceOptions.length > 0 ? (
                          <HeaderWorkspaceMenu ref={workspaceMenuRef}>
                            <HeaderWorkspaceTrigger
                              type="button"
                              aria-label="Open organization switcher"
                              aria-expanded={workspaceMenuOpen}
                              onClick={() => setWorkspaceMenuOpen((current) => !current)}
                            >
                              <HeaderWorkspaceTriggerAvatar $image={currentWorkspaceOption?.vendor.logo_url || undefined}>
                                {!currentWorkspaceOption?.vendor.logo_url ? <Building2 /> : null}
                              </HeaderWorkspaceTriggerAvatar>
                              <HeaderWorkspaceTriggerBody>
                                <strong>{currentWorkspaceOption?.vendor.name || vendorWorkspace?.vendor.name || "Agency account"}</strong>
                                <span>{formatRoleLabel(currentWorkspaceOption?.membership.role || vendorWorkspace?.membership.role)}</span>
                              </HeaderWorkspaceTriggerBody>
                              <HeaderWorkspaceTriggerChevron>
                                <ChevronDown />
                              </HeaderWorkspaceTriggerChevron>
                            </HeaderWorkspaceTrigger>
                            {workspaceMenuOpen ? (
                              <HeaderWorkspaceDropdown>
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
                            ) : null}
                          </HeaderWorkspaceMenu>
                        ) : (
                          <>
                            <VendorLogoBadge $image={vendorWorkspace?.vendor.logo_url || undefined}>
                              {!vendorWorkspace?.vendor.logo_url ? <Building2 size={22} /> : null}
                            </VendorLogoBadge>
                            <VendorTitle>{vendorWorkspace?.vendor.name || "Agency account"}</VendorTitle>
                          </>
                        )}
                      </VendorIdentity>
                    </VendorHero>

                    <StarterSummary>
                      <StarterSummaryItem>
                        <StarterSummaryLabel>Listings</StarterSummaryLabel>
                        <StarterSummaryValue>
                          {listingUsage} / {listingLimit}
                        </StarterSummaryValue>
                      </StarterSummaryItem>
                      <StarterSummaryItem>
                        <StarterSummaryLabel>Seats</StarterSummaryLabel>
                        <StarterSummaryValue>
                          {agentUsage} / {agentLimit}
                        </StarterSummaryValue>
                      </StarterSummaryItem>
                      <VendorPillLink href={isFreeAgencyPlan ? freeUpgradeHref : "/hub/upgrade"} $tone="warning">
                        <Sparkles size={14} />
                        {vendorWorkspace?.limits?.currentPlan?.name || currentVendorPlan.name}
                      </VendorPillLink>
                      <VendorPillLink
                        href={isFreeAgencyPlan ? freeUpgradeHref : "/hub?section=verification"}
                        $tone={vendorWorkspace?.vendor.verified_status === "approved" ? "success" : "warning"}
                      >
                        {vendorWorkspace?.vendor.verified_status === "approved" ? <BadgeCheck size={14} /> : <ShieldCheck size={14} />}
                        {vendorWorkspace?.vendor.verified_status === "approved" ? "Verified" : "Unverified"}
                      </VendorPillLink>
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
                    {isFreeAgencyPlan || hubSection === "snapshot" || hubSection === "analytics" ? (
                      <HubFeatureHeader>
                        <HubFeatureTitle>
                          {isFreeAgencyPlan
                            ? hubSection === "analytics"
                              ? "Premium analytics preview"
                              : "Premium workspace preview"
                            : hubSection === "analytics"
                              ? "Analytics"
                              : "Workspace snapshot"}
                        </HubFeatureTitle>
                        {isFreeAgencyPlan ? (
                          <HubFeatureCopy>
                            {hubSection === "analytics"
                              ? "Upgrade to unlock live analytics and sales insights inside your hub."
                              : "Upgrade to unlock live sales and lead overview inside your hub."}
                          </HubFeatureCopy>
                        ) : null}
                      </HubFeatureHeader>
                    ) : null}
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
                    ) : hubSection === "manage-listings" ? (
                      <>
                        <VendorPropertiesView
                          embedded
                          hideHeader
                          title="Manage listings"
                          subtitle="Review current listings, verification state, and property activity."
                          vendorId={activeVendorId ?? vendorWorkspace?.vendor.id ?? null}
                          onSelectProperty={(property) => {
                            setSelectedHubProperty(property);
                            setHubSection("listing-detail");
                          }}
                        />
                        <HubSectionFooter>
                          <HubSectionAction href="/request-sale">
                            <Plus size={16} />
                            <span>Add property listing</span>
                          </HubSectionAction>
                        </HubSectionFooter>
                      </>
                    ) : hubSection === "listing-detail" && selectedHubProperty ? (
                      <ListingDetailViewport>
                        <ListingDetailScroller>
                          <ListingDetailHeader>
                            <ListingDetailTitleWrap>
                              <ListingDetailTitle>Listing detail</ListingDetailTitle>
                              <ListingDetailCopy>Review this property, its scheduled appointments, and who is handling each viewing.</ListingDetailCopy>
                            </ListingDetailTitleWrap>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                              <CTAButton
                                type="button"
                                onClick={() => openAppointmentCreator(selectedHubPropertyDetail?.property.id ?? selectedHubProperty.id)}
                              >
                                Schedule appointment
                              </CTAButton>
                              <ListingDetailBack
                                type="button"
                                onClick={() => {
                                  setHubSection("manage-listings");
                                }}
                              >
                                Back to listings
                              </ListingDetailBack>
                            </div>
                          </ListingDetailHeader>

                          <ListingDetailHero>
                            {selectedHubPropertyLoading ? (
                              <HubFeatureCopy>Loading listing detail...</HubFeatureCopy>
                            ) : selectedHubPropertyError || !selectedHubPropertyDetail ? (
                              <HubFeatureCopy>{selectedHubPropertyError ?? "Unable to load listing detail."}</HubFeatureCopy>
                            ) : (
                              <>
                                <ListingDetailImage $image={selectedHubPropertyDetail.property.cover_image_url || undefined}>
                                  {!selectedHubPropertyDetail.property.cover_image_url ? <Building2 size={24} /> : null}
                                </ListingDetailImage>
                                <ListingDetailInfo>
                                  <ListingDetailPills>
                                    <AppointmentPill>{labelize(selectedHubPropertyDetail.property.status)}</AppointmentPill>
                                    <AppointmentPill $tone="warning">{labelize(selectedHubPropertyDetail.property.deal_type)}</AppointmentPill>
                                    <AppointmentPill>{formatPropertyTypeValue(selectedHubPropertyDetail.property.property_type)}</AppointmentPill>
                                  </ListingDetailPills>
                                  <ListingDetailTitle>{selectedHubPropertyDetail.property.title || "Untitled property"}</ListingDetailTitle>
                                  <ListingDetailPrice>
                                    {formatCurrency(
                                      selectedHubPropertyDetail.property.price ?? undefined,
                                      selectedHubPropertyDetail.property.currency ?? "MMK",
                                      "Contact"
                                    )}
                                  </ListingDetailPrice>
                                  <ListingDetailMetaGrid>
                                    <ListingDetailMetaCard>
                                      <ListingDetailMetaLabel>Location</ListingDetailMetaLabel>
                                      <ListingDetailMetaValue>
                                        {[
                                          selectedHubPropertyDetail.property.district || selectedHubPropertyDetail.property.city,
                                          selectedHubPropertyDetail.property.township,
                                        ]
                                          .filter(Boolean)
                                          .join(" / ") || "Unspecified"}
                                      </ListingDetailMetaValue>
                                    </ListingDetailMetaCard>
                                    <ListingDetailMetaCard>
                                      <ListingDetailMetaLabel>Appointments</ListingDetailMetaLabel>
                                      <ListingDetailMetaValue>
                                        {selectedHubPropertyDetail.property.appointments_count} scheduled
                                      </ListingDetailMetaValue>
                                    </ListingDetailMetaCard>
                                    <ListingDetailMetaCard>
                                      <ListingDetailMetaLabel>Verification</ListingDetailMetaLabel>
                                      <ListingDetailMetaValue>
                                        {labelize(selectedHubPropertyDetail.property.verification_status)}
                                      </ListingDetailMetaValue>
                                    </ListingDetailMetaCard>
                                    <ListingDetailMetaCard>
                                      <ListingDetailMetaLabel>Listing ID</ListingDetailMetaLabel>
                                      <ListingDetailMetaValue>{selectedHubPropertyDetail.property.id.slice(0, 8)}</ListingDetailMetaValue>
                                    </ListingDetailMetaCard>
                                  </ListingDetailMetaGrid>
                                </ListingDetailInfo>
                              </>
                            )}
                          </ListingDetailHero>

                          <ListingDetailLower>
                            <ListingDetailCard>
                              <ListingDetailSectionTitle>Scheduled appointments</ListingDetailSectionTitle>
                              <ListingAppointmentList>
                                {selectedPropertyAppointments.length ? (
                                  selectedPropertyAppointments.map((appointment) => (
                                    <ListingAppointmentRow
                                      key={appointment.id}
                                      as="button"
                                      type="button"
                                      onClick={() => openAppointmentEditor(appointment.id)}
                                    >
                                      <ListingAppointmentTime>{appointment.time}</ListingAppointmentTime>
                                      <ListingAppointmentMain>
                                        <ListingAppointmentTitle>{appointment.title}</ListingAppointmentTitle>
                                        <ListingAppointmentMeta>
                                          {appointment.client} • Assigned to {appointment.assignee}
                                        </ListingAppointmentMeta>
                                      </ListingAppointmentMain>
                                      <AppointmentPill $tone={appointment.status === "Confirmed" ? "success" : "warning"}>
                                        {appointment.status}
                                      </AppointmentPill>
                                    </ListingAppointmentRow>
                                  ))
                                ) : (
                                  <HubFeatureCopy>No appointments scheduled for this listing yet.</HubFeatureCopy>
                                )}
                              </ListingAppointmentList>
                            </ListingDetailCard>

                            <ListingDetailCard>
                              <ListingDetailSectionTitle>Staff assignment</ListingDetailSectionTitle>
                              <ListingStaffList>
                                {selectedPropertyStaff.length ? (
                                  selectedPropertyStaff.map((staff) => (
                                    <ListingStaffRow key={staff.id}>
                                      <ListingStaffName>{staff.name}</ListingStaffName>
                                      <ListingStaffMeta>
                                        {staff.assigned_count} assigned appointment{staff.assigned_count > 1 ? "s" : ""}
                                      </ListingStaffMeta>
                                    </ListingStaffRow>
                                  ))
                                ) : (
                                  <HubFeatureCopy>
                                    {selectedHubPropertyDetail?.unassigned_count
                                      ? `${selectedHubPropertyDetail.unassigned_count} appointment${
                                          selectedHubPropertyDetail.unassigned_count > 1 ? "s are" : " is"
                                        } waiting for staff assignment.`
                                      : "No staff assignments yet for this listing."}
                                  </HubFeatureCopy>
                                )}
                              </ListingStaffList>
                            </ListingDetailCard>
                          </ListingDetailLower>
                        </ListingDetailScroller>
                      </ListingDetailViewport>
                    ) : hubSection === "lead-inbox" ? (
                      <LeadInboxViewport>
                        <LeadInboxScroller>
                          <VendorInquiriesView
                            embedded
                            hideHeader
                            title="Lead inbox"
                            subtitle="Track routed buyer leads, assign owners, and follow up from inside your hub."
                            vendorId={activeVendorId ?? vendorWorkspace?.vendor.id ?? null}
                          />
                        </LeadInboxScroller>
                      </LeadInboxViewport>
                    ) : hubSection === "appointments" ? (
                      <HubSectionViewport>
                        <HubSectionScroller>
                          <AppointmentLayout>
                            <AppointmentTopGrid>
                              <AppointmentCard>
                                <AppointmentCardHeader>
                                  <AppointmentCardTitleWrap>
                                    <AppointmentCardTitle>
                                      <Calendar size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />
                                      Calendar
                                    </AppointmentCardTitle>
                                  </AppointmentCardTitleWrap>
                                  <AppointmentCardHeaderRight>
                                  <AppointmentPill $tone="success">
                                    <Calendar size={14} />
                                    {appointmentStats.upcoming} upcoming
                                  </AppointmentPill>
                                    {appointmentCalendarView === "month" ? (
                                      <AppointmentMonthNav>
                                        <AppointmentMonthButton
                                          type="button"
                                          aria-label="Previous month"
                                          onClick={() => {
                                            setAppointmentPopupDay(null);
                                            setAppointmentMonthOffset((current) => current - 1);
                                          }}
                                        >
                                          <ChevronLeft size={16} />
                                        </AppointmentMonthButton>
                                        <AppointmentMonthLabel>{appointmentMonthLabel}</AppointmentMonthLabel>
                                        <AppointmentMonthButton
                                          type="button"
                                          aria-label="Next month"
                                          onClick={() => {
                                            setAppointmentPopupDay(null);
                                            setAppointmentMonthOffset((current) => current + 1);
                                          }}
                                        >
                                          <ChevronRight size={16} />
                                        </AppointmentMonthButton>
                                      </AppointmentMonthNav>
                                    ) : null}
                                    <AppointmentToggleRow>
                                      <AppointmentToggleButton
                                        type="button"
                                        $active={appointmentCalendarView === "week"}
                                        onClick={() => {
                                          setAppointmentPopupDay(null);
                                          setAppointmentCalendarView("week");
                                        }}
                                      >
                                        7 days
                                      </AppointmentToggleButton>
                                      <AppointmentToggleButton
                                        type="button"
                                        $active={appointmentCalendarView === "month"}
                                        onClick={() => {
                                          setAppointmentPopupDay(null);
                                          setAppointmentCalendarView("month");
                                        }}
                                      >
                                        Month
                                      </AppointmentToggleButton>
                                    </AppointmentToggleRow>
                                  </AppointmentCardHeaderRight>
                                </AppointmentCardHeader>
                                {appointmentCalendarView === "week" ? (
                                  <>
                                    <AppointmentStats>
                                      <AppointmentStat>
                                        <AppointmentStatLabel>Today</AppointmentStatLabel>
                                        <AppointmentStatValue>{appointmentStats.today} appointments</AppointmentStatValue>
                                      </AppointmentStat>
                                      <AppointmentStat>
                                        <AppointmentStatLabel>Unassigned</AppointmentStatLabel>
                                        <AppointmentStatValue>{appointmentStats.unassigned} appointment{appointmentStats.unassigned === 1 ? "" : "s"}</AppointmentStatValue>
                                      </AppointmentStat>
                                      <AppointmentStat>
                                        <AppointmentStatLabel>Upcoming</AppointmentStatLabel>
                                        <AppointmentStatValue>{appointmentStats.upcoming} appointments</AppointmentStatValue>
                                      </AppointmentStat>
                                    </AppointmentStats>
                                    <AppointmentWeekScroller>
                                      <AppointmentWeekRow>
                                        {appointmentWeekDays.map((day) => (
                                          <AppointmentDayCell key={`${day.day}-${day.date}`} $active={day.active}>
                                            <AppointmentDayName>{day.day}</AppointmentDayName>
                                            <AppointmentDayDate>{day.date}</AppointmentDayDate>
                                            <AppointmentCount $active={day.active}>
                                              {day.count ? `${day.count} viewing${day.count > 1 ? "s" : ""}` : "Open"}
                                            </AppointmentCount>
                                          </AppointmentDayCell>
                                        ))}
                                      </AppointmentWeekRow>
                                    </AppointmentWeekScroller>
                                  </>
                                ) : (
                                  <AppointmentCalendarSplit>
                                    <div>
                                      <AppointmentMonthWeekdays>
                                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
                                          <AppointmentMonthWeekday key={label}>{label}</AppointmentMonthWeekday>
                                        ))}
                                      </AppointmentMonthWeekdays>
                                      <AppointmentMonthGrid>
                                        {appointmentMonthCells.map((day) => (
                                          <AppointmentMonthCell
                                            key={day.key}
                                            $muted={day.muted}
                                            $active={day.active}
                                            onClick={() => {
                                              if (!day.active) return;
                                              setAppointmentPopupDay((current) => (current === day.key ? null : day.key));
                                            }}
                                          >
                                            <AppointmentDayDate>{day.day}</AppointmentDayDate>
                                          {day.count ? <AppointmentDot $active={day.active} /> : null}
                                          {appointmentPopupDay === day.key && day.details.length ? (
                                            <AppointmentMonthPopup
                                              ref={appointmentMonthPopupRef}
                                              onClick={(event) => event.stopPropagation()}
                                            >
                                              <AppointmentMonthPopupTitle>
                                                {appointmentMonthLabel} {day.day}
                                              </AppointmentMonthPopupTitle>
                                              <AppointmentMonthPopupList>
                                                      {day.details.map((detail) => (
                                                        <AppointmentMonthPopupItem
                                                    key={`${day.key}-${detail.id}`}
                                                    as="button"
                                                    type="button"
                                                    onClick={() => {
                                                      setAppointmentPopupDay(null);
                                                      openAppointmentEditor(detail.id);
                                                    }}
                                                  >
                                                    <AppointmentMonthPopupProperty>
                                                      {detail.property}
                                                    </AppointmentMonthPopupProperty>
                                                    <AppointmentMonthPopupMeta>
                                                      {detail.time} • Assigned to {detail.assignee}
                                                    </AppointmentMonthPopupMeta>
                                                  </AppointmentMonthPopupItem>
                                                ))}
                                              </AppointmentMonthPopupList>
                                            </AppointmentMonthPopup>
                                          ) : null}
                                          </AppointmentMonthCell>
                                        ))}
                                      </AppointmentMonthGrid>
                                    </div>
                                    <AppointmentStatsColumn>
                                      <AppointmentStat>
                                        <AppointmentStatLabel>Today</AppointmentStatLabel>
                                        <AppointmentStatValue>{appointmentStats.today} appointments</AppointmentStatValue>
                                      </AppointmentStat>
                                      <AppointmentStat>
                                        <AppointmentStatLabel>Unassigned</AppointmentStatLabel>
                                        <AppointmentStatValue>{appointmentStats.unassigned} appointment{appointmentStats.unassigned === 1 ? "" : "s"}</AppointmentStatValue>
                                      </AppointmentStat>
                                      <AppointmentStat>
                                        <AppointmentStatLabel>Upcoming</AppointmentStatLabel>
                                        <AppointmentStatValue>{appointmentStats.upcoming} appointments</AppointmentStatValue>
                                      </AppointmentStat>
                                    </AppointmentStatsColumn>
                                  </AppointmentCalendarSplit>
                                )}
                              </AppointmentCard>

                              <AppointmentCard>
                                <AppointmentCardHeader>
                                  <AppointmentCardTitleWrap>
                                    <AppointmentCardTitle>
                                      <Users2 size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />
                                      Assignment
                                    </AppointmentCardTitle>
                                    <AppointmentCardCopy>Staff load and routing.</AppointmentCardCopy>
                                  </AppointmentCardTitleWrap>
                                  <AppointmentPill $tone={canManageTeam ? "success" : "neutral"}>
                                    <Users2 size={14} />
                                    {canManageTeam ? "Owner controls" : "View only"}
                                  </AppointmentPill>
                                </AppointmentCardHeader>
                                <AppointmentAssignmentList>
                                  {appointmentAssignments.length ? appointmentAssignments.map((staff) => (
                                    <AppointmentAssignmentRow
                                      key={staff.id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedAppointmentStaffId(staff.id);
                                        setShowPastStaffAppointments(false);
                                      }}
                                    >
                                      <AppointmentAssignmentTop>
                                        <AppointmentAssignmentName>{staff.name}</AppointmentAssignmentName>
                                        <span>{labelize(staff.role)}</span>
                                        <span>•</span>
                                        <span>
                                          {staff.assigned_count} scheduled viewing{staff.assigned_count === 1 ? "" : "s"}
                                        </span>
                                      </AppointmentAssignmentTop>
                                      <AppointmentPill>{staff.assigned_count} assigned</AppointmentPill>
                                    </AppointmentAssignmentRow>
                                  )) : <HubFeatureCopy>No active team members are available for assignment yet.</HubFeatureCopy>}
                                </AppointmentAssignmentList>
                              </AppointmentCard>
                            </AppointmentTopGrid>

                              <AppointmentCard>
                                <AppointmentCardHeader>
                                  <AppointmentCardTitleWrap>
                                    <AppointmentCardTitle>
                                      <Clock size={16} style={{ marginRight: 8, verticalAlign: "text-bottom" }} />
                                      Board
                                    </AppointmentCardTitle>
                                    <AppointmentCardCopy>Upcoming queue.</AppointmentCardCopy>
                                  </AppointmentCardTitleWrap>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                  <AppointmentPill $tone="warning">
                                    <Clock size={14} />
                                    {appointmentStats.unassigned} unassigned
                                  </AppointmentPill>
                                  <CTAButton type="button" onClick={() => openAppointmentCreator()}>
                                    Create appointment
                                  </CTAButton>
                                </div>
                              </AppointmentCardHeader>
                              <AppointmentQueueList>
                                {appointmentDashboardLoading && !appointmentDashboard ? (
                                  <HubFeatureCopy>Loading appointments...</HubFeatureCopy>
                                ) : appointmentDashboardError ? (
                                  <HubFeatureCopy>{appointmentDashboardError}</HubFeatureCopy>
                                ) : appointmentQueue.length ? (
                                  appointmentQueue.map((appointment) => (
                                    <AppointmentQueueRow
                                      key={appointment.id}
                                      as="button"
                                      type="button"
                                      onClick={() => openAppointmentEditor(appointment.id)}
                                    >
                                      <AppointmentQueueTime>
                                        <AppointmentQueueTimeValue>{appointment.time}</AppointmentQueueTimeValue>
                                        <AppointmentQueueTimeLabel>{appointment.dayLabel}</AppointmentQueueTimeLabel>
                                      </AppointmentQueueTime>
                                      <AppointmentQueueMain>
                                        <AppointmentQueueTitle>{appointment.property}</AppointmentQueueTitle>
                                        <AppointmentQueueMeta>
                                          {appointment.source === "viewing_request" && appointment.isUnread ? (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                              <AppointmentUnreadDot />
                                              New request
                                            </span>
                                          ) : null}
                                          <span>{appointment.client}</span>
                                          <span>•</span>
                                          <span>{appointment.location}</span>
                                        </AppointmentQueueMeta>
                                      </AppointmentQueueMain>
                                      <AppointmentQueueSide>
                                        <AppointmentQueueSideLabel>Assignee</AppointmentQueueSideLabel>
                                        <AppointmentQueueSideValue>{appointment.owner}</AppointmentQueueSideValue>
                                      </AppointmentQueueSide>
                                      <AppointmentPill $tone={appointment.status === "Confirmed" ? "success" : "warning"}>
                                        {appointment.status}
                                      </AppointmentPill>
                                    </AppointmentQueueRow>
                                  ))
                                ) : (
                                  <HubFeatureCopy>No upcoming appointments scheduled yet.</HubFeatureCopy>
                                )}
                              </AppointmentQueueList>
                            </AppointmentCard>
                          </AppointmentLayout>
                        </HubSectionScroller>
                      </HubSectionViewport>
                    ) : hubSection === "settings" ? (
                      <WorkspaceSectionViewport>
                        <WorkspaceSectionScroller>
                          <WorkspaceSectionHeader>
                            <WorkspaceSectionTitleWrap>
                              <WorkspaceSectionTitle>Organization settings</WorkspaceSectionTitle>
                              <WorkspaceSectionCopy>Core workspace controls.</WorkspaceSectionCopy>
                            </WorkspaceSectionTitleWrap>
                          </WorkspaceSectionHeader>
                          <SettingsIndexGrid>
                            <SettingsIndexCard>
                              <SettingsIndexHeader>
                                <SettingsIndexTitleWrap>
                                  <SettingsIndexTitle>Workspace</SettingsIndexTitle>
                                  <SettingsIndexCopy>Plan, seats, status.</SettingsIndexCopy>
                                </SettingsIndexTitleWrap>
                                <AppointmentPill>
                                  <Users2 size={14} />
                                  {activeTeamCount} / {agentLimit} seats
                                </AppointmentPill>
                              </SettingsIndexHeader>
                              <SettingsIndexRows>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Building2 size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Agency</SettingsIndexLabel>
                                  <SettingsIndexValue>{vendorWorkspace?.vendor.name || "Agency account"}</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Sparkles size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Plan</SettingsIndexLabel>
                                  <SettingsIndexValue>{vendorWorkspace?.limits?.currentPlan?.name || currentVendorPlan.name}</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><ShieldCheck size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Verification</SettingsIndexLabel>
                                  <SettingsIndexValue>{labelize(vendorWorkspace?.vendor.verified_status || "not_requested")}</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Users2 size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Control</SettingsIndexLabel>
                                  <SettingsIndexValue>{canManageTeam ? "Owner / admin" : "View only"}</SettingsIndexValue>
                                </SettingsIndexRow>
                              </SettingsIndexRows>
                              <SettingsIndexActions>
                                <GhostButton type="button" onClick={() => setHubSection("team")}>
                                  Team
                                </GhostButton>
                                {vendorWorkspace?.limits?.suggestedUpgrade ? (
                                  <GhostButton type="button" onClick={() => router.push("/hub/upgrade")}>
                                    Upgrade
                                  </GhostButton>
                                ) : null}
                              </SettingsIndexActions>
                            </SettingsIndexCard>

                            <SettingsIndexCard>
                              <SettingsIndexHeader>
                                <SettingsIndexTitleWrap>
                                  <SettingsIndexTitle>Storefront</SettingsIndexTitle>
                                  <SettingsIndexCopy>Visibility, branding, contact.</SettingsIndexCopy>
                                </SettingsIndexTitleWrap>
                                <AppointmentPill $tone={vendorWorkspace?.vendor.public_storefront_enabled ? "success" : "warning"}>
                                  <Globe2 size={14} />
                                  {vendorWorkspace?.vendor.public_storefront_enabled ? "Live" : "Hidden"}
                                </AppointmentPill>
                              </SettingsIndexHeader>
                              <SettingsIndexRows>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Globe2 size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Slug</SettingsIndexLabel>
                                  <SettingsIndexValue>
                                    {vendorWorkspace?.vendor.slug ? `/agency/${vendorWorkspace.vendor.slug}` : "Not set yet"}
                                  </SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><ImageIcon size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Branding</SettingsIndexLabel>
                                  <SettingsIndexValue>
                                    {hasAgencyLogo ? "Logo ready" : "Logo missing"} • {vendorWorkspace?.vendor.cover_image_url ? "Cover ready" : "Cover missing"}
                                  </SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Phone size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Contact</SettingsIndexLabel>
                                  <SettingsIndexValue>
                                    {vendorWorkspace?.vendor.contact_phone?.trim() || vendorWorkspace?.vendor.contact_email?.trim() || "Not added yet"}
                                  </SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><MessageSquareText size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Channels</SettingsIndexLabel>
                                  <SettingsIndexValue>{storefrontChannels} active</SettingsIndexValue>
                                </SettingsIndexRow>
                              </SettingsIndexRows>
                              <SettingsIndexActions>
                                <CTAButton type="button" onClick={() => router.push("/hub/settings")}>
                                  Edit
                                </CTAButton>
                                {vendorWorkspace?.vendor.public_storefront_enabled && vendorWorkspace?.vendor.slug ? (
                                  <GhostButton type="button" onClick={() => router.push(`/agency/${vendorWorkspace.vendor.slug}`)}>
                                    View
                                  </GhostButton>
                                ) : null}
                              </SettingsIndexActions>
                            </SettingsIndexCard>

                            <SettingsIndexCard>
                              <SettingsIndexHeader>
                                <SettingsIndexTitleWrap>
                                  <SettingsIndexTitle>Permissions</SettingsIndexTitle>
                                  <SettingsIndexCopy>Role access.</SettingsIndexCopy>
                                </SettingsIndexTitleWrap>
                              </SettingsIndexHeader>
                              <SettingsIndexBullets>
                                <SettingsIndexBullet>
                                  <CheckCircle2 size={16} />
                                  <span><strong style={{ color: "var(--color-text)" }}>Owner:</strong> full control.</span>
                                </SettingsIndexBullet>
                                <SettingsIndexBullet>
                                  <CheckCircle2 size={16} />
                                  <span><strong style={{ color: "var(--color-text)" }}>Admin:</strong> listings + appointments.</span>
                                </SettingsIndexBullet>
                                <SettingsIndexBullet>
                                  <Circle size={16} />
                                  <span><strong style={{ color: "var(--color-text)" }}>Agent:</strong> assigned work only.</span>
                                </SettingsIndexBullet>
                              </SettingsIndexBullets>
                              <SettingsIndexActions>
                                <GhostButton type="button" onClick={() => setHubSection("team")}>
                                  Team
                                </GhostButton>
                              </SettingsIndexActions>
                            </SettingsIndexCard>

                            <SettingsIndexCard>
                              <SettingsIndexHeader>
                                <SettingsIndexTitleWrap>
                                  <SettingsIndexTitle>Operations</SettingsIndexTitle>
                                  <SettingsIndexCopy>Workflow defaults.</SettingsIndexCopy>
                                </SettingsIndexTitleWrap>
                              </SettingsIndexHeader>
                              <SettingsIndexRows>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Phone size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Listing contact</SettingsIndexLabel>
                                  <SettingsIndexValue>Agency profile</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Calendar size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Assignments</SettingsIndexLabel>
                                  <SettingsIndexValue>Manual</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Settings size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Editor</SettingsIndexLabel>
                                  <SettingsIndexValue>Storefront editor</SettingsIndexValue>
                                </SettingsIndexRow>
                                <SettingsIndexRow>
                                  <SettingsIndexLabel><Users2 size={14} style={{ marginRight: 6, verticalAlign: "text-bottom" }} />Team source</SettingsIndexLabel>
                                  <SettingsIndexValue>Vendor members</SettingsIndexValue>
                                </SettingsIndexRow>
                              </SettingsIndexRows>
                              <SettingsIndexActions>
                                <GhostButton type="button" onClick={() => router.push("/hub/settings")}>
                                  Configure
                                </GhostButton>
                              </SettingsIndexActions>
                            </SettingsIndexCard>
                          </SettingsIndexGrid>
                        </WorkspaceSectionScroller>
                      </WorkspaceSectionViewport>
                    ) : hubSection === "verification" ? (
                      <WorkspaceSectionViewport>
                        <WorkspaceSectionScroller>
                          <VendorVerificationView />
                        </WorkspaceSectionScroller>
                      </WorkspaceSectionViewport>
                    ) : hubSection === "team" ? (
                      <WorkspaceSectionViewport>
                        <WorkspaceSectionScroller>
                          <WorkspaceSectionHeader>
                            <WorkspaceSectionTitleWrap>
                              <WorkspaceSectionTitle>Team</WorkspaceSectionTitle>
                              <WorkspaceSectionCopy>Manage seats and current member records tied to this agency workspace.</WorkspaceSectionCopy>
                            </WorkspaceSectionTitleWrap>
                            <AppointmentPill>
                              <Users2 size={14} />
                              {activeTeamCount} / {agentLimit} active seats
                            </AppointmentPill>
                          </WorkspaceSectionHeader>
                          {teamError ? <HubFeatureCopy>{teamError}</HubFeatureCopy> : null}
                          <TeamSectionStack>
                            <TeamSummaryBar>
                              <TeamSummaryItem>
                                <TeamSummaryItemLabel>Active seats</TeamSummaryItemLabel>
                                <TeamSummaryItemValue>
                                  {activeTeamCount} / {agentLimit}
                                </TeamSummaryItemValue>
                              </TeamSummaryItem>
                              <TeamSummaryItem>
                                <TeamSummaryItemLabel>Role mix</TeamSummaryItemLabel>
                                <TeamSummaryItemValue>
                                  {ownerCount} owner • {adminCount} admin • {agentCount} agent
                                </TeamSummaryItemValue>
                              </TeamSummaryItem>
                              <TeamSummaryItem>
                                <TeamSummaryItemLabel>Current plan</TeamSummaryItemLabel>
                                <TeamSummaryItemValue>{vendorWorkspace?.limits?.currentPlan?.name || currentVendorPlan.name}</TeamSummaryItemValue>
                              </TeamSummaryItem>
                            </TeamSummaryBar>
                            <WorkspacePanel>
                              <WorkspacePanelTitle>Add team member</WorkspacePanelTitle>
                              <WorkspacePanelCopy>Send an email invite and choose the role the person should receive after accepting it.</WorkspacePanelCopy>
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
                                      label="Role"
                                      hideLabel
                                      value={teamInviteRole}
                                      onChange={setTeamInviteRole}
                                    >
                                      <option value="agent">Agent</option>
                                      <option value="admin">Admin</option>
                                      <option value="owner">Owner</option>
                                    </CustomSelect>
                                  </CompactSelectWrap>
                                  <CompactCTAButton
                                    type="button"
                                    onClick={() => void handleTeamInvite()}
                                    disabled={teamSavingInvite || !teamInviteEmail.trim()}
                                  >
                                    {teamSavingInvite ? "Sending..." : "Send invite"}
                                  </CompactCTAButton>
                                </TeamInviteGrid>
                              ) : (
                                <WorkspaceSummaryHint>Only owner and admin seats can add team members in this workspace.</WorkspaceSummaryHint>
                              )}
                            </WorkspacePanel>
                            <WorkspacePanel>
                              <WorkspacePanelTitle>Pending invites</WorkspacePanelTitle>
                              <WorkspacePanelCopy>Track which invitations are still waiting for the recipient to join the workspace.</WorkspacePanelCopy>
                              <TeamMembersList>
                                {teamInvites.length ? (
                                  teamInvites.map((invite) => (
                                    <TeamMemberCard key={invite.id}>
                                      <TeamMemberTop>
                                        <div style={{ display: "grid", gap: 4 }}>
                                          <TeamMemberName>{invite.email}</TeamMemberName>
                                          <TeamMemberMeta>
                                            {invite.has_existing_account ? "Existing account" : "New account will be created on acceptance"}
                                          </TeamMemberMeta>
                                          {invite.expires_at ? (
                                            <TeamMemberMeta>Expires {new Date(invite.expires_at).toLocaleDateString()}</TeamMemberMeta>
                                          ) : null}
                                        </div>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                          <AppointmentPill>{labelize(invite.role)}</AppointmentPill>
                                          <AppointmentPill $tone={invite.status === "accepted" ? "success" : "warning"}>
                                            {labelize(invite.status)}
                                          </AppointmentPill>
                                        </div>
                                      </TeamMemberTop>
                                    </TeamMemberCard>
                                  ))
                                ) : (
                                  <HubFeatureCopy>No pending invites yet.</HubFeatureCopy>
                                )}
                              </TeamMembersList>
                            </WorkspacePanel>
                            <WorkspacePanel>
                              <WorkspacePanelTitle>Current team members</WorkspacePanelTitle>
                              <WorkspacePanelCopy>Review who is active in this workspace and adjust role or status as needed.</WorkspacePanelCopy>
                              <TeamMembersList>
                                {teamLoading ? (
                                  <HubFeatureCopy>Loading team...</HubFeatureCopy>
                                ) : teamMembers.length ? (
                                  teamMembers.map((member) => (
                                    <TeamMemberCard key={member.user_id}>
                                      <TeamMemberTop>
                                        <div style={{ display: "grid", gap: 4 }}>
                                          <TeamMemberName>{member.full_name || member.email || "Unnamed member"}</TeamMemberName>
                                          <TeamMemberMeta>{member.email || "No email"}</TeamMemberMeta>
                                          {member.phone ? <TeamMemberMeta>{member.phone}</TeamMemberMeta> : null}
                                        </div>
                                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                          <AppointmentPill>{labelize(member.role)}</AppointmentPill>
                                          <AppointmentPill $tone={member.status === "active" ? "success" : "neutral"}>
                                            {labelize(member.status)}
                                          </AppointmentPill>
                                        </div>
                                      </TeamMemberTop>
                                      {canManageTeam && member.user_id !== userId ? (
                                        <TeamMemberControls>
                                          <CompactSelectWrap>
                                            <CustomSelect
                                              id={`team-role-${member.user_id}`}
                                              name={`team-role-${member.user_id}`}
                                              label="Role"
                                              hideLabel
                                              value={member.role}
                                              onChange={(nextRole) => {
                                                setTeamMembers((current) =>
                                                  current.map((item) =>
                                                    item.user_id === member.user_id ? { ...item, role: nextRole } : item
                                                  )
                                                );
                                              }}
                                            >
                                              <option value="agent">Agent</option>
                                              <option value="admin">Admin</option>
                                              <option value="owner">Owner</option>
                                            </CustomSelect>
                                          </CompactSelectWrap>
                                          <CompactSelectWrap>
                                            <CustomSelect
                                              id={`team-status-${member.user_id}`}
                                              name={`team-status-${member.user_id}`}
                                              label="Status"
                                              hideLabel
                                              value={member.status}
                                              onChange={(nextStatus) => {
                                                setTeamMembers((current) =>
                                                  current.map((item) =>
                                                    item.user_id === member.user_id ? { ...item, status: nextStatus } : item
                                                  )
                                                );
                                              }}
                                            >
                                              <option value="active">Active</option>
                                              <option value="inactive">Inactive</option>
                                            </CustomSelect>
                                          </CompactSelectWrap>
                                          <CompactGhostButton
                                            type="button"
                                            onClick={() => void handleTeamMemberUpdate(member.user_id, member.role, member.status)}
                                            disabled={teamSavingUserId === member.user_id}
                                          >
                                            {teamSavingUserId === member.user_id ? "Saving..." : "Save"}
                                          </CompactGhostButton>
                                        </TeamMemberControls>
                                      ) : null}
                                    </TeamMemberCard>
                                  ))
                                ) : (
                                  <HubFeatureCopy>No team members found for this workspace yet.</HubFeatureCopy>
                                )}
                              </TeamMembersList>
                            </WorkspacePanel>
                          </TeamSectionStack>
                        </WorkspaceSectionScroller>
                      </WorkspaceSectionViewport>
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
                                {formatCurrency(summaryPortfolioValue, "MMK", "MMK 0")}
                              </HubInsightCardValueCentered>
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
                              <HubInsightHero>
                                <HubInsightHeroValue>{summaryNextAppointmentTitle}</HubInsightHeroValue>
                                {summaryNextAppointmentAt ? (
                                  <HubInsightHeroLabel>{new Date(summaryNextAppointmentAt).toLocaleString(locale)}</HubInsightHeroLabel>
                                ) : (
                                  <HubInsightHeroLabel>No appointment scheduled yet</HubInsightHeroLabel>
                                )}
                              </HubInsightHero>
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
                          <HubInsightFooterLink href="/hub/analytics/listings-by-type">
                            View full analytics <ArrowUpRight size={14} />
                          </HubInsightFooterLink>
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
                                      <HubInsightLegendRow key={("key" in item && item.key) || item.label || index}>
                                        <HubInsightLegendDot $color={HUB_INSIGHT_COLORS[index % HUB_INSIGHT_COLORS.length]} />
                                        <span>{"label" in item && item.label ? item.label : labelize("key" in item ? item.key : undefined)}</span>
                                        <HubInsightMiniCount>{item.count}</HubInsightMiniCount>
                                      </HubInsightLegendRow>
                                    ))}
                                  </HubInsightLegend>
                                </HubInsightStack>
                                <HubInsightHero>
                                  <HubInsightHeroValue>{workspaceSnapshotView.metrics.totalProperties}</HubInsightHeroValue>
                                  <HubInsightHeroLabel>Total active property records</HubInsightHeroLabel>
                                </HubInsightHero>
                              </HubInsightPieWrap>
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
                          <HubInsightFooterLink href="/hub/analytics/sales-by-type">
                            View full analytics <ArrowUpRight size={14} />
                          </HubInsightFooterLink>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightHero>
                                <HubInsightHeroValue>
                                  {workspaceSnapshotView.metrics.soldProperties + workspaceSnapshotView.metrics.rentedProperties}
                                </HubInsightHeroValue>
                                <HubInsightHeroLabel>Closed sale or rent outcomes</HubInsightHeroLabel>
                              </HubInsightHero>
                              <HubInsightBarList>
                                {salesByTypeSummary.map((item, index, list) => {
                                  const max = Math.max(1, ...list.map((current) => current.count));
                                  const label = "label" in item && item.label ? item.label : labelize("key" in item ? item.key : undefined);
                                  return (
                                    <HubInsightBarRow key={("key" in item && item.key) || item.label || index}>
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
                          <HubInsightCardTop>
                            <HubInsightCardTitle>
                              <BarChart3 />
                              Price range by type
                            </HubInsightCardTitle>
                          </HubInsightCardTop>
                          <HubInsightFooterLink href="/hub/analytics/price-range-by-type">
                            View full analytics <ArrowUpRight size={14} />
                          </HubInsightFooterLink>
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
                                        <span>
                                          {formatCurrency(item.min, item.currency, "MMK 0")} -{" "}
                                          {formatCurrency(item.max, item.currency, "MMK 0")}
                                        </span>
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
                          <HubInsightCardTop>
                            <HubInsightCardTitle>
                              <Clock />
                              Appointments by type
                            </HubInsightCardTitle>
                          </HubInsightCardTop>
                          <HubInsightFooterLink href="/hub/analytics/appointments-by-type">
                            View full analytics <ArrowUpRight size={14} />
                          </HubInsightFooterLink>
                          <HubInsightBody>
                            <HubInsightCardInner>
                              <HubInsightHero>
                                <HubInsightHeroValue>{workspaceSnapshotView.metrics.appointmentsCount}</HubInsightHeroValue>
                                <HubInsightHeroLabel>Scheduled viewing appointments</HubInsightHeroLabel>
                              </HubInsightHero>
                              <HubInsightColumnWrap>
                                {appointmentsByTypeSummary.map((item, index, list) => {
                                  const max = Math.max(1, ...list.map((current) => current.count));
                                  return (
                                    <HubInsightColumn key={("key" in item && item.key) || item.label || index}>
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
            </VendorColumn>
          </VendorGrid>
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
      {(selectedAppointment || appointmentComposerMode === "create") && (
        <ModalOverlay onClick={closeAppointmentEditor}>
          <AppointmentModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div style={{ display: "grid", gap: 6 }}>
                <strong>
                  {appointmentComposerMode === "create"
                    ? "Create appointment"
                    : selectedAppointment?.property_title || "Appointment"}
                </strong>
                <Muted>
                  {appointmentComposerMode === "create"
                    ? "Schedule a new viewing and assign it to a team member."
                    : selectedAppointment?.source === "viewing_request"
                      ? "Viewing request"
                      : "Scheduled appointment"}
                </Muted>
              </div>
              <GhostButton type="button" onClick={closeAppointmentEditor} aria-label="Close appointment editor">
                <X size={16} />
              </GhostButton>
            </ModalHeader>
            <AppointmentEditorMeta>
              {appointmentComposerMode === "edit" && selectedAppointment ? (
                <>
                  <AppointmentEditorRow>
                    <MapPin size={16} />
                    <span>{selectedAppointment.property_location || "Unspecified"}</span>
                  </AppointmentEditorRow>
                  <AppointmentEditorRow>
                    <Clock size={16} />
                    <span>
                      {selectedAppointment.start_at
                        ? new Date(selectedAppointment.start_at).toLocaleString(locale, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "Time pending"}
                    </span>
                  </AppointmentEditorRow>
                  <AppointmentEditorRow>
                    <Users2 size={16} />
                    <span>{selectedAppointment.client_name || "Buyer"}</span>
                  </AppointmentEditorRow>
                </>
              ) : null}
            </AppointmentEditorMeta>
            <CardDivider />
            <AppointmentEditorSections>
              <AppointmentEditorSection>
                <AppointmentEditorSectionHeader>
                  <AppointmentEditorSectionTitle>Appointment details</AppointmentEditorSectionTitle>
                  <AppointmentEditorSectionCopy>Choose the property, current status, and time for this visit.</AppointmentEditorSectionCopy>
                </AppointmentEditorSectionHeader>
                <AppointmentEditorGrid>
                  <AppointmentEditorField>
                    <AppointmentEditorLabel>Property</AppointmentEditorLabel>
                    <CustomSelect
                      id="appointment-property"
                      name="appointment-property"
                      label="Property"
                      hideLabel
                      value={appointmentEditorPropertyId}
                      onChange={setAppointmentEditorPropertyId}
                      disabled={appointmentComposerMode === "edit" || appointmentComposerPropertyLocked}
                    >
                      <option value="">
                        {vendorPropertyOptionsLoading ? "Loading properties..." : "Select property"}
                      </option>
                      {vendorPropertyOptions.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.title || "Untitled property"}
                        </option>
                      ))}
                    </CustomSelect>
                  </AppointmentEditorField>
                  <AppointmentEditorField>
                    <AppointmentEditorLabel>Status</AppointmentEditorLabel>
                    <CustomSelect
                      id="appointment-status"
                      name="appointment-status"
                      label="Status"
                      hideLabel
                      value={appointmentEditorStatus}
                      onChange={setAppointmentEditorStatus}
                    >
                      {((appointmentComposerMode === "edit" && selectedAppointment?.source === "viewing_request")
                        ? [
                            { value: "new", label: "New" },
                            { value: "contacted", label: "Contacted" },
                            { value: "scheduled", label: "Scheduled" },
                            { value: "closed", label: "Closed" },
                            { value: "lost", label: "Lost" },
                          ]
                        : [
                            { value: "scheduled", label: "Scheduled" },
                            { value: "completed", label: "Completed" },
                            { value: "canceled", label: "Canceled" },
                          ]
                      ).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </CustomSelect>
                  </AppointmentEditorField>
                  <AppointmentEditorField>
                    <AppointmentEditorLabel>Title</AppointmentEditorLabel>
                    <AppointmentEditorInput
                      id="appointment-title"
                      name="appointment-title"
                      placeholder="Property viewing"
                      value={appointmentEditorTitle}
                      onChange={(event) => setAppointmentEditorTitle(event.target.value)}
                      disabled={appointmentComposerMode === "edit" && selectedAppointment?.source === "viewing_request"}
                    />
                  </AppointmentEditorField>
                  <AppointmentEditorField>
                    <AppointmentEditorLabel>Date</AppointmentEditorLabel>
                    <AppointmentDatePicker
                      name="appointment-date"
                      value={getDatePart(appointmentEditorStartAt)}
                      onChange={(date) =>
                        setAppointmentEditorStartAt(combineDateAndTime(date, getTimePart(appointmentEditorStartAt)))
                      }
                      locale={locale}
                      disabled={appointmentComposerMode === "edit" && selectedAppointment?.source === "viewing_request"}
                    />
                  </AppointmentEditorField>
                  <AppointmentEditorField>
                    <AppointmentEditorLabel>Time</AppointmentEditorLabel>
                    <CustomSelect
                      id="appointment-time"
                      name="appointment-time"
                      label="Time"
                      hideLabel
                      value={getTimePart(appointmentEditorStartAt)}
                      onChange={(time) =>
                        setAppointmentEditorStartAt(combineDateAndTime(getDatePart(appointmentEditorStartAt), time))
                      }
                      disabled={appointmentComposerMode === "edit" && selectedAppointment?.source === "viewing_request"}
                    >
                      {[
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
                      ].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </CustomSelect>
                  </AppointmentEditorField>
                </AppointmentEditorGrid>
              </AppointmentEditorSection>

              <AppointmentEditorSection>
                <AppointmentEditorSectionHeader>
                  <AppointmentEditorSectionTitle>Buyer details</AppointmentEditorSectionTitle>
                  <AppointmentEditorSectionCopy>Add the buyer contact you want your team to reference for this appointment.</AppointmentEditorSectionCopy>
                </AppointmentEditorSectionHeader>
                <AppointmentEditorGrid>
                  <AppointmentEditorField>
                    <AppointmentEditorLabel>Client name</AppointmentEditorLabel>
                    <AppointmentEditorInput
                      id="appointment-client-name"
                      name="appointment-client-name"
                      placeholder="Full name"
                      value={appointmentEditorClientName}
                      onChange={(event) => setAppointmentEditorClientName(event.target.value)}
                      disabled={appointmentComposerMode === "edit" && selectedAppointment?.source === "viewing_request"}
                    />
                  </AppointmentEditorField>
                  <AppointmentEditorField>
                    <AppointmentEditorLabel>Client phone</AppointmentEditorLabel>
                    <AppointmentEditorInput
                      id="appointment-client-phone"
                      name="appointment-client-phone"
                      placeholder="09..."
                      value={appointmentEditorClientPhone}
                      onChange={(event) => setAppointmentEditorClientPhone(event.target.value)}
                      disabled={appointmentComposerMode === "edit" && selectedAppointment?.source === "viewing_request"}
                    />
                  </AppointmentEditorField>
                </AppointmentEditorGrid>
              </AppointmentEditorSection>

              <AppointmentEditorSection>
                <AppointmentEditorSectionHeader>
                  <AppointmentEditorSectionTitle>Assignment</AppointmentEditorSectionTitle>
                  <AppointmentEditorSectionCopy>Choose who will handle this appointment, or leave it unassigned for now.</AppointmentEditorSectionCopy>
                </AppointmentEditorSectionHeader>
                <AppointmentEditorField>
                  <AppointmentEditorLabel>Assigned staff</AppointmentEditorLabel>
                  <CustomSelect
                    id="appointment-assignee"
                    name="appointment-assignee"
                    label="Assigned staff"
                    hideLabel
                    value={appointmentEditorAssignee}
                    onChange={setAppointmentEditorAssignee}
                  >
                    <option value="">Unassigned</option>
                    {appointmentAssignments.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </CustomSelect>
                </AppointmentEditorField>
              </AppointmentEditorSection>

              <AppointmentEditorSection>
                <AppointmentEditorSectionHeader>
                  <AppointmentEditorSectionTitle>Notes</AppointmentEditorSectionTitle>
                  <AppointmentEditorSectionCopy>Capture access details, reminders, or anything the assigned staff should know.</AppointmentEditorSectionCopy>
                </AppointmentEditorSectionHeader>
                <AppointmentEditorField>
                  <AppointmentTextArea
                    value={appointmentEditorNotes}
                    onChange={(event) => setAppointmentEditorNotes(event.target.value)}
                    disabled={appointmentComposerMode === "edit" && selectedAppointment?.source === "viewing_request"}
                    placeholder="Optional notes"
                  />
                </AppointmentEditorField>
              </AppointmentEditorSection>
            </AppointmentEditorSections>
            {appointmentEditorError ? <Muted style={{ color: "var(--color-primary)" }}>{appointmentEditorError}</Muted> : null}
            <ModalActions style={{ justifyContent: "space-between" }}>
              {appointmentComposerMode === "edit" ? (
                <DangerButton type="button" onClick={() => void handleAppointmentDelete()} disabled={appointmentEditorSaving}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Trash2 size={16} />
                    Delete
                  </span>
                </DangerButton>
              ) : (
                <div />
              )}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <GhostButton type="button" onClick={closeAppointmentEditor} disabled={appointmentEditorSaving}>
                  Cancel
                </GhostButton>
                <CTAButton type="button" onClick={() => void handleAppointmentSave()} disabled={appointmentEditorSaving}>
                  {appointmentEditorSaving
                    ? appointmentComposerMode === "create"
                      ? "Creating..."
                      : "Saving..."
                    : appointmentComposerMode === "create"
                      ? "Create appointment"
                      : "Save changes"}
                </CTAButton>
              </div>
            </ModalActions>
          </AppointmentModalCard>
        </ModalOverlay>
      )}
      {selectedStaffAssignment && (
        <ModalOverlay
          onClick={() => {
            setSelectedAppointmentStaffId(null);
            setShowPastStaffAppointments(false);
          }}
        >
          <StaffAppointmentsModalCard onClick={(event) => event.stopPropagation()}>
            <ModalHeader>
              <div style={{ display: "grid", gap: 6 }}>
                <strong>{selectedStaffAssignment.name}</strong>
                <Muted>
                  {labelize(selectedStaffAssignment.role)} • {selectedStaffAssignment.assigned_count} assigned appointment
                  {selectedStaffAssignment.assigned_count === 1 ? "" : "s"}
                </Muted>
              </div>
              <GhostButton
                type="button"
                onClick={() => {
                  setSelectedAppointmentStaffId(null);
                  setShowPastStaffAppointments(false);
                }}
                aria-label="Close staff appointments"
              >
                <X size={16} />
              </GhostButton>
            </ModalHeader>
            <StaffAppointmentsModalBody>
              <StaffAppointmentsPanel>
                <StaffAppointmentsPanelHeader>
                  <StaffAppointmentsPanelTitle>Appointments by staff</StaffAppointmentsPanelTitle>
                  <StaffAppointmentsToggle
                    type="button"
                    $active={showPastStaffAppointments}
                    onClick={() => setShowPastStaffAppointments((value) => !value)}
                  >
                    {showPastStaffAppointments ? "Hide previous tasks" : "Show previous tasks"}
                  </StaffAppointmentsToggle>
                </StaffAppointmentsPanelHeader>
                <StaffAppointmentsList>
                  {selectedStaffAppointments.length ? (
                    selectedStaffAppointments.map((appointment) => (
                      <StaffAppointmentsRow
                        key={appointment.id}
                        as="button"
                        type="button"
                        onClick={() => {
                          setSelectedAppointmentStaffId(null);
                          setShowPastStaffAppointments(false);
                          openAppointmentEditor(appointment.id);
                        }}
                      >
                        <StaffAppointmentsRowTop>
                          <div style={{ display: "grid", gap: 4 }}>
                            <StaffAppointmentsRowTitle>{appointment.property_title || appointment.title || "Untitled appointment"}</StaffAppointmentsRowTitle>
                            <StaffAppointmentsRowMeta>
                              <span>{appointment.start_at ? new Date(appointment.start_at).toLocaleString(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Time pending"}</span>
                              <span>•</span>
                              <span>{appointment.client_name || "Buyer"}</span>
                            </StaffAppointmentsRowMeta>
                          </div>
                          <AppointmentPill $tone={appointment.status === "completed" || appointment.status === "closed" ? "success" : appointment.status === "canceled" || appointment.status === "lost" ? "danger" : "warning"}>
                            {labelize(appointment.status)}
                          </AppointmentPill>
                        </StaffAppointmentsRowTop>
                        <StaffAppointmentsRowMeta>
                          <MapPin size={14} />
                          <span>{appointment.property_location || "Unspecified"}</span>
                        </StaffAppointmentsRowMeta>
                      </StaffAppointmentsRow>
                    ))
                  ) : (
                    <HubFeatureCopy>
                      {showPastStaffAppointments
                        ? "No appointments are assigned to this staff member yet."
                        : "No upcoming appointments are currently assigned to this staff member."}
                    </HubFeatureCopy>
                  )}
                </StaffAppointmentsList>
              </StaffAppointmentsPanel>
              <StaffAppointmentsAside>
                <StaffAppointmentsPanelTitle>Assignment summary</StaffAppointmentsPanelTitle>
                <StaffAppointmentsSummary>
                  <StaffAppointmentsSummaryRow>
                    <StaffAppointmentsSummaryLabel>Assigned now</StaffAppointmentsSummaryLabel>
                    <StaffAppointmentsSummaryValue>
                      {selectedStaffAssignment.assigned_count} appointment
                      {selectedStaffAssignment.assigned_count === 1 ? "" : "s"}
                    </StaffAppointmentsSummaryValue>
                  </StaffAppointmentsSummaryRow>
                  <StaffAppointmentsSummaryRow>
                    <StaffAppointmentsSummaryLabel>Visible in this view</StaffAppointmentsSummaryLabel>
                    <StaffAppointmentsSummaryValue>
                      {selectedStaffAppointments.length} item{selectedStaffAppointments.length === 1 ? "" : "s"}
                    </StaffAppointmentsSummaryValue>
                  </StaffAppointmentsSummaryRow>
                  <StaffAppointmentsSummaryRow>
                    <StaffAppointmentsSummaryLabel>Scope</StaffAppointmentsSummaryLabel>
                    <StaffAppointmentsSummaryValue>
                      {showPastStaffAppointments ? "All tasks" : "Upcoming only"}
                    </StaffAppointmentsSummaryValue>
                  </StaffAppointmentsSummaryRow>
                </StaffAppointmentsSummary>
              </StaffAppointmentsAside>
            </StaffAppointmentsModalBody>
          </StaffAppointmentsModalCard>
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
