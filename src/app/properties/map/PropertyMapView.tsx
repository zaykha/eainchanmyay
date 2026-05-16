"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  BadgeCheck,
  Map,
  MapPin,
  Ruler,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import styled from "styled-components";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import type { Listing, ListingFilters } from "@/app/living-site/lib/data";
import { formatCurrency } from "@/app/living-site/lib/format";
import {
  buildListingQuery,
  type ListingQueryBounds,
} from "@/app/living-site/hooks/useInfiniteListings";
import { getDistricts, getStates, getTownships } from "@/app/living-site/lib/myanmar-geo";
import { formatPropertyTypeValue, propertyTypeDefinitions } from "@/lib/property-types";

const PropertyMapLeaflet = dynamic(() => import("./PropertyMapLeaflet"), {
  ssr: false,
  loading: () => <MapCanvas />,
});

type ListingsResponse = {
  data: Listing[];
  total: number;
  hasMore: boolean;
};

// TODO: add marker clustering when the project adopts a clustering package.
const MARKER_LIMIT = 100;

const Page = styled.div`
  height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(255, 123, 153, 0.12), transparent 26%),
    linear-gradient(180deg, #f8fafc 0%, #eef2f8 100%);
  color: #172033;
`;

const Shell = styled.div`
  max-width: 1480px;
  margin: 0 auto;
  padding: 16px;
  height: 100%;

  @media (max-width: 920px) {
    padding: 0;
  }
`;

const DesktopLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(360px, 38%) minmax(0, 1fr);
  gap: 16px;
  height: calc(100vh - 32px);
  overflow: hidden;

  @media (max-width: 920px) {
    display: none;
  }
`;

const MobileLayout = styled.div`
  display: none;

  @media (max-width: 920px) {
    display: block;
    height: 100vh;
    overflow: hidden;
  }
`;

const Panel = styled.section`
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
  overflow: hidden;
`;

const ListPanel = styled(Panel)`
  display: grid;
  grid-template-rows: auto auto auto 1fr;
  min-height: 0;
`;

const MapPanel = styled(Panel)`
  position: relative;
  min-height: 0;
  background: #e8eef5;
`;

const PanelHeader = styled.div`
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 248, 252, 0.98));
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.84rem;
  color: #64748b;
  margin-bottom: 8px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.2rem;
  line-height: 1.1;
`;

const SearchRow = styled.form`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 10px;
  margin-top: 12px;
`;

const SearchInputWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 46px;
  border-radius: 15px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  background: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
  color: #475569;

  input {
    flex: 1;
    border: none;
    background: transparent;
    font: inherit;
    color: #172033;
    outline: none;
  }
`;

const FilterBar = styled.div`
  padding: 10px 16px;
  display: grid;
  gap: 8px;
  background: rgba(244, 247, 251, 0.88);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
`;

const ChipRow = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
`;

const Chip = styled.button<{ $active?: boolean }>`
  border: 1px solid ${(props) => (props.$active ? "rgba(225, 29, 72, 0.28)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) => (props.$active ? "rgba(255, 235, 240, 0.95)" : "rgba(255, 255, 255, 0.96)")};
  color: ${(props) => (props.$active ? "#d61f55" : "#475569")};
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.82rem;
  white-space: nowrap;
  cursor: pointer;
  flex: 0 0 auto;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  height: 46px;
  padding: 0 15px;
  border-radius: 15px;
  border: 1px solid
    ${(props) => (props.$primary ? "rgba(225, 29, 72, 0.92)" : "rgba(148, 163, 184, 0.24)")};
  background: ${(props) =>
    props.$primary
      ? "linear-gradient(135deg, #ff4d73, #e11d48)"
      : "rgba(255, 255, 255, 0.96)"};
  color: ${(props) => (props.$primary ? "#fff" : "#172033")};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: ${(props) =>
    props.$primary ? "0 14px 28px rgba(225, 29, 72, 0.2)" : "0 8px 18px rgba(15, 23, 42, 0.06)"};

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

const SummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
`;

const SummaryCard = styled.div`
  background: linear-gradient(180deg, #ffffff, #f7f9fc);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 15px;
  padding: 10px 12px 9px;
  box-shadow: 0 12px 22px rgba(15, 23, 42, 0.05);
`;

const SummaryValue = styled.div`
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1;
`;

const SummaryLabel = styled.div`
  margin-top: 6px;
  color: #64748b;
  font-size: 0.8rem;
`;

const ListScroller = styled.div`
  overflow-y: auto;
  padding: 8px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  background: rgba(244, 247, 251, 0.92);
  align-items: stretch;
`;

const ListingButton = styled.article<{ $selected?: boolean }>`
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  border-radius: 18px;
  border: 1px solid
    ${(props) => (props.$selected ? "rgba(225, 29, 72, 0.34)" : "rgba(148, 163, 184, 0.18)")};
  background: ${(props) => (props.$selected ? "rgba(255, 241, 244, 0.94)" : "#fff")};
  box-shadow: ${(props) =>
    props.$selected ? "0 18px 30px rgba(225, 29, 72, 0.12)" : "0 12px 26px rgba(15, 23, 42, 0.05)"};
  cursor: pointer;
  align-self: start;
  min-height: 156px;
  width: 100%;
  overflow: hidden;
`;

const ListingImage = styled.div`
  width: 120px;
  aspect-ratio: 1.05;
  border-radius: 16px;
  background: linear-gradient(135deg, #d7dde6, #b3c1d3);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const ListingContent = styled.div`
  min-width: 0;
  display: grid;
  gap: 8px;
  align-content: start;
  min-height: 132px;
`;

const ListingTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
`;

const ListingTitle = styled.h3`
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.3;
`;

const PriceLabel = styled.div`
  font-size: 0.95rem;
  font-weight: 800;
  color: #e11d48;
  white-space: nowrap;
`;

const MetaLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  color: #667085;
  font-size: 0.84rem;
`;

const MiniPill = styled.span<{ $tone?: "accent" | "neutral" }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  background: ${(props) =>
    props.$tone === "accent" ? "rgba(255, 236, 240, 0.95)" : "rgba(241, 245, 249, 0.95)"};
  color: ${(props) => (props.$tone === "accent" ? "#d61f55" : "#475569")};
  border: 1px solid
    ${(props) =>
      props.$tone === "accent" ? "rgba(225, 29, 72, 0.18)" : "rgba(148, 163, 184, 0.18)"};
`;

const FactsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #475569;
  font-size: 0.78rem;
`;

const Fact = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
  padding-top: 2px;
`;

const CardLink = styled(Link)<{ $accent?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.82rem;
  border: 1px solid
    ${(props) => (props.$accent ? "rgba(225, 29, 72, 0.86)" : "rgba(148, 163, 184, 0.22)")};
  background: ${(props) => (props.$accent ? "linear-gradient(135deg, #ff4d73, #e11d48)" : "#fff")};
  color: ${(props) => (props.$accent ? "#fff" : "#172033")};
`;

const MapCanvas = styled.div`
  position: absolute;
  inset: 0;
`;

const MapOverlayTop = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: center;
  z-index: 410;
  pointer-events: none;
`;

const SearchAreaButton = styled.button`
  pointer-events: auto;
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  border: 1px solid rgba(225, 29, 72, 0.85);
  background: linear-gradient(135deg, #ff4d73, #e11d48);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 18px 34px rgba(225, 29, 72, 0.24);
  cursor: pointer;
`;

const MapPreviewWrap = styled.div`
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  z-index: 400;
  display: flex;
  justify-content: center;
  pointer-events: none;

  @media (max-width: 920px) {
    left: 12px;
    right: 12px;
    bottom: 88px;
  }
`;

const MapPreviewCard = styled.div`
  pointer-events: auto;
  width: min(420px, 100%);
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.18);
  padding: 14px;
  display: grid;
  grid-template-columns: 106px minmax(0, 1fr);
  gap: 14px;
`;

const PreviewImage = styled(ListingImage)`
  width: 106px;
`;

const EmptyState = styled.div`
  padding: 36px 20px;
  text-align: center;
  color: #64748b;
`;

const MobileTopBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 420;
  padding: 12px 12px 0;
  display: grid;
  gap: 10px;
`;

const MobileTopCard = styled.div`
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
  padding: 8px;
`;

const MobileSearchRow = styled.form`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
`;

const FloatingListButton = styled.button`
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  z-index: 430;
  min-height: 52px;
  padding: 0 20px;
  border-radius: 999px;
  border: 1px solid rgba(225, 29, 72, 0.9);
  background: linear-gradient(135deg, #ff4d73, #e11d48);
  color: #fff;
  font-weight: 800;
  box-shadow: 0 22px 44px rgba(225, 29, 72, 0.24);
`;

const MobileListSheet = styled.div`
  position: fixed;
  inset: auto 0 0 0;
  z-index: 520;
  background: #f8fafc;
  border-radius: 28px 28px 0 0;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 -18px 44px rgba(15, 23, 42, 0.18);
  max-height: 72vh;
  display: grid;
  grid-template-rows: auto 1fr;
`;

const SheetHeader = styled.div`
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
`;

const SheetTitle = styled.h2`
  margin: 0;
  font-size: 1rem;
`;

const SheetClose = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 22, 0.44);
  z-index: 500;
`;

const FilterDialog = styled.div`
  position: fixed;
  inset: auto 16px 16px;
  z-index: 540;
  background: #fff;
  border-radius: 26px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 26px 54px rgba(15, 23, 42, 0.18);
  padding: 18px;
  display: grid;
  gap: 14px;

  @media (min-width: 921px) {
    inset: 80px auto auto 50%;
    transform: translateX(-50%);
    width: min(720px, calc(100vw - 48px));
  }
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const FilterTitle = styled.h2`
  margin: 0;
  font-size: 1.05rem;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const NumberField = styled.label`
  display: grid;
  gap: 8px;
  color: #475569;
  font-size: 0.86rem;
  font-weight: 700;

  input {
    height: 50px;
    padding: 0 14px;
    border-radius: 16px;
    border: 1px solid rgba(148, 163, 184, 0.24);
    background: #fff;
    font: inherit;
    color: #172033;
    outline: none;
  }
`;

const FilterFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
`;

const SecondaryButton = styled(ActionButton)`
  background: #fff;
  color: #172033;
  border-color: rgba(148, 163, 184, 0.24);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
`;

const SkeletonGrid = styled.div`
  display: grid;
  gap: 12px;
`;

const SkeletonCard = styled.div`
  height: 142px;
  border-radius: 22px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.74), rgba(241, 245, 249, 0.96), rgba(226, 232, 240, 0.74));
  background-size: 200% 100%;
  animation: shimmer 1.35s linear infinite;

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;

const propertyTypeOptions = [
  { value: "", label: "All property types" },
  ...propertyTypeDefinitions.map((item) => ({ value: item.value, label: item.label })),
  { value: "house_land", label: "House + Land" },
  { value: "commercial", label: "Commercial" },
  { value: "hotel_restaurant", label: "Hotel / Restaurant" },
];

const hasCoordinates = (listing: Listing) =>
  typeof listing.latitude === "number" &&
  typeof listing.longitude === "number" &&
  Number.isFinite(listing.latitude) &&
  Number.isFinite(listing.longitude);

const buildBoundsKey = (bounds: ListingQueryBounds | null) =>
  bounds
    ? `${bounds.south.toFixed(4)}:${bounds.north.toFixed(4)}:${bounds.west.toFixed(4)}:${bounds.east.toFixed(4)}`
    : "none";

const normalizeCount = (count: number) => new Intl.NumberFormat("en-US").format(count);

const toOptionalNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildHomeSearchHref = (filters: ListingFilters) => {
  const params = new URLSearchParams(buildListingQuery(filters, { page: 1 }));
  params.delete("page");
  params.delete("pageSize");
  return params.toString() ? `/?${params.toString()}` : "/";
};

function MapListingCard({
  listing,
  selected,
  onSelect,
  registerRef,
}: {
  listing: Listing;
  selected: boolean;
  onSelect: () => void;
  registerRef?: (node: HTMLElement | null) => void;
}) {
  const locationLine = [listing.township, listing.district || listing.city].filter(Boolean).join(", ");
  const facts = [
    listing.bedrooms ? { key: "beds", icon: <BedDouble size={15} />, label: `${listing.bedrooms} bed` } : null,
    listing.bathrooms ? { key: "baths", icon: <Bath size={15} />, label: `${listing.bathrooms} bath` } : null,
    listing.areaSqft ? { key: "area", icon: <Ruler size={15} />, label: `${listing.areaSqft.toLocaleString("en-US")} sqft` } : null,
  ].filter(Boolean) as Array<{ key: string; icon: ReactNode; label: string }>;

  return (
    <div
      ref={registerRef}
      style={{ display: "block", width: "100%" }}
    >
      <ListingButton
        $selected={selected}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
      >
        <ListingImage>
          {listing.imageUrl ? <img src={listing.imageUrl} alt={listing.title} /> : null}
        </ListingImage>
        <ListingContent>
          <ListingTop>
            <div>
              <ListingTitle>{listing.title || "Property listing"}</ListingTitle>
              <MetaLine>
                <MiniPill>{String(listing.dealType ?? "N/A").toUpperCase()}</MiniPill>
                <MiniPill>{formatPropertyTypeValue(listing.propertyType) || "Property"}</MiniPill>
                {listing.verificationStatus === "approved" ? (
                  <MiniPill $tone="accent">
                    <BadgeCheck size={14} />
                    Verified
                  </MiniPill>
                ) : null}
              </MetaLine>
            </div>
            <PriceLabel>{formatCurrency(listing.price, listing.currency, "Contact")}</PriceLabel>
          </ListingTop>
          <MetaLine>
            <MapPin size={15} />
            {locationLine || listing.stateRegion || "Location pending"}
          </MetaLine>
          {facts.length ? (
            <FactsRow>
              {facts.map((fact) => (
                <Fact key={fact.key}>
                  {fact.icon}
                  {fact.label}
                </Fact>
              ))}
            </FactsRow>
          ) : null}
          <CardActions onClick={(event) => event.stopPropagation()}>
            <CardLink href={`/listing/${listing.id}`}>View details</CardLink>
            <CardLink href={`/listing/${listing.id}#contact`} $accent>
              Contact
            </CardLink>
          </CardActions>
        </ListingContent>
      </ListingButton>
    </div>
  );
}

export default function PropertyMapView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") ?? "";
  const initialDealType = searchParams.get("deal") ?? "";
  const initialPropertyType = searchParams.get("type") ?? "";
  const initialStateRegion = searchParams.get("state") ?? "";
  const initialDistrict = searchParams.get("district") ?? "";
  const initialTownship = searchParams.get("township") ?? "";
  const initialMinPrice = searchParams.get("minPrice") ?? "";
  const initialMaxPrice = searchParams.get("maxPrice") ?? "";
  const initialBedrooms = searchParams.get("beds") ?? "";
  const initialBathrooms = searchParams.get("baths") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [searchDraft, setSearchDraft] = useState(initialQuery);
  const [dealType, setDealType] = useState(initialDealType);
  const [propertyType, setPropertyType] = useState(initialPropertyType);
  const [stateRegion, setStateRegion] = useState(initialStateRegion);
  const [district, setDistrict] = useState(initialDistrict);
  const [township, setTownship] = useState(initialTownship);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [bedrooms, setBedrooms] = useState(initialBedrooms);
  const [bathrooms, setBathrooms] = useState(initialBathrooms);
  const [filterOpen, setFilterOpen] = useState(false);
  const [mobileListOpen, setMobileListOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [appliedBounds, setAppliedBounds] = useState<ListingQueryBounds | null>(null);
  const [pendingBounds, setPendingBounds] = useState<ListingQueryBounds | null>(null);
  const requestIdRef = useRef(0);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const filters = useMemo<ListingFilters>(
    () => ({
      query,
      dealType: dealType || undefined,
      propertyType: propertyType || undefined,
      stateRegion: stateRegion || undefined,
      district: district || undefined,
      township: township || undefined,
      minPrice: toOptionalNumber(minPrice),
      maxPrice: toOptionalNumber(maxPrice),
      bedrooms: toOptionalNumber(bedrooms),
      bathrooms: toOptionalNumber(bathrooms),
    }),
    [bathrooms, bedrooms, dealType, district, maxPrice, minPrice, propertyType, query, stateRegion, township]
  );

  const stateOptions = useMemo(() => getStates(), []);
  const districtOptions = useMemo(
    () => (stateRegion ? getDistricts(stateRegion) : []),
    [stateRegion]
  );
  const townshipOptions = useMemo(
    () => (stateRegion && district ? getTownships(stateRegion, district) : []),
    [district, stateRegion]
  );

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  const boundsKey = useMemo(() => buildBoundsKey(appliedBounds), [appliedBounds]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    const queryString = buildListingQuery(filters, {
      view: "map",
      page: 1,
      pageSize: 120,
      bounds: appliedBounds,
    });

    fetch(`/api/listings?${queryString}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load map listings.");
        }
        return (await response.json()) as ListingsResponse;
      })
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setListings(result.data ?? []);
        setTotal(result.total ?? 0);
      })
      .catch((fetchError: unknown) => {
        if (requestIdRef.current !== requestId) return;
        setListings([]);
        setTotal(0);
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load map listings.");
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setLoading(false);
        }
      });
  }, [appliedBounds, boundsKey, filterKey, filters]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set("q", query.trim());
    if (dealType) nextParams.set("deal", dealType);
    if (propertyType) nextParams.set("type", propertyType);
    if (stateRegion) nextParams.set("state", stateRegion);
    if (district) nextParams.set("district", district);
    if (township) nextParams.set("township", township);
    if (minPrice) nextParams.set("minPrice", minPrice);
    if (maxPrice) nextParams.set("maxPrice", maxPrice);
    if (bedrooms) nextParams.set("beds", bedrooms);
    if (bathrooms) nextParams.set("baths", bathrooms);
    const nextUrl = nextParams.toString() ? `/properties/map?${nextParams.toString()}` : "/properties/map";
    router.replace(nextUrl);
  }, [bathrooms, bedrooms, dealType, district, maxPrice, minPrice, propertyType, query, router, stateRegion, township]);

  const mapListings = useMemo(() => listings.filter(hasCoordinates), [listings]);
  const markerListings = useMemo(() => mapListings.slice(0, MARKER_LIMIT), [mapListings]);
  const selectedListing = useMemo(
    () => listings.find((listing) => listing.id === selectedId) ?? markerListings[0] ?? listings[0] ?? null,
    [listings, markerListings, selectedId]
  );
  const missingLocationCount = Math.max(0, listings.length - mapListings.length);
  const focusedMapListing = useMemo(
    () => (selectedListing && hasCoordinates(selectedListing) ? selectedListing : markerListings[0] ?? null),
    [markerListings, selectedListing]
  );
  const searchAreaVisible = buildBoundsKey(pendingBounds) !== buildBoundsKey(appliedBounds) && pendingBounds !== null;
  const homeHref = useMemo(() => buildHomeSearchHref(filters), [filters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(max-width: 920px)");
    const sync = () => setIsMobileViewport(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!selectedListing) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !listings.some((listing) => listing.id === selectedId)) {
      setSelectedId(selectedListing.id);
    }
  }, [listings, selectedId, selectedListing]);

  useEffect(() => {
    if (!selectedId) return;
    const target = cardRefs.current[selectedId];
    target?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const submitSearch = () => {
    setQuery(searchDraft);
  };

  const resetFilters = () => {
    setDealType("");
    setPropertyType("");
    setStateRegion("");
    setDistrict("");
    setTownship("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setBathrooms("");
    setAppliedBounds(null);
    setPendingBounds(null);
  };

  const renderListContent = () => {
    if (loading) {
      return (
        <SkeletonGrid>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </SkeletonGrid>
      );
    }

    if (error) {
      return <EmptyState>{error}</EmptyState>;
    }

    if (!listings.length) {
      return <EmptyState>No active listings match the current map filters.</EmptyState>;
    }

    return listings.map((listing) => (
      <MapListingCard
        key={listing.id}
        listing={listing}
        selected={listing.id === selectedListing?.id}
        onSelect={() => {
          setSelectedId(listing.id);
          setMobileListOpen(false);
        }}
        registerRef={(node) => {
          cardRefs.current[listing.id] = node;
        }}
      />
    ));
  };

  const previewCard = selectedListing ? (
    <MapPreviewCard>
      <PreviewImage>{selectedListing.imageUrl ? <img src={selectedListing.imageUrl} alt={selectedListing.title} /> : null}</PreviewImage>
      <ListingContent>
        <ListingTop>
          <div>
            <ListingTitle>{selectedListing.title || "Property listing"}</ListingTitle>
            <MetaLine>
              <MiniPill>{String(selectedListing.dealType ?? "N/A").toUpperCase()}</MiniPill>
              <MiniPill>{formatPropertyTypeValue(selectedListing.propertyType) || "Property"}</MiniPill>
            </MetaLine>
          </div>
          <PriceLabel>{formatCurrency(selectedListing.price, selectedListing.currency, "Contact")}</PriceLabel>
        </ListingTop>
        <MetaLine>
          <MapPin size={15} />
          {[selectedListing.township, selectedListing.district || selectedListing.city].filter(Boolean).join(", ") ||
            selectedListing.stateRegion ||
            "Location pending"}
        </MetaLine>
        <FactsRow>
          {selectedListing.bedrooms ? (
            <Fact>
              <BedDouble size={15} />
              {selectedListing.bedrooms} bed
            </Fact>
          ) : null}
          {selectedListing.bathrooms ? (
            <Fact>
              <Bath size={15} />
              {selectedListing.bathrooms} bath
            </Fact>
          ) : null}
          {selectedListing.areaSqft ? (
            <Fact>
              <Ruler size={15} />
              {selectedListing.areaSqft.toLocaleString("en-US")} sqft
            </Fact>
          ) : null}
        </FactsRow>
        <CardActions>
          <CardLink href={`/listing/${selectedListing.id}`}>View details</CardLink>
          <CardLink href={`/listing/${selectedListing.id}#contact`} $accent>
            Contact
          </CardLink>
        </CardActions>
      </ListingContent>
    </MapPreviewCard>
  ) : null;

  return (
    <Page>
      <Shell>
        {!isMobileViewport ? (
        <DesktopLayout>
          <ListPanel>
            <PanelHeader>
              <BackLink href={homeHref}>
                <ArrowLeft size={16} />
                Back to search
              </BackLink>
              <Title>Map discovery</Title>
              <SearchRow
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
                }}
              >
                <SearchInputWrap>
                  <Search size={16} />
                  <input
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    placeholder="Search by title, township, district, or state"
                  />
                </SearchInputWrap>
                <ActionButton type="submit" $primary>
                  <Search size={16} />
                  Search
                </ActionButton>
                <ActionButton type="button" onClick={() => setFilterOpen(true)}>
                  <SlidersHorizontal size={16} />
                  Filters
                </ActionButton>
              </SearchRow>
            </PanelHeader>

            <FilterBar>
              <ChipRow>
                <Chip $active={!dealType} onClick={() => setDealType("")}>
                  All deals
                </Chip>
                <Chip $active={dealType === "sale"} onClick={() => setDealType("sale")}>
                  Buy
                </Chip>
                <Chip $active={dealType === "rent"} onClick={() => setDealType("rent")}>
                  Rent
                </Chip>
              </ChipRow>
              <ChipRow>
                <Chip $active={!propertyType} onClick={() => setPropertyType("")}>
                  All types
                </Chip>
                {propertyTypeDefinitions.slice(0, 8).map((item) => (
                  <Chip
                    key={item.value}
                    $active={propertyType === item.value}
                    onClick={() => setPropertyType((current) => (current === item.value ? "" : item.value))}
                  >
                    {item.label}
                  </Chip>
                ))}
              </ChipRow>
            </FilterBar>

            <SummaryRow>
              <SummaryCard>
                <SummaryValue>{normalizeCount(total)}</SummaryValue>
                <SummaryLabel>Total results</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryValue>{normalizeCount(markerListings.length)}</SummaryValue>
                <SummaryLabel>Map markers</SummaryLabel>
              </SummaryCard>
              <SummaryCard>
                <SummaryValue>{normalizeCount(missingLocationCount)}</SummaryValue>
                <SummaryLabel>Missing pins</SummaryLabel>
              </SummaryCard>
            </SummaryRow>

            <ListScroller>{renderListContent()}</ListScroller>
          </ListPanel>

          <MapPanel>
            <MapCanvas>
              <PropertyMapLeaflet
                listings={markerListings}
                selectedId={selectedListing?.id ?? null}
                onSelect={setSelectedId}
                onBoundsChange={setPendingBounds}
                focusedListing={focusedMapListing}
              />
            </MapCanvas>
            {searchAreaVisible ? (
              <MapOverlayTop>
                <SearchAreaButton
                  type="button"
                  onClick={() => {
                    setAppliedBounds(pendingBounds);
                  }}
                >
                  Search this area
                </SearchAreaButton>
              </MapOverlayTop>
            ) : null}
            <MapPreviewWrap>{previewCard}</MapPreviewWrap>
          </MapPanel>
        </DesktopLayout>
        ) : null}

        {isMobileViewport ? (
        <MobileLayout>
          <MapPanel style={{ minHeight: "100vh", borderRadius: 0, border: "none" }}>
            <MapCanvas>
              <PropertyMapLeaflet
                listings={markerListings}
                selectedId={selectedListing?.id ?? null}
                onSelect={setSelectedId}
                onBoundsChange={setPendingBounds}
                focusedListing={focusedMapListing}
              />
            </MapCanvas>

            <MobileTopBar>
              <MobileTopCard>
                <MobileSearchRow
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitSearch();
                  }}
                >
                  <SearchInputWrap>
                    <Search size={16} />
                  <input
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      placeholder="Search properties"
                    />
                  </SearchInputWrap>
                  <ActionButton type="button" onClick={() => setFilterOpen(true)}>
                    <SlidersHorizontal size={16} />
                  </ActionButton>
                </MobileSearchRow>
              </MobileTopCard>
              <ChipRow>
                <Chip $active={!propertyType} onClick={() => setPropertyType("")}>
                  All
                </Chip>
                {propertyTypeDefinitions.slice(0, 6).map((item) => (
                  <Chip
                    key={item.value}
                    $active={propertyType === item.value}
                    onClick={() => setPropertyType((current) => (current === item.value ? "" : item.value))}
                  >
                    {item.label}
                  </Chip>
                ))}
              </ChipRow>
            </MobileTopBar>

            {searchAreaVisible ? (
              <MapOverlayTop style={{ top: 92 }}>
                <SearchAreaButton
                  type="button"
                  onClick={() => {
                    setAppliedBounds(pendingBounds);
                  }}
                >
                  Search this area
                </SearchAreaButton>
              </MapOverlayTop>
            ) : null}

            <MapPreviewWrap>{!mobileListOpen ? previewCard : null}</MapPreviewWrap>

            <FloatingListButton type="button" onClick={() => setMobileListOpen(true)}>
              <Map size={16} />
              Show list
            </FloatingListButton>
          </MapPanel>
        </MobileLayout>
        ) : null}
      </Shell>

      {mobileListOpen && (
        <>
          <Overlay onClick={() => setMobileListOpen(false)} />
          <MobileListSheet>
            <SheetHeader>
              <SheetTitle>
                {normalizeCount(total)} results · {normalizeCount(markerListings.length)} on map
              </SheetTitle>
              <SheetClose type="button" onClick={() => setMobileListOpen(false)}>
                <X size={18} />
              </SheetClose>
            </SheetHeader>
            <ListScroller style={{ padding: "16px", background: "#f8fafc" }}>{renderListContent()}</ListScroller>
          </MobileListSheet>
        </>
      )}

      {filterOpen && (
        <>
          <Overlay onClick={() => setFilterOpen(false)} />
          <FilterDialog>
            <FilterHeader>
              <FilterTitle>Search filters</FilterTitle>
              <SheetClose type="button" onClick={() => setFilterOpen(false)}>
                <X size={18} />
              </SheetClose>
            </FilterHeader>
            <FilterGrid>
              <CustomSelect
                id="map-deal-type"
                name="map_deal_type"
                label="Deal type"
                value={dealType}
                onChange={setDealType}
              >
                <option value="">All deals</option>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </CustomSelect>

              <CustomSelect
                id="map-property-type"
                name="map_property_type"
                label="Property type"
                value={propertyType}
                onChange={setPropertyType}
              >
                {propertyTypeOptions.map((item) => (
                  <option key={item.value || "all"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </CustomSelect>

              <CustomSelect
                id="map-state"
                name="map_state"
                label="State / Region"
                value={stateRegion}
                onChange={(value) => {
                  setStateRegion(value);
                  setDistrict("");
                  setTownship("");
                }}
              >
                <option value="">All states</option>
                {stateOptions.map((item) => (
                  <option key={item.pcode ?? item.name_en} value={item.name_en}>
                    {item.name_en}
                  </option>
                ))}
              </CustomSelect>

              <CustomSelect
                id="map-district"
                name="map_district"
                label="District"
                value={district}
                onChange={(value) => {
                  setDistrict(value);
                  setTownship("");
                }}
                disabled={!stateRegion}
              >
                <option value="">All districts</option>
                {districtOptions.map((item) => (
                  <option key={item.pcode ?? item.name_en} value={item.name_en}>
                    {item.name_en}
                  </option>
                ))}
              </CustomSelect>

              <CustomSelect
                id="map-township"
                name="map_township"
                label="Township"
                value={township}
                onChange={setTownship}
                disabled={!district}
              >
                <option value="">All townships</option>
                {townshipOptions.map((item) => (
                  <option key={item.pcode ?? item.name_en} value={item.name_en}>
                    {item.name_en}
                  </option>
                ))}
              </CustomSelect>

              <NumberField>
                Minimum price
                <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} inputMode="numeric" />
              </NumberField>

              <NumberField>
                Maximum price
                <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} inputMode="numeric" />
              </NumberField>

              <NumberField>
                Bedrooms
                <input value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} inputMode="numeric" />
              </NumberField>

              <NumberField>
                Bathrooms
                <input value={bathrooms} onChange={(event) => setBathrooms(event.target.value)} inputMode="numeric" />
              </NumberField>
            </FilterGrid>
            <FilterFooter>
              <SecondaryButton type="button" onClick={resetFilters}>
                Clear filters
              </SecondaryButton>
              <ActionButton
                type="button"
                $primary
                onClick={() => {
                  setAppliedBounds(null);
                  setPendingBounds(null);
                  setFilterOpen(false);
                }}
              >
                Apply filters
              </ActionButton>
            </FilterFooter>
          </FilterDialog>
        </>
      )}
    </Page>
  );
}
