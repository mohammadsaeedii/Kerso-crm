import type { Metadata } from "next";
import { ExplorePage } from "@/features/explore/ExplorePage";
import { firstQuery } from "@/lib/utils/query";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = (isLocale(raw) ? raw : "fa") as Locale;
  const dict = await getDictionary(locale);
  return { title: dict.explore.title };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const sp = await searchParams;
  return <ExplorePage initialCompanyId={firstQuery(sp.company)} />;
}
