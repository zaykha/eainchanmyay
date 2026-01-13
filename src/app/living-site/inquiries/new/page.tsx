"use client";

import { useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { SectionTitle, Panel } from "@/app/living-site/components/PageSection";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { getDistricts, getStates, getTownships } from "@/app/living-site/lib/myanmar-geo";
import { useAppState } from "@/app/living-site/lib/app-state";
import { createInquiry } from "@/app/living-site/lib/data";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";

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

export default function NewInquiryPage() {
  const router = useRouter();
  const { user } = useAppState();
  const [dealType, setDealType] = useState("buy");
  const [propertyType, setPropertyType] = useState("house");
  const [stateRegion, setStateRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [township, setTownship] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("");
  const [needParking, setNeedParking] = useState(false);
  const [needLift, setNeedLift] = useState(false);
  const [needSolar, setNeedSolar] = useState(false);
  const [needGenerator, setNeedGenerator] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!user?.id) {
      setError("Please sign in to submit an inquiry.");
      return;
    }
    if (!stateRegion || !district || !township || !budgetRange) {
      setError("Please complete the required fields.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await createInquiry({
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
      needParking,
      needLift,
      needSolar,
      needGenerator,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message ?? "Unable to submit inquiry.");
      return;
    }
    setSuccess(true);
  };

  const stateOptions = getStates();
  const districtOptions = getDistricts(stateRegion);
  const townshipOptions = getTownships(stateRegion, district);

  const propertyTypeOptions = [
    { value: "land", label: "Land" },
    { value: "house", label: "House" },
    { value: "apartment", label: "Apartment" },
    { value: "mini_condo", label: "Mini condo" },
    { value: "condo", label: "Condo" },
    { value: "serviced_apartment", label: "Serviced apartment" },
    { value: "shop_office", label: "Shop/Office" },
    { value: "hotel_restaurant", label: "Hotel/Restaurant" },
    { value: "warehouse", label: "Warehouse" },
  ];

  const buyBudgetOptions = [
    { value: "0-1000", label: "Up to 1,000 Lakh" },
    { value: "1000-5000", label: "1,000–5,000 Lakh" },
    { value: "5000-50000", label: "5,000–50,000 Lakh" },
    { value: "50000-100000", label: "50,000–100,000 Lakh" },
    { value: "100000+", label: "100,000+ Lakh" },
  ];

  const rentBudgetOptions = [
    { value: "0-5", label: "Up to 5 Lakh" },
    { value: "5-10", label: "5–10 Lakh" },
    { value: "10-20", label: "10–20 Lakh" },
    { value: "20-50", label: "20–50 Lakh" },
    { value: "50-100", label: "50–100 Lakh" },
    { value: "100+", label: "100+ Lakh" },
  ];

  const budgetOptions = dealType === "rent" ? rentBudgetOptions : buyBudgetOptions;

  return (
    <div>
      <SiteHeader />
      <PageShell>
        <TitleRow>
          <SectionTitle>New inquiry</SectionTitle>
          <BackButton type="button" onClick={() => router.back()}>
            Back
          </BackButton>
        </TitleRow>
        <Muted>Tell us what you want to buy or rent. We’ll follow up inside your activities.</Muted>
        {!user && (
          <Panel style={{ display: "grid", gap: "10px" }}>
            <Muted>Sign in to submit an inquiry.</Muted>
            <PrimaryButton type="button" onClick={() => router.push("/auth")}>
              Sign in
            </PrimaryButton>
          </Panel>
        )}
        {user && (
          <Panel style={{ display: "grid", gap: "16px" }}>
          <FieldGroup>
            <CustomSelect
              id="inquiry-deal-type"
              name="deal_type"
              label="Deal type"
              value={dealType}
              onChange={(value) => setDealType(value)}
            >
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
            </CustomSelect>
            <CustomSelect
              id="inquiry-property-type"
              name="property_type"
              label="Property type"
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
              label="Preferred state/region"
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
              label="Preferred city (district)"
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
              label="Preferred township"
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
            label="Budget range (Lakh)"
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
            label="Timeline"
            value={timeline}
            onChange={(value) => setTimeline(value)}
          >
            <option value="asap">ASAP</option>
            <option value="1-3">1–3 months</option>
            <option value="3-6">3–6 months</option>
            <option value="browsing">Just browsing</option>
          </CustomSelect>

          <FieldGroup>
            <strong>Requirements</strong>
            <TileGrid>
              <Tile type="button" $active={needParking} onClick={() => setNeedParking(!needParking)}>
                Need parking
              </Tile>
              <Tile type="button" $active={needLift} onClick={() => setNeedLift(!needLift)}>
                Need lift
              </Tile>
              <Tile type="button" $active={needSolar} onClick={() => setNeedSolar(!needSolar)}>
                Need solar
              </Tile>
              <Tile
                type="button"
                $active={needGenerator}
                onClick={() => setNeedGenerator(!needGenerator)}
              >
                Need generator
              </Tile>
            </TileGrid>
          </FieldGroup>

          {error && <Muted style={{ color: "var(--color-danger)" }}>{error}</Muted>}
          {success ? (
            <Muted>Thanks. Our team will contact you shortly.</Muted>
          ) : (
            <PrimaryButton type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit inquiry"}
            </PrimaryButton>
          )}
        </Panel>
        )}
      </PageShell>
      <BottomNav />
      {submitting && <LoadingOverlay message="Submitting inquiry..." />}
      {success && (
        <SuccessOverlay>
          <SuccessModal>
            <strong>Thanks. Our team will contact you shortly.</strong>
            <ActionRow>
              <GhostButton type="button" onClick={() => router.push("/")}>
                Browse listings
              </GhostButton>
              <PrimaryButton type="button" onClick={() => router.push("/activities")}>
                Go to activities
              </PrimaryButton>
            </ActionRow>
          </SuccessModal>
        </SuccessOverlay>
      )}
    </div>
  );
}
