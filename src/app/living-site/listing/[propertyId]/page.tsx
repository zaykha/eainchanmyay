"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Bath, BedDouble, Home, MapPin, Phone, Ruler } from "lucide-react";
import styled from "styled-components";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { SectionTitle } from "@/app/living-site/components/PageSection";
import { useListingDetail } from "@/app/living-site/hooks/useListingDetail";
import { createViewingRequest } from "@/app/living-site/lib/data";
import { resolvePhotoUrl } from "@/app/living-site/lib/images";
import { formatCurrency } from "@/app/living-site/lib/format";
import { EAIN_CONTACT_PHONE } from "@/app/living-site/lib/constants";

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

const Tag = styled.span`
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
  grid-template-columns: 2fr 1fr;
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const GalleryMain = styled.div`
  min-height: 240px;
`;

const GalleryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 16px;
  border: 1px solid var(--color-outline);
  box-shadow: var(--shadow-soft);
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

const ContentLayout = styled.div`
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const PriceLine = styled.div`
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-text);
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

const ContactButton = styled.a`
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

const SecondaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-weight: 600;
  border: 1px solid var(--color-outline);
  cursor: pointer;
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
  background: var(--color-surface);
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
  color: var(--color-muted);
  background: var(--color-surface);
  padding: 0 4px;
  transition: transform 0.15s ease, color 0.15s ease;
  transform: translateY(-50%);
  transform-origin: left center;
`;

const FloatingInput = styled.input`
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  padding: 0 12px;
  background: var(--color-surface);
  color: var(--color-text);
  height: 50px;
  font-size: 0.95rem;
  line-height: 1.2;
  outline: none;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 25%, transparent);
  }
`;

const FloatingTextarea = styled.textarea`
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  padding: 16px 12px;
  background: var(--color-surface);
  color: var(--color-text);
  min-height: 100px;
  resize: none;
  font-size: 0.95rem;
  line-height: 1.4;
  outline: none;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 25%, transparent);
  }
`;

const SelectShell = styled.div`
  position: relative;
`;

const SelectTrigger = styled.button`
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  padding: 0 12px;
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

const SelectValue = styled.span<{ $muted?: boolean }>`
  color: ${(props) => (props.$muted ? "var(--color-muted)" : "var(--color-text)")};
  font-size: 0.95rem;
  line-height: 1.2;
`;

const SelectMenu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: 12px;
  box-shadow: var(--shadow-soft);
  z-index: 10;
  padding: 6px;
  display: grid;
  gap: 4px;
`;

const SelectOption = styled.button<{ $active?: boolean }>`
  border: none;
  background: ${(props) =>
    props.$active
      ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
      : "transparent"};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  padding: 10px 12px;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  font-weight: 600;
`;

const DateTrigger = styled.button`
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  padding: 0 12px;
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
  background: var(--color-surface);
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
  color: #dc2626;
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

const formatLabel = (value?: string) =>
  value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "";

const formatDealType = (value?: string) => {
  if (!value) return "";
  const lowered = value.toLowerCase();
  if (lowered === "sale") return "For sale";
  if (lowered === "rent") return "For rent";
  return formatLabel(value);
};

const formatPropertyType = (value?: string) => {
  if (!value) return "";
  const lowered = value.toLowerCase();
  if (lowered === "house_land") return "House + Land";
  return formatLabel(value);
};

const formatDateLabel = (value?: string) => {
  if (!value) return "";
  const parsed = parseDate(value);
  if (!parsed) return "";
  return parsed.toLocaleDateString("en-US", {
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

type FloatingInputProps = {
  label: string;
  name: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
};

function Input({ label, name, value, type = "text", onChange }: FloatingInputProps) {
  return (
    <FloatingField $filled={Boolean(value)} data-filled={Boolean(value)}>
      <FloatingLabel className="floating-label">{label}</FloatingLabel>
      <FloatingInput
        type={type}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FloatingField>
  );
}

type FloatingTextareaProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
};

function Textarea({ label, name, value, onChange }: FloatingTextareaProps) {
  return (
    <FloatingField $filled={Boolean(value)} data-filled={Boolean(value)}>
      <FloatingLabel className="floating-label">{label}</FloatingLabel>
      <FloatingTextarea
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </FloatingField>
  );
}

type SelectOptionItem = {
  value: string;
  label: string;
};

type SelectProps = {
  label: string;
  name: string;
  value: string;
  options: SelectOptionItem[];
  onChange: (value: string) => void;
};

function Select({ label, name, value, options, onChange }: SelectProps) {
  const [open, setOpen] = useState(false);
  const activeOption = options.find((option) => option.value === value);

  return (
    <FloatingField
      $filled={Boolean(value)}
      data-filled={Boolean(value)}
      onBlur={() => {
        setTimeout(() => setOpen(false), 100);
      }}
    >
      <FloatingLabel className="floating-label">{label}</FloatingLabel>
      <SelectShell>
        <SelectTrigger
          type="button"
          name={name}
          onClick={() => setOpen((prev) => !prev)}
        >
          <SelectValue $muted={!activeOption}>
            {activeOption?.label ?? "Select an option"}
          </SelectValue>
        </SelectTrigger>
        {open && (
          <SelectMenu>
            {options.map((option) => (
              <SelectOption
                key={option.value}
                type="button"
                $active={option.value === value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </SelectOption>
            ))}
          </SelectMenu>
        )}
      </SelectShell>
    </FloatingField>
  );
}

type DateTimePickerProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
};

function DateTimePicker({ label, name, value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseDate(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate ?? new Date());
  const days = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);
  const monthLabel = currentMonth.toLocaleDateString("en-US", {
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
          <SelectValue $muted={!value}>{formatDateLabel(value)}</SelectValue>
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
                Prev
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
                Next
              </CalendarNav>
            </CalendarHeader>
            <CalendarGrid>
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
  const propertyId = params?.propertyId as string | undefined;
  const { detail, loading } = useListingDetail(propertyId);
  const [viewingOpen, setViewingOpen] = useState(false);
  const [viewingName, setViewingName] = useState("");
  const [viewingPhone, setViewingPhone] = useState("");
  const [viewingDate, setViewingDate] = useState("");
  const [viewingWindow, setViewingWindow] = useState("");
  const [viewingNotes, setViewingNotes] = useState("");
  const [viewingSubmitting, setViewingSubmitting] = useState(false);
  const [viewingError, setViewingError] = useState<string | null>(null);
  const [viewingSuccess, setViewingSuccess] = useState(false);
  const timeWindowOptions = [
    { value: "9-12", label: "Morning (9–12)" },
    { value: "12-3", label: "Afternoon (12–3)" },
    { value: "3-6", label: "Evening (3–6)" },
    { value: "6-9", label: "Night (6–9)" },
  ];

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

  if (loading) {
    return (
      <div>
        <SiteHeader />
        <PageShell>Loading property...</PageShell>
      </div>
    );
  }

  if (!detail) {
    return (
      <div>
        <SiteHeader />
        <PageShell>Property not found.</PageShell>
      </div>
    );
  }

  const { property } = detail;
  const title = (property.title as string) || "Property";
  const description = (property.description as string) || "";
  const price = property.price as number | undefined;
  const currency = (property.currency as string) || "MMK";
  const dealType = formatDealType(property.deal_type as string);
  const propertyType = formatPropertyType(property.property_type as string);
  const locationParts = [
    property.township,
    property.district,
    property.state_region,
  ]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(", ");
  const addressText = (property.address_text as string) || "";
  const city = (property.city as string) || "";
  const bedrooms = property.bedrooms as number | undefined;
  const bathrooms = property.bathrooms as number | undefined;
  const areaSqft = property.area_sqft as number | undefined;
  const formattedArea =
    typeof areaSqft === "number"
      ? new Intl.NumberFormat("en-US").format(areaSqft)
      : undefined;
  const primaryContact = EAIN_CONTACT_PHONE;

  const handleViewingSubmit = async () => {
    if (!propertyId) return;
    if (!viewingName.trim() || !viewingPhone.trim() || !viewingDate || !viewingWindow) {
      setViewingError("Please complete all required fields.");
      return;
    }
    setViewingError(null);
    setViewingSubmitting(true);
    const result = await createViewingRequest({
      propertyId,
      name: viewingName.trim(),
      phone: viewingPhone.trim(),
      preferredDate: viewingDate,
      preferredTimeWindow: viewingWindow,
      notes: viewingNotes.trim() || undefined,
    });
    setViewingSubmitting(false);
    if (!result.ok) {
      setViewingError(result.message ?? "Unable to submit your request.");
      return;
    }
    setViewingSuccess(true);
  };

  return (
    <div>
      <SiteHeader />
      <PageShell>
        <HeaderRow>
          <TitleBlock>
            <SectionTitle>{title}</SectionTitle>
            <Location>
              <MapPin size={16} />
              {locationParts || city || "Location TBD"}
            </Location>
            <TagRow>
              {dealType && <Tag>{dealType}</Tag>}
              {propertyType && <Tag>{propertyType}</Tag>}
            </TagRow>
          </TitleBlock>
          <PriceLine>{formatCurrency(price, currency)}</PriceLine>
        </HeaderRow>
        <Gallery>
          <GalleryMain>
            {galleryUrls[0] ? (
              <GalleryImage src={galleryUrls[0]} alt={title} />
            ) : (
              <ImagePlaceholder>No photo available</ImagePlaceholder>
            )}
          </GalleryMain>
          <GalleryGrid>
            {galleryUrls.slice(1, 5).map((url) => (
              <GalleryImage key={url} src={url} alt={`${title} photo`} />
            ))}
          </GalleryGrid>
        </Gallery>
        {galleryUrls.length > 5 && (
          <GalleryGrid>
            {galleryUrls.slice(5).map((url) => (
              <GalleryImage key={url} src={url} alt={`${title} photo`} />
            ))}
          </GalleryGrid>
        )}
        <ContentLayout>
          <div>
            <FeatureRow>
              {bedrooms !== undefined && (
                <FeatureItem>
                  <BedDouble size={16} />
                  {bedrooms} bedrooms
                </FeatureItem>
              )}
              {bathrooms !== undefined && (
                <FeatureItem>
                  <Bath size={16} />
                  {bathrooms} bathrooms
                </FeatureItem>
              )}
              {areaSqft !== undefined && (
                <FeatureItem>
                  <Ruler size={16} />
                  {formattedArea} sqft
                </FeatureItem>
              )}
              <FeatureItem>
                <Home size={16} />
                {propertyType || "Property"}
              </FeatureItem>
            </FeatureRow>
            <SectionBlock>
              <SectionTitle>Description</SectionTitle>
              {description ? <p>{description}</p> : <MetaText>No description yet.</MetaText>}
            </SectionBlock>
            <SectionBlock>
              <SectionTitle>Location</SectionTitle>
              <MetaText>{locationParts || city || "Location details coming soon."}</MetaText>
              {addressText && <MetaText>{addressText}</MetaText>}
              {city && !locationParts.includes(city) && <MetaText>{city}</MetaText>}
            </SectionBlock>
          </div>
          <ContactCard>
            <ContactTitle>Contact agent</ContactTitle>
            <ContactRow>
              <strong>Eain Chan Myae Advisory</strong>
              <span>Call our team for verified owner connections.</span>
              <span>
                Hotline: <a href={`tel:${EAIN_CONTACT_PHONE}`}>{EAIN_CONTACT_PHONE}</a>
              </span>
            </ContactRow>
            <ContactButton href={`tel:${primaryContact}`}>
              <Phone size={16} style={{ marginRight: 6 }} />
              Contact agent
            </ContactButton>
            <SecondaryButton
              as="button"
              type="button"
              onClick={() => {
                setViewingOpen(true);
                setViewingSuccess(false);
                setViewingError(null);
              }}
            >
              Request viewing
            </SecondaryButton>
          </ContactCard>
        </ContentLayout>
      </PageShell>
      {viewingOpen && (
        <ModalOverlay onClick={() => setViewingOpen(false)}>
          <ModalCard onClick={(event) => event.stopPropagation()}>
            <SectionTitle>Request viewing</SectionTitle>
            <p>Best for users who want to propose a time.</p>
            <strong>{title}</strong>
            <Input
              label="Full name"
              name="name"
              value={viewingName}
              onChange={setViewingName}
            />
            <Input
              label="Phone number"
              name="phone"
              value={viewingPhone}
              onChange={setViewingPhone}
            />
            <DateTimePicker
              label="Preferred date"
              name="preferred_date"
              value={viewingDate}
              onChange={setViewingDate}
            />
            <Select
              label="Time window"
              name="preferred_time_window"
              value={viewingWindow}
              options={timeWindowOptions}
              onChange={setViewingWindow}
            />
            <Textarea
              label="Notes (optional)"
              name="notes"
              value={viewingNotes}
              onChange={setViewingNotes}
            />
            {viewingError && <ErrorText>{viewingError}</ErrorText>}
            {viewingSuccess && (
              <SuccessCard>
                <strong>Request sent</strong>
                <p>We’ll confirm by phone.</p>
              </SuccessCard>
            )}
            <ModalActions>
              <GhostButton type="button" onClick={() => setViewingOpen(false)}>
                Close
              </GhostButton>
              {!viewingSuccess && (
                <SubmitButton
                  type="button"
                  onClick={handleViewingSubmit}
                  disabled={viewingSubmitting}
                >
                  {viewingSubmitting ? "Submitting..." : "Submit request"}
                </SubmitButton>
              )}
            </ModalActions>
          </ModalCard>
        </ModalOverlay>
      )}
      <BottomNav />
    </div>
  );
}
