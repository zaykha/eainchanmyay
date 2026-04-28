"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { SectionTitle, Panel } from "@/app/living-site/components/PageSection";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { CustomInput } from "@/app/living-site/components/form-controls/CustomInput";
import { getDistricts, getStates, getTownships } from "@/app/living-site/lib/myanmar-geo";
import { useAppState } from "@/app/living-site/lib/app-state";
import { getInquiryById, updateInquiry } from "@/app/living-site/lib/data";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { useI18n } from "@/app/living-site/lib/i18n";

const PageShell = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 16px;
`;

const BackButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 8px 12px;
  background: transparent;
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  width: fit-content;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
  gap: 12px;
`;

const TileGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
`;

const Tile = styled.button<{ $active?: boolean }>`
  border: 1px solid
    ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-outline)")};
  border-radius: 14px;
  padding: 12px;
  background: ${(props) =>
    props.$active
      ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
      : "var(--color-surface-2)"};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  display: grid;
  gap: 6px;
  justify-items: center;
  font-weight: 600;
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.2;
  cursor: pointer;
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-muted);
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

function NewInquiryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, authToken } = useAppState();
  const { t } = useI18n();
  const editId = searchParams.get("editId");
  const isEdit = Boolean(editId);
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
          setError(t("inquiry.loadError"));
          return;
        }
        setDealType(String(inquiry.deal_type ?? "buy"));
        setPropertyType(String(inquiry.property_type ?? "house"));
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
    () =>
      ["house", "house_land", "apartment", "condo", "mini_condo", "serviced_apartment"].includes(
        propertyType
      ),
    [propertyType]
  );

  useEffect(() => {
    if (!showBedBathFields) {
      setBedrooms("");
      setBathrooms("");
    }
  }, [showBedBathFields]);

  const toNullableNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setError(t("inquiry.signInRequired"));
      return;
    }
    if (!stateRegion || !district || !township || !budgetRange) {
      setError(t("common.completeRequired"));
      return;
    }
    setError(null);
    setSubmitting(true);
    const payload = {
      userId: user.id,
      dealType: dealType as "buy" | "rent",
      propertyType: propertyType as
        | "land"
        | "house"
        | "apartment"
        | "mini_condo"
        | "condo"
        | "serviced_apartment"
        | "shop_office"
        | "hotel_restaurant"
        | "warehouse",
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
    };
    const result =
      isEdit && editId
        ? await updateInquiry({ id: editId, ...payload })
        : await (async () => {
            if (!authToken) {
              return { ok: false, message: t("inquiry.submitError") };
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
              : { ok: false, message: apiPayload?.error ?? t("inquiry.submitError") };
          })();
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? t("inquiry.submitError"));
      return;
    }
    setSuccess(true);
  };

  const stateOptions = getStates();
  const districtOptions = getDistricts(stateRegion);
  const townshipOptions = getTownships(stateRegion, district);

  const propertyTypeOptions = [
    { value: "land", label: t("property.land") },
    { value: "house", label: t("property.house") },
    { value: "apartment", label: t("property.apartment") },
    { value: "mini_condo", label: t("property.miniCondo") },
    { value: "condo", label: t("property.condo") },
    { value: "serviced_apartment", label: t("property.servicedApartment") },
    { value: "shop_office", label: t("property.commercial") },
    { value: "hotel_restaurant", label: t("property.commercial") },
    { value: "warehouse", label: t("property.warehouse") },
  ];

  const buyBudgetOptions = [
    { value: "0-1000", label: t("inquiry.budget.buy1") },
    { value: "1000-5000", label: t("inquiry.budget.buy2") },
    { value: "5000-50000", label: t("inquiry.budget.buy3") },
    { value: "50000-100000", label: t("inquiry.budget.buy4") },
    { value: "100000+", label: t("inquiry.budget.buy5") },
  ];

  const rentBudgetOptions = [
    { value: "0-5", label: t("inquiry.budget.rent1") },
    { value: "5-10", label: t("inquiry.budget.rent2") },
    { value: "10-20", label: t("inquiry.budget.rent3") },
    { value: "20-50", label: t("inquiry.budget.rent4") },
    { value: "50-100", label: t("inquiry.budget.rent5") },
    { value: "100+", label: t("inquiry.budget.rent6") },
  ];

  const budgetOptions = dealType === "rent" ? rentBudgetOptions : buyBudgetOptions;

  return (
    <div>
      <SiteHeader />
      <PageShell>
        <TitleRow>
          <SectionTitle>{isEdit ? t("inquiry.editTitle") : t("inquiry.newTitle")}</SectionTitle>
          <BackButton type="button" onClick={() => router.back()}>
            {t("common.back")}
          </BackButton>
        </TitleRow>
        <Muted>
          {isEdit ? t("inquiry.editSubtitle") : t("inquiry.newSubtitle")}
        </Muted>
        {!user && (
          <Panel style={{ display: "grid", gap: "10px" }}>
            <Muted>{t("inquiry.signInRequired")}</Muted>
            <PrimaryButton type="button" onClick={() => router.push("/auth")}>
              {t("auth.signIn")}
            </PrimaryButton>
          </Panel>
        )}
        {user && (
          <Panel style={{ display: "grid", gap: "16px" }}>
          <FieldGroup>
            <CustomSelect
              id="inquiry-deal-type"
              name="deal_type"
              label={t("inquiry.dealType")}
              value={dealType}
              onChange={(value) => setDealType(value)}
            >
              <option value="buy">{t("inquiry.buy")}</option>
              <option value="rent">{t("inquiry.rent")}</option>
            </CustomSelect>
            <CustomSelect
              id="inquiry-property-type"
              name="property_type"
              label={t("inquiry.propertyType")}
              value={propertyType}
              onChange={(value) => setPropertyType(value)}
            >
              {propertyTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </CustomSelect>
          </FieldGroup>

          <FieldGroup>
            <CustomSelect
              id="inquiry-state"
              name="state_region"
              label={t("inquiry.state")}
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
              label={t("inquiry.city")}
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
              label={t("inquiry.township")}
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
          </FieldGroup>

          <CustomSelect
            id="inquiry-budget-range"
            name="budget_range"
            label={t("inquiry.budgetRange")}
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
            label={t("inquiry.timeline")}
            value={timeline}
            onChange={(value) => setTimeline(value)}
          >
            <option value="asap">{t("inquiry.timeline.asap")}</option>
            <option value="1-3">{t("inquiry.timeline.oneThree")}</option>
            <option value="3-6">{t("inquiry.timeline.threeSix")}</option>
            <option value="browsing">{t("inquiry.timeline.browsing")}</option>
          </CustomSelect>

          <FieldGroup>
            <CustomInput
              id="inquiry-area-sqft"
              label={t("inquiry.areaSqft")}
              name="area_sqft"
              value={areaSqft}
              onChange={(event) => setAreaSqft(event.target.value)}
            />
            {showBedBathFields && (
              <>
                <CustomInput
                  id="inquiry-bedrooms"
                  label={t("inquiry.bedrooms")}
                  name="bedrooms"
                  value={bedrooms}
                  onChange={(event) => setBedrooms(event.target.value)}
                />
                <CustomInput
                  id="inquiry-bathrooms"
                  label={t("inquiry.bathrooms")}
                  name="bathrooms"
                  value={bathrooms}
                  onChange={(event) => setBathrooms(event.target.value)}
                />
              </>
            )}
          </FieldGroup>

          <FieldGroup>
            <strong>{t("inquiry.requirements")}</strong>
            <TileGrid>
              <Tile type="button" $active={needParking} onClick={() => setNeedParking(!needParking)}>
                {t("inquiry.needParking")}
              </Tile>
              <Tile type="button" $active={needLift} onClick={() => setNeedLift(!needLift)}>
                {t("inquiry.needLift")}
              </Tile>
              <Tile type="button" $active={needSolar} onClick={() => setNeedSolar(!needSolar)}>
                {t("inquiry.needSolar")}
              </Tile>
              <Tile
                type="button"
                $active={needGenerator}
                onClick={() => setNeedGenerator(!needGenerator)}
              >
                {t("inquiry.needGenerator")}
              </Tile>
            </TileGrid>
          </FieldGroup>

          {error && <Muted style={{ color: "var(--color-danger)" }}>{error}</Muted>}
          {success ? (
            <Muted>{isEdit ? t("inquiry.updated") : t("inquiry.thanks")}</Muted>
          ) : (
            <PrimaryButton type="button" onClick={handleSubmit} disabled={submitting || loadingEdit}>
              {loadingEdit
                ? t("common.loading")
                : submitting
                  ? t("common.submitting")
                  : isEdit
                    ? t("common.saveChanges")
                    : t("inquiry.submit")}
            </PrimaryButton>
          )}
        </Panel>
        )}
      </PageShell>
      <BottomNav />
      {(submitting || loadingEdit) && (
        <LoadingOverlay
          message={loadingEdit ? t("inquiry.loading") : t("inquiry.submitting")}
        />
      )}
      {success && (
        <SuccessOverlay>
          <SuccessModal>
            <strong>{isEdit ? t("inquiry.updated") : t("inquiry.thanks")}</strong>
            <ActionRow>
              <GhostButton type="button" onClick={() => router.push("/")}>
                {t("inquiry.browse")}
              </GhostButton>
              <PrimaryButton type="button" onClick={() => router.push("/activities")}>
                {t("inquiry.goActivities")}
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
