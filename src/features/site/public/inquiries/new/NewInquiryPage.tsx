"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CarFront,
  Check,
  Factory,
  Home,
  House,
  Landmark,
  Lightbulb,
  MapPin,
  Ruler,
  Search,
  SunMedium,
  Wallet,
  Waves,
} from "lucide-react";
import { MarketplaceHeader } from "@/features/site/shared/components/MarketplaceHeader";
import { SectionTitle, Panel } from "@/features/site/shared/components/PageSection";
import { CustomSelect } from "@/features/site/shared/components/form-controls/CustomSelect";
import { CustomInput } from "@/features/site/shared/components/form-controls/CustomInput";
import { getDistricts, getStates, getTownships } from "@/features/site/shared/lib/myanmar-geo";
import { useAppState } from "@/features/site/shared/lib/app-state";
import { getInquiryById, updateInquiry } from "@/features/site/shared/lib/data";
import { LoadingOverlay } from "@/features/site/shared/components/LoadingOverlay";
import { useI18n } from "@/features/site/shared/lib/i18n";
import {
  formatPropertyTypeValue,
  isBedBathPropertyType,
  normalizeSelectablePropertyType,
  propertyTypeDefinitions,
  type PropertyType,
} from "@/lib/property-types";

const PageShell = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  padding: 18px 16px 30px;
  display: grid;
  gap: 14px;
`;

const BackButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  background: color-mix(in srgb, var(--color-surface) 88%, white);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  width: fit-content;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 760px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-muted);
`;

const Intro = styled.div`
  display: grid;
  gap: 4px;
`;

const IntroTitle = styled(SectionTitle)`
  margin: 0;
`;

const AgencyBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: fit-content;
  margin: 0 auto;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface) 92%, white);
  box-shadow: var(--shadow-soft);
`;

const AgencyBannerLogo = styled.div<{ $image?: string | null }>`
  width: 28px;
  height: 28px;
  border-radius: 10px;
  flex: 0 0 auto;
  background:
    ${(props) =>
      props.$image
        ? `url(${props.$image}) center/cover no-repeat`
        : "color-mix(in srgb, var(--color-primary) 14%, white)"};
  display: grid;
  place-items: center;
  color: var(--color-primary);
  overflow: hidden;
`;

const AgencyBannerText = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  color: var(--color-text);
  font-size: 0.86rem;
`;

const AgencyBannerLabel = styled.span`
  color: var(--color-muted);
`;

const AgencyBannerName = styled.span`
  font-weight: 800;
`;

const PrimaryButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  background: var(--gradient);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
`;

const FieldGroup = styled.div`
  display: grid;
  gap: 10px;
`;

const FieldStack = styled.div`
  display: grid;
  gap: 8px;
`;

const TileGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Tile = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-outline)")};
  border-radius: 12px;
  padding: 8px 8px;
  background: ${(props) =>
    props.$active
      ? "color-mix(in srgb, var(--color-primary) 12%, white)"
      : "color-mix(in srgb, var(--color-surface-2) 84%, white)"};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  display: grid;
  gap: 5px;
  justify-items: center;
  min-height: 72px;
  font-weight: 600;
  font-size: 0.8rem;
  text-align: center;
  line-height: 1.2;
  cursor: pointer;
`;

const FormCard = styled(Panel)`
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(255, 226, 214, 0.56), transparent 32%),
    linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 92%, white), color-mix(in srgb, var(--color-surface-2) 90%, white));
`;

const SectionCard = styled.div`
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface) 92%, white);
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SectionIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--color-primary) 12%, white);
  color: var(--color-primary);
  flex: 0 0 auto;
`;

const SectionHeaderText = styled.div`
  display: grid;
  gap: 0;
`;

const SectionCardTitle = styled.h3`
  margin: 0;
  color: var(--color-text);
  font-size: 0.95rem;
`;

const ChoiceGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: min(100%, 420px);
  margin: 0 auto;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    width: 100%;
  }
`;

const ChoiceCard = styled.button<{ $active?: boolean }>`
  border: 1px solid ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-outline)")};
  border-radius: 14px;
  background: ${(props) =>
    props.$active ? "color-mix(in srgb, var(--color-primary) 10%, white)" : "color-mix(in srgb, var(--color-surface-2) 84%, white)"};
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 54px;
  text-align: left;
  cursor: pointer;
  box-shadow: ${(props) => (props.$active ? "var(--frame-shadow)" : "var(--shadow-soft)")};
`;

const ChoiceTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ChoiceIcon = styled.div<{ $active?: boolean }>`
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: ${(props) =>
    props.$active ? "color-mix(in srgb, var(--color-primary) 18%, white)" : "color-mix(in srgb, var(--color-surface) 70%, white)"};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
`;

const ChoiceCheck = styled.div<{ $active?: boolean }>`
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  border: 1px solid ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-outline)")};
  background: ${(props) => (props.$active ? "var(--color-primary)" : "transparent")};
  color: ${(props) => (props.$active ? "#fff" : "transparent")};
`;

const ChoiceTitle = styled.div`
  color: var(--color-text);
  font-weight: 800;
  font-size: 0.88rem;
`;

const InlineFieldGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const TripleFieldGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const SpaceFieldGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const RequirementIcon = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--color-surface) 70%, white);
`;

const RequirementLabel = styled.div`
  font-weight: 700;
  font-size: 0.78rem;
`;

const SuccessOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: color-mix(in srgb, var(--color-paper) 55%, transparent);
  display: grid;
  place-items: center;
  z-index: 80;
  padding: 16px;
`;

const SuccessModal = styled(Panel)`
  max-width: 520px;
  width: min(520px, 92vw);
  display: grid;
  gap: 14px;
`;

const ActionRow = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
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

const englishInquiryCopy = {
  "common.back": "Back",
  "common.loading": "Loading...",
  "common.submitting": "Submitting...",
  "common.saveChanges": "Save changes",
  "common.completeRequired": "Please complete the required fields before submitting.",
  "auth.signIn": "Sign in",
  "inquiry.newTitle": "Request property help",
  "inquiry.newSubtitle": "Tell us what you need and we will route your inquiry to the right agency workspace.",
  "inquiry.editTitle": "Update your inquiry",
  "inquiry.editSubtitle": "Refine your request so agencies can respond with more relevant options.",
  "inquiry.signInRequired": "Please sign in before submitting a property inquiry.",
  "inquiry.submitError": "We could not submit your inquiry right now.",
  "inquiry.loadError": "We could not load this inquiry.",
  "inquiry.submit": "Submit inquiry",
  "inquiry.updated": "Your inquiry has been updated.",
  "inquiry.thanks": "Your inquiry has been sent.",
  "inquiry.browse": "Browse listings",
  "inquiry.goActivities": "Go to account",
  "inquiry.loading": "Loading inquiry...",
  "inquiry.submitting": "Sending inquiry...",
  "inquiry.dealType": "Request type",
  "inquiry.buy": "Buy",
  "inquiry.rent": "Rent",
  "inquiry.propertyType": "Property type",
  "inquiry.state": "State / region",
  "inquiry.city": "District / city",
  "inquiry.township": "Township",
  "inquiry.budgetRange": "Budget range",
  "inquiry.timeline": "Timeline",
  "inquiry.areaSqft": "Preferred area (sqft)",
  "inquiry.bedrooms": "Bedrooms",
  "inquiry.bathrooms": "Bathrooms",
  "inquiry.requirements": "Requirements",
  "inquiry.needParking": "Parking",
  "inquiry.needLift": "Lift",
  "inquiry.needSolar": "Solar",
  "inquiry.needGenerator": "Generator",
  "inquiry.budget.buy1": "Up to MMK 1,000L",
  "inquiry.budget.buy2": "MMK 1,000L to 5,000L",
  "inquiry.budget.buy3": "MMK 5,000L to 50,000L",
  "inquiry.budget.buy4": "MMK 50,000L to 100,000L",
  "inquiry.budget.buy5": "Above MMK 100,000L",
  "inquiry.budget.rent1": "Up to MMK 5L / month",
  "inquiry.budget.rent2": "MMK 5L to 10L / month",
  "inquiry.budget.rent3": "MMK 10L to 20L / month",
  "inquiry.budget.rent4": "MMK 20L to 50L / month",
  "inquiry.budget.rent5": "MMK 50L to 100L / month",
  "inquiry.budget.rent6": "Above MMK 100L / month",
  "inquiry.timeline.asap": "As soon as possible",
  "inquiry.timeline.oneThree": "Within 1 to 3 months",
  "inquiry.timeline.threeSix": "Within 3 to 6 months",
  "inquiry.timeline.browsing": "Just browsing",
} as const;

const propertyTypeIconMap: Record<string, JSX.Element> = {
  house: <House size={18} />,
  apartment: <Building2 size={18} />,
  mini_condo: <Building2 size={18} />,
  condo: <Building2 size={18} />,
  serviced_apartment: <Building2 size={18} />,
  office: <Landmark size={18} />,
  shop: <Home size={18} />,
  shop_office: <Landmark size={18} />,
  warehouse: <Factory size={18} />,
  industrial: <Factory size={18} />,
  land: <MapPin size={18} />,
};

function NewInquiryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authToken } = useAppState();
  const { t } = useI18n();
  const tr = (key: keyof typeof englishInquiryCopy | string, fallback?: string) => {
    const translated = t(key);
    if (translated !== key) return translated;
    if (fallback) return fallback;
    return (englishInquiryCopy as Record<string, string>)[key] ?? key;
  };
  const editId = searchParams.get("editId");
  const isEdit = Boolean(editId);
  const agencyId = searchParams.get("agencyId")?.trim() || "";
  const agencyName = searchParams.get("agency")?.trim() || "";
  const agencySlug = searchParams.get("agencySlug")?.trim() || "";
  const agencyLogo = searchParams.get("agencyLogo")?.trim() || "";
  const [dealType, setDealType] = useState("buy");
  const [propertyType, setPropertyType] = useState("house");
  const [stateRegion, setStateRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [township, setTownship] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSqft, setAreaSqft] = useState("");
  const [needParking, setNeedParking] = useState(false);
  const [needLift, setNeedLift] = useState(false);
  const [needSolar, setNeedSolar] = useState(false);
  const [needGenerator, setNeedGenerator] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  useEffect(() => {
    if (!editId || !user?.id) return;
    let active = true;
    setLoadingEdit(true);
    getInquiryById(user.id, editId)
      .then(({ inquiry, error: loadError }) => {
        if (!active) return;
        if (loadError) {
          setError(loadError);
          return;
        }
        if (!inquiry) {
          setError(tr("inquiry.loadError"));
          return;
        }
        setDealType(String(inquiry.deal_type ?? "buy"));
        setPropertyType(normalizeSelectablePropertyType(String(inquiry.property_type ?? "house")));
        setStateRegion(String(inquiry.state_region ?? ""));
        setDistrict(String(inquiry.district ?? ""));
        setTownship(String(inquiry.township ?? ""));
        setBudgetRange(String(inquiry.budget_range ?? ""));
        setTimeline(String(inquiry.timeline ?? ""));
        setBedrooms(String(inquiry.bedrooms ?? ""));
        setBathrooms(String(inquiry.bathrooms ?? ""));
        setAreaSqft(String(inquiry.area_sqft ?? ""));
        setNeedParking(Boolean(inquiry.need_parking));
        setNeedLift(Boolean(inquiry.need_lift));
        setNeedSolar(Boolean(inquiry.need_solar));
        setNeedGenerator(Boolean(inquiry.need_generator));
      })
      .finally(() => {
        if (active) setLoadingEdit(false);
      });

    return () => {
      active = false;
    };
  }, [editId, user?.id, t]);

  const showBedBathFields = useMemo(
    () => isBedBathPropertyType(propertyType),
    [propertyType]
  );
  const showRequirementToggles = propertyType !== "land";

  useEffect(() => {
    if (!showBedBathFields) {
      setBedrooms("");
      setBathrooms("");
    }
  }, [showBedBathFields]);

  useEffect(() => {
    if (!showRequirementToggles) {
      setNeedParking(false);
      setNeedLift(false);
      setNeedSolar(false);
      setNeedGenerator(false);
    }
  }, [showRequirementToggles]);

  const toNullableNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError(tr("inquiry.signInRequired"));
      return;
    }
    if (!stateRegion || !district || !township || !budgetRange) {
      setError(tr("common.completeRequired"));
      return;
    }
    setError(null);
    setSubmitting(true);
    const payload = {
      userId: user.id,
      dealType: dealType as "buy" | "rent",
      propertyType: propertyType as PropertyType,
      stateRegion,
      district,
      township,
      budgetRange,
      timeline: timeline ? (timeline as "asap" | "1-3" | "3-6" | "browsing") : null,
      bedrooms: showBedBathFields ? toNullableNumber(bedrooms) : null,
      bathrooms: showBedBathFields ? toNullableNumber(bathrooms) : null,
      areaSqft: toNullableNumber(areaSqft),
      needParking,
      needLift,
      needSolar,
      needGenerator,
      targetVendorId: agencyId || null,
    };
    const result =
      isEdit && editId
        ? await updateInquiry({ id: editId, ...payload })
        : await (async () => {
            if (!authToken) {
              return { ok: false, message: tr("inquiry.submitError") };
            }

            const response = await fetch("/api/public/inquiries", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify(payload),
            });

            const apiPayload = (await response.json().catch(() => null)) as { error?: string } | null;
            return response.ok
              ? { ok: true }
              : { ok: false, message: apiPayload?.error ?? tr("inquiry.submitError") };
          })();
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? tr("inquiry.submitError"));
      return;
    }
    setSuccess(true);
  };

  const stateOptions = getStates();
  const districtOptions = getDistricts(stateRegion);
  const townshipOptions = getTownships(stateRegion, district);

  const propertyTypeOptions = propertyTypeDefinitions.map((option) => ({
    value: option.value,
    label: (() => {
      const translated = formatPropertyTypeValue(option.value, t);
      return translated.startsWith("property.") ? option.label : translated;
    })(),
  }));

  const buyBudgetOptions = [
    { value: "0-1000", label: tr("inquiry.budget.buy1") },
    { value: "1000-5000", label: tr("inquiry.budget.buy2") },
    { value: "5000-50000", label: tr("inquiry.budget.buy3") },
    { value: "50000-100000", label: tr("inquiry.budget.buy4") },
    { value: "100000+", label: tr("inquiry.budget.buy5") },
  ];

  const rentBudgetOptions = [
    { value: "0-5", label: tr("inquiry.budget.rent1") },
    { value: "5-10", label: tr("inquiry.budget.rent2") },
    { value: "10-20", label: tr("inquiry.budget.rent3") },
    { value: "20-50", label: tr("inquiry.budget.rent4") },
    { value: "50-100", label: tr("inquiry.budget.rent5") },
    { value: "100+", label: tr("inquiry.budget.rent6") },
  ];

  const budgetOptions = dealType === "rent" ? rentBudgetOptions : buyBudgetOptions;

  return (
    <div>
      <MarketplaceHeader />
      <PageShell>
        <TitleRow>
          <Intro>
            <IntroTitle>{isEdit ? tr("inquiry.editTitle") : tr("inquiry.newTitle")}</IntroTitle>
            {agencyName ? (
              <AgencyBanner>
                <AgencyBannerLogo $image={agencyLogo || null}>
                  {!agencyLogo ? <Building2 size={14} /> : null}
                </AgencyBannerLogo>
                <AgencyBannerText>
                  <AgencyBannerLabel>Inquiry for</AgencyBannerLabel>
                  <AgencyBannerName>
                    {agencySlug ? `${agencyName}` : agencyName}
                  </AgencyBannerName>
                </AgencyBannerText>
              </AgencyBanner>
            ) : null}
          </Intro>
          <BackButton type="button" onClick={() => router.back()}>
            {tr("common.back")}
          </BackButton>
        </TitleRow>
        {!user && (
          <Panel style={{ display: "grid", gap: "10px" }}>
            <Muted>{tr("inquiry.signInRequired")}</Muted>
            <PrimaryButton type="button" onClick={() => router.push("/auth")}>
              {tr("auth.signIn")}
            </PrimaryButton>
          </Panel>
        )}
        {user && (
          <FormCard>
            <SectionCard>
              <SectionHeader>
                <SectionIcon>
                  <Search size={18} />
                </SectionIcon>
                <SectionHeaderText>
                  <SectionCardTitle>What are you looking for?</SectionCardTitle>
                </SectionHeaderText>
              </SectionHeader>
              <FieldGroup>
                <FieldStack>
                  <Muted style={{ marginBottom: 10, fontWeight: 700, color: "var(--color-text)" }}>{tr("inquiry.dealType")}</Muted>
                  <ChoiceGrid>
                    <ChoiceCard type="button" $active={dealType === "buy"} onClick={() => setDealType("buy")}>
                      <ChoiceTop>
                        <ChoiceIcon $active={dealType === "buy"}>
                          <Home size={18} />
                        </ChoiceIcon>
                        <ChoiceTitle>{tr("inquiry.buy")}</ChoiceTitle>
                      </ChoiceTop>
                      <ChoiceCheck $active={dealType === "buy"}>
                        <Check size={14} />
                      </ChoiceCheck>
                    </ChoiceCard>
                    <ChoiceCard type="button" $active={dealType === "rent"} onClick={() => setDealType("rent")}>
                      <ChoiceTop>
                        <ChoiceIcon $active={dealType === "rent"}>
                          <Building2 size={18} />
                        </ChoiceIcon>
                        <ChoiceTitle>{tr("inquiry.rent")}</ChoiceTitle>
                      </ChoiceTop>
                      <ChoiceCheck $active={dealType === "rent"}>
                        <Check size={14} />
                      </ChoiceCheck>
                    </ChoiceCard>
                  </ChoiceGrid>
                </FieldStack>

                <FieldStack>
                  <Muted style={{ fontWeight: 700, color: "var(--color-text)" }}>{tr("inquiry.propertyType")}</Muted>
                  <CustomSelect
                    id="inquiry-property-type"
                    name="property_type"
                    label={tr("inquiry.propertyType")}
                    hideLabel
                    value={propertyType}
                    onChange={(value) => setPropertyType(value)}
                  >
                    {propertyTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </CustomSelect>
                </FieldStack>
              </FieldGroup>
            </SectionCard>

            <SectionCard>
              <SectionHeader>
                <SectionIcon>
                  <MapPin size={18} />
                </SectionIcon>
                <SectionHeaderText>
                  <SectionCardTitle>Where should we search?</SectionCardTitle>
                </SectionHeaderText>
              </SectionHeader>
              <TripleFieldGrid>
                <CustomSelect
                  id="inquiry-state"
                  name="state_region"
                  label={tr("inquiry.state")}
                  value={stateRegion}
                  onChange={(value) => {
                    setStateRegion(value);
                    setDistrict("");
                    setTownship("");
                  }}
                >
                  {stateOptions.map((state) => (
                    <option key={state.pcode} value={state.name_en}>
                      {state.name_en}
                    </option>
                  ))}
                </CustomSelect>
                <CustomSelect
                  id="inquiry-district"
                  name="district"
                  label={tr("inquiry.city")}
                  value={district}
                  onChange={(value) => {
                    setDistrict(value);
                    setTownship("");
                  }}
                  disabled={!stateRegion}
                >
                  {districtOptions.map((item) => (
                    <option key={item.pcode} value={item.name_en}>
                      {item.name_en}
                    </option>
                  ))}
                </CustomSelect>
                <CustomSelect
                  id="inquiry-township"
                  name="township"
                  label={tr("inquiry.township")}
                  value={township}
                  onChange={(value) => setTownship(value)}
                  disabled={!district}
                >
                  {townshipOptions.map((item) => (
                    <option key={item.pcode} value={item.name_en}>
                      {item.name_en}
                    </option>
                  ))}
                </CustomSelect>
              </TripleFieldGrid>
            </SectionCard>

            <SectionCard>
              <SectionHeader>
                <SectionIcon>
                  <Wallet size={18} />
                </SectionIcon>
                <SectionHeaderText>
                  <SectionCardTitle>Budget and timing</SectionCardTitle>
                </SectionHeaderText>
              </SectionHeader>
              <InlineFieldGrid>
                <CustomSelect
                  id="inquiry-budget-range"
                  name="budget_range"
                  label={tr("inquiry.budgetRange")}
                  value={budgetRange}
                  onChange={(value) => setBudgetRange(value)}
                >
                  {budgetOptions.map((option) => (
                    <option key={`range-${option.value}`} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CustomSelect>

                <CustomSelect
                  id="inquiry-timeline"
                  name="timeline"
                  label={tr("inquiry.timeline")}
                  value={timeline}
                  onChange={(value) => setTimeline(value)}
                >
                  <option value="asap">{tr("inquiry.timeline.asap")}</option>
                  <option value="1-3">{tr("inquiry.timeline.oneThree")}</option>
                  <option value="3-6">{tr("inquiry.timeline.threeSix")}</option>
                  <option value="browsing">{tr("inquiry.timeline.browsing")}</option>
                </CustomSelect>
              </InlineFieldGrid>
            </SectionCard>

            <SectionCard>
              <SectionHeader>
                <SectionIcon>
                  <Ruler size={18} />
                </SectionIcon>
                <SectionHeaderText>
                  <SectionCardTitle>Space requirements</SectionCardTitle>
                </SectionHeaderText>
              </SectionHeader>
              <SpaceFieldGrid>
                <CustomInput
                  id="inquiry-area-sqft"
                  label={tr("inquiry.areaSqft")}
                  name="area_sqft"
                  value={areaSqft}
                  onChange={(event) => setAreaSqft(event.target.value)}
                />
                {showBedBathFields ? (
                  <>
                    <CustomInput
                      id="inquiry-bedrooms"
                      label={tr("inquiry.bedrooms")}
                      name="bedrooms"
                      value={bedrooms}
                      onChange={(event) => setBedrooms(event.target.value)}
                    />
                    <CustomInput
                      id="inquiry-bathrooms"
                      label={tr("inquiry.bathrooms")}
                      name="bathrooms"
                      value={bathrooms}
                      onChange={(event) => setBathrooms(event.target.value)}
                    />
                  </>
                ) : (
                  <>
                    <ChoiceCard type="button" $active={false} style={{ cursor: "default", gridColumn: "span 2" }}>
                      <ChoiceTop>
                        <ChoiceIcon>
                          {propertyTypeIconMap[propertyType] ?? <Building2 size={18} />}
                        </ChoiceIcon>
                        <ChoiceTitle>{propertyTypeOptions.find((option) => option.value === propertyType)?.label || formatPropertyTypeValue(propertyType)}</ChoiceTitle>
                      </ChoiceTop>
                      <ChoiceCheck $active={false} />
                    </ChoiceCard>
                  </>
                )}
              </SpaceFieldGrid>
            </SectionCard>

            {showRequirementToggles ? (
              <SectionCard>
                <SectionHeader>
                  <SectionIcon>
                    <Lightbulb size={18} />
                  </SectionIcon>
                  <SectionHeaderText>
                    <SectionCardTitle>{tr("inquiry.requirements")}</SectionCardTitle>
                  </SectionHeaderText>
                </SectionHeader>
                <TileGrid>
                  <Tile type="button" $active={needParking} onClick={() => setNeedParking(!needParking)}>
                    <RequirementIcon>
                      <CarFront size={16} />
                    </RequirementIcon>
                    <RequirementLabel>{tr("inquiry.needParking")}</RequirementLabel>
                  </Tile>
                  <Tile type="button" $active={needLift} onClick={() => setNeedLift(!needLift)}>
                    <RequirementIcon>
                      <Waves size={16} />
                    </RequirementIcon>
                    <RequirementLabel>{tr("inquiry.needLift")}</RequirementLabel>
                  </Tile>
                  <Tile type="button" $active={needSolar} onClick={() => setNeedSolar(!needSolar)}>
                    <RequirementIcon>
                      <SunMedium size={16} />
                    </RequirementIcon>
                    <RequirementLabel>{tr("inquiry.needSolar")}</RequirementLabel>
                  </Tile>
                  <Tile type="button" $active={needGenerator} onClick={() => setNeedGenerator(!needGenerator)}>
                    <RequirementIcon>
                      <Lightbulb size={16} />
                    </RequirementIcon>
                    <RequirementLabel>{tr("inquiry.needGenerator")}</RequirementLabel>
                  </Tile>
                </TileGrid>
              </SectionCard>
            ) : null}

            {error && <Muted style={{ color: "var(--color-danger)" }}>{error}</Muted>}
            {success ? (
              <Muted>{isEdit ? tr("inquiry.updated") : tr("inquiry.thanks")}</Muted>
            ) : (
              <PrimaryButton type="button" onClick={handleSubmit} disabled={submitting || loadingEdit}>
                {loadingEdit
                  ? tr("common.loading")
                  : submitting
                    ? tr("common.submitting")
                    : isEdit
                      ? tr("common.saveChanges")
                      : tr("inquiry.submit")}
              </PrimaryButton>
            )}
          </FormCard>
        )}
      </PageShell>
      {(submitting || loadingEdit) && (
        <LoadingOverlay
          message={loadingEdit ? tr("inquiry.loading") : tr("inquiry.submitting")}
        />
      )}
      {success && (
        <SuccessOverlay>
          <SuccessModal>
            <strong>{isEdit ? tr("inquiry.updated") : tr("inquiry.thanks")}</strong>
            <ActionRow>
              <GhostButton type="button" onClick={() => router.push("/")}>
                {tr("inquiry.browse")}
              </GhostButton>
              <PrimaryButton type="button" onClick={() => router.push("/account")}>
                {tr("inquiry.goActivities")}
              </PrimaryButton>
            </ActionRow>
          </SuccessModal>
        </SuccessOverlay>
      )}
    </div>
  );
}

export default function NewInquiryPage() {
  return (
    <Suspense fallback={<LoadingOverlay message="Loading..." />}>
      <NewInquiryPageContent />
    </Suspense>
  );
}
