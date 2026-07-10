"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import styled from "styled-components";
import { ArrowRight, Building2, MapPin, Search, ShieldCheck } from "lucide-react";
import { MarketplaceHeader } from "@/features/site/shared/components/MarketplaceHeader";
import { PageSection, Panel } from "@/features/site/shared/components/PageSection";
import { useAppState } from "@/features/site/shared/lib/app-state";
import type { PublicAgencyCardRecord } from "@/lib/public-agencies";

const UI = {
  title: "Our Partner Agencies",
  subtitle: "Discover agencies and verified partners on Eain Chan Myay.",
  searchLabel: "Search agencies",
  searchPlaceholder: "Search agencies by name, description, township, district, or coverage",
  all: "All",
  verified: "Verified",
  unverified: "Unverified",
  viewProfile: "View Profile",
  noResultsTitle: "No agencies found",
  noResultsCopy: "Try another keyword or switch the verification filter.",
  joinAgency: "Join as an agency",
  activeListings: "Active listings",
  disclaimer: "Agency details may change. Verify current contact and listing information before making decisions.",
} as const;

type PartnersIndexViewProps = {
  agencies: PublicAgencyCardRecord[];
};

const Shell = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(10, 35, 66, 0.08), transparent 30%),
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 24%),
    linear-gradient(180deg, #f6efe8 0%, #fffaf5 42%, #ffffff 100%);
`;

const Wrapper = styled(PageSection)`
  max-width: 1180px;
  gap: 18px;
  padding-bottom: 84px;
`;

const Hero = styled(Panel)`
  border-radius: 30px;
  padding: clamp(20px, 4vw, 34px);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.16), transparent 26%),
    radial-gradient(circle at bottom left, rgba(255, 255, 255, 0.08), transparent 30%),
    linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-color: color-mix(in srgb, var(--color-primary-dark) 42%, transparent);
  color: #f8fafc;
  display: grid;
  gap: 14px;
`;

const HeroTitle = styled.h1`
  margin: 0;
  max-width: 760px;
  font-size: clamp(2rem, 5vw, 3.8rem);
  line-height: 0.98;
`;

const HeroCopy = styled.p`
  margin: 0;
  max-width: 760px;
  color: rgba(241, 245, 249, 0.84);
  line-height: 1.7;
`;

const SearchPanel = styled(Panel)`
  display: grid;
  gap: 16px;
`;

const SearchWrap = styled.label`
  position: relative;
  display: block;
`;

const SearchInput = styled.input`
  width: 100%;
  min-height: 54px;
  border-radius: 18px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface) 92%, white);
  color: var(--color-text);
  padding: 0 18px 0 52px;
  font-size: 0.98rem;
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 18px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--color-muted);
`;

const FilterSection = styled.div`
  display: grid;
  gap: 10px;
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const FilterChip = styled.button<{ $active?: boolean }>`
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid ${(props) => (props.$active ? "rgba(233, 27, 66, 0.18)" : "var(--color-outline)")};
  background: ${(props) =>
    props.$active ? "linear-gradient(135deg, rgba(255, 61, 93, 0.12), rgba(233, 27, 66, 0.06))" : "var(--color-surface)"};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  font-size: 0.88rem;
  font-weight: 700;
  text-align: left;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1040px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(Link)`
  display: grid;
  gap: 14px;
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);
  padding: 18px;
  color: inherit;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    border-color: rgba(233, 27, 66, 0.18);
    box-shadow: 0 28px 52px rgba(15, 23, 42, 0.1);
  }
`;

const CardTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

const Logo = styled.div<{ $image?: string | null }>`
  width: 64px;
  height: 64px;
  border-radius: 20px;
  overflow: hidden;
  flex: 0 0 64px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background:
    ${(props) =>
      props.$image
        ? `url(${props.$image}) center/cover no-repeat`
        : "linear-gradient(135deg, rgba(255, 61, 93, 0.16), rgba(245, 158, 11, 0.14))"};
  display: grid;
  place-items: center;
  color: var(--color-text);

  svg {
    width: 24px;
    height: 24px;
  }
`;

const TitleWrap = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const CardTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-size: 1.04rem;
  line-height: 1.24;
`;

const Badge = styled.span<{ $verified?: boolean }>`
  min-height: 28px;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid
    ${(props) => (props.$verified ? "rgba(16, 185, 129, 0.18)" : "rgba(148, 163, 184, 0.2)")};
  background: ${(props) => (props.$verified ? "rgba(16, 185, 129, 0.12)" : "rgba(148, 163, 184, 0.1)")};
  color: ${(props) => (props.$verified ? "#0f766e" : "#64748b")};
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.2;
  flex-wrap: wrap;
`;

const Description = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.65;
  font-size: 0.92rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const MetaList = styled.div`
  display: grid;
  gap: 8px;
`;

const MetaRow = styled.div`
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.5;
  min-width: 0;

  svg {
    width: 15px;
    height: 15px;
    flex: 0 0 15px;
    margin-top: 2px;
  }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const CountPill = styled.span`
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-surface-2) 86%, white);
  border: 1px solid var(--color-outline);
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 700;
`;

const ActionLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
  font-size: 0.92rem;
  font-weight: 700;
`;

const EmptyState = styled(Panel)`
  display: grid;
  gap: 8px;
  padding: 24px;
`;

const EmptyTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-size: 1.05rem;
`;

const EmptyCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
`;

const JoinCard = styled(Panel)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const JoinCopy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.6;
`;

const JoinAction = styled(Link)`
  min-height: 44px;
  padding: 0 16px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--gradient);
  color: white;
  font-weight: 700;
`;

function buildSearchHaystack(agency: PublicAgencyCardRecord) {
  return [
    agency.name,
    agency.tagline,
    agency.description,
    agency.coverageLabel,
    agency.locationTokens.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isVerifiedStatus(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase() === "approved";
}

export function PartnersIndexView({ agencies }: PartnersIndexViewProps) {
  const { profileRole, profileReady } = useAppState();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
  const deferredQuery = useDeferredValue(query);
  const shouldShowJoinCard = profileReady && profileRole !== "vendor_user";

  const filteredAgencies = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return agencies.filter((agency) => {
      const verified = isVerifiedStatus(agency.verifiedStatus);

      if (filter === "verified" && !verified) return false;
      if (filter === "unverified" && verified) return false;
      if (!normalizedQuery) return true;

      return buildSearchHaystack(agency).includes(normalizedQuery);
    });
  }, [agencies, deferredQuery, filter]);

  return (
    <Shell>
      <MarketplaceHeader />
      <Wrapper>
        <Hero as="section">
          <HeroTitle>{UI.title}</HeroTitle>
          <HeroCopy>{UI.subtitle}</HeroCopy>
        </Hero>

        <SearchPanel as="section">
          <SearchWrap>
            <SearchIcon aria-hidden="true" />
            <SearchInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={UI.searchPlaceholder}
              aria-label={UI.searchLabel}
            />
          </SearchWrap>

          <FilterSection>
            <FilterRow>
              <FilterChip type="button" $active={filter === "all"} onClick={() => setFilter("all")} aria-pressed={filter === "all"}>
                {UI.all}
              </FilterChip>
              <FilterChip
                type="button"
                $active={filter === "verified"}
                onClick={() => setFilter("verified")}
                aria-pressed={filter === "verified"}
              >
                {UI.verified}
              </FilterChip>
              <FilterChip
                type="button"
                $active={filter === "unverified"}
                onClick={() => setFilter("unverified")}
                aria-pressed={filter === "unverified"}
              >
                {UI.unverified}
              </FilterChip>
            </FilterRow>
          </FilterSection>
        </SearchPanel>

        {!filteredAgencies.length ? (
          <EmptyState as="section">
            <EmptyTitle>{UI.noResultsTitle}</EmptyTitle>
            <EmptyCopy>{UI.noResultsCopy}</EmptyCopy>
          </EmptyState>
        ) : (
          <Grid as="section">
            {filteredAgencies.map((agency) => {
              const verified = isVerifiedStatus(agency.verifiedStatus);
              const description = agency.description || agency.tagline || UI.disclaimer;

              return (
                <Card key={agency.id} href={`/agency/${agency.slug}`}>
                  <CardTop>
                    <Logo $image={agency.logoUrl}>
                      {!agency.logoUrl ? <Building2 /> : null}
                    </Logo>
                    <TitleWrap>
                      <CardTitle>{agency.name}</CardTitle>
                      <Badge $verified={verified}>
                        <ShieldCheck size={13} />
                        <span>{verified ? UI.verified : UI.unverified}</span>
                      </Badge>
                    </TitleWrap>
                  </CardTop>

                  <Description>{description}</Description>

                  <MetaList>
                    {agency.coverageLabel ? (
                      <MetaRow>
                        <MapPin />
                        <span>{agency.coverageLabel}</span>
                      </MetaRow>
                    ) : null}
                  </MetaList>

                  <Footer>
                    <CountPill>{`${agency.listingCount} ${UI.activeListings}`}</CountPill>
                    <ActionLabel>
                      <span>{UI.viewProfile}</span>
                      <ArrowRight size={15} />
                    </ActionLabel>
                  </Footer>
                </Card>
              );
            })}
          </Grid>
        )}

        {shouldShowJoinCard ? (
          <JoinCard as="section">
            <JoinCopy>Want your agency profile listed here? Publish your storefront and complete your public profile.</JoinCopy>
            <JoinAction href="/vendor-setup">
              <span>{UI.joinAgency}</span>
              <ArrowRight size={15} />
            </JoinAction>
          </JoinCard>
        ) : null}
      </Wrapper>
    </Shell>
  );
}
