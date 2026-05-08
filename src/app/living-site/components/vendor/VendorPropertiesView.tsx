"use client";

import { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { formatPropertyTypeValue, propertyTypeDefinitions } from "@/lib/property-types";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Building2,
  Calendar,
  Filter,
  Home,
  Hotel,
  LandPlot,
  MapPin,
  Plus,
  Search,
  Store,
  Warehouse,
} from "lucide-react";
import { useAppState } from "@/app/living-site/lib/app-state";
import { formatCurrency } from "@/app/living-site/lib/format";
import { LoadingOverlay } from "@/app/living-site/components/LoadingOverlay";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";

const Page = styled.div<{ $embedded?: boolean }>`
  display: grid;
  gap: ${(props) => (props.$embedded ? "16px" : "20px")};
`;

const Header = styled.div<{ $embedded?: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const Heading = styled.div`
  display: grid;
  gap: 6px;
`;

const Title = styled.h1<{ $embedded?: boolean }>`
  margin: 0;
  font-size: ${(props) => (props.$embedded ? "1.25rem" : "clamp(1.8rem, 3vw, 2.4rem)")};
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
`;

const Subtitle = styled.p<{ $embedded?: boolean }>`
  margin: 0;
  color: ${(props) => (props.$embedded ? "var(--color-muted)" : "#98a2b3")};
  line-height: 1.55;
`;

const ActionLink = styled(Link)<{ $embedded?: boolean }>`
  min-height: 46px;
  padding: 0 18px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: ${(props) => (props.$embedded ? "var(--gradient)" : "linear-gradient(135deg, #ff3d5d 0%, #e91b42 100%)")};
  color: white;
  font-weight: 700;
`;

const Filters = styled.form`
  display: grid;
  grid-template-columns: minmax(220px, 1.5fr) repeat(3, minmax(0, 0.6fr));
  gap: 12px;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SearchField = styled.div<{ $embedded?: boolean }>`
  position: relative;
  min-width: 0;
`;

const Input = styled.input<{ $embedded?: boolean }>`
  min-height: 46px;
  border-radius: 14px;
  border: 1px solid ${(props) => (props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.08)")};
  background: ${(props) => (props.$embedded ? "var(--color-surface)" : "#151b29")};
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
  padding: 0 52px 0 14px;
  width: 100%;
`;

const SearchButton = styled.button<{ $embedded?: boolean }>`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid ${(props) => (props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.08)")};
  background: ${(props) => (props.$embedded ? "var(--color-surface-2)" : "#1b2231")};
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    background 140ms ease,
    border-color 140ms ease,
    transform 140ms ease;

  &:hover {
    background: ${(props) => (props.$embedded ? "color-mix(in srgb, var(--color-surface-2) 88%, white)" : "#20293a")};
    border-color: color-mix(in srgb, var(--color-primary) 18%, var(--color-outline));
  }

  &:active {
    transform: translateY(-50%) scale(0.98);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const EmbeddedViewport = styled.div`
  min-height: 640px;
  max-height: 640px;
  overflow: visible;
  display: grid;
  align-content: start;
`;

const EmbeddedScroller = styled.div`
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: visible;
  padding-top: 14px;
  padding-right: 6px;
  display: grid;
  align-content: start;
  gap: 14px;
`;

const EmbeddedLoadingState = styled.div`
  min-height: 640px;
  border-radius: 24px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface-2) 72%, white);
  display: grid;
  place-items: center;
  color: var(--color-text);
  font-weight: 700;
`;

const EmbeddedCardButton = styled.button`
  display: grid;
  width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
`;

const Card = styled.div<{ $embedded?: boolean }>`
  position: relative;
  border-radius: 22px;
  border: 1px solid ${(props) => (props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.08)")};
  background: ${(props) => (props.$embedded ? "var(--color-surface-2)" : "#151b29")};
  padding: ${(props) => (props.$embedded ? "18px 12px 12px" : "18px")};
  display: grid;
  gap: ${(props) => (props.$embedded ? "10px" : "14px")};
  overflow: ${(props) => (props.$embedded ? "visible" : "hidden")};
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    background 160ms ease;

  &:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--color-primary) 18%, var(--color-outline));
    box-shadow: var(--frame-shadow);
    background: ${(props) => (props.$embedded ? "color-mix(in srgb, var(--color-surface-2) 88%, white)" : "#192132")};
  }
`;

const EmbeddedCardRow = styled.div`
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;

  @media (max-width: 720px) {
    grid-template-columns: 132px minmax(0, 1fr);
  }
`;

const EmbeddedThumb = styled.div<{ $image?: string }>`
  width: 100%;
  min-height: 0;
  aspect-ratio: 3 / 2;
  border-radius: 14px;
  background: ${(props) =>
    props.$image ? `center / cover no-repeat url(${props.$image})` : "color-mix(in srgb, var(--color-surface) 92%, white)"};
  display: grid;
  place-items: center;
  color: var(--color-muted);
  overflow: hidden;
  position: relative;

  svg {
    width: 22px;
    height: 22px;
  }
`;

const EmbeddedCardBody = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
  align-content: start;
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const CardTitle = styled.h2<{ $embedded?: boolean }>`
  margin: 0;
  font-size: ${(props) => (props.$embedded ? "0.95rem" : "1.05rem")};
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: ${(props) => (props.$embedded ? 2 : 3)};
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Meta = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const EmbeddedPrice = styled.div`
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.2;
`;

const Pill = styled.span<{ $embedded?: boolean }>`
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: ${(props) => (props.$embedded ? "color-mix(in srgb, var(--color-surface) 92%, white)" : "rgba(255, 255, 255, 0.06)")};
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#d9dfeb")};
  display: inline-flex;
  align-items: center;
  font-size: ${(props) => (props.$embedded ? "0.75rem" : "0.82rem")};
  font-weight: 600;
`;

const EmbeddedPill = styled(Pill)<{ $tone?: "neutral" | "deal" | "price" | "status" }>`
  min-height: 24px;
  padding: 0 8px;
  font-size: 0.72rem;
  border: 1px solid
    ${(props) =>
      props.$tone === "deal"
        ? "rgba(235, 35, 64, 0.14)"
        : props.$tone === "price"
        ? "rgba(59, 130, 246, 0.14)"
        : props.$tone === "status"
        ? "rgba(16, 185, 129, 0.14)"
        : "var(--color-outline)"};
  background:
    ${(props) =>
      props.$tone === "deal"
        ? "#fff1f3"
        : props.$tone === "price"
        ? "#eff6ff"
        : props.$tone === "status"
        ? "#ecfdf5"
        : "var(--color-surface)"};
  color:
    ${(props) =>
      props.$tone === "deal"
        ? "#b4233a"
        : props.$tone === "price"
        ? "#1d4ed8"
        : props.$tone === "status"
        ? "#0f766e"
        : "var(--color-text)"};
`;

const IconPill = styled(Pill)`
  gap: 6px;

  svg {
    width: 13px;
    height: 13px;
    flex: 0 0 13px;
  }
`;

const Row = styled.div<{ $embedded?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: ${(props) => (props.$embedded ? "var(--color-muted)" : "#c7cfdd")};
`;

const Strong = styled.span<{ $embedded?: boolean }>`
  color: ${(props) => (props.$embedded ? "var(--color-text)" : "#f8fafc")};
  font-weight: 700;
`;

const Footer = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`;

const EmbeddedFooterMeta = styled.div`
  display: grid;
  gap: 5px;
  min-width: 0;
`;

const EmbeddedPillRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const EmbeddedFloatingPills = styled(EmbeddedPillRow)`
  position: absolute;
  top: 0;
  left: 12px;
  z-index: 2;
  transform: translateY(-50%);
`;

const EmbeddedFooterLine = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--color-muted);
  font-size: 0.78rem;
  line-height: 1.25;

  svg {
    width: 13px;
    height: 13px;
    flex: 0 0 13px;
  }
`;

const EmbeddedLeftStack = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const PropertyTypeTag = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 84px;
  align-self: stretch;
  padding: 8px 4px;
  border-left: 1px solid var(--color-outline);
  color: var(--color-muted);
  font-size: 0.74rem;
  text-align: center;

  svg {
    width: 20px;
    height: 20px;
  }
`;

const EmptyCard = styled.div<{ $embedded?: boolean }>`
  border-radius: 24px;
  border: 1px dashed ${(props) => (props.$embedded ? "var(--color-outline)" : "rgba(255, 255, 255, 0.16)")};
  background: ${(props) => (props.$embedded ? "color-mix(in srgb, var(--color-surface-2) 72%, white)" : "rgba(255, 255, 255, 0.02)")};
  padding: 24px;
  color: ${(props) => (props.$embedded ? "var(--color-muted)" : "#97a0b2")};
  line-height: 1.65;
`;

const Notice = styled.div<{ $danger?: boolean; $embedded?: boolean }>`
  border-radius: 22px;
  border: 1px solid
    ${(props) =>
      props.$embedded
        ? props.$danger
          ? "rgba(255, 148, 148, 0.22)"
          : "rgba(255, 210, 92, 0.22)"
        : props.$danger
        ? "rgba(255, 148, 148, 0.22)"
        : "rgba(255, 210, 92, 0.22)"};
  background: ${(props) =>
    props.$embedded
      ? props.$danger
        ? "rgba(255, 148, 148, 0.08)"
        : "rgba(255, 210, 92, 0.08)"
      : props.$danger
      ? "rgba(255, 148, 148, 0.08)"
      : "rgba(255, 210, 92, 0.08)"};
  padding: 16px 18px;
  color: ${(props) =>
    props.$embedded
      ? props.$danger
        ? "#a61c2f"
        : "#7a5b00"
      : props.$danger
      ? "#ffd9df"
      : "#f2dfab"};
  line-height: 1.6;
`;

export type VendorPropertyItem = {
  id: string;
  title: string | null;
  deal_type: string | null;
  property_type: string | null;
  price: number | null;
  currency: string | null;
  status: string | null;
  district: string | null;
  township: string | null;
  city: string | null;
  appointments_count: number;
  verification_status: string | null;
  cover_image_url?: string | null;
};

type WorkspaceLimits = {
  limits?: {
    currentPlan?: {
      name: string;
    };
    listingCount?: number;
    listingLimit?: number;
    listingNearLimit?: boolean;
    listingOverLimit?: boolean;
    suggestedUpgrade?: {
      name: string;
      priceLabel: string;
    } | null;
  };
};

function labelize(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const SIMULATED_VARIANTS: Array<Partial<VendorPropertyItem> & { title: string }> = [
  {
    title: "Corner condo near Kandawgyi",
    deal_type: "sale",
    property_type: "condo",
    district: "Yangon East",
    township: "Tamwe",
    city: "Yangon",
    appointments_count: 6,
    price: 420000000,
  },
  {
    title: "Family house with quiet street access",
    deal_type: "sale",
    property_type: "house",
    district: "Yangon North",
    township: "Mayangone",
    city: "Yangon",
    appointments_count: 4,
    price: 950000000,
  },
  {
    title: "Main-road land plot for future development",
    deal_type: "sale",
    property_type: "land",
    district: "Bago",
    township: "Bago",
    city: "Bago",
    appointments_count: 3,
    price: 600000000,
  },
  {
    title: "Compact shop office for daily foot traffic",
    deal_type: "rent",
    property_type: "shop_office",
    district: "Downtown",
    township: "Lanmadaw",
    city: "Yangon",
    appointments_count: 2,
    price: 3500000,
    currency: "MMK",
  },
  {
    title: "Warehouse with truck access and high ceiling",
    deal_type: "rent",
    property_type: "warehouse",
    district: "Industrial Zone",
    township: "Hlaing Tharyar",
    city: "Yangon",
    appointments_count: 1,
    price: 7800000,
    currency: "MMK",
  },
  {
    title: "Mini condo with city-facing balcony",
    deal_type: "sale",
    property_type: "mini_condo",
    district: "Yangon Central",
    township: "Sanchaung",
    city: "Yangon",
    appointments_count: 5,
    price: 265000000,
  },
  {
    title: "Serviced apartment close to embassy row",
    deal_type: "rent",
    property_type: "serviced_apartment",
    district: "Golden Valley",
    township: "Bahan",
    city: "Yangon",
    appointments_count: 2,
    price: 4200000,
    currency: "MMK",
  },
  {
    title: "Restaurant space with ready kitchen layout",
    deal_type: "rent",
    property_type: "restaurant",
    district: "City Fringe",
    township: "Kamayut",
    city: "Yangon",
    appointments_count: 3,
    price: 6800000,
    currency: "MMK",
  },
];

function getDealTypeLabel(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "sale") return "Sale";
  if (normalized === "rent") return "Rent";
  return labelize(value);
}

function PropertyTypeIcon({ type }: { type: string | null | undefined }) {
  const normalized = String(type ?? "").trim().toLowerCase();
  if (normalized === "land") return <LandPlot />;
  if (normalized === "house") return <Home />;
  if (["condo", "mini_condo", "apartment", "serviced_apartment"].includes(normalized)) return <Building2 />;
  if (["shop", "shop_office", "marketplace", "restaurant"].includes(normalized)) return <Store />;
  if (normalized === "office") return <BriefcaseBusiness />;
  if (normalized === "hotel") return <Hotel />;
  if (["warehouse", "industrial"].includes(normalized)) return <Warehouse />;
  return <Building2 />;
}

type VendorPropertiesViewProps = {
  embedded?: boolean;
  hideHeader?: boolean;
  title?: string;
  subtitle?: string;
  simulateCount?: number;
  onSelectProperty?: (property: VendorPropertyItem) => void;
};

export function VendorPropertiesView({
  embedded = false,
  hideHeader = false,
  title = "Properties",
  subtitle = "Manage the live properties linked to this vendor workspace, then open each one for workspace-specific detail and editing.",
  simulateCount,
  onSelectProperty,
}: VendorPropertiesViewProps = {}) {
  const { authToken } = useAppState();
  const [items, setItems] = useState<VendorPropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaceLimits, setWorkspaceLimits] = useState<WorkspaceLimits["limits"] | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [dealType, setDealType] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const renderedItems = useMemo(() => {
    if (!embedded || !simulateCount || simulateCount <= 0 || items.length === 0) return items;
    return Array.from({ length: simulateCount }, (_, index) => {
      const source = items[index % items.length];
      const variant = SIMULATED_VARIANTS[index % SIMULATED_VARIANTS.length];
      return {
        ...source,
        ...variant,
        id: `${source.id}-sim-${index}`,
      };
    });
  }, [embedded, items, simulateCount]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return renderedItems.filter((property) => {
      if (status && property.status !== status) return false;
      if (dealType && property.deal_type !== dealType) return false;
      if (propertyType && property.property_type !== propertyType) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        property.title,
        property.city,
        property.district,
        property.township,
        formatPropertyTypeValue(property.property_type),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [dealType, propertyType, query, renderedItems, status]);

  useEffect(() => {
    if (!authToken) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [response, workspaceResponse] = await Promise.all([
          fetch("/api/vendor/properties", {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }),
          fetch("/api/vendor/workspace", {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }),
        ]);
        const payload = (await response.json()) as { items?: VendorPropertyItem[]; error?: string };
        const workspacePayload = (await workspaceResponse.json()) as WorkspaceLimits & { error?: string };
        if (!response.ok) {
          throw new Error(payload?.error || "Unable to load vendor properties.");
        }
        if (!workspaceResponse.ok) {
          throw new Error(workspacePayload?.error || "Unable to load workspace limits.");
        }
        if (!cancelled) {
          setItems(payload.items ?? []);
          setWorkspaceLimits(workspacePayload.limits ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load vendor properties.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authToken]);

  function applySearch() {
    setQuery(searchInput.trim());
  }

  if (loading) {
    return embedded ? <EmbeddedLoadingState>Loading properties...</EmbeddedLoadingState> : <LoadingOverlay message="Loading properties..." />;
  }

  return (
    <Page $embedded={embedded}>
      {!hideHeader ? (
        <Header $embedded={embedded}>
          <Heading>
            <Title $embedded={embedded}>{title}</Title>
            <Subtitle $embedded={embedded}>{subtitle}</Subtitle>
          </Heading>
          <ActionLink $embedded={embedded} href="/request-sale">
            <Plus size={18} />
            <span>Request listing</span>
          </ActionLink>
        </Header>
      ) : null}

      {workspaceLimits?.listingNearLimit ? (
        <Notice $danger={workspaceLimits.listingOverLimit} $embedded={embedded}>
          {workspaceLimits.listingOverLimit
            ? "This workspace is already over its current listing soft limit. New listing intake should move behind an upgrade flow in a later phase."
            : `This workspace is close to its listing limit: ${workspaceLimits.listingCount ?? items.length}/${workspaceLimits.listingLimit ?? items.length}. ${
                workspaceLimits.suggestedUpgrade
                  ? `Recommended upgrade: ${workspaceLimits.suggestedUpgrade.name} (${workspaceLimits.suggestedUpgrade.priceLabel}).`
                  : ""
              }`}
        </Notice>
      ) : null}

      <Filters
        onSubmit={(event) => {
          event.preventDefault();
          applySearch();
        }}
      >
        <SearchField $embedded={embedded}>
          <Input
            $embedded={embedded}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search title or location"
            aria-label="Search properties"
          />
          <SearchButton type="submit" $embedded={embedded} aria-label="Search listings">
            <Search />
          </SearchButton>
        </SearchField>
        <CustomSelect
          id="vendor-property-status"
          name="vendor-property-status"
          label="Status"
          value={status}
          onChange={setStatus}
          hideLabel
        >
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
          <option value="archived">Archived</option>
        </CustomSelect>
        <CustomSelect
          id="vendor-property-deal"
          name="vendor-property-deal"
          label="Deal"
          value={dealType}
          onChange={setDealType}
          hideLabel
        >
          <option value="">All deals</option>
          <option value="sale">Sale</option>
          <option value="rent">Rent</option>
        </CustomSelect>
        <CustomSelect
          id="vendor-property-type"
          name="vendor-property-type"
          label="Type"
          value={propertyType}
          onChange={setPropertyType}
          hideLabel
        >
          <option value="">All types</option>
          {propertyTypeDefinitions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </CustomSelect>
      </Filters>

      {embedded ? (
        <EmbeddedViewport>
          <EmbeddedScroller>
            {error ? <EmptyCard $embedded>{error}</EmptyCard> : null}

            {!error && !filteredItems.length ? (
              <EmptyCard $embedded>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                    color: "var(--color-text)",
                    fontWeight: 700,
                  }}
                >
                  <Filter size={16} />
                  <span>No properties matched this workspace filter.</span>
                </div>
                Create a new listing request or relax the filters to see more results.
              </EmptyCard>
            ) : null}

            {!!filteredItems.length && (
              <Grid>
                {filteredItems.map((property) => (
                  <Card key={property.id} $embedded>
                    <EmbeddedCardButton
                      type="button"
                      onClick={() => {
                        onSelectProperty?.(property);
                      }}
                      aria-label={`Open ${property.title || "property"} details`}
                    >
                      <EmbeddedFloatingPills>
                        <EmbeddedPill $embedded $tone="status">
                          {labelize(property.status)}
                        </EmbeddedPill>
                        <EmbeddedPill $embedded $tone="deal">
                          {getDealTypeLabel(property.deal_type)}
                        </EmbeddedPill>
                        <EmbeddedPill $embedded $tone="price">
                          {formatCurrency(property.price ?? undefined, property.currency ?? "MMK", "Contact")}
                        </EmbeddedPill>
                      </EmbeddedFloatingPills>
                      <EmbeddedCardRow>
                        <EmbeddedThumb $image={property.cover_image_url || undefined}>
                          {!property.cover_image_url ? <Building2 /> : null}
                        </EmbeddedThumb>
                        <EmbeddedCardBody>
                          <EmbeddedLeftStack>
                            <CardTop>
                              <CardTitle $embedded>{property.title || "Untitled property"}</CardTitle>
                            </CardTop>
                            <EmbeddedFooterMeta>
                              <EmbeddedFooterLine>
                                <MapPin />
                                <span>{[property.district || property.city, property.township].filter(Boolean).join(" / ") || "Unspecified"}</span>
                              </EmbeddedFooterLine>
                              <EmbeddedFooterLine>
                                <Calendar />
                                <span>{property.appointments_count} appointments</span>
                              </EmbeddedFooterLine>
                            </EmbeddedFooterMeta>
                          </EmbeddedLeftStack>
                        </EmbeddedCardBody>
                        <PropertyTypeTag>
                          <PropertyTypeIcon type={property.property_type} />
                          <span>{formatPropertyTypeValue(property.property_type)}</span>
                        </PropertyTypeTag>
                      </EmbeddedCardRow>
                    </EmbeddedCardButton>
                  </Card>
                ))}
              </Grid>
            )}
          </EmbeddedScroller>
        </EmbeddedViewport>
      ) : (
        <>
          {error ? <EmptyCard>{error}</EmptyCard> : null}

          {!error && !items.length ? (
            <EmptyCard>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 10, color: "#dbe2ef", fontWeight: 700 }}>
                <Filter size={16} />
                <span>No properties matched this workspace filter.</span>
              </div>
              Create a new listing request or relax the filters to see more results.
            </EmptyCard>
          ) : null}

          {!!items.length && (
            <Grid>
              {items.map((property) => (
                <Card key={property.id}>
                  <CardTop>
                    <CardTitle>{property.title || "Untitled property"}</CardTitle>
                    <Pill>{labelize(property.status)}</Pill>
                  </CardTop>
                  <Meta>
                    <Pill>{labelize(property.deal_type)}</Pill>
                    <Pill>{labelize(property.property_type)}</Pill>
                    <Pill>{`Verification: ${labelize(property.verification_status)}`}</Pill>
                  </Meta>
                  <Row>
                    <span>Price</span>
                    <Strong>{formatCurrency(property.price ?? undefined, property.currency ?? "MMK", "Contact")}</Strong>
                  </Row>
                  <Row>
                    <span>Location</span>
                    <Strong>{[property.district || property.city, property.township].filter(Boolean).join(" / ") || "Unspecified"}</Strong>
                  </Row>
                  <Footer>
                    <span style={{ color: "#9aa4b6" }}>{property.appointments_count} appointments</span>
                    <OpenLink href={`/vendor/properties/${property.id}`}>
                      <span>Open workspace</span>
                      <ChevronRight size={16} />
                    </OpenLink>
                  </Footer>
                </Card>
              ))}
            </Grid>
          )}
        </>
      )}
    </Page>
  );
}
