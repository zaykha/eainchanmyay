export type ArticleSeedItem = {
  id?: string;
  slug?: string | null;
  title?: string | null;
  summary?: string | null;
  category?: string | null;
  sourceName?: string | null;
  sourceTitle?: string | null;
  sourceUrl?: string | null;
  publishedDate?: string | null;
  region?: string | null;
  tags?: string[] | null;
  marketTakeaway?: string | null;
  suggestedPlacement?: string | null;
  temporary?: boolean | null;
  body?: string | string[] | null;
  keyPoints?: string[] | null;
};

export type ArticleRecord = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  sourceName: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  publishedDate: string | null;
  region: string | null;
  tags: string[];
  marketTakeaway: string | null;
  suggestedPlacement: string | null;
  temporary: boolean;
  body: string | null;
  bodySections: string[];
  keyPoints: string[];
  readTimeMinutes: number;
};

export type ArticleCollection = {
  disclaimer: string | null;
  language: string | null;
  project: string | null;
  purpose: string | null;
  fetchedAt: string | null;
  articles: ArticleRecord[];
};

export function slugifyArticleTitle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "market-update";
}

export function normalizeBody(raw: ArticleSeedItem["body"]) {
  if (Array.isArray(raw)) {
    const sections = raw.map((item) => String(item ?? "").trim()).filter(Boolean);
    return {
      body: sections.join("\n\n") || null,
      sections,
    };
  }

  const body = String(raw ?? "").trim();
  if (!body) {
    return { body: null, sections: [] as string[] };
  }

  const sections = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return { body, sections: sections.length ? sections : [body] };
}

export function estimateReadTime(parts: Array<string | null | undefined>) {
  const text = parts.filter(Boolean).join(" ").trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(2, Math.ceil(words / 180));
}

function toArticleLocale(language?: string | null) {
  if (language === "mm") return "my-MM";
  if (language === "zh") return "zh-CN";
  if (language === "th") return "th-TH";
  return "en";
}

export function formatArticleDate(value: string | null, language?: string | null, fallback = "Market update") {
  if (!value) return fallback;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(toArticleLocale(language), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getArticleSearchHaystack(article: ArticleRecord) {
  return [
    article.title,
    article.summary,
    article.category,
    article.sourceName,
    article.sourceTitle,
    article.marketTakeaway,
    article.region,
    article.tags.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
