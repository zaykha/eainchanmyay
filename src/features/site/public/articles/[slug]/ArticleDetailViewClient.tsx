"use client";

import Link from "next/link";
import styled from "styled-components";
import { ArrowLeft, ArrowUpRight, Clock3, MapPin, Sparkles } from "lucide-react";
import { MarketplaceHeader } from "@/features/site/shared/components/MarketplaceHeader";
import { PageSection, Panel } from "@/features/site/shared/components/PageSection";
import { useI18n } from "@/features/site/shared/lib/i18n";
import type { ArticleCollection, ArticleRecord } from "@/lib/articles-shared";
import { formatArticleDate } from "@/lib/articles-shared";

const Shell = styled.div`
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(10, 35, 66, 0.08), transparent 30%),
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.12), transparent 22%),
    linear-gradient(180deg, #f6efe8 0%, #fffaf5 38%, #ffffff 100%);
`;

const Wrapper = styled(PageSection)`
  max-width: 1120px;
  gap: 18px;
  padding-bottom: 88px;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--color-outline);
  background: rgba(255, 255, 255, 0.86);
  color: var(--color-text);
  font-size: 0.9rem;
  font-weight: 700;
`;

const Hero = styled(Panel)`
  border-radius: 30px;
  padding: clamp(20px, 4vw, 34px);
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(17, 94, 89, 0.94)),
    linear-gradient(120deg, #0f172a, #0f766e);
  color: #f8fafc;
  display: grid;
  gap: 16px;
`;

const HeroMeta = styled.div`
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
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.09);
  font-size: 0.8rem;
  font-weight: 700;
`;

const Title = styled.h1`
  margin: 0;
  max-width: 860px;
  font-size: clamp(2rem, 5vw, 3.6rem);
  line-height: 1.02;
`;

const Summary = styled.p`
  margin: 0;
  max-width: 760px;
  color: rgba(241, 245, 249, 0.84);
  line-height: 1.7;
  font-size: 1rem;
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.9fr);
  gap: 18px;
  align-items: start;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const ContentCard = styled(Panel)`
  display: grid;
  gap: 18px;
  border-radius: 24px;
  padding: clamp(18px, 3vw, 24px);
`;

const SectionTitle = styled.h2`
  margin: 0;
  color: var(--color-text);
  font-size: 1.1rem;
`;

const Copy = styled.p`
  margin: 0;
  color: var(--color-muted);
  line-height: 1.78;
`;

const BulletList = styled.ul`
  margin: 0;
  padding-left: 20px;
  display: grid;
  gap: 8px;
  color: var(--color-muted);
  line-height: 1.7;
`;

const Disclaimer = styled.div`
  min-height: 44px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid rgba(245, 158, 11, 0.18);
  background: rgba(245, 158, 11, 0.08);
  color: #8a5a00;
  font-size: 0.88rem;
  line-height: 1.6;
`;

const Sidebar = styled.aside`
  display: grid;
  gap: 16px;
`;

const InfoCard = styled(Panel)`
  display: grid;
  gap: 12px;
  border-radius: 24px;
`;

const InfoRow = styled.div`
  display: grid;
  gap: 4px;
`;

const InfoLabel = styled.div`
  color: var(--color-muted);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const InfoValue = styled.div`
  color: var(--color-text);
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

const SourceLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  color: var(--color-primary);
  font-weight: 700;
`;

const RelatedList = styled.div`
  display: grid;
  gap: 12px;
`;

const RelatedCard = styled(Link)`
  display: grid;
  gap: 8px;
  border-radius: 18px;
  border: 1px solid var(--color-outline);
  background: color-mix(in srgb, var(--color-surface) 92%, white);
  padding: 14px;
`;

const RelatedTitle = styled.h3`
  margin: 0;
  color: var(--color-text);
  font-size: 0.96rem;
  line-height: 1.35;
`;

const RelatedMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--color-muted);
  font-size: 0.82rem;
`;

type ArticleDetailViewClientProps = {
  article: ArticleRecord;
  relatedArticles: ArticleRecord[];
  collection: Pick<ArticleCollection, "disclaimer" | "project" | "purpose">;
};

export function ArticleDetailViewClient({
  article,
  relatedArticles,
  collection,
}: ArticleDetailViewClientProps) {
  const { t, language } = useI18n();
  const hasSource = Boolean(article.sourceName || article.sourceTitle || article.sourceUrl);
  const defaultDisclaimer = t("articles.disclaimerDefault");
  const marketUpdate = t("articles.marketUpdate");
  const readTime = t("articles.readTime");

  return (
    <Shell>
      <MarketplaceHeader />
      <Wrapper>
        <BackLink href="/articles">
          <ArrowLeft size={16} />
          <span>{t("articles.back")}</span>
        </BackLink>

        <Hero as="article">
          <HeroMeta>
            <Badge>{article.category}</Badge>
            <Badge>{formatArticleDate(article.publishedDate, language, marketUpdate)}</Badge>
            <Badge>
              <Clock3 size={13} />
              <span>{`${article.readTimeMinutes} ${readTime}`}</span>
            </Badge>
            {article.region ? (
              <Badge>
                <MapPin size={13} />
                <span>{article.region}</span>
              </Badge>
            ) : null}
          </HeroMeta>
          <Title>{article.title}</Title>
          <Summary>{article.summary}</Summary>
        </Hero>

        <Layout>
          <ContentCard as="article">
            <Disclaimer>{collection.disclaimer || defaultDisclaimer}</Disclaimer>

            <div style={{ display: "grid", gap: 10 }}>
              <SectionTitle>{t("articles.summary")}</SectionTitle>
              <Copy>{article.summary || marketUpdate}</Copy>
            </div>

            {article.marketTakeaway ? (
              <div style={{ display: "grid", gap: 10 }}>
                <SectionTitle>{t("articles.takeaway")}</SectionTitle>
                <Copy>{article.marketTakeaway}</Copy>
              </div>
            ) : null}

            {article.bodySections.length ? (
              <div style={{ display: "grid", gap: 12 }}>
                {article.bodySections.map((section, index) => (
                  <Copy key={`${article.slug}-section-${index}`}>{section}</Copy>
                ))}
              </div>
            ) : article.keyPoints.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                <SectionTitle>{t("articles.keyPoints")}</SectionTitle>
                <BulletList>
                  {article.keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </BulletList>
              </div>
            ) : null}
          </ContentCard>

          <Sidebar>
            <InfoCard>
              {hasSource ? (
                <InfoRow>
                  <InfoLabel>{t("articles.source")}</InfoLabel>
                  <InfoValue>{article.sourceName || article.sourceTitle}</InfoValue>
                </InfoRow>
              ) : null}
              {article.sourceUrl ? (
                <SourceLink href={article.sourceUrl} target="_blank" rel="noreferrer">
                  <span>{article.sourceTitle || article.sourceName || t("articles.source")}</span>
                  <ArrowUpRight size={15} />
                </SourceLink>
              ) : null}
              {article.tags.length ? (
                <InfoRow>
                  <InfoLabel>{t("articles.tags")}</InfoLabel>
                  <InfoValue>{article.tags.join(" • ")}</InfoValue>
                </InfoRow>
              ) : null}
              {article.suggestedPlacement ? (
                <InfoRow>
                  <InfoLabel>{t("articles.placement")}</InfoLabel>
                  <InfoValue>{article.suggestedPlacement}</InfoValue>
                </InfoRow>
              ) : null}
            </InfoCard>

            {relatedArticles.length ? (
              <InfoCard>
                <SectionTitle>{t("articles.related")}</SectionTitle>
                <RelatedList>
                  {relatedArticles.map((related) => (
                    <RelatedCard key={related.slug} href={`/articles/${related.slug}`}>
                      <Badge>{related.category}</Badge>
                      <RelatedTitle>{related.title}</RelatedTitle>
                      <RelatedMeta>
                        <span>{formatArticleDate(related.publishedDate, language, marketUpdate)}</span>
                        <span>{`${related.readTimeMinutes} ${readTime}`}</span>
                      </RelatedMeta>
                    </RelatedCard>
                  ))}
                </RelatedList>
              </InfoCard>
            ) : (
              <InfoCard>
                <SectionTitle>{t("articles.related")}</SectionTitle>
                <Copy>{t("articles.moreFromSeed")}</Copy>
              </InfoCard>
            )}

            <InfoCard>
              <InfoRow>
                <InfoLabel>{t("articles.seed")}</InfoLabel>
                <InfoValue>{collection.project || t("articles.localSeedData")}</InfoValue>
              </InfoRow>
              {collection.purpose ? (
                <InfoRow>
                  <InfoLabel>{t("articles.purpose")}</InfoLabel>
                  <InfoValue>{collection.purpose}</InfoValue>
                </InfoRow>
              ) : null}
              <InfoRow>
                <InfoLabel>{t("articles.status")}</InfoLabel>
                <InfoValue>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Sparkles size={14} />
                    <span>{defaultDisclaimer}</span>
                  </span>
                </InfoValue>
              </InfoRow>
            </InfoCard>
          </Sidebar>
        </Layout>
      </Wrapper>
    </Shell>
  );
}
