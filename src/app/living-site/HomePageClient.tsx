"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import styled from "styled-components";
import { SiteHeader } from "@/app/living-site/components/SiteHeader";
import { BottomNav } from "@/app/living-site/components/BottomNav";
import { ListingGrid } from "@/app/living-site/components/ListingGrid";
import { PageSection, SectionTitle } from "@/app/living-site/components/PageSection";
import { useListings } from "@/app/living-site/hooks/useListings";

const Screen = styled.div`
  padding: 12px;

  @media (max-width: 640px) {
    padding: 12px 0;
  }
`;

const SearchShell = styled.div`
  display: grid;
  gap: 12px;
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
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-outline);
  background: var(--color-surface);
  flex: 1;
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
`;

const SearchInput = styled.input`
  border: none;
  outline: none;
  width: 100%;
  background: transparent;
  color: var(--color-text);
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

const TextInput = styled.input`
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline);
  padding: 10px 12px;
  background: var(--color-surface);
  color: var(--color-text);
`;

const SelectInput = styled.select`
  width: 100%;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-outline);
  padding: 10px 12px;
  background: var(--color-surface);
  color: var(--color-text);
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
    padding: 12px 0;
    border-radius: 0;
    border-left: none;
    border-right: none;
    background: none;
    box-shadow: none;
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
`;

const FilterOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(12, 18, 36, 0.45);
  display: grid;
  place-items: center;
  z-index: 80;
  padding: 16px;
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
  color: var(--color-text);
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

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function HomePageClient() {
  const router = useRouter();
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
  const { listings, loading } = useListings(filters);

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
                  placeholder="Search townships, districts, or property names"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </SearchBar>
              <FilterActions>
                <FilterButton
                  type="button"
                  aria-label="Filters"
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
                    aria-label="Clear filters"
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
          <SectionTitle>Featured properties</SectionTitle>
          <ListingGrid listings={listings.slice(0, 6)} loading={loading} />
        </PageSection>
      </Screen>
      {filtersOpen && (
        <FilterOverlay onClick={() => setFiltersOpen(false)}>
          <FilterCard onClick={(event) => event.stopPropagation()}>
            <FilterHeader>
              <FilterTitle>Filters</FilterTitle>
              <FilterClose
                type="button"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
              >
                <X size={14} />
              </FilterClose>
            </FilterHeader>
            <FilterField>
              <FilterLabel>Deal type</FilterLabel>
              <SelectInput
                value={pendingDealType}
                onChange={(event) => setPendingDealType(event.target.value)}
              >
                <option value="">Any</option>
                <option value="sale">For sale</option>
                <option value="rent">For rent</option>
              </SelectInput>
            </FilterField>
            <FilterField>
              <FilterLabel>Property type</FilterLabel>
              <SelectInput
                value={pendingPropertyType}
                onChange={(event) => setPendingPropertyType(event.target.value)}
              >
                <option value="">Any</option>
                <option value="land">Land</option>
                <option value="house">House</option>
                <option value="house_land">House + Land</option>
                <option value="apartment">Apartment</option>
                <option value="commercial">Commercial</option>
              </SelectInput>
            </FilterField>
            <FilterField>
              <FilterLabel>State or region</FilterLabel>
              <TextInput
                value={pendingStateRegion}
                onChange={(event) => setPendingStateRegion(event.target.value)}
                placeholder="Yangon, Mandalay, Bago..."
              />
            </FilterField>
            <FilterField>
              <FilterLabel>District</FilterLabel>
              <TextInput
                value={pendingDistrict}
                onChange={(event) => setPendingDistrict(event.target.value)}
                placeholder="Mayangone, Ahlone..."
              />
            </FilterField>
            <FilterField>
              <FilterLabel>Township</FilterLabel>
              <TextInput
                value={pendingTownship}
                onChange={(event) => setPendingTownship(event.target.value)}
                placeholder="Sanchaung, Kamayut..."
              />
            </FilterField>
            <FilterField>
              <FilterLabel>Price range (MMK)</FilterLabel>
              <RangeRow>
                <RangeInput
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={pendingMinPrice}
                  onChange={(event) => setPendingMinPrice(event.target.value)}
                />
                <RangeInput
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={pendingMaxPrice}
                  onChange={(event) => setPendingMaxPrice(event.target.value)}
                />
              </RangeRow>
            </FilterField>
            <FilterField>
              <FilterLabel>Bedrooms</FilterLabel>
              <RangeInput
                type="number"
                min={0}
                placeholder="At least"
                value={pendingBedrooms}
                onChange={(event) => setPendingBedrooms(event.target.value)}
              />
            </FilterField>
            <FilterField>
              <FilterLabel>Bathrooms</FilterLabel>
              <RangeInput
                type="number"
                min={0}
                placeholder="At least"
                value={pendingBathrooms}
                onChange={(event) => setPendingBathrooms(event.target.value)}
              />
            </FilterField>
            <FilterField>
              <FilterLabel>Area (sqft)</FilterLabel>
              <RangeRow>
                <RangeInput
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={pendingMinArea}
                  onChange={(event) => setPendingMinArea(event.target.value)}
                />
                <RangeInput
                  type="number"
                  min={0}
                  placeholder="Max"
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
                Clear
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
                Apply filters
              </ApplyButton>
            </FilterFooter>
          </FilterCard>
        </FilterOverlay>
      )}
      <BottomNav />
    </div>
  );
}
