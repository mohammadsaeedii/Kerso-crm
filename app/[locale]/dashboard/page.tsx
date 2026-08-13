import type { Metadata } from "next";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
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
  return { title: dict.dashboard.title };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}) {
  const sp = await searchParams;
  return <DashboardPage initialDealId={firstQuery(sp.deal)} />;
}
