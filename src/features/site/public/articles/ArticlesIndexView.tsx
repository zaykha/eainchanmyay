"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import styled from "styled-components";
import { ArrowRight, Clock3, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { MarketplaceHeader } from "@/features/site/shared/components/MarketplaceHeader";
import { PageSection, Panel } from "@/features/site/shared/components/PageSection";
import type { ArticleRecord } from "@/lib/articles-shared";
import { formatArticleDate, getArticleSearchHaystack } from "@/lib/articles-shared";

const UI = {
  title: "Articles",
  subtitle: "Local market reporting, trend summaries, and practical takeaways for Myanmar property buyers, renters, and agencies.",
  searchLabel: "Search articles",
  searchPlaceholder: "Search title, summary, category, source, or tags",
  categories: "Categories",
  allCategories: "All",
  featured: "Featured article",
  latest: "Latest coverage",
  readMore: "Read more",
  source: "Source",
  related: "Related articles",
  noResultsTitle: "No articles found",
  noResultsCopy: "Try a different keyword or remove a category filter.",
  disclaimer: "Temporary MVP article data. Please verify before final publication.",
} as const;

const Shell = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(10, 35, 66, 0.1), transparent 30%),
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 24%),
    linear-gradient(180deg, #f6efe8 0%, #fffaf5 40%, #ffffff 100%);
`;

const Wrapper = styled(PageSection)`
  gap: 18px;
  padding-bottom: 80px;
  max-width: 1180px;
`;

const Hero = styled(Panel)`
  overflow: hidden;
  border-radius: 30px;
  padding: clamp(20px, 4vw, 34px);
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(17, 94, 89, 0.94)),
    linear-gradient(120deg, #0f172a, #0f766e);
  color: #f8fafc;
  display: grid;
  gap: 18px;
`;

const Eyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.08);
  font-size: 0.82rem;
  font-weight: 700;
`;

const HeroTitle = styled.h1`
  margin: 0;
  max-width: 760px;
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 0.98;
`;

const HeroCopy = styled.p`
  margin: 0;
  max-width: 720px;
  color: rgba(241, 245, 249, 0.84);
  line-height: 1.7;
`;

const SearchCard = styled(Panel)`
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

  &::placeholder {
    color: var(--color-muted);
  }
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

const ChipSection = styled.div`
  display: grid;
  gap: 10px;

  @media (max-width: 720px) {
    display: none;
  }
`;

const ChipLabel = styled.div`
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 700;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Chip = styled.button<{ $active?: boolean }>`
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid
    ${(props) => (props.$active ? "rgba(233, 27, 66, 0.16)" : "var(--color-outline)")};
  background: ${(props) =>
    props.$active ? "linear-gradient(135deg, rgba(255, 61, 93, 0.12), rgba(233, 27, 66, 0.06))" : "var(--color-surface)"};
  color: ${(props) => (props.$active ? "var(--color-primary)" : "var(--color-text)")};
  font-size: 0.88rem;
  font-weight: 700;
  text-align: left;
`;

const MobileFilterTrigger = styled.button`
  display: none;

  @media (max-width: 720px) {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 42px;
    width: 100%;
    padding: 0 14px;
    border-radius: 16px;
    border: 1px solid var(--color-outline);
    background: rgba(255, 255, 255, 0.96);
    color: var(--color-text);
    font-size: 0.9rem;
    font-weight: 700;
  }
`;

const MobileFilterSummary = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FilterOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.34);
  display: grid;
  align-items: end;
  padding: 14px;
`;

const FilterDialog = styled.div`
  width: min(100%, 420px);
  max-height: min(72vh, 560px);
  margin: 0 auto;
  border-radius: 26px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.18);
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
`;

const FilterTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-size: 1rem;
`;

const FilterClose = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: #fff;
  color: var(--color-text);
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const FilterBody = styled.div`
  overflow-y: auto;
  padding: 14px 16px 16px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px;
`;

const FeaturedLink = styled(Link)`
  display: grid;
  gap: 16px;
  padding: clamp(18px, 3vw, 26px);
  border-radius: 26px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.86)),
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.1), transparent 28%);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
`;

const FeaturedMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const Badge = styled.span`
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.74);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 700;
`;

const FeaturedTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: clamp(1.45rem, 3vw, 2.4rem);
  line-height: 1.08;
`;

const FeaturedSummary = styled.p`
  margin: 0;
  color: #475467;
  line-height: 1.7;
  font-size: 0.98rem;
`;

const FeaturedFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
`;

const FeaturedTakeaway = styled.p`
  margin: 0;
  color: #0f172a;
  font-size: 0.94rem;
  font-weight: 600;
  line-height: 1.6;
`;

const ActionLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-primary);
  font-size: 0.92rem;
  font-weight: 700;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(Link)`
  display: grid;
  gap: 14px;
  min-width: 0;
  border-radius: 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);
  padding: 18px;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 28px 52px rgba(15, 23, 42, 0.1);
    border-color: rgba(233, 27, 66, 0.18);
  }
`;

const CardTitle = styled.h2`
  margin: 0;
  color: #0f172a;
  font-size: 1.04rem;
  line-height: 1.28;
`;

const CardSummary = styled.p`
  margin: 0;
  color: #475467;
  line-height: 1.65;
  font-size: 0.92rem;
`;

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MetaText = styled.span`
  color: var(--color-muted);
  font-size: 0.84rem;
`;

const Disclaimer = styled(Panel)`
  color: var(--color-muted);
  font-size: 0.88rem;
  line-height: 1.6;
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

type ArticlesIndexViewProps = {
  articles: ArticleRecord[];
  categories: string[];
  disclaimer: string;
};

export function ArticlesIndexView({
  articles,
  categories,
  disclaimer,
}: ArticlesIndexViewProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(UI.allCategories);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const categoryOptions = [UI.allCategories, ...categories];

  const filteredArticles = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return articles.filter((article) => {
      if (activeCategory !== UI.allCategories && article.category !== activeCategory) {
        return false;
      }

      if (!normalizedQuery) return true;
      return getArticleSearchHaystack(article).includes(normalizedQuery);
    });
  }, [activeCategory, articles, deferredQuery]);

  const featuredArticle = filteredArticles[0] ?? articles[0] ?? null;
  const gridArticles = featuredArticle
    ? filteredArticles.filter((article) => article.slug !== featuredArticle.slug)
    : filteredArticles;

  return (
    <Shell>
      <MarketplaceHeader />
      <Wrapper>
        <Hero as="section">
          <Eyebrow>
            <Sparkles size={14} />
            <span>{UI.latest}</span>
          </Eyebrow>
          <HeroTitle>{UI.title}</HeroTitle>
          <HeroCopy>{UI.subtitle}</HeroCopy>
        </Hero>

        <SearchCard as="section">
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

          <MobileFilterTrigger type="button" onClick={() => setMobileFiltersOpen(true)}>
            <MobileFilterSummary>
              {activeCategory === UI.allCategories ? UI.categories : `${UI.categories}: ${activeCategory}`}
            </MobileFilterSummary>
            <SlidersHorizontal size={16} />
          </MobileFilterTrigger>

          <ChipSection>
            <ChipLabel>{UI.categories}</ChipLabel>
            <ChipRow>
              {categoryOptions.map((category) => (
                <Chip
                  key={category}
                  type="button"
                  $active={category === activeCategory}
                  onClick={() => setActiveCategory(category)}
                  aria-pressed={category === activeCategory}
                >
                  {category}
                </Chip>
              ))}
            </ChipRow>
          </ChipSection>
        </SearchCard>

        {featuredArticle ? (
          <FeaturedLink href={`/articles/${featuredArticle.slug}`}>
            <FeaturedMeta>
              <Badge>{UI.featured}</Badge>
              <Badge>{featuredArticle.category}</Badge>
              <Badge>
                <Clock3 size={13} />
                <span>{`${featuredArticle.readTimeMinutes} min read`}</span>
              </Badge>
              <Badge>{formatArticleDate(featuredArticle.publishedDate)}</Badge>
              {featuredArticle.sourceName ? <Badge>{`${UI.source}: ${featuredArticle.sourceName}`}</Badge> : null}
            </FeaturedMeta>
            <FeaturedTitle>{featuredArticle.title}</FeaturedTitle>
            <FeaturedSummary>{featuredArticle.summary}</FeaturedSummary>
            <FeaturedFooter>
              <FeaturedTakeaway>{featuredArticle.marketTakeaway || featuredArticle.summary}</FeaturedTakeaway>
              <ActionLabel>
                <span>{UI.readMore}</span>
                <ArrowRight size={16} />
              </ActionLabel>
            </FeaturedFooter>
          </FeaturedLink>
        ) : null}

        {!filteredArticles.length ? (
          <EmptyState as="section">
            <EmptyTitle>{UI.noResultsTitle}</EmptyTitle>
            <EmptyCopy>{UI.noResultsCopy}</EmptyCopy>
          </EmptyState>
        ) : null}

        {!!gridArticles.length && (
          <Grid as="section">
            {gridArticles.map((article) => (
              <Card key={article.slug} href={`/articles/${article.slug}`}>
                <MetaRow>
                  <Badge>{article.category}</Badge>
                  <Badge>{formatArticleDate(article.publishedDate)}</Badge>
                </MetaRow>
                <CardTitle>{article.title}</CardTitle>
                <CardSummary>{article.summary}</CardSummary>
                <MetaRow>
                  <MetaText>{`${article.readTimeMinutes} min read`}</MetaText>
                  {article.sourceName ? <MetaText>{`${UI.source}: ${article.sourceName}`}</MetaText> : null}
                  {article.tags.length ? <MetaText>{article.tags.slice(0, 3).join(" • ")}</MetaText> : null}
                </MetaRow>
                <ActionLabel>
                  <span>{UI.readMore}</span>
                  <ArrowRight size={15} />
                </ActionLabel>
              </Card>
            ))}
          </Grid>
        )}

        <Disclaimer>{disclaimer || UI.disclaimer}</Disclaimer>
      </Wrapper>

      {mobileFiltersOpen ? (
        <FilterOverlay onClick={() => setMobileFiltersOpen(false)}>
          <FilterDialog onClick={(event) => event.stopPropagation()}>
            <FilterHeader>
              <FilterTitle>{UI.categories}</FilterTitle>
              <FilterClose type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                <X size={16} />
              </FilterClose>
            </FilterHeader>
            <FilterBody>
              {categoryOptions.map((category) => (
                <Chip
                  key={category}
                  type="button"
                  $active={category === activeCategory}
                  onClick={() => {
                    setActiveCategory(category);
                    setMobileFiltersOpen(false);
                  }}
                  aria-pressed={category === activeCategory}
                >
                  {category}
                </Chip>
              ))}
            </FilterBody>
          </FilterDialog>
        </FilterOverlay>
      ) : null}
    </Shell>
  );
}
