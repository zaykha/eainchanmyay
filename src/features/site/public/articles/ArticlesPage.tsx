import type { Metadata } from "next";
import { ArticlesIndexView } from "@/features/site/public/articles/ArticlesIndexView";
import { getArticleCollection, getArticleCategories } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Articles | Eain Chan Myay",
  description: "Myanmar market articles, research summaries, and temporary MVP editorial coverage for Eain Chan Myay.",
};

export default async function ArticlesPage() {
  const [collection, categories] = await Promise.all([getArticleCollection(), getArticleCategories()]);

  return (
    <ArticlesIndexView
      articles={collection.articles}
      categories={categories}
      disclaimer={collection.disclaimer || "Temporary MVP article data. Please verify before final publication."}
    />
  );
}
