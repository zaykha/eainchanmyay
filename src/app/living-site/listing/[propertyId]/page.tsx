"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Bath,
  BedDouble,
  ChevronLeft,
  ChevronRight,
  Flag,
  Home,
  MapPin,
  Phone,
  Ruler,
  Tag,
} from "lucide-react";
import styled, { keyframes } from "styled-components";
import { MarketplaceHeader } from "@/app/living-site/components/MarketplaceHeader";
import { SectionTitle } from "@/app/living-site/components/PageSection";
import { useListingDetail } from "@/app/living-site/hooks/useListingDetail";
import {
  createViewingRequest,
  getCustomerProfile,
  getViewingRequestForUserProperty,
  isPropertySaved,
  updateViewingRequest,
  toggleSavedProperty,
} from "@/app/living-site/lib/data";
import { resolvePhotoUrl } from "@/app/living-site/lib/images";
import { formatCurrency } from "@/app/living-site/lib/format";
import { EAIN_CONTACT_PHONE } from "@/app/living-site/lib/constants";
import { useAppState } from "@/app/living-site/lib/app-state";
import { CustomInput } from "@/app/living-site/components/form-controls/CustomInput";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { CustomTextarea } from "@/app/living-site/components/form-controls/CustomTextarea";
import { useI18n } from "@/app/living-site/lib/i18n";
import { translateLocationName } from "@/app/living-site/lib/myanmar-geo";
import { formatPropertyTypeValue, isBedBathPropertyType } from "@/lib/property-types";

const PageShell = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 16px;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
`;

const TitleBlock = styled.div`
  display: grid;
  gap: 6px;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const TagPill = styled.span`
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface) 90%, transparent);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-muted);
`;

const Location = styled.span`
  color: var(--color-muted);
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const Gallery = styled.div`
  display: grid;
  gap: 12px;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  min-height: 220px;
  border-radius: 16px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  color: var(--color-muted);
  display: grid;
  place-items: center;
  box-shadow: var(--shadow-soft);
`;

const shimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
`;

const DetailSkeleton = styled.div`
  max-width: 1140px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 16px;
`;

const SkeletonBlock = styled.div<{ $height: number; $radius?: number; $width?: string }>`
  width: ${(props) => props.$width ?? "100%"};
  height: ${(props) => `${props.$height}px`};
  border-radius: ${(props) => `${props.$radius ?? 16}px`};
  background: linear-gradient(
    90deg,
    rgba(226, 232, 240, 0.7),
    rgba(241, 245, 249, 0.98),
    rgba(226, 232, 240, 0.7)
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.3s linear infinite;
`;

const SkeletonHeader = styled.div`
  display: grid;
  gap: 10px;
`;

const SkeletonTagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const SkeletonFeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const SkeletonTwoColumn = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.9fr);
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const CarouselShell = styled.div`
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  box-shadow: var(--shadow-soft);
  width: 100%;
`;

const CarouselViewport = styled.div`
  width: 100%;
  height: min(60vh, 520px);
  display: grid;
  place-items: center;
  background: var(--color-surface-2);

  @media (max-width: 640px) {
    height: auto;
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0.75;
    transform: translateX(18px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const CarouselImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: ${slideIn} 0.2s ease-out;

  @media (max-width: 640px) {
    height: auto;
    aspect-ratio: 4 / 3;
    object-fit: cover;
  }
`;

const CarouselButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface-2) 92%, transparent);
  color: var(--color-text);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: var(--shadow-soft);
  z-index: 2;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrevButton = styled(CarouselButton)`
  left: 12px;
`;

const NextButton = styled(CarouselButton)`
  right: 12px;
`;

const DotRow = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
`;

const Dot = styled.button<{ $active?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: none;
  background: ${(props) =>
    props.$active
      ? "var(--color-primary)"
      : "color-mix(in srgb, var(--color-muted) 60%, transparent)"};
  cursor: pointer;
`;

const LightboxNavButton = styled(CarouselButton)`
  position: static;
  transform: none;
  width: 44px;
  height: 44px;
`;

const LightboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 10, 18, 0.85);
  display: grid;
  place-items: center;
  z-index: 90;
  padding: 16px;
`;

const LightboxCard = styled.div`
  width: min(960px, 96vw);
  background: var(--color-surface-2);
  border-radius: 18px;
  border: 1px solid var(--color-outline);
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 12px;
  padding: 16px;
`;

const LightboxViewport = styled.div`
  width: 100%;
  max-height: 72vh;
  min-height: 320px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  place-items: center;
  background: var(--color-surface-2);
  border-radius: 14px;
  overflow: hidden;
`;

const LightboxImage = styled.img`
  max-width: 100%;
  max-height: 70vh;
  width: auto;
  height: auto;
  object-fit: contain;
  animation: ${slideIn} 0.2s ease-out;
`;

const LightboxHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CloseButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 6px 10px;
  background: var(--color-surface-2);
  color: var(--color-text);
  cursor: pointer;
  font-weight: 600;
`;

const ContentLayout = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const PriceBadge = styled.div`
  padding: 8px 14px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-text);
  box-shadow: var(--shadow-soft);
`;

const FeatureRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  padding: 12px 0;
  border-top: 1px solid var(--color-outline);
  border-bottom: 1px solid var(--color-outline);
  color: var(--color-muted);
  font-size: 0.9rem;
`;

const FeatureItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;

  svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
  }
`;

const SectionBlock = styled.div`
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
`;

const MetaText = styled.p`
  margin: 0;
  color: var(--color-muted);
`;

const MapLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-weight: 600;
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--color-text) 40%, transparent);
`;

const ContactCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  padding: 18px 20px;
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ContactTitle = styled.div`
  font-weight: 700;
  font-size: 1.1rem;
`;

const TrustPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
`;

const ContactRow = styled.div`
  display: grid;
  gap: 6px;
  color: var(--color-muted);
  font-size: 0.9rem;

  a {
    color: var(--color-text);
    font-weight: 600;
  }
`;

const AgencyCard = styled(Link)`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  padding: 14px 16px;
  background: var(--color-surface-2);
  display: grid;
  gap: 6px;
  color: inherit;
`;

const ManagedAgencyCard = styled.div`
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  padding: 14px 16px;
  background: var(--color-surface-2);
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
`;

const ManagedAgencyLogo = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  overflow: hidden;
  display: grid;
  place-items: center;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  svg {
    width: 24px;
    height: 24px;
    color: var(--color-muted);
  }
`;

const ManagedAgencyInfo = styled.div`
  display: grid;
  gap: 4px;
`;

const ContactButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: var(--gradient);
  color: #fff;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: var(--frame-shadow);
  cursor: pointer;
`;

const SaveButton = styled.button<{ $active?: boolean }>`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: ${(props) =>
    props.$active
      ? "color-mix(in srgb, var(--color-success) 18%, transparent)"
      : "transparent"};
  color: ${(props) => (props.$active ? "var(--color-success)" : "var(--color-text)")};
  font-weight: 600;
  cursor: pointer;
`;

const SecondaryButton = styled.a<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: ${(props) =>
    props.$active
      ? "color-mix(in srgb, var(--color-primary) 18%, transparent)"
      : "transparent"};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  font-weight: 600;
  border: 1px solid
    ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-outline)")};
  cursor: pointer;
`;

const ContactChoice = styled.button`
  width: 100%;
  border: 1px solid var(--color-outline);
  border-radius: 14px;
  padding: 14px 16px;
  background: var(--color-surface);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  font-weight: 600;
`;

const ReportButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: transparent;
  color: var(--color-muted);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 36, 0.55);
  display: grid;
  place-items: center;
  z-index: 80;
  padding: 16px;
`;

const ModalCard = styled.div`
  width: min(520px, 100%);
  background: var(--color-surface-2);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  padding: 18px;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 12px;
`;

const FloatingField = styled.label<{ $filled: boolean }>`
  position: relative;
  display: grid;
  gap: 6px;

  &[data-filled="true"] .floating-label,
  &:focus-within .floating-label {
    transform: translateY(-22px) scale(0.85);
    color: var(--color-primary);
  }
`;

const FloatingLabel = styled.span`
  position: absolute;
  left: 12px;
  top: 50%;
  font-size: 0.75rem;
  color: color-mix(in srgb, var(--color-text) 72%, transparent);
  background: var(--color-surface-2);
  padding: 0 4px;
  transition: transform 0.15s ease, color 0.15s ease;
  transform: translateY(-50%);
  transform-origin: left center;
`;

const SelectValue = styled.span<{ $muted?: boolean }>`
  color: ${(props) => (props.$muted ? "var(--color-muted)" : "var(--color-text)")};
  font-size: 0.95rem;
  line-height: 1.2;
`;

const DateTrigger = styled.button`
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  padding: 12px 12px 0;
  background: var(--color-surface-2);
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

const CalendarOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 36, 0.4);
  display: grid;
  place-items: center;
  z-index: 90;
  padding: 16px;
`;

const CalendarCard = styled.div`
  width: min(420px, 100%);
  background: var(--color-surface-2);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  box-shadow: var(--shadow-soft);
  padding: 16px;
  display: grid;
  gap: 12px;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
`;

const CalendarNav = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 6px 10px;
  background: var(--color-surface);
  cursor: pointer;
  color: var(--color-text);
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
`;

const CalendarDay = styled.button<{ $muted?: boolean; $active?: boolean }>`
  border: 1px solid var(--color-outline);
  border-radius: 10px;
  padding: 8px 0;
  background: ${(props) =>
    props.$active
      ? "color-mix(in srgb, var(--color-primary) 18%, transparent)"
      : "transparent"};
  color: ${(props) =>
    props.$active
      ? "var(--color-primary)"
      : props.$muted
      ? "var(--color-muted)"
      : "var(--color-text)"};
  cursor: pointer;
  font-weight: 600;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const SubmitButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: var(--gradient);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

const ErrorText = styled.p`
  margin: 0;
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 600;
`;

const SuccessCard = styled.div`
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
  padding: 12px;
  display: grid;
  gap: 6px;
`;

const BenefitCard = styled.div`
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 28%, transparent);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  padding: 12px;
  display: grid;
  gap: 6px;
`;

const BenefitList = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: var(--color-muted);
  display: grid;
  gap: 4px;
  font-size: 0.9rem;
`;

const formatLabel = (value?: string) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "";

const formatDealType = (value: string | undefined, t: (key: string) => string) => {
  if (!value) return "";
  const lowered = value.toLowerCase();
  if (lowered === "sale") return t("listing.forSale");
  if (lowered === "rent") return t("listing.forRent");
  return formatLabel(value);
};

const formatPropertyType = (value: string | undefined, t: (key: string) => string) => {
  return formatPropertyTypeValue(value, t) || formatLabel(value);
};

const getNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const formatDateLabel = (value: string | undefined, locale: string) => {
  if (!value) return "";
  const parsed = parseDate(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const parseDate = (value: string) => {
  const parts = value.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) return null;
  const [year, month, day] = parts;
  return new Date(year, month - 1, day);
};

const getCalendarDays = (monthDate: Date) => {
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
};

const toDateString = (value: Date) => {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function getViewingContactCacheKey(userId?: string | null) {
  return `ecm_viewing_contact_cache:${userId ?? "guest"}`;
}

const LISTING_COPY: Record<string, string> = {
  "calendar.sun": "Sun",
  "calendar.mon": "Mon",
  "calendar.tue": "Tue",
  "calendar.wed": "Wed",
  "calendar.thu": "Thu",
  "calendar.fri": "Fri",
  "calendar.sat": "Sat",
  "common.close": "Close",
  "common.next": "Next",
  "common.previous": "Previous",
  "common.signIn": "Sign in",
  "common.submitting": "Submitting...",
  "listing.areaSqft": "sq ft",
  "listing.bathrooms": "bathrooms",
  "listing.bedrooms": "bedrooms",
  "listing.completeRequired": "Complete the required fields before submitting your viewing request.",
  "listing.confirmByPhone": "We will confirm the appointment by phone.",
  "listing.contactAgent": "Contact agency",
  "listing.contactPrice": "Contact for price",
  "listing.contactSubtitle": "Reach out directly for this listing.",
  "listing.customer": "Customer",
  "listing.description": "Description",
  "listing.editRequest": "Edit request",
  "listing.forRent": "For rent",
  "listing.forSale": "For sale",
  "listing.fullName": "Full name",
  "listing.goToPhoto": "Go to photo",
  "listing.hotline": "Hotline",
  "listing.loadingProperty": "Loading property...",
  "listing.location": "Location",
  "listing.locationDetailsSoon": "More location details coming soon.",
  "listing.locationTbd": "Location to be confirmed",
  "listing.nextPhoto": "Next photo",
  "listing.noDescription": "No description has been added yet.",
  "listing.noNotes": "No notes added.",
  "listing.noPhotoAvailable": "No photo available",
  "listing.notFound": "Property not found.",
  "listing.notes": "Notes",
  "listing.notesOptional": "Notes (optional)",
  "listing.openMaps": "Open in Maps",
  "listing.phoneNumber": "Phone number",
  "listing.phoneRequired": "Phone number is required to request a viewing.",
  "listing.photoLabel": "Photo",
  "listing.preferredDate": "Preferred date",
  "listing.previousPhoto": "Previous photo",
  "listing.property": "Property",
  "listing.requestSent": "Viewing request sent.",
  "listing.requestViewing": "Request viewing",
  "listing.saveCompare": "Save and compare listings later.",
  "listing.saveProperty": "Save property",
  "listing.saved": "Saved",
  "listing.signInToTrack": "Sign in to save and track this request",
  "listing.submitRequest": "Submit request",
  "listing.timeWindow": "Time window",
  "listing.timeWindow.afternoon": "12 PM - 3 PM",
  "listing.timeWindow.evening": "3 PM - 6 PM",
  "listing.timeWindow.morning": "9 AM - 12 PM",
  "listing.timeWindow.night": "6 PM - 9 PM",
  "listing.unableSubmitRequest": "Unable to submit your viewing request right now.",
  "listing.verifiedAgent": "Verified agency",
  "listing.viewStatus": "View request status and updates.",
  "listing.viewingRequest": "Viewing request",
  "listing.viewingRequested": "Viewing requested",
};


type DateTimePickerProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  locale: string;
  dayLabels: string[];
  prevLabel: string;
  nextLabel: string;
};

function DateTimePicker({
  label,
  name,
  value,
  onChange,
  locale,
  dayLabels,
  prevLabel,
  nextLabel,
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDate(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate ?? new Date());
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const monthLabel = currentMonth.toLocaleDateString(locale, {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <FloatingField $filled={Boolean(value)} data-filled={Boolean(value)}>
        <FloatingLabel className="floating-label">{label}</FloatingLabel>
        <DateTrigger
          type="button"
          name={name}
          onClick={() => {
            setCurrentMonth(selectedDate ?? new Date());
            setOpen(true);
          }}
        >
          <SelectValue $muted={!value}>{formatDateLabel(value, locale)}</SelectValue>
        </DateTrigger>
      </FloatingField>
      {open && (
        <CalendarOverlay onClick={() => setOpen(false)}>
          <CalendarCard onClick={(event) => event.stopPropagation()}>
            <CalendarHeader>
              <CalendarNav
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                  )
                }
              >
                {prevLabel}
              </CalendarNav>
              <strong>{monthLabel}</strong>
              <CalendarNav
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                  )
                }
              >
                {nextLabel}
              </CalendarNav>
            </CalendarHeader>
            <CalendarGrid>
              {dayLabels.map((day) => (
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
                  <CalendarDay
                    key={key}
                    type="button"
                    $muted={!item.inMonth}
                    $active={active}
                    onClick={() => {
                      onChange(key);
                      setOpen(false);
                    }}
                  >
                    {item.date.getDate()}
                  </CalendarDay>
                );
              })}
            </CalendarGrid>
          </CalendarCard>
        </CalendarOverlay>
      )}
    </>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, authToken, profileRole } = useAppState();
  const { t, language } = useI18n();
  const propertyId = params?.propertyId as string | undefined;
  const { detail, loading } = useListingDetail(propertyId);
  const [viewingOpen, setViewingOpen] = useState(false);
  const [viewingName, setViewingName] = useState("");
  const [viewingPhone, setViewingPhone] = useState("");
  const [viewingNameTouched, setViewingNameTouched] = useState(false);
  const [viewingPhoneTouched, setViewingPhoneTouched] = useState(false);
  const [viewingContactPrefilled, setViewingContactPrefilled] = useState(false);
  const [viewingDate, setViewingDate] = useState("");
  const [viewingWindow, setViewingWindow] = useState("");
  const [viewingNotes, setViewingNotes] = useState("");
  const [viewingSubmitting, setViewingSubmitting] = useState(false);
  const [viewingError, setViewingError] = useState<string | null>(null);
  const [viewingSuccess, setViewingSuccess] = useState(false);
  const [viewingInfoOpen, setViewingInfoOpen] = useState(false);
  const [existingViewingRequest, setExistingViewingRequest] = useState<Record<string, unknown> | null>(
    null
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveSubmitting, setSaveSubmitting] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactCopied, setContactCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [currentVendorId, setCurrentVendorId] = useState<string | null>(null);
  const metadataFullName =
    typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const metadataName =
    typeof user?.user_metadata?.name === "string" ? user.user_metadata.name.trim() : "";
  const locale =
    language === "mm" ? "my-MM" : language === "zh" ? "zh-CN" : language === "th" ? "th-TH" : "en-US";
  const timeWindowOptions = [
    { value: "9-12", label: t("listing.timeWindow.morning") },
    { value: "12-3", label: t("listing.timeWindow.afternoon") },
    { value: "3-6", label: t("listing.timeWindow.evening") },
    { value: "6-9", label: t("listing.timeWindow.night") },
  ];
  const dayLabels = [
    t("calendar.sun"),
    t("calendar.mon"),
    t("calendar.tue"),
    t("calendar.wed"),
    t("calendar.thu"),
    t("calendar.fri"),
    t("calendar.sat"),
  ];
  const viewingWindowLabel =
    timeWindowOptions.find((option) => option.value === viewingWindow)?.label || viewingWindow;

  useEffect(() => {
    if (!user?.id || !propertyId) return;
    isPropertySaved(user.id, propertyId).then((result) => {
      setSaved(result);
    });
  }, [propertyId, user?.id]);

  useEffect(() => {
    if (!user?.id || !propertyId) return;
    getViewingRequestForUserProperty(user.id, propertyId).then(({ request }) => {
      setExistingViewingRequest(request);
      if (request) {
        const date = String(request.preferred_date ?? "");
        const timeWindow = String(request.preferred_time_window ?? "");
        const notes = String(request.notes ?? "");
        if (!viewingDate) setViewingDate(date);
        if (!viewingWindow) setViewingWindow(timeWindow);
        if (!viewingNotes) setViewingNotes(notes);
      }
    });
  }, [propertyId, user?.id, viewingDate, viewingNotes, viewingWindow]);

  useEffect(() => {
    if (!authToken || profileRole !== "vendor_user") {
      setCurrentVendorId(null);
      return;
    }

    let active = true;
    fetch("/api/vendor/workspace", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json().catch(() => null)) as
          | { vendor?: { id?: string | null } | null }
          | null;
      })
      .then((payload) => {
        if (!active) return;
        const vendorId =
          payload?.vendor && typeof payload.vendor.id === "string" ? payload.vendor.id : null;
        setCurrentVendorId(vendorId);
      })
      .catch(() => {
        if (active) {
          setCurrentVendorId(null);
        }
      });

    return () => {
      active = false;
    };
  }, [authToken, profileRole]);

  useEffect(() => {
    if (!viewingOpen || !user?.id) return;
    if (viewingContactPrefilled) return;
    const currentName = viewingName.trim();
    const currentPhone = viewingPhone.trim();
    const cacheKey = getViewingContactCacheKey(user.id);

    if (!currentName && !viewingNameTouched) {
      const resolvedMetadataName = metadataFullName || metadataName;
      if (resolvedMetadataName) {
        setViewingName(resolvedMetadataName);
      }
    }

    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { name?: string; phone?: string } | null;
        if (!currentName && !viewingNameTouched && typeof parsed?.name === "string" && parsed.name.trim()) {
          setViewingName(parsed.name.trim());
        }
        if (!currentPhone && !viewingPhoneTouched && typeof parsed?.phone === "string" && parsed.phone.trim()) {
          setViewingPhone(parsed.phone.trim());
        }
      }
    } catch {
      // Ignore broken local cache and continue with profile fetch.
    }

    const nextName =
      currentName ||
      metadataFullName ||
      metadataName;
    const nextPhone = currentPhone;

    if (nextName && nextPhone) {
      setViewingContactPrefilled(true);
      return;
    }

    let active = true;
    getCustomerProfile(user.id)
      .then(({ profile }) => {
        if (!active || !profile) return;
        const resolvedName = !nextName && profile.name ? profile.name.trim() : nextName;
        const resolvedPhone = !nextPhone && profile.contact_number ? profile.contact_number.trim() : nextPhone;

        if (!currentName && !viewingNameTouched && profile.name) {
          setViewingName(profile.name);
        }
        if (!currentPhone && !viewingPhoneTouched && profile.contact_number) {
          setViewingPhone(profile.contact_number);
        }
        try {
          window.localStorage.setItem(
            cacheKey,
            JSON.stringify({
              name: resolvedName || "",
              phone: resolvedPhone || "",
            })
          );
        } catch {
          // Ignore localStorage write failures.
        }
      })
      .finally(() => {
        if (!active) return;
        setViewingContactPrefilled(true);
      });

    return () => {
      active = false;
    };
  }, [
    metadataFullName,
    metadataName,
    user?.id,
    viewingContactPrefilled,
    viewingName,
    viewingNameTouched,
    viewingOpen,
    viewingPhone,
    viewingPhoneTouched,
  ]);

  useEffect(() => {
    if (viewingOpen) return;
    setViewingContactPrefilled(false);
    setViewingNameTouched(false);
    setViewingPhoneTouched(false);
  }, [viewingOpen]);

  useEffect(() => {
    if (!viewingOpen) return;
    const cacheKey = getViewingContactCacheKey(user?.id);
    try {
      window.localStorage.setItem(
        cacheKey,
        JSON.stringify({
          name: viewingName.trim(),
          phone: viewingPhone.trim(),
        })
      );
    } catch {
      // Ignore localStorage write failures.
    }
  }, [viewingName, viewingOpen, viewingPhone]);

  const galleryUrls = useMemo(() => {
    const images = detail?.images ?? [];
    const sorted = [...images].sort((a, b) => {
      const aCover = a.is_cover === true ? 1 : 0;
      const bCover = b.is_cover === true ? 1 : 0;
      if (aCover !== bCover) return bCover - aCover;
      const aOrder = typeof a.sort_order === "number" ? a.sort_order : 9999;
      const bOrder = typeof b.sort_order === "number" ? b.sort_order : 9999;
      return aOrder - bOrder;
    });
    return sorted
      .map((photo) => resolvePhotoUrl(photo))
      .filter((url): url is string => Boolean(url));
  }, [detail?.images]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [galleryUrls.length]);

  useEffect(() => {
    if (!propertyId || !detail) return;

    const storageKey = "ecm_listing_view_session_id";
    let sessionId = "";
    try {
      sessionId = window.localStorage.getItem(storageKey) || "";
      if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        window.localStorage.setItem(storageKey, sessionId);
      }
    } catch {
      sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    void fetch(`/api/public/listings/${propertyId}/view`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source: "listing_detail",
        sessionId,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, [authToken, detail, propertyId]);

  if (!propertyId || loading) {
    return (
      <div>
        <MarketplaceHeader />
        <DetailSkeleton aria-hidden="true">
          <SkeletonHeader>
            <SkeletonBlock $height={18} $radius={999} $width="132px" />
            <SkeletonBlock $height={34} $width="42%" />
            <SkeletonBlock $height={18} $width="58%" />
            <SkeletonTagRow>
              <SkeletonBlock $height={30} $radius={999} $width="84px" />
              <SkeletonBlock $height={30} $radius={999} $width="98px" />
              <SkeletonBlock $height={30} $radius={999} $width="110px" />
            </SkeletonTagRow>
          </SkeletonHeader>
          <SkeletonBlock $height={460} $radius={18} />
          <SkeletonFeatureGrid>
            <SkeletonBlock $height={88} $radius={18} />
            <SkeletonBlock $height={88} $radius={18} />
            <SkeletonBlock $height={88} $radius={18} />
          </SkeletonFeatureGrid>
          <SkeletonTwoColumn>
            <SkeletonBlock $height={220} $radius={18} />
            <SkeletonBlock $height={220} $radius={18} />
          </SkeletonTwoColumn>
        </DetailSkeleton>
      </div>
    );
  }

  if (!detail) {
    return (
      <div>
        <MarketplaceHeader />
        <PageShell>{t("listing.notFound")}</PageShell>
      </div>
    );
  }

  const { property } = detail;
  const agency = (detail.agency ?? null) as Record<string, unknown> | null;
  const title = (property.title as string) || t("listing.property");
  const description = (property.description as string) || "";
  const price = property.price as number | undefined;
  const currency = (property.currency as string) || "MMK";
  const dealType = formatDealType(property.deal_type as string, t);
  const propertyType = formatPropertyType(property.property_type as string, t);
  const propertyTypeRaw = String(property.property_type ?? "").toLowerCase();
  const locationPartValues = [
    property.township,
    property.district,
    property.state_region,
  ].filter((part): part is string => typeof part === "string" && part.trim().length > 0);
  const locationParts = locationPartValues.join(", ");
  const localizedLocationParts = locationPartValues
    .map((part) => translateLocationName(part, language))
    .join(", ");
  const addressText = (property.address_text as string) || "";
  const city = (property.city as string) || "";
  const localizedCity = city ? translateLocationName(city, language) : "";
  const latitude =
    getNumber(property.latitude) ??
    getNumber(property.lat) ??
    getNumber(property.map_latitude);
  const longitude =
    getNumber(property.longitude) ??
    getNumber(property.lng) ??
    getNumber(property.map_longitude);
  const mapsUrl =
    latitude !== undefined && longitude !== undefined
      ? `https://maps.google.com/?q=${latitude},${longitude}`
      : null;
  const bedrooms = property.bedrooms as number | undefined;
  const bathrooms = property.bathrooms as number | undefined;
  const areaSqft = property.area_sqft as number | undefined;
  const formattedArea =
    typeof areaSqft === "number"
      ? new Intl.NumberFormat(locale).format(areaSqft)
      : undefined;
  const propertyVerificationStatus = typeof property.verification_status === "string" ? property.verification_status : null;
  const agencyVerificationStatus = agency && typeof agency.verification_status === "string" ? agency.verification_status : null;
  const agencyId = agency && typeof agency.id === "string" ? agency.id : null;
  const agencySlug = agency && typeof agency.slug === "string" ? agency.slug : null;
  const agencyName = agency && typeof agency.name === "string" ? agency.name : null;
  const agencyTagline = agency && typeof agency.tagline === "string" ? agency.tagline : null;
  const agencyPhone = agency && typeof agency.contact_phone === "string" ? agency.contact_phone : null;
  const agencyLogo = agency && typeof agency.logo_url === "string" ? agency.logo_url : null;
  const ownerName = typeof property.owner_name === "string" ? property.owner_name : null;
  const ownerPhone = typeof property.owner_phone === "string" ? property.owner_phone : null;
  const createdBy = typeof property.created_by === "string" ? property.created_by : null;
  const isAgencyListing = Boolean(agencyId || agencySlug || agencyPhone || agencyName);
  const isOwnAgencyListing = Boolean(isAgencyListing && agencyId && currentVendorId && agencyId === currentVendorId);
  const isOwnDirectListing = Boolean(!isAgencyListing && user?.id && createdBy && user.id === createdBy);
  const isOwnListing = isOwnAgencyListing || isOwnDirectListing;
  const primaryContact = agencyPhone || ownerPhone || EAIN_CONTACT_PHONE;
  const contactName = agencyName || ownerName || "Eain Chan Myay Advisory";
  const canRequestViewing = isAgencyListing && !isOwnListing;
  const showVerifiedListing = propertyVerificationStatus === "approved";
  const showVerifiedAgency = !showVerifiedListing && agencyVerificationStatus === "approved";
  const showBeds = isBedBathPropertyType(propertyTypeRaw) && bedrooms !== undefined;
  const showBaths = isBedBathPropertyType(propertyTypeRaw) && bathrooms !== undefined;
  const reportReasonOptions = [
    { value: "spam", label: t("listing.reportReason.spam") },
    { value: "inappropriate", label: t("listing.reportReason.inappropriate") },
    { value: "illegal", label: t("listing.reportReason.illegal") },
    { value: "duplicate", label: t("listing.reportReason.duplicate") },
    { value: "other", label: t("listing.reportReason.other") },
  ];
  const featureItems: Array<{ key: string; label: string; icon: React.ElementType }> = [];
  if (showBeds) {
    featureItems.push({ key: "beds", label: `${bedrooms} ${t("listing.bedrooms")}`, icon: BedDouble });
  }
  if (showBaths) {
    featureItems.push({ key: "baths", label: `${bathrooms} ${t("listing.bathrooms")}`, icon: Bath });
  }
  if (formattedArea) {
    featureItems.push({ key: "area", label: `${formattedArea} ${t("listing.areaSqft")}`, icon: Ruler });
  }
  if (!showBeds && !showBaths && dealType) {
    featureItems.push({ key: "deal", label: dealType, icon: Tag });
  }
  featureItems.push({ key: "type", label: propertyType || t("listing.property"), icon: Home });

  const handleViewingSubmit = async () => {
    if (!propertyId) return;
    const resolvedName = viewingName.trim() || user?.email || t("listing.customer");
    const resolvedPhone = viewingPhone.trim();
    if (!resolvedPhone || !viewingDate || !viewingWindow) {
      setViewingError(
        user
          ? t("listing.phoneRequired")
          : t("listing.completeRequired")
      );
      return;
    }
    setViewingError(null);
    setViewingSubmitting(true);
    const result = existingViewingRequest?.id
      ? await updateViewingRequest({
          id: String(existingViewingRequest.id),
          preferredDate: viewingDate,
          preferredTimeWindow: viewingWindow,
          notes: viewingNotes.trim() || undefined,
        })
      : await createViewingRequest({
          propertyId,
          userId: user?.id,
          name: resolvedName,
          phone: resolvedPhone,
          preferredDate: viewingDate,
          preferredTimeWindow: viewingWindow,
          notes: viewingNotes.trim() || undefined,
        });
    setViewingSubmitting(false);
    if (!result.ok) {
      setViewingError(result.message ?? t("listing.unableSubmitRequest"));
      return;
    }
    setViewingSuccess(true);
    if (!existingViewingRequest?.id && user?.id && propertyId) {
      getViewingRequestForUserProperty(user.id, propertyId).then(({ request }) => {
        setExistingViewingRequest(request);
      });
    }
  };

  const handleSave = async () => {
    if (!propertyId) return;
    if (!user) {
      if (typeof window !== "undefined") {
        const resumePayload = {
          propertyId,
          resumePath: `/listing/${propertyId}`,
        };
        window.localStorage.setItem(
          "kaiten_living_auth_resume",
          JSON.stringify(resumePayload)
        );
      }
      window.location.href = "/auth";
      return;
    }

    setSaveSubmitting(true);
    const result = await toggleSavedProperty({
      userId: user.id,
      propertyId,
      shouldSave: !saved,
    });
    setSaveSubmitting(false);
    if (result.ok) {
      setSaved((prev) => !prev);
    }
  };

  const handleCopyContact = async () => {
    try {
      await navigator.clipboard.writeText(primaryContact);
      setContactCopied(true);
    } catch {
      setContactCopied(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!propertyId) return;
    setReportError(null);
    setReportSubmitting(true);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    const response = await fetch("/api/public/listing-reports", {
      method: "POST",
      headers,
      body: JSON.stringify({
        propertyId,
        reason: reportReason,
        details: reportDetails.trim() || null,
      }),
    });
    setReportSubmitting(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setReportError(payload?.message ?? t("listing.unableSubmitReport"));
      return;
    }
    setReportSuccess(true);
  };

  return (
    <div>
      <MarketplaceHeader />
      <PageShell>
        <HeaderRow>
          <TitleBlock>
            <SectionTitle>{title}</SectionTitle>
            <Location>
              <MapPin size={16} />
              {localizedLocationParts || localizedCity || t("listing.locationTbd")}
            </Location>
            <TagRow>
              {dealType && <TagPill>{dealType}</TagPill>}
              {propertyType && <TagPill>{propertyType}</TagPill>}
            </TagRow>
          </TitleBlock>
          <PriceBadge>{formatCurrency(price, currency, t("listing.contactPrice"), language)}</PriceBadge>
        </HeaderRow>
        <Gallery>
          {galleryUrls.length ? (
            <>
              <CarouselShell>
                <CarouselViewport onClick={() => setLightboxOpen(true)}>
                  <CarouselImage
                    src={galleryUrls[activeImageIndex]}
                    alt={`${title} ${t("listing.photoLabel")} ${activeImageIndex + 1}`}
                  />
                </CarouselViewport>
                <PrevButton
                  type="button"
                  aria-label={t("listing.previousPhoto")}
                  onClick={() =>
                    setActiveImageIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={activeImageIndex === 0}
                >
                  <ChevronLeft size={18} />
                </PrevButton>
                <NextButton
                  type="button"
                  aria-label={t("listing.nextPhoto")}
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      Math.min(galleryUrls.length - 1, prev + 1)
                    )
                  }
                  disabled={activeImageIndex === galleryUrls.length - 1}
                >
                  <ChevronRight size={18} />
                </NextButton>
              </CarouselShell>
              {galleryUrls.length > 1 && (
                <DotRow>
                  {galleryUrls.map((_, index) => (
                    <Dot
                      key={`dot-${index}`}
                      type="button"
                      $active={index === activeImageIndex}
                      aria-label={`${t("listing.goToPhoto")} ${index + 1}`}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </DotRow>
              )}
            </>
          ) : (
            <ImagePlaceholder>{t("listing.noPhotoAvailable")}</ImagePlaceholder>
          )}
        </Gallery>
        {lightboxOpen && (
          <LightboxOverlay onClick={() => setLightboxOpen(false)}>
            <LightboxCard onClick={(event) => event.stopPropagation()}>
              <LightboxHeader>
                <strong>{title}</strong>
                <CloseButton type="button" onClick={() => setLightboxOpen(false)}>
                  {t("common.close")}
                </CloseButton>
              </LightboxHeader>
              <LightboxViewport>
                <LightboxNavButton
                  type="button"
                  aria-label={t("listing.previousPhoto")}
                  onClick={() =>
                    setActiveImageIndex((prev) => Math.max(0, prev - 1))
                  }
                  disabled={activeImageIndex === 0}
                >
                  <ChevronLeft size={18} />
                </LightboxNavButton>
                <LightboxImage
                  key={galleryUrls[activeImageIndex]}
                  src={galleryUrls[activeImageIndex]}
                  alt={`${title} ${t("listing.photoLabel")} ${activeImageIndex + 1}`}
                />
                <LightboxNavButton
                  type="button"
                  aria-label={t("listing.nextPhoto")}
                  onClick={() =>
                    setActiveImageIndex((prev) =>
                      Math.min(galleryUrls.length - 1, prev + 1)
                    )
                  }
                  disabled={activeImageIndex === galleryUrls.length - 1}
                >
                  <ChevronRight size={18} />
                </LightboxNavButton>
              </LightboxViewport>
              {galleryUrls.length > 1 && (
                <DotRow>
                  {galleryUrls.map((_, index) => (
                    <Dot
                      key={`lightbox-dot-${index}`}
                      type="button"
                      $active={index === activeImageIndex}
                      aria-label={`${t("listing.goToPhoto")} ${index + 1}`}
                      onClick={() => setActiveImageIndex(index)}
                    />
                  ))}
                </DotRow>
              )}
            </LightboxCard>
          </LightboxOverlay>
        )}
        <ContentLayout>
          <div>
            <FeatureRow>
              {featureItems.map((item) => (
                <FeatureItem key={item.key}>
                  <item.icon size={16} />
                  {item.label}
                </FeatureItem>
              ))}
            </FeatureRow>
            <SectionBlock>
              <SectionTitle>{t("listing.description")}</SectionTitle>
              {description ? <p>{description}</p> : <MetaText>{t("listing.noDescription")}</MetaText>}
            </SectionBlock>
            <SectionBlock>
              <SectionTitle>{t("listing.location")}</SectionTitle>
              <MetaText>{localizedLocationParts || localizedCity || t("listing.locationDetailsSoon")}</MetaText>
              {addressText && <MetaText>{addressText}</MetaText>}
              {localizedCity && !locationPartValues.includes(city) && <MetaText>{localizedCity}</MetaText>}
              {mapsUrl && (
                <MapLink href={mapsUrl} target="_blank" rel="noreferrer">
                  <MapPin size={16} />
                  {t("listing.openMaps")}
                </MapLink>
              )}
            </SectionBlock>
          </div>
          <ContactCard>
            <ContactTitle>
              {isOwnListing ? t("listing.manageYourListing") : isAgencyListing ? t("listing.contactAgent") : t("listing.contactSeller")}
            </ContactTitle>
            {showVerifiedListing ? <TrustPill>{t("listing.verifiedListing")}</TrustPill> : null}
            {showVerifiedAgency ? <TrustPill>{t("listing.verifiedAgent")}</TrustPill> : null}
            <ContactRow>
              <strong>{isOwnListing ? title : contactName}</strong>
              {isOwnListing ? (
                <span>
                  {isOwnAgencyListing
                    ? t("listing.ownAgencyListing")
                    : t("listing.ownDirectListing")}
                </span>
              ) : (
                <>
                  <span>{t("listing.contactSubtitle")}</span>
                  <span>
                    {t("listing.hotline")}: <a href={`tel:${primaryContact}`}>{primaryContact}</a>
                  </span>
                </>
              )}
            </ContactRow>
            {isOwnAgencyListing ? (
              <ManagedAgencyCard>
                <ManagedAgencyLogo>
                  {agencyLogo ? <img src={agencyLogo} alt={agencyName || t("agency.label")} /> : <Home size={24} />}
                </ManagedAgencyLogo>
                <ManagedAgencyInfo>
                  <strong>{agencyName || t("listing.yourAgency")}</strong>
                  <span>{agencyTagline || t("listing.manageAgencyListing")}</span>
                </ManagedAgencyInfo>
              </ManagedAgencyCard>
            ) : null}
            {!isOwnListing && agencySlug ? (
              <AgencyCard href={`/agency/${agencySlug}`}>
                <strong>{agencyName || t("listing.agencyProfile")}</strong>
                <span>{agencyTagline || t("listing.browseAgencyStorefront")}</span>
              </AgencyCard>
            ) : null}
            {isOwnListing ? (
              <SecondaryButton
                as="button"
                type="button"
                onClick={() => router.push("/hub?section=manage-listings")}
              >
                {t("listing.manageYourListing")}
              </SecondaryButton>
            ) : (
              <>
                <ContactButton
                  type="button"
                  onClick={() => {
                    setContactCopied(false);
                    setContactOpen(true);
                  }}
                >
                  <Phone size={16} style={{ marginRight: 6 }} />
                  {isAgencyListing ? t("listing.contactAgent") : t("listing.contactSeller")}
                </ContactButton>
                <SaveButton type="button" onClick={handleSave} disabled={saveSubmitting} $active={saved}>
                  {saved ? t("listing.saved") : t("listing.saveProperty")}
                </SaveButton>
                {canRequestViewing ? (
                  <SecondaryButton
                    as="button"
                    type="button"
                    onClick={() => {
                      if (existingViewingRequest) {
                        setViewingInfoOpen(true);
                      } else {
                        setViewingOpen(true);
                        setViewingSuccess(false);
                        setViewingError(null);
                      }
                    }}
                    $active={Boolean(existingViewingRequest)}
                  >
                    {existingViewingRequest ? t("listing.viewingRequested") : t("listing.requestViewing")}
                  </SecondaryButton>
                ) : null}
                <ReportButton
                  type="button"
                  onClick={() => {
                    setReportError(null);
                    setReportSuccess(false);
                    setReportDetails("");
                    setReportReason("spam");
                    setReportOpen(true);
                  }}
                >
                  <Flag size={16} />
                  {t("listing.reportListing")}
                </ReportButton>
              </>
            )}
          </ContactCard>
        </ContentLayout>
      </PageShell>
      {viewingInfoOpen && (
        <ModalOverlay onClick={() => setViewingInfoOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <SectionTitle>{t("listing.viewingRequest")}</SectionTitle>
            <strong>{title}</strong>
            <MetaText>
              {t("listing.preferredDate")}: <strong>{formatDateLabel(viewingDate, locale)}</strong>
            </MetaText>
            {viewingWindow && (
              <MetaText>
                {t("listing.timeWindow")}: <strong>{viewingWindowLabel}</strong>
              </MetaText>
            )}
            {viewingNotes ? (
              <MetaText>{t("listing.notes")}: {viewingNotes}</MetaText>
            ) : (
              <MetaText>{t("listing.noNotes")}</MetaText>
            )}
            <ModalActions>
              <GhostButton type="button" onClick={() => setViewingInfoOpen(false)}>
                {t("common.close")}
              </GhostButton>
              <SubmitButton
                type="button"
                onClick={() => {
                  setViewingInfoOpen(false);
                  setViewingOpen(true);
                  setViewingSuccess(false);
                  setViewingError(null);
                }}
              >
                {t("listing.editRequest")}
              </SubmitButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
      {contactOpen && (
        <ModalOverlay onClick={() => setContactOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <SectionTitle>{t("listing.contactAgent")}</SectionTitle>
            <strong>{contactName}</strong>
            <MetaText>{primaryContact}</MetaText>
            {contactCopied ? <SuccessCard><strong>{t("listing.numberCopied")}</strong></SuccessCard> : null}
            <ContactChoice
              type="button"
              onClick={() => {
                window.location.href = `tel:${primaryContact}`;
              }}
            >
              <span>{t("listing.callNow")}</span>
              <Phone size={18} />
            </ContactChoice>
            <ContactChoice type="button" onClick={() => void handleCopyContact()}>
              <span>{t("listing.copyNumber")}</span>
              <Tag size={18} />
            </ContactChoice>
            <ModalActions>
              <GhostButton type="button" onClick={() => setContactOpen(false)}>
                {t("common.close")}
              </GhostButton>
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
      {viewingOpen && (
        <ModalOverlay onClick={() => setViewingOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <SectionTitle>{t("listing.requestViewing")}</SectionTitle>
            {viewingSuccess ? null : (
              <>
                <strong>{title}</strong>
                <CustomInput
                  id="viewing-name"
                  label={t("listing.fullName")}
                  name="name"
                  value={viewingName}
                  onChange={(event) => {
                    setViewingNameTouched(true);
                    setViewingName(event.target.value);
                  }}
                />
                <CustomInput
                  id="viewing-phone"
                  label={t("listing.phoneNumber")}
                  name="phone"
                  value={viewingPhone}
                  onChange={(event) => {
                    setViewingPhoneTouched(true);
                    setViewingPhone(event.target.value);
                  }}
                />
                <DateTimePicker
                  label={t("listing.preferredDate")}
                  name="preferred_date"
                  value={viewingDate}
                  onChange={setViewingDate}
                  locale={locale}
                  dayLabels={dayLabels}
                  prevLabel={t("common.previous")}
                  nextLabel={t("common.next")}
                />
                <CustomSelect
                  id="viewing-window"
                  label={t("listing.timeWindow")}
                  name="preferred_time_window"
                  value={viewingWindow}
                  onChange={(value) => setViewingWindow(value)}
                >
                  {timeWindowOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CustomSelect>
                <CustomTextarea
                  id="viewing-notes"
                  label={t("listing.notesOptional")}
                  name="notes"
                  value={viewingNotes}
                  onChange={(event) => setViewingNotes(event.target.value)}
                />
              </>
            )}
            {!user && !viewingSuccess && (
              <BenefitCard>
                <strong>{t("listing.signInToTrack")}</strong>
                <BenefitList>
                  <li>{t("listing.saveCompare")}</li>
                  <li>{t("listing.viewStatus")}</li>
                </BenefitList>
                <ModalActions>
                  <GhostButton
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem(
                          "kaiten_living_auth_resume",
                          JSON.stringify({ resumePath: `/listing/${propertyId}` })
                        );
                      }
                      window.location.href = "/auth";
                    }}
                  >
                    {t("common.signIn")}
                  </GhostButton>
                </ModalActions>
              </BenefitCard>
            )}
            {viewingError && <ErrorText>{viewingError}</ErrorText>}
            {viewingSuccess && (
              <SuccessCard>
                <strong>{t("listing.requestSent")}</strong>
                <p>{t("listing.confirmByPhone")}</p>
              </SuccessCard>
            )}
            <ModalActions>
              <GhostButton type="button" onClick={() => setViewingOpen(false)}>
                {t("common.close")}
              </GhostButton>
              {!viewingSuccess && (
                <SubmitButton
                  type="button"
                  onClick={handleViewingSubmit}
                  disabled={viewingSubmitting}
                >
                  {viewingSubmitting ? t("common.submitting") : t("listing.submitRequest")}
                </SubmitButton>
              )}
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
      {reportOpen && (
        <ModalOverlay onClick={() => setReportOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <SectionTitle>{t("listing.reportListing")}</SectionTitle>
            {reportSuccess ? (
              <SuccessCard>
                <strong>{t("listing.reportThanks")}</strong>
                <p>{t("listing.reportReview")}</p>
              </SuccessCard>
            ) : (
              <>
                <CustomSelect
                  id="report-reason"
                  label={t("listing.reportReason")}
                  name="reason"
                  value={reportReason}
                  onChange={setReportReason}
                >
                  {reportReasonOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CustomSelect>
                <CustomTextarea
                  id="report-details"
                  label={t("listing.reportDetails")}
                  name="details"
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                />
                {reportError ? <ErrorText>{reportError}</ErrorText> : null}
              </>
            )}
            <ModalActions>
              <GhostButton type="button" onClick={() => setReportOpen(false)}>
                {reportSuccess ? t("common.close") : t("listing.cancel")}
              </GhostButton>
              {!reportSuccess ? (
                <SubmitButton type="button" onClick={handleReportSubmit} disabled={reportSubmitting}>
                  {reportSubmitting ? t("common.submitting") : t("listing.submitReport")}
                </SubmitButton>
              ) : null}
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
    </div>
  );
}
