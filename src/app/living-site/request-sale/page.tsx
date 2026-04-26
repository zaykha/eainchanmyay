"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import styled, { css, keyframes } from "styled-components";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  BatteryCharging,
  Building2,
  CheckCircle2,
  ChevronRight,
  Home,
  Hotel,
  MapPin,
  ParkingSquare,
  Store,
  Sun,
  TowerControl,
  Warehouse,
} from "lucide-react";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { SectionTitle, Panel } from "@/app/living-site/components/PageSection";
import { useAppState } from "@/app/living-site/lib/app-state";
import { getDistricts, getStates, getTownships } from "@/app/living-site/lib/myanmar-geo";
import { CustomInput } from "@/app/living-site/components/form-controls/CustomInput";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { CustomTextarea } from "@/app/living-site/components/form-controls/CustomTextarea";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { getSalesRequestById, updateSalesRequest } from "@/app/living-site/lib/data";
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

const Stepper = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const StepPill = styled.span<{ $active?: boolean; $completed?: boolean }>`
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: ${(props) => {
    if (props.$completed) {
      return "color-mix(in srgb, var(--color-primary) 16%, transparent)";
    }
    return props.$active
      ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
      : "var(--color-surface-2)";
  }};
  color: ${(props) => {
    if (props.$completed) return "var(--color-primary)";
    return props.$active ? "var(--color-primary)" : "var(--color-muted)";
  }};
  font-weight: 600;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const FormCard = styled(Panel)`
  display: grid;
  gap: 14px;
  background: var(--color-surface-2);
`;

const TileGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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
  font-size: 0.82rem;
  text-align: center;
  line-height: 1.15;
  cursor: pointer;
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  background: var(--color-surface-2);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-muted);
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--color-danger);
  font-weight: 600;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const attentionShake = keyframes`
  0% {
    transform: translateX(0);
  }
  30% {
    transform: translateX(-3px);
  }
  60% {
    transform: translateX(3px);
  }
  100% {
    transform: translateX(0);
  }
`;

const MapFrame = styled.div`
  position: relative;
  border-radius: 16px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface-2);
  overflow: hidden;
  min-height: 280px;
`;

const MapCanvas = styled.div<{ $inactive?: boolean }>`
  width: 100%;
  height: 320px;
  filter: ${(props) => (props.$inactive ? "blur(4px)" : "none")};
  transition: filter 0.2s ease;
  pointer-events: ${(props) => (props.$inactive ? "none" : "auto")};

  .leaflet-container {
    width: 100%;
    height: 100%;
    background: var(--color-surface);
  }
`;

const MapOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(9, 13, 22, 0.65);
  color: var(--color-text);
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  pointer-events: none;
`;

const MapActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const MapButton = styled.button<{ $attention?: boolean }>`
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  background: var(--color-surface-2);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  ${(props) =>
    props.$attention
      ? css`
          animation: ${attentionShake} 0.6s ease;
        `
      : ""}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MapHelper = styled.p`
  margin: 0;
  color: var(--color-muted);
  font-size: 0.85rem;
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
  animation: ${fadeIn} 0.2s ease-out;
`;

type Option = { value: string; label: string };
type OptionDefinition = { value: string; labelKey: string };

const dealTypeOptions: OptionDefinition[] = [
  { value: "sale", labelKey: "requestSale.dealType.sale" },
  { value: "rent", labelKey: "requestSale.dealType.rent" },
];

const propertyTypeOptions: OptionDefinition[] = [
  { value: "land", labelKey: "requestSale.propertyType.land" },
  { value: "house", labelKey: "requestSale.propertyType.house" },
  { value: "apartment", labelKey: "requestSale.propertyType.apartment" },
  { value: "mini_condo", labelKey: "requestSale.propertyType.miniCondo" },
  { value: "condo", labelKey: "requestSale.propertyType.condo" },
  { value: "serviced_apartment", labelKey: "requestSale.propertyType.serviced" },
  { value: "shop_office", labelKey: "requestSale.propertyType.shopOffice" },
  { value: "hotel_restaurant", labelKey: "requestSale.propertyType.hotelRestaurant" },
  { value: "warehouse", labelKey: "requestSale.propertyType.warehouse" },
];

const currencyOptions: Option[] = [
  { value: "MMK", label: "MMK" },
  { value: "USD", label: "USD" },
  { value: "CNY", label: "CNY" },
  { value: "THB", label: "THB" },
];

const stepKeys = [
  "requestSale.steps.basics",
  "requestSale.steps.location",
  "requestSale.steps.details",
  "requestSale.steps.pricing",
  "requestSale.steps.contact",
];

const MYANMAR_CENTER: [number, number] = [21.9162, 95.956];
const DEFAULT_ZOOM = 6;

const RequestSaleMap = dynamic(() => import("./RequestSaleMap"), { ssr: false });

type FormState = {
  title: string;
  description: string;
  deal_type: string;
  property_type: string;
  price: string;
  currency: string;
  state_region: string;
  district: string;
  city: string;
  township: string;
  address_text: string;
  bedrooms: string;
  bathrooms: string;
  area_sqft: string;
  has_lift: boolean;
  has_backup_power: boolean;
  backup_power_type: "solar" | "generator" | "solar_generator" | "";
  has_parking: boolean;
  latitude: string;
  longitude: string;
  owner_name: string;
  owner_phone: string;
  owner_phone_secondary: string;
};

const initialState: FormState = {
  title: "",
  description: "",
  deal_type: "sale",
  property_type: "house",
  price: "",
  currency: "MMK",
  state_region: "",
  district: "",
  city: "",
  township: "",
  address_text: "",
  bedrooms: "",
  bathrooms: "",
  area_sqft: "",
  has_lift: false,
  has_backup_power: false,
  backup_power_type: "",
  has_parking: false,
  latitude: "",
  longitude: "",
  owner_name: "",
  owner_phone: "",
  owner_phone_secondary: "",
};

const toNullableNumber = (value: string) => {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNullableString = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toFormNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
};

const toBackupPowerType = (value: unknown): FormState["backup_power_type"] => {
  if (value === "solar" || value === "generator" || value === "solar_generator") {
    return value;
  }
  return "";
};

function RequestSalePageContent() {
  const { user, profileRole, profileReady } = useAppState();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const isEdit = Boolean(editId);
  const fieldId = useId();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [mapActive, setMapActive] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locateAttempted, setLocateAttempted] = useState(false);
  const [mapPosition, setMapPosition] = useState<[number, number] | null>(null);
  const [attention, setAttention] = useState(false);
  const stepLabels = useMemo(() => stepKeys.map((key) => t(key)), [t]);
  const localizedDealTypeOptions = useMemo<Option[]>(
    () => dealTypeOptions.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  );
  const localizedPropertyTypeOptions = useMemo<Option[]>(
    () =>
      propertyTypeOptions.map((option) => ({ value: option.value, label: t(option.labelKey) })),
    [t]
  );
  const prevLocationRef = useRef({
    state_region: "",
    district: "",
    township: "",
  });

  useEffect(() => {
    if (!editId || !user?.id) return;
    let active = true;
    setLoadingEdit(true);
    getSalesRequestById(user.id, editId)
      .then(({ request, error: loadError }) => {
        if (!active) return;
        if (loadError) {
          setError(loadError);
          return;
        }
        if (!request) {
          setError(t("requestSale.error.load"));
          return;
        }
        const rawPrice = typeof request.price === "number" ? request.price / 100000 : null;
        setForm({
          title: String(request.title ?? ""),
          description: String(request.description ?? ""),
          deal_type: String(request.deal_type ?? "sale"),
          property_type: String(request.property_type ?? "house"),
          price: rawPrice ? String(rawPrice) : "",
          currency: String(request.currency ?? "MMK"),
          state_region: String(request.state_region ?? ""),
          district: String(request.district ?? ""),
          city: String(request.city ?? ""),
          township: String(request.township ?? ""),
          address_text: String(request.address_text ?? ""),
          bedrooms: toFormNumber(request.bedrooms),
          bathrooms: toFormNumber(request.bathrooms),
          area_sqft: toFormNumber(request.area_sqft),
          has_lift: Boolean(request.has_lift),
          has_backup_power: Boolean(request.has_backup_power),
          backup_power_type: toBackupPowerType(request.backup_power_type),
          has_parking: Boolean(request.has_parking),
          latitude: toFormNumber(request.latitude),
          longitude: toFormNumber(request.longitude),
          owner_name: String(request.owner_name ?? ""),
          owner_phone: String(request.owner_phone ?? ""),
          owner_phone_secondary: String(request.owner_phone_secondary ?? ""),
        });
      })
      .finally(() => {
        if (active) setLoadingEdit(false);
      });

    return () => {
      active = false;
    };
  }, [editId, user?.id, t]);

  const isLand = form.property_type === "land";
  const locationReady = Boolean(form.state_region && form.district && form.township);

  const backupTiles = useMemo(
    () => [
      { key: "solar", label: t("requestSale.backupPower.solar"), icon: Sun },
      { key: "generator", label: t("requestSale.backupPower.generator"), icon: BatteryCharging },
    ],
    [t]
  );

  const states = useMemo(() => getStates(), []);
  const districts = useMemo(
    () => getDistricts(form.state_region),
    [form.state_region]
  );
  const townships = useMemo(
    () => getTownships(form.state_region, form.district),
    [form.state_region, form.district]
  );

  useEffect(() => {
    if (!locationReady) return;
    const timeout = setTimeout(() => setAttention(false), 700);
    setAttention(true);
    return () => clearTimeout(timeout);
  }, [locationReady]);

  useEffect(() => {
    const prev = prevLocationRef.current;
    const hasChanged =
      prev.state_region &&
      (prev.state_region !== form.state_region ||
        prev.district !== form.district ||
        prev.township !== form.township);

    if (hasChanged) {
      setMapActive(false);
      setMapLoading(false);
      setLocateAttempted(false);
      setMapPosition(null);
      setForm((current) => ({ ...current, latitude: "", longitude: "" }));
    }

    prevLocationRef.current = {
      state_region: form.state_region,
      district: form.district,
      township: form.township,
    };
  }, [form.state_region, form.district, form.township]);

  useEffect(() => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setMapPosition([lat, lng]);
      return;
    }
    if (!mapActive) {
      setMapPosition(null);
    }
  }, [form.latitude, form.longitude, mapActive]);

  const propertyTiles = useMemo(
    () => [
      { key: "land", label: t("requestSale.propertyType.land"), icon: MapPin },
      { key: "house", label: t("requestSale.propertyType.house"), icon: Home },
      { key: "apartment", label: t("requestSale.propertyType.apartment"), icon: Building2 },
      { key: "mini_condo", label: t("requestSale.propertyType.miniCondo"), icon: Building2 },
      { key: "condo", label: t("requestSale.propertyType.condo"), icon: TowerControl },
      { key: "serviced_apartment", label: t("requestSale.propertyType.serviced"), icon: Building2 },
      { key: "shop_office", label: t("requestSale.propertyType.shopOffice"), icon: Store },
      { key: "hotel_restaurant", label: t("requestSale.propertyType.hotelRestaurant"), icon: Hotel },
      { key: "warehouse", label: t("requestSale.propertyType.warehouse"), icon: Warehouse },
    ],
    [t]
  );

  const handleLocateOnMap = async () => {
    if (!locationReady) return;
    setMapError(null);
    setMapLoading(true);
    setMapActive(false);
    setLocateAttempted(true);

    const query = `${form.township}, ${form.district}, ${form.state_region}, Myanmar`;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          query
        )}`
      );
      const result = await response.json();
      const first = result?.[0];
      if (!first) {
        setMapError(t("requestSale.error.locationNotFound"));
        return;
      }
      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setMapError(t("requestSale.error.locationNotFound"));
        return;
      }
      setMapPosition([lat, lng]);
      setMapActive(true);
      setForm((current) => ({
        ...current,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
    } catch {
      setMapError(t("requestSale.error.locate"));
    } finally {
      setMapLoading(false);
    }
  };

  const handleUseLatLng = async () => {
    setMapError(null);
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setMapError(t("requestSale.error.latLng"));
      return;
    }

    setMapLoading(true);
    setMapActive(false);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const result = await response.json();
      const address = result?.address;
      const state =
        address?.state || address?.region || address?.state_district || address?.province;
      const district =
        address?.county || address?.district || address?.city_district || address?.region;
      const township =
        address?.township || address?.suburb || address?.neighbourhood || address?.city;

      if (!state || !district || !township) {
        setMapError(t("requestSale.error.latLngNoMatch"));
        return;
      }

      prevLocationRef.current = {
        state_region: state,
        district,
        township,
      };
      setForm((current) => ({
        ...current,
        state_region: state,
        district,
        township,
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
      }));
      setMapPosition([lat, lng]);
      setMapActive(true);
    } catch {
      setMapError(t("requestSale.error.latLngNoMatch"));
    } finally {
      setMapLoading(false);
    }
  };

  const handleMapSelect = (lat: number, lng: number) => {
    setMapError(null);
    setMapActive(true);
    setLocateAttempted(true);
    setForm((current) => ({
      ...current,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
    setMapPosition([lat, lng]);
  };

  const handleNext = () => {
    setError(null);
    if (step === 0 && !form.title.trim()) {
      setError(t("requestSale.error.titleRequired"));
      return;
    }
    if (
      step === 1 &&
      (!form.state_region.trim() || !form.district.trim() || !form.township.trim())
    ) {
      setError(t("requestSale.error.locationRequired"));
      return;
    }
    if (step === 3 && !form.price.trim()) {
      setError(t("requestSale.error.priceRequired"));
      return;
    }
    setStep((prev) => Math.min(stepKeys.length - 1, prev + 1));
  };

  const handleSubmit = async () => {
    setError(null);
    if (
      !form.title.trim() ||
      !form.state_region.trim() ||
      !form.district.trim() ||
      !form.township.trim()
    ) {
      setError(t("requestSale.error.completeRequired"));
      return;
    }
    if (!form.price.trim()) {
      setError(t("requestSale.error.priceRequired"));
      return;
    }
    if (form.has_backup_power && !form.backup_power_type) {
      setError(t("requestSale.error.backupRequired"));
      return;
    }

    const payload = {
      user_id: user?.id ?? null,
      title: form.title.trim(),
      description: toNullableString(form.description),
      deal_type: form.deal_type,
      property_type: form.property_type,
      price: Number(form.price) * 100000,
      currency: form.currency,
      state_region: form.state_region.trim(),
      district: toNullableString(form.district),
      city: toNullableString(form.city),
      township: form.township.trim(),
      address_text: toNullableString(form.address_text),
      bedrooms: isLand ? null : toNullableNumber(form.bedrooms),
      bathrooms: isLand ? null : toNullableNumber(form.bathrooms),
      area_sqft: toNullableNumber(form.area_sqft),
      commission_percent: null,
      has_lift: isLand ? false : form.has_lift,
      has_backup_power: isLand ? false : form.has_backup_power,
      backup_power_type: isLand ? null : form.backup_power_type || null,
      has_parking: isLand ? false : form.has_parking,
      latitude: toNullableNumber(form.latitude),
      longitude: toNullableNumber(form.longitude),
      owner_name: toNullableString(form.owner_name),
      owner_phone: toNullableString(form.owner_phone),
      owner_phone_secondary: toNullableString(form.owner_phone_secondary),
    };

    setSubmitting(true);
    if (isEdit && editId) {
      if (!user?.id) {
        setSubmitting(false);
        setError(t("requestSale.error.signIn"));
        return;
      }
      const result = await updateSalesRequest({
        id: editId,
        userId: user.id,
        title: form.title.trim(),
        description: toNullableString(form.description),
        dealType: form.deal_type,
        propertyType: form.property_type,
        price: Number(form.price) * 100000,
        currency: form.currency,
        stateRegion: form.state_region.trim(),
        district: toNullableString(form.district),
        city: toNullableString(form.city),
        township: form.township.trim(),
        addressText: toNullableString(form.address_text),
        bedrooms: isLand ? null : toNullableNumber(form.bedrooms),
        bathrooms: isLand ? null : toNullableNumber(form.bathrooms),
        areaSqft: toNullableNumber(form.area_sqft),
        hasLift: isLand ? false : form.has_lift,
        hasBackupPower: isLand ? false : form.has_backup_power,
        backupPowerType: isLand ? null : form.backup_power_type || null,
        hasParking: isLand ? false : form.has_parking,
        latitude: toNullableNumber(form.latitude),
        longitude: toNullableNumber(form.longitude),
        ownerName: toNullableString(form.owner_name),
        ownerPhone: toNullableString(form.owner_phone),
        ownerPhoneSecondary: toNullableString(form.owner_phone_secondary),
      });
      setSubmitting(false);
      if (!result.ok) {
        setError(result.message ?? t("requestSale.error.updateFailed"));
        return;
      }
    } else {
      const response = await fetch("/api/public/sales-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSubmitting(false);

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setError(result.message ?? t("requestSale.error.submitFailed"));
        return;
      }
    }

    setSuccess(true);
    setForm(initialState);
    setStep(0);
  };

  const setField = (key: keyof FormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (!user) {
    return (
      <div>
        <SiteHeader />
        <PageShell>
          <SectionTitle>{t("requestSale.titleNew")}</SectionTitle>
          <Panel>
            <Muted>{t("requestSale.signInPrompt")}</Muted>
            <PrimaryButton type="button" onClick={() => router.push("/auth")}>
              {t("requestSale.signInContinue")}
            </PrimaryButton>
          </Panel>
        </PageShell>
        <BottomNav />
      </div>
    );
  }

  if (!profileReady) {
    return (
      <div>
        <SiteHeader />
        <PageShell>
          <Panel>
            <Muted>Loading workspace access…</Muted>
          </Panel>
        </PageShell>
        <BottomNav />
      </div>
    );
  }

  if (profileRole !== "vendor_user" && profileRole !== "staff" && profileRole !== "admin" && profileRole !== "master_admin") {
    return (
      <div>
        <SiteHeader />
        <PageShell>
          <SectionTitle>{t("requestSale.titleNew")}</SectionTitle>
          <Panel>
            <Muted>Only vendor accounts can access this workflow.</Muted>
            <PrimaryButton type="button" onClick={() => router.push("/")}>
              Back to home
            </PrimaryButton>
          </Panel>
        </PageShell>
        <BottomNav />
      </div>
    );
  }

  return (
    <div>
      <SiteHeader />
      <PageShell>
        <TitleRow>
          <SectionTitle>
            {isEdit ? t("requestSale.titleEdit") : t("requestSale.titleNew")}
          </SectionTitle>
          <BackButton type="button" onClick={() => router.back()}>
            {t("common.back")}
          </BackButton>
        </TitleRow>
        <Muted>
          {isEdit
            ? t("requestSale.subtitleEdit")
            : t("requestSale.subtitleNew")}
        </Muted>
        <Stepper>
          {stepLabels.map((label, index) => (
            <StepPill key={label} $active={index === step} $completed={index < step}>
              {index < step && <CheckCircle2 size={14} />}
              {label}
            </StepPill>
          ))}
        </Stepper>

        <FormCard>
          {step === 0 && (
            <>
              <CustomInput
                id={`${fieldId}-title`}
                label={t("requestSale.titleLabel")}
                name="title"
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
              />
              <CustomTextarea
                id={`${fieldId}-description`}
                label={t("requestSale.descriptionLabel")}
                name="description"
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
              />
              <CustomSelect
                id={`${fieldId}-deal-type`}
                label={t("requestSale.dealTypeLabel")}
                name="deal_type"
                value={form.deal_type}
                onChange={(value) => setField("deal_type", value)}
              >
                {localizedDealTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CustomSelect>
              <CustomSelect
                id={`${fieldId}-property-type`}
                label={t("requestSale.propertyTypeLabel")}
                name="property_type"
                value={form.property_type}
                onChange={(value) => setField("property_type", value)}
              >
                {localizedPropertyTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CustomSelect>
              <TileGrid>
                {propertyTiles.map((tile) => (
                  <Tile
                    key={tile.key}
                    type="button"
                    $active={form.property_type === tile.key}
                    onClick={() => setField("property_type", tile.key)}
                  >
                    <tile.icon size={18} />
                    {tile.label}
                  </Tile>
                ))}
              </TileGrid>
            </>
          )}

          {step === 1 && (
            <>
              <CustomSelect
                id={`${fieldId}-state-region`}
                label={t("requestSale.stateRegionLabel")}
                name="state_region"
                value={form.state_region}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    state_region: value,
                    district: "",
                    township: "",
                  }))
                }
              >
                {states.map((state) => (
                  <option key={state.pcode} value={state.name_en}>
                    {state.name_en}
                  </option>
                ))}
              </CustomSelect>
              <CustomSelect
                id={`${fieldId}-district`}
                label={t("requestSale.cityLabel")}
                name="district"
                value={form.district}
                disabled={!form.state_region}
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    district: value,
                    township: "",
                  }))
                }
              >
                {districts.map((district) => (
                  <option key={district.pcode} value={district.name_en}>
                    {district.name_en}
                  </option>
                ))}
              </CustomSelect>
              <CustomSelect
                id={`${fieldId}-township`}
                label={t("requestSale.townshipLabel")}
                name="township"
                value={form.township}
                disabled={!form.district}
                onChange={(value) => setField("township", value)}
              >
                {townships.map((township) => (
                  <option key={township.pcode} value={township.name_en}>
                    {township.name_en}
                  </option>
                ))}
              </CustomSelect>
              <CustomTextarea
                id={`${fieldId}-address-text`}
                label={t("requestSale.addressLabel")}
                name="address_text"
                value={form.address_text}
                onChange={(event) => setField("address_text", event.target.value)}
              />
              <MapActions>
                <MapButton
                  type="button"
                  onClick={handleLocateOnMap}
                  disabled={!locationReady || mapLoading}
                  $attention={locationReady && !mapActive && attention}
                >
                  {t("requestSale.locateOnMap")}
                </MapButton>
                {locateAttempted && (
                  <MapButton type="button" onClick={handleUseLatLng} disabled={mapLoading}>
                    {t("requestSale.useLatLng")}
                  </MapButton>
                )}
              </MapActions>
              <MapHelper>{t("requestSale.mapHelper")}</MapHelper>
              <MapFrame>
                <MapCanvas $inactive={!mapActive || mapLoading}>
                  <RequestSaleMap
                    center={MYANMAR_CENTER}
                    defaultZoom={DEFAULT_ZOOM}
                    active={mapActive}
                    position={mapPosition}
                    onSelect={handleMapSelect}
                  />
                </MapCanvas>
                {(!mapActive || mapLoading) && (
                  <MapOverlay>{mapLoading ? t("common.loading") : "?"}</MapOverlay>
                )}
              </MapFrame>
              <CustomInput
                id={`${fieldId}-latitude`}
                label={t("requestSale.latitudeLabel")}
                name="latitude"
                value={form.latitude}
                onChange={(event) => setField("latitude", event.target.value)}
              />
              <CustomInput
                id={`${fieldId}-longitude`}
                label={t("requestSale.longitudeLabel")}
                name="longitude"
                value={form.longitude}
                onChange={(event) => setField("longitude", event.target.value)}
              />
              {mapError && <ErrorText>{mapError}</ErrorText>}
            </>
          )}

          {step === 2 && (
            <>
              <CustomInput
                id={`${fieldId}-area-sqft`}
                label={t("requestSale.areaLabel")}
                name="area_sqft"
                value={form.area_sqft}
                onChange={(event) => setField("area_sqft", event.target.value)}
              />
              {!isLand && (
                <>
                  <CustomInput
                    id={`${fieldId}-bedrooms`}
                    label={t("requestSale.bedroomsLabel")}
                    name="bedrooms"
                    value={form.bedrooms}
                    onChange={(event) => setField("bedrooms", event.target.value)}
                  />
                  <CustomInput
                    id={`${fieldId}-bathrooms`}
                    label={t("requestSale.bathroomsLabel")}
                    name="bathrooms"
                    value={form.bathrooms}
                    onChange={(event) => setField("bathrooms", event.target.value)}
                  />
                </>
              )}
              {!isLand && (
                <>
                  <TileGrid>
                    <Tile
                      type="button"
                      $active={form.has_lift}
                      onClick={() => setField("has_lift", !form.has_lift)}
                    >
                      <TowerControl size={18} />
                      {t("requestSale.lift")}
                    </Tile>
                    <Tile
                      type="button"
                      $active={form.has_parking}
                      onClick={() => setField("has_parking", !form.has_parking)}
                    >
                      <ParkingSquare size={18} />
                      {t("requestSale.parking")}
                    </Tile>
                  </TileGrid>
                  <Muted>{t("requestSale.backupPower")}</Muted>
                  <TileGrid>
                    {backupTiles.map((tile) => {
                      const active =
                        form.backup_power_type === tile.key ||
                        form.backup_power_type === "solar_generator";
                      return (
                        <Tile
                          key={tile.key}
                          type="button"
                          $active={active}
                          onClick={() => {
                            const hasSolar =
                              form.backup_power_type === "solar" ||
                              form.backup_power_type === "solar_generator";
                            const hasGenerator =
                              form.backup_power_type === "generator" ||
                              form.backup_power_type === "solar_generator";
                            const nextSolar =
                              tile.key === "solar" ? !hasSolar : hasSolar;
                            const nextGenerator =
                              tile.key === "generator" ? !hasGenerator : hasGenerator;
                            let nextType: FormState["backup_power_type"] = "";
                            if (nextSolar && nextGenerator) nextType = "solar_generator";
                            else if (nextSolar) nextType = "solar";
                            else if (nextGenerator) nextType = "generator";
                            setField("backup_power_type", nextType);
                            setField("has_backup_power", Boolean(nextType));
                          }}
                        >
                          <tile.icon size={18} />
                          {tile.label}
                        </Tile>
                      );
                    })}
                  </TileGrid>
                </>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <CustomInput
                id={`${fieldId}-price`}
                label={t("requestSale.priceLabel")}
                name="price"
                value={form.price}
                onChange={(event) => setField("price", event.target.value)}
              />
              <CustomSelect
                id={`${fieldId}-currency`}
                label={t("requestSale.currencyLabel")}
                name="currency"
                value={form.currency}
                onChange={(value) => setField("currency", value)}
              >
                {currencyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CustomSelect>
            </>
          )}

          {step === 4 && (
            <>
              <CustomInput
                id={`${fieldId}-owner-name`}
                label={t("requestSale.contactNameLabel")}
                name="owner_name"
                value={form.owner_name}
                onChange={(event) => setField("owner_name", event.target.value)}
              />
              <CustomInput
                id={`${fieldId}-owner-phone`}
                label={t("requestSale.contactPhoneLabel")}
                name="owner_phone"
                value={form.owner_phone}
                onChange={(event) => setField("owner_phone", event.target.value)}
              />
              <CustomInput
                id={`${fieldId}-owner-phone-secondary`}
                label={t("requestSale.contactPhoneSecondaryLabel")}
                name="owner_phone_secondary"
                value={form.owner_phone_secondary}
                onChange={(event) => setField("owner_phone_secondary", event.target.value)}
              />
            </>
          )}

          {error && <ErrorText>{error}</ErrorText>}

          <Actions>
            <SecondaryButton
              type="button"
              onClick={() => setStep((prev) => Math.max(0, prev - 1))}
              disabled={step === 0}
            >
              {t("common.back")}
            </SecondaryButton>
            {step < stepKeys.length - 1 ? (
              <PrimaryButton type="button" onClick={handleNext}>
                {t("common.next")}
                <ChevronRight size={16} style={{ marginLeft: 6 }} />
              </PrimaryButton>
            ) : (
              <PrimaryButton type="button" onClick={handleSubmit} disabled={submitting || loadingEdit}>
                {loadingEdit
                  ? t("common.loading")
                  : submitting
                    ? t("common.submitting")
                    : isEdit
                      ? t("common.saveChanges")
                      : t("listing.submitRequest")}
              </PrimaryButton>
            )}
          </Actions>
        </FormCard>
      </PageShell>
      <BottomNav />
      {(submitting || loadingEdit) && (
        <LoadingOverlay
          message={loadingEdit ? t("requestSale.loadingRequest") : t("requestSale.submittingRequest")}
        />
      )}
      {success && (
        <SuccessOverlay>
          <SuccessModal>
            <strong>{isEdit ? t("requestSale.successUpdated") : t("requestSale.successThanks")}</strong>
            <Muted>
              {isEdit
                ? t("requestSale.successReviewUpdate")
                : t("requestSale.successReviewNew")}
            </Muted>
            <Actions>
              <SecondaryButton type="button" onClick={() => router.push("/")}>
                {t("requestSale.browseListings")}
              </SecondaryButton>
              <PrimaryButton type="button" onClick={() => router.push("/activities")}>
                {t("requestSale.goActivities")}
              </PrimaryButton>
            </Actions>
          </SuccessModal>
        </SuccessOverlay>
      )}
    </div>
  );
}

export default function RequestSalePage() {
  return (
    <Suspense fallback={<LoadingOverlay message="Loading..." />}>
      <RequestSalePageContent />
    </Suspense>
  );
}
