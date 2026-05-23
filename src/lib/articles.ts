import "server-only";

import { cache } from "react";
import { promises as fs } from "fs";
import path from "path";
import {
  type ArticleCollection,
  type ArticleRecord,
  type ArticleSeedItem,
  estimateReadTime,
  formatArticleDate,
  getArticleSearchHaystack,
  normalizeBody,
  slugifyArticleTitle,
} from "@/lib/articles-shared";

type ArticleSeedPayload = {
  project?: string;
  purpose?: string;
  language?: string;
  disclaimer?: string;
  fetchedAt?: string;
  count?: number;
  notesForCodex?: string[];
  articles?: ArticleSeedItem[];
};

const ARTICLE_SEED_PATHS = [
  path.join(process.cwd(), "data", "eainchanmyay_myanmar_market_articles_seed.json"),
  path.join(process.cwd(), "public", "data", "myanmar-market-articles-seed.json"),
];

const DEFAULT_DISCLAIMER = "Temporary MVP article data. Please verify before final publication.";

function normalizeArticle(item: ArticleSeedItem, index: number): ArticleRecord {
  const title = String(item.title ?? "").trim() || `Market update ${index + 1}`;
  const summary = String(item.summary ?? "").trim() || String(item.marketTakeaway ?? "").trim() || "Market update";
  const category = String(item.category ?? "").trim() || "Market Update";
  const slug = String(item.slug ?? "").trim() || slugifyArticleTitle(title);
  const bodyData = normalizeBody(item.body);
  const keyPoints = Array.isArray(item.keyPoints)
    ? item.keyPoints.map((point) => String(point ?? "").trim()).filter(Boolean)
    : [];

  const derivedPoints = [
    bodyData.body ? null : summary,
    item.marketTakeaway ? String(item.marketTakeaway).trim() : null,
    item.region ? `Region: ${String(item.region).trim()}` : null,
    item.sourceTitle ? `Source topic: ${String(item.sourceTitle).trim()}` : null,
  ]
    .filter(Boolean)
    .filter((value, position, all) => all.indexOf(value) === position)
    .slice(0, 4) as string[];

  return {
    id: String(item.id ?? `article-${index + 1}`),
    slug,
    title,
    summary,
    category,
    sourceName: item.sourceName ? String(item.sourceName).trim() : null,
    sourceTitle: item.sourceTitle ? String(item.sourceTitle).trim() : null,
    sourceUrl: item.sourceUrl ? String(item.sourceUrl).trim() : null,
    publishedDate: item.publishedDate ? String(item.publishedDate).trim() : null,
    region: item.region ? String(item.region).trim() : null,
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag ?? "").trim()).filter(Boolean) : [],
    marketTakeaway: item.marketTakeaway ? String(item.marketTakeaway).trim() : null,
    suggestedPlacement: item.suggestedPlacement ? String(item.suggestedPlacement).trim() : null,
    temporary: item.temporary === true,
    body: bodyData.body,
    bodySections: bodyData.sections,
    keyPoints: keyPoints.length ? keyPoints : derivedPoints,
    readTimeMinutes: estimateReadTime([
      title,
      summary,
      bodyData.body,
      item.marketTakeaway ? String(item.marketTakeaway) : null,
    ]),
  };
}

async function readSeedFile() {
  for (const candidate of ARTICLE_SEED_PATHS) {
    try {
      return await fs.readFile(candidate, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error("Article seed file not found.");
}

export const getArticleCollection = cache(async (): Promise<ArticleCollection> => {
  const raw = await readSeedFile();
  const parsed = JSON.parse(raw) as ArticleSeedPayload;
  const items = Array.isArray(parsed.articles) ? parsed.articles : [];
  const articles = items.map(normalizeArticle).sort((left, right) => {
    const leftDate = left.publishedDate ? Date.parse(left.publishedDate) : 0;
    const rightDate = right.publishedDate ? Date.parse(right.publishedDate) : 0;
    return rightDate - leftDate;
  });

  return {
    disclaimer: parsed.disclaimer ? String(parsed.disclaimer) : DEFAULT_DISCLAIMER,
    language: parsed.language ? String(parsed.language) : null,
    project: parsed.project ? String(parsed.project) : null,
    purpose: parsed.purpose ? String(parsed.purpose) : null,
    fetchedAt: parsed.fetchedAt ? String(parsed.fetchedAt) : null,
    articles,
  };
});

export async function getArticles() {
  const collection = await getArticleCollection();
  return collection.articles;
}

export async function getArticleBySlug(slug: string) {
  const articles = await getArticles();
  return articles.find((article) => article.slug === slug) ?? null;
}

export async function getArticleCategories() {
  const articles = await getArticles();
  return Array.from(new Set(articles.map((article) => article.category))).sort((left, right) =>
    left.localeCompare(right)
  );
}

export async function getRelatedArticles(article: ArticleRecord, limit = 3) {
  const articles = await getArticles();
  const tagSet = new Set(article.tags.map((tag) => tag.toLowerCase()));

  return articles
    .filter((candidate) => candidate.slug !== article.slug)
    .map((candidate) => {
      const sharedTags = candidate.tags.filter((tag) => tagSet.has(tag.toLowerCase())).length;
      const sameCategory = candidate.category === article.category ? 3 : 0;
      return {
        candidate,
        score: sameCategory + sharedTags,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

export { formatArticleDate, getArticleSearchHaystack };
