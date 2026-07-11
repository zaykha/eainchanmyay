import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleDetailViewClient } from "@/features/site/public/articles/[slug]/ArticleDetailViewClient";
import { getArticleBySlug, getArticleCollection, getRelatedArticles } from "@/lib/articles";

const DEFAULT_DISCLAIMER = "Temporary MVP article data. Please verify before final publication.";

type ArticleDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article not found | Eain Chan Myay",
      description: DEFAULT_DISCLAIMER,
    };
  }

  return {
    title: `${article.title} | Eain Chan Myay`,
    description: article.summary || DEFAULT_DISCLAIMER,
  };
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;
  const [article, collection] = await Promise.all([getArticleBySlug(slug), getArticleCollection()]);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article, 3);

  return (
    <ArticleDetailViewClient
      article={article}
      relatedArticles={relatedArticles}
      collection={{
        disclaimer: collection.disclaimer,
        project: collection.project,
        purpose: collection.purpose,
      }}
    />
  );
}
