"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import styled from "styled-components";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { ListingGrid } from "@/app/living-site/components/ListingGrid";
import { PageSection, SectionTitle } from "@/app/living-site/components/PageSection";
import { useInfiniteListings } from "@/app/living-site/hooks/useInfiniteListings";
import { useI18n } from "@/app/living-site/lib/i18n";
import { CustomSelect } from "@/app/living-site/components/form-controls/CustomSelect";
import { getDistricts, getStates, getTownships } from "@/app/living-site/lib/myanmar-geo";

const Screen = styled.div`
  padding: 12px;

  @media (max-width: 640px) {
    padding: 0px 0;
    font-size: 0.92rem;
  }
`;

const SearchShell = styled.div`
  display: grid;
  gap: 12px;

  @media (max-width: 640px) {
    padding: 0 12px;
    gap: 8px;
  }
`;

const TopRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  flex: 1;
  min-width: 0;

  @media (max-width: 640px) {
    padding: 8px 10px;
  }
`;

const SearchIcon = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 10px;
  border: 1px solid var(--color-outline);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  background: var(--color-surface);
  box-shadow: var(--shadow-soft);

  svg {
    width: 14px;
    height: 14px;
  }

  @media (max-width: 640px) {
    width: 20px;
    height: 20px;

    svg {
      width: 12px;
      height: 12px;
    }
  }
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  background: transparent;
  color: var(--color-text);
  padding: 5px 0;
`;

const RangeRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
`;

const RangeInput = styled.input`
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline);
  padding: 10px 12px;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
`;

const FilterButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 12px;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  background: var(--color-surface);
  cursor: pointer;
  color: var(--color-text);
  box-shadow: var(--shadow-soft);

  @media (max-width: 640px) {
    width: 32px;
    height: 32px;
  }
`;

const Paper = styled.div`
  background: var(--color-paper);
  border-radius: 18px;
  border: 1px solid var(--color-outline);
  box-shadow: var(--shadow-soft);
  padding: 14px;
  max-width: 1140px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  @media (max-width: 640px) {
    padding: 0px 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
    background: none;
    box-shadow: none;
    border:none;
    margin-top: 10px;
  }
`;

const FilterActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const ClearButton = styled.button`
  border: 1px dashed var(--color-outline);
  border-radius: 999px;
  padding: 6px;
  background: var(--color-surface);
  cursor: pointer;
  color: var(--color-muted);
  font-weight: 600;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;

  @media (max-width: 640px) {
    width: 24px;
    height: 24px;
  }
`;

const FilterOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 36, 0.45);
  display: grid;
  place-items: center;
  z-index: 80;
  padding: 16px;

  @media (max-width: 640px) {
    padding: 0;
    align-items: stretch;
  }
`;

const FilterCard = styled.div`
  width: min(520px, 100%);
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 14px;

  @media (max-width: 640px) {
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    overflow-y: auto;
  }
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const FilterTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
`;

const FilterClose = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--color-surface);
  cursor: pointer;
  font-weight: 600;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
`;

const FilterField = styled.div`
  display: grid;
  gap: 8px;
`;

const FilterLabel = styled.span`
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
  font-weight: 700;
`;

const FilterFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const ApplyButton = styled.button`
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: var(--radius-md);
  padding: 10px 16px;
  background: var(--gradient);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--frame-shadow);
`;

const ClearTextButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 8px 12px;
  background: transparent;
  cursor: pointer;
  color: var(--color-muted);
  font-weight: 600;
`;

const LoadMoreSentinel = styled.div`
  height: 1px;
`;

const LoadMoreText = styled.p`
  margin: 12px 0 0;
  color: var(--color-muted);
`;

const LoadMoreButton = styled.button`
  border: 1px solid var(--color-outline);
  border-radius: 999px;
  padding: 8px 16px;
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  margin: 12px auto 0;
  display: block;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function HomePageClient() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useSearchParams();
  const initialQuery = params.get("q") ?? "";
  const initialDealType = params.get("deal") ?? "";
  const initialPropertyType = params.get("type") ?? "";
  const initialStateRegion = params.get("state") ?? "";
  const initialDistrict = params.get("district") ?? "";
  const initialTownship = params.get("township") ?? "";
  const initialMinPrice = params.get("minPrice") ?? "";
  const initialMaxPrice = params.get("maxPrice") ?? "";
  const initialBedrooms = params.get("beds") ?? "";
  const initialBathrooms = params.get("baths") ?? "";
  const initialMinArea = params.get("minArea") ?? "";
  const initialMaxArea = params.get("maxArea") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [dealType, setDealType] = useState(initialDealType);
  const [propertyType, setPropertyType] = useState(initialPropertyType);
  const [stateRegion, setStateRegion] = useState(initialStateRegion);
  const [district, setDistrict] = useState(initialDistrict);
  const [township, setTownship] = useState(initialTownship);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [bedrooms, setBedrooms] = useState(initialBedrooms);
  const [bathrooms, setBathrooms] = useState(initialBathrooms);
  const [minArea, setMinArea] = useState(initialMinArea);
  const [maxArea, setMaxArea] = useState(initialMaxArea);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingDealType, setPendingDealType] = useState(initialDealType);
  const [pendingPropertyType, setPendingPropertyType] = useState(initialPropertyType);
  const [pendingStateRegion, setPendingStateRegion] = useState(initialStateRegion);
  const [pendingDistrict, setPendingDistrict] = useState(initialDistrict);
  const [pendingTownship, setPendingTownship] = useState(initialTownship);
  const [pendingMinPrice, setPendingMinPrice] = useState(initialMinPrice);
  const [pendingMaxPrice, setPendingMaxPrice] = useState(initialMaxPrice);
  const [pendingBedrooms, setPendingBedrooms] = useState(initialBedrooms);
  const [pendingBathrooms, setPendingBathrooms] = useState(initialBathrooms);
  const [pendingMinArea, setPendingMinArea] = useState(initialMinArea);
  const [pendingMaxArea, setPendingMaxArea] = useState(initialMaxArea);
  const hasActiveFilters =
    Boolean(query.trim()) ||
    Boolean(dealType) ||
    Boolean(propertyType) ||
    Boolean(stateRegion.trim()) ||
    Boolean(district.trim()) ||
    Boolean(township.trim()) ||
    Boolean(minPrice) ||
    Boolean(maxPrice) ||
    Boolean(bedrooms) ||
    Boolean(bathrooms) ||
    Boolean(minArea) ||
    Boolean(maxArea);

  const filters = useMemo(
    () => ({
      query,
      dealType: dealType || undefined,
      propertyType: propertyType || undefined,
      stateRegion: stateRegion || undefined,
      district: district || undefined,
      township: township || undefined,
      minPrice: minPrice ? toNumber(minPrice) : undefined,
      maxPrice: maxPrice ? toNumber(maxPrice) : undefined,
      bedrooms: bedrooms ? toNumber(bedrooms) : undefined,
      bathrooms: bathrooms ? toNumber(bathrooms) : undefined,
      minAreaSqft: minArea ? toNumber(minArea) : undefined,
      maxAreaSqft: maxArea ? toNumber(maxArea) : undefined,
    }),
    [
      bathrooms,
      bedrooms,
      dealType,
      district,
      maxArea,
      maxPrice,
      minArea,
      minPrice,
      propertyType,
      query,
      stateRegion,
      township,
    ]
  );
  const { listings, loading, loadingMore, hasMore, loadMore } = useInfiniteListings(filters);
  const stateOptions = useMemo(() => getStates(), []);
  const districtOptions = useMemo(
    () => (pendingStateRegion ? getDistricts(pendingStateRegion) : []),
    [pendingStateRegion]
  );
  const townshipOptions = useMemo(
    () => (pendingStateRegion && pendingDistrict ? getTownships(pendingStateRegion, pendingDistrict) : []),
    [pendingStateRegion, pendingDistrict]
  );
  const showBedBathFilters = useMemo(
    () =>
      ["house", "house_land", "apartment", "condo", "mini_condo", "serviced_apartment"].includes(
        pendingPropertyType
      ),
    [pendingPropertyType]
  );

  useEffect(() => {
    if (!showBedBathFilters) {
      setPendingBedrooms("");
      setPendingBathrooms("");
    }
  }, [showBedBathFilters]);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loading) return;
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "220px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loadMore, loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextParams = new URLSearchParams();
    if (query.trim()) nextParams.set("q", query.trim());
    if (dealType) nextParams.set("deal", dealType);
    if (propertyType) nextParams.set("type", propertyType);
    if (stateRegion.trim()) nextParams.set("state", stateRegion.trim());
    if (district.trim()) nextParams.set("district", district.trim());
    if (township.trim()) nextParams.set("township", township.trim());
    if (minPrice) nextParams.set("minPrice", minPrice);
    if (maxPrice) nextParams.set("maxPrice", maxPrice);
    if (bedrooms) nextParams.set("beds", bedrooms);
    if (bathrooms) nextParams.set("baths", bathrooms);
    if (minArea) nextParams.set("minArea", minArea);
    if (maxArea) nextParams.set("maxArea", maxArea);
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `/?${nextQuery}` : "/";
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      router.replace(nextUrl);
    }
  }, [
    bathrooms,
    bedrooms,
    dealType,
    district,
    maxArea,
    maxPrice,
    minArea,
    minPrice,
    propertyType,
    query,
    router,
    stateRegion,
    township,
  ]);

  return (
    <div>
      <SiteHeader />
      <Screen>
        <Paper>
          <SearchShell>
            <TopRow>
              <SearchBar>
                <SearchIcon>
                  <Search size={14} />
                </SearchIcon>
                <SearchInput
                  placeholder={t("home.searchPlaceholder")}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </SearchBar>
              <FilterActions>
                <FilterButton
                  type="button"
                  aria-label={t("home.filters")}
                  onClick={() => {
                    setPendingDealType(dealType);
                    setPendingPropertyType(propertyType);
                    setPendingStateRegion(stateRegion);
                    setPendingDistrict(district);
                    setPendingTownship(township);
                    setPendingMinPrice(minPrice);
                    setPendingMaxPrice(maxPrice);
                    setPendingBedrooms(bedrooms);
                    setPendingBathrooms(bathrooms);
                    setPendingMinArea(minArea);
                    setPendingMaxArea(maxArea);
                    setFiltersOpen(true);
                  }}
                >
                  <SlidersHorizontal size={16} />
                </FilterButton>
                {hasActiveFilters && (
                  <ClearButton
                    type="button"
                    aria-label={t("home.clear")}
                    onClick={() => {
                      setQuery("");
                      setDealType("");
                      setPropertyType("");
                      setStateRegion("");
                      setDistrict("");
                      setTownship("");
                      setMinPrice("");
                      setMaxPrice("");
                      setBedrooms("");
                      setBathrooms("");
                      setMinArea("");
                      setMaxArea("");
                    }}
                  >
                    <X size={12} />
                  </ClearButton>
                )}
              </FilterActions>
            </TopRow>
          </SearchShell>
        </Paper>
        <PageSection>
          <SectionTitle>{t("home.featured")}</SectionTitle>
          <ListingGrid listings={listings} loading={loading} />
          {loadingMore && <LoadMoreText>{t("home.loadingMore")}</LoadMoreText>}
          {!loading && hasMore && (
            <LoadMoreButton type="button" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? t("home.loadingMore") : t("home.loadMore")}
            </LoadMoreButton>
          )}
          {hasMore && !loading && <LoadMoreSentinel ref={loadMoreRef} />}
        </PageSection>
      </Screen>
      {filtersOpen && (
        <FilterOverlay onClick={() => setFiltersOpen(false)}>
          <FilterCard onClick={(event) => event.stopPropagation()}>
            <FilterHeader>
              <FilterTitle>{t("home.filters")}</FilterTitle>
              <FilterClose
                type="button"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
              >
                <X size={14} />
              </FilterClose>
            </FilterHeader>
            <FilterField>
              <CustomSelect
                id="filters-deal-type"
                name="deal_type"
                label={t("filter.dealType")}
                value={pendingDealType}
                onChange={(value) => setPendingDealType(value)}
              >
                <option value="sale">{t("listing.forSale")}</option>
                <option value="rent">{t("listing.forRent")}</option>
              </CustomSelect>
            </FilterField>
            <FilterField>
              <CustomSelect
                id="filters-property-type"
                name="property_type"
                label={t("filter.propertyType")}
                value={pendingPropertyType}
                onChange={(value) => setPendingPropertyType(value)}
              >
                <option value="land">{t("property.land")}</option>
                <option value="house">{t("property.house")}</option>
                <option value="house_land">{t("property.houseLand")}</option>
                <option value="apartment">{t("property.apartment")}</option>
                <option value="commercial">{t("property.commercial")}</option>
              </CustomSelect>
            </FilterField>
            <FilterField>
              <CustomSelect
                id="filters-state"
                name="state_region"
                label={t("filter.state")}
                value={pendingStateRegion}
                onChange={(value) => {
                  setPendingStateRegion(value);
                  setPendingDistrict("");
                  setPendingTownship("");
                }}
              >
                {stateOptions.map((state) => (
                  <option key={state.pcode} value={state.name_en}>
                    {state.name_en}
                  </option>
                ))}
              </CustomSelect>
            </FilterField>
            <FilterField>
              <CustomSelect
                id="filters-district"
                name="district"
                label={t("filter.district")}
                value={pendingDistrict}
                onChange={(value) => {
                  setPendingDistrict(value);
                  setPendingTownship("");
                }}
                disabled={!pendingStateRegion}
              >
                {districtOptions.map((item) => (
                  <option key={item.pcode} value={item.name_en}>
                    {item.name_en}
                  </option>
                ))}
              </CustomSelect>
            </FilterField>
            <FilterField>
              <CustomSelect
                id="filters-township"
                name="township"
                label={t("filter.township")}
                value={pendingTownship}
                onChange={(value) => setPendingTownship(value)}
                disabled={!pendingDistrict}
              >
                {townshipOptions.map((item) => (
                  <option key={item.pcode} value={item.name_en}>
                    {item.name_en}
                  </option>
                ))}
              </CustomSelect>
            </FilterField>
            <FilterField>
              <FilterLabel>{t("filter.priceRange")}</FilterLabel>
              <RangeRow>
                <RangeInput
                  type="number"
                  min={0}
                  value={pendingMinPrice}
                  onChange={(event) => setPendingMinPrice(event.target.value)}
                />
                <RangeInput
                  type="number"
                  min={0}
                  value={pendingMaxPrice}
                  onChange={(event) => setPendingMaxPrice(event.target.value)}
                />
              </RangeRow>
            </FilterField>
            {showBedBathFilters && (
              <>
                <FilterField>
                  <FilterLabel>{t("filter.bedrooms")}</FilterLabel>
                  <RangeInput
                    type="number"
                    min={0}
                    value={pendingBedrooms}
                    onChange={(event) => setPendingBedrooms(event.target.value)}
                  />
                </FilterField>
                <FilterField>
                  <FilterLabel>{t("filter.bathrooms")}</FilterLabel>
                  <RangeInput
                    type="number"
                    min={0}
                    value={pendingBathrooms}
                    onChange={(event) => setPendingBathrooms(event.target.value)}
                  />
                </FilterField>
              </>
            )}
            <FilterField>
              <FilterLabel>{t("filter.area")}</FilterLabel>
              <RangeRow>
                <RangeInput
                  type="number"
                  min={0}
                  value={pendingMinArea}
                  onChange={(event) => setPendingMinArea(event.target.value)}
                />
                <RangeInput
                  type="number"
                  min={0}
                  value={pendingMaxArea}
                  onChange={(event) => setPendingMaxArea(event.target.value)}
                />
              </RangeRow>
            </FilterField>
            <FilterFooter>
              <ClearTextButton
                type="button"
                onClick={() => {
                  setPendingDealType("");
                  setPendingPropertyType("");
                  setPendingStateRegion("");
                  setPendingDistrict("");
                  setPendingTownship("");
                  setPendingMinPrice("");
                  setPendingMaxPrice("");
                  setPendingBedrooms("");
                  setPendingBathrooms("");
                  setPendingMinArea("");
                  setPendingMaxArea("");
                }}
              >
                {t("home.clear")}
              </ClearTextButton>
              <ApplyButton
                type="button"
                onClick={() => {
                  setDealType(pendingDealType);
                  setPropertyType(pendingPropertyType);
                  setStateRegion(pendingStateRegion);
                  setDistrict(pendingDistrict);
                  setTownship(pendingTownship);
                  setMinPrice(pendingMinPrice);
                  setMaxPrice(pendingMaxPrice);
                  setBedrooms(pendingBedrooms);
                  setBathrooms(pendingBathrooms);
                  setMinArea(pendingMinArea);
                  setMaxArea(pendingMaxArea);
                  setFiltersOpen(false);
                }}
              >
                {t("filter.apply")}
              </ApplyButton>
            </FilterFooter>
          </FilterCard>
        </FilterOverlay>
      )}
      <BottomNav />
    </div>
  );
}
