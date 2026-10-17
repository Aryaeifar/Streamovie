import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BrowseView } from "@/components/browse/browse-view";
import en from "@/i18n/dictionaries/en";
import { browseCategories, getBrowseCategory } from "@/lib/browse-categories";

export function generateStaticParams() {
  return browseCategories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const config = getBrowseCategory(category);
  if (!config) return {};
  return {
    title: en.home[config.titleKey],
    description: en.home[config.subtitleKey],
  };
}

export default async function BrowseCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const config = getBrowseCategory(category);
  if (!config) notFound();
  return <BrowseView category={config} />;
}
