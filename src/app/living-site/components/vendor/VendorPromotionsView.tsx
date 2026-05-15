"use client";

import { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ImageIcon,
  LayoutTemplate,
  Lock,
  Megaphone,
  Search,
  Sparkles,
} from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { withActiveVendorHeaders } from "@/app/living-site/lib/active-context";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { formatCurrency } from "@/app/living-site/lib/format";
import { formatPropertyTypeValue } from "@/lib/property-types";
import { promotionDurationOptions, promotionProducts, type PromotionType } from "@/lib/vendor-promotions";

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

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 18px;

  @media (max-width: 1040px) {
    grid-template-columns: 1fr;
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

const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const ProductCard = styled.button<{ $active?: boolean }>`
  border-radius: 22px;
  border: 1px solid
    ${(props) => (props.$active ? "rgba(233, 61, 93, 0.28)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) =>
    props.$active ? "linear-gradient(180deg, #fff6f8 0%, #fff1f4 100%)" : "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)"};
  padding: 16px;
  display: grid;
  gap: 12px;
  text-align: left;
  box-shadow: ${(props) => (props.$active ? "0 16px 28px rgba(225, 29, 72, 0.08)" : "0 10px 22px rgba(15, 23, 42, 0.04)")};
  cursor: pointer;
`;

const ProductTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
`;

const ProductIcon = styled.div<{ $active?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: ${(props) => (props.$active ? "#ffe4eb" : "#f1f5f9")};
  color: ${(props) => (props.$active ? "#e11d48" : "var(--color-muted)")};
`;

const ProductTitle = styled.strong`
  display: block;
  font-size: 0.96rem;
  color: var(--color-text);
`;

const ProductCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.55;
  font-size: 0.9rem;
`;

const ProductMeta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

const Field = styled.label`
  display: grid;
  gap: 8px;
  color: var(--color-text);
  font-weight: 700;
  font-size: 0.9rem;
`;

const FieldHint = styled.span`
  color: var(--color-muted);
  font-weight: 500;
  font-size: 0.82rem;
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

const PromotionTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
  flex-wrap: wrap;
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
  eligibleListings: EligibleListing[];
  items: PromotionItem[];
  helperPreview?: {
    heroRotationTodo?: string;
    searchRankingTodo?: string;
    listingBoostTodo?: string;
  };
};

type Props = {
  embedded?: boolean;
  vendorId: string | null;
  verified: boolean;
  verificationHref?: string;
  onBack?: () => void;
};

function productIcon(type: PromotionType) {
  if (type === "hero_ad") return <LayoutTemplate size={18} />;
  if (type === "search_ranking") return <Search size={18} />;
  return <Sparkles size={18} />;
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

export function VendorPromotionsView({ embedded, vendorId, verified, verificationHref = "/hub?section=verification", onBack }: Props) {
  const { authToken } = useAppState();
  const [data, setData] = useState<PromotionsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<PromotionType>("hero_ad");
  const [targetType, setTargetType] = useState<"agency_profile" | "listing">("agency_profile");
  const [listingId, setListingId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState("24");
  const [pricePer24h, setPricePer24h] = useState("");
  const [startsAt, setStartsAt] = useState(() => formatDateTimeInput(new Date(Date.now() + 60 * 60 * 1000)));
  const [targetUrl, setTargetUrl] = useState("");

  useEffect(() => {
    if (selectedType !== "hero_ad") {
      setTargetType("listing");
      return;
    }
  }, [selectedType]);

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
  const endsAtPreview = useMemo(() => {
    const parsedHours = Number(durationHours);
    const start = new Date(startsAt);
    if (!Number.isFinite(parsedHours) || !Number.isFinite(start.getTime())) return "N/A";
    return formatDateTime(new Date(start.getTime() + parsedHours * 60 * 60 * 1000).toISOString());
  }, [durationHours, startsAt]);

  const activePromotions = useMemo(() => (data?.items ?? []).filter((item) => item.status === "active"), [data]);
  const draftPromotions = useMemo(
    () =>
      (data?.items ?? []).filter((item) =>
        item.status === "draft" || item.status === "pending_payment" || item.status === "pending_activation" || item.status === "paused"
      ),
    [data]
  );
  const expiredPromotions = useMemo(
    () => (data?.items ?? []).filter((item) => item.status === "expired" || item.status === "cancelled"),
    [data]
  );

  const listingRequired = selectedType !== "hero_ad" || targetType === "listing";
  const noEligibleListings = !eligibleListings.length;

  const handleSubmit = async () => {
    if (!authToken || !vendorId) return;
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
          target_type: targetType,
          listing_id: listingRequired ? listingId || null : null,
          title: title.trim() || null,
          description: description.trim() || null,
          duration_hours: Number(durationHours),
          price_per_24h: Number(pricePer24h),
          starts_at: startsAt,
          target_url: targetUrl.trim() || null,
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save promotion.");
      }
      setSuccess(payload?.message || "Promotion saved as draft.");
      setTitle("");
      setDescription("");
      setPricePer24h("");
      setTargetUrl("");
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
            <Subtitle>Buy visibility placements for your active listings and agency profile.</Subtitle>
          </Heading>
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
        </Header>

        {error ? <Notice $tone="danger">{error}</Notice> : null}
        {success ? <Notice $tone="success">{success}</Notice> : null}
        <Notice>
          All promotion requests are saved as drafts for now. Payment, activation, homepage hero rotation, search ranking, and boosted public slots are prepared in helpers but not fully wired into public surfaces yet.
        </Notice>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Product Cards</CardTitle>
              <CardCopy>Choose which visibility product you want to configure inside this workspace.</CardCopy>
            </div>
          </CardHeader>
          <ProductGrid>
            {promotionProducts.map((product) => (
              <ProductCard
                key={product.type}
                type="button"
                $active={selectedType === product.type}
                onClick={() => setSelectedType(product.type)}
              >
                <ProductTop>
                  <ProductIcon $active={selectedType === product.type}>{productIcon(product.type)}</ProductIcon>
                  <Pill $tone={selectedType === product.type ? "accent" : "neutral"}>
                    {product.type === "hero_ad" ? "Hero" : product.type === "search_ranking" ? "Ranking" : "Boost"}
                  </Pill>
                </ProductTop>
                <div>
                  <ProductTitle>{product.label}</ProductTitle>
                  <ProductCopy>{product.description}</ProductCopy>
                </div>
                <ProductMeta>
                  {product.targetTypes.map((target) => (
                    <Pill key={target}>{target === "agency_profile" ? "Agency profile" : "Active listing"}</Pill>
                  ))}
                </ProductMeta>
              </ProductCard>
            ))}
          </ProductGrid>
        </Card>

        <Grid>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Create Promotion Request</CardTitle>
                <CardCopy>Configure the target, timing, and draft pricing for this placement.</CardCopy>
              </div>
            </CardHeader>

            {listingRequired && noEligibleListings ? (
              <Empty>You need at least one active listing before purchasing this promotion.</Empty>
            ) : null}

            <FormGrid>
              <Field>
                Promotion type
                <CustomSelect
                  id="promotion-type"
                  name="promotion-type"
                  label="Promotion type"
                  hideLabel
                  value={selectedType}
                  onChange={(value) => setSelectedType(value as PromotionType)}
                >
                  {promotionProducts.map((product) => (
                    <option key={product.type} value={product.type}>
                      {product.label}
                    </option>
                  ))}
                </CustomSelect>
              </Field>

              <Field>
                Target type
                <CustomSelect
                  id="promotion-target-type"
                  name="promotion-target-type"
                  label="Target type"
                  hideLabel
                  value={targetType}
                  onChange={(value) => setTargetType(value as "agency_profile" | "listing")}
                  disabled={selectedType !== "hero_ad"}
                >
                  <option value="agency_profile">Agency profile</option>
                  <option value="listing">Listing</option>
                </CustomSelect>
              </Field>

              {listingRequired ? (
                <Field>
                  Listing
                  <CustomSelect
                    id="promotion-listing"
                    name="promotion-listing"
                    label="Listing"
                    hideLabel
                    value={listingId}
                    onChange={setListingId}
                    disabled={noEligibleListings}
                  >
                    <option value="">Select an active listing</option>
                    {eligibleListings.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title || "Untitled property"}
                      </option>
                    ))}
                  </CustomSelect>
                </Field>
              ) : (
                <Field>
                  Generated target route
                  <Input value={targetUrl || "Agency profile route will be generated automatically."} readOnly />
                </Field>
              )}

              <Field>
                Title
                <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Optional campaign title" />
              </Field>

              <Field>
                Duration
                <CustomSelect
                  id="promotion-duration"
                  name="promotion-duration"
                  label="Duration"
                  hideLabel
                  value={durationHours}
                  onChange={setDurationHours}
                >
                  {promotionDurationOptions.map((option) => (
                    <option key={option.durationHours} value={String(option.durationHours)}>
                      {option.label}
                    </option>
                  ))}
                </CustomSelect>
              </Field>

              <Field>
                Price per 24h
                <Input value={pricePer24h} onChange={(event) => setPricePer24h(event.target.value)} placeholder="0" inputMode="decimal" />
              </Field>

              <Field>
                Starts at
                <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} />
              </Field>

              <Field>
                Ends at
                <Input value={endsAtPreview} readOnly />
              </Field>

              <Field>
                Target URL
                <Input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="Optional override route" />
              </Field>

              <FullWidth>
                <Field>
                  Description
                  <Textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Optional short description for the placement."
                  />
                  {selectedType === "hero_ad" ? (
                    <FieldHint>Banner image upload is left as TODO until a generic vendor asset upload endpoint exists. Existing listing or agency visuals can still be used later during activation.</FieldHint>
                  ) : null}
                </Field>
              </FullWidth>
            </FormGrid>

            {selectedListing ? (
              <ListingSelectCard>
                <ListingMini>
                  <ListingMiniImage $image={selectedListing.cover_image_url || undefined}>
                    {!selectedListing.cover_image_url ? <ImageIcon size={18} /> : null}
                  </ListingMiniImage>
                  <div>
                    <ListingMiniTitle>{selectedListing.title || "Untitled property"}</ListingMiniTitle>
                    <ListingMiniMeta>
                      {formatPropertyTypeValue(selectedListing.property_type)} • {selectedListing.deal_type || "N/A"} • {selectedListing.township || selectedListing.city || "N/A"}
                    </ListingMiniMeta>
                    <ListingMiniMeta>{formatCurrency(selectedListing.price ?? undefined, selectedListing.currency ?? "MMK", "Contact")}</ListingMiniMeta>
                  </div>
                </ListingMini>
              </ListingSelectCard>
            ) : null}

            <ButtonRow>
              <Button
                type="button"
                $primary
                onClick={() => void handleSubmit()}
                disabled={saving || !startsAt || !pricePer24h || (listingRequired && !listingId)}
              >
                <Megaphone size={16} />
                <span>{saving ? "Saving..." : "Save as Draft"}</span>
              </Button>
              {onBack ? (
                <Button type="button" onClick={onBack}>
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </Button>
              ) : null}
            </ButtonRow>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Marketplace Notes</CardTitle>
                <CardCopy>Current MVP scope and helper readiness.</CardCopy>
              </div>
            </CardHeader>
            <Notice>
              <strong>Hero ad:</strong> helper ordering is prepared for active campaigns by price per 24h, then start date, up to 4 slots.
            </Notice>
            <Notice>
              <strong>Search ranking:</strong> helper bonus is prepared to apply only after a listing already matches the user&apos;s search or filters.
            </Notice>
            <Notice>
              <strong>Listing boost:</strong> helper ordering is prepared for active boosted listings by price per 24h, then start date, up to 6 slots.
            </Notice>
            {data?.helperPreview?.heroRotationTodo ? <FieldHint>{data.helperPreview.heroRotationTodo}</FieldHint> : null}
            {data?.helperPreview?.searchRankingTodo ? <FieldHint>{data.helperPreview.searchRankingTodo}</FieldHint> : null}
            {data?.helperPreview?.listingBoostTodo ? <FieldHint>{data.helperPreview.listingBoostTodo}</FieldHint> : null}
          </Card>
        </Grid>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Active Promotions</CardTitle>
              <CardCopy>Promotions that are already live for this agency workspace.</CardCopy>
            </div>
          </CardHeader>
          <PromotionList>
            {loading ? (
              <>
                {Array.from({ length: 3 }, (_, index) => (
                  <PromotionRow key={`active-promotion-skeleton-${index}`}>
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
                ))}
              </>
            ) : null}
            {!loading && !activePromotions.length ? <Empty>No active promotions yet.</Empty> : null}
            {activePromotions.map((item) => (
              <PromotionRow key={item.id}>
                <PromotionTop>
                  <div>
                    <PromotionTitle>{item.title || "Untitled promotion"}</PromotionTitle>
                    <PromotionMeta>
                      <span>{promotionProducts.find((product) => product.type === item.promotion_type)?.label || item.promotion_type || "Promotion"}</span>
                      <span>•</span>
                      <span>{item.target_type === "agency_profile" ? "Agency profile" : "Listing target"}</span>
                    </PromotionMeta>
                  </div>
                  <Pill $tone={statusTone(item.status)}>{item.status || "N/A"}</Pill>
                </PromotionTop>
                <PromotionMeta>
                  <span><CalendarClock size={14} style={{ verticalAlign: "text-bottom", marginRight: 6 }} />{formatDateTime(item.starts_at)}</span>
                  <span>•</span>
                  <span>{formatCurrency(item.price_per_24h ?? undefined, "MMK", "N/A")} / 24h</span>
                  <span>•</span>
                  <span>{item.duration_hours ? `${item.duration_hours}h` : "N/A"}</span>
                </PromotionMeta>
              </PromotionRow>
            ))}
          </PromotionList>
        </Card>

        <Grid>
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Draft Promotions</CardTitle>
                <CardCopy>Draft, pending, or paused items waiting for activation.</CardCopy>
              </div>
          </CardHeader>
          <PromotionList>
            {loading ? (
              <>
                {Array.from({ length: 2 }, (_, index) => (
                  <PromotionRow key={`draft-promotion-skeleton-${index}`}>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ display: "grid", gap: 8, flex: 1 }}>
                          <SkeletonBlock $height={18} style={{ width: "44%" }} />
                          <SkeletonBlock $height={14} style={{ width: "60%" }} />
                        </div>
                        <SkeletonBlock $height={28} $radius={999} style={{ width: 84 }} />
                      </div>
                      <SkeletonBlock $height={14} style={{ width: "48%" }} />
                    </div>
                  </PromotionRow>
                ))}
              </>
            ) : null}
            {!loading && !draftPromotions.length ? <Empty>No draft or pending promotions yet.</Empty> : null}
            {draftPromotions.map((item) => (
              <PromotionRow key={item.id}>
                  <PromotionTop>
                    <div>
                      <PromotionTitle>{item.title || "Untitled promotion"}</PromotionTitle>
                      <PromotionMeta>
                        <span>{promotionProducts.find((product) => product.type === item.promotion_type)?.label || item.promotion_type || "Promotion"}</span>
                        <span>•</span>
                        <span>{item.target_type === "agency_profile" ? "Agency profile" : "Listing target"}</span>
                      </PromotionMeta>
                    </div>
                    <Pill $tone={statusTone(item.status)}>{item.status || "N/A"}</Pill>
                  </PromotionTop>
                  <PromotionMeta>
                    <span>{formatDateTime(item.starts_at)}</span>
                    <span>•</span>
                    <span>{formatCurrency(item.price_per_24h ?? undefined, "MMK", "N/A")} / 24h</span>
                  </PromotionMeta>
                </PromotionRow>
              ))}
            </PromotionList>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Expired Promotions</CardTitle>
                <CardCopy>Past promotions kept for workspace history.</CardCopy>
              </div>
          </CardHeader>
          <PromotionList>
            {loading ? (
              <>
                {Array.from({ length: 2 }, (_, index) => (
                  <PromotionRow key={`expired-promotion-skeleton-${index}`}>
                    <div style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ display: "grid", gap: 8, flex: 1 }}>
                          <SkeletonBlock $height={18} style={{ width: "40%" }} />
                          <SkeletonBlock $height={14} style={{ width: "58%" }} />
                        </div>
                        <SkeletonBlock $height={28} $radius={999} style={{ width: 82 }} />
                      </div>
                      <SkeletonBlock $height={14} style={{ width: "52%" }} />
                    </div>
                  </PromotionRow>
                ))}
              </>
            ) : null}
            {!loading && !expiredPromotions.length ? <Empty>No expired promotions yet.</Empty> : null}
            {expiredPromotions.map((item) => (
                <PromotionRow key={item.id}>
                  <PromotionTop>
                    <div>
                      <PromotionTitle>{item.title || "Untitled promotion"}</PromotionTitle>
                      <PromotionMeta>
                        <span>{promotionProducts.find((product) => product.type === item.promotion_type)?.label || item.promotion_type || "Promotion"}</span>
                        <span>•</span>
                        <span>{item.target_type === "agency_profile" ? "Agency profile" : "Listing target"}</span>
                      </PromotionMeta>
                    </div>
                    <Pill $tone={statusTone(item.status)}>{item.status || "N/A"}</Pill>
                  </PromotionTop>
                  <PromotionMeta>
                    <span>{formatDateTime(item.ends_at)}</span>
                    <span>•</span>
                    <span>{item.target_url || "N/A"}</span>
                  </PromotionMeta>
                </PromotionRow>
              ))}
            </PromotionList>
          </Card>
        </Grid>
      </Shell>
    </Page>
  );
}
