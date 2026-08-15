import type { Metadata } from "next";
import { CallsPage } from "@/features/calls/CallsPage";
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
  return { title: dict.callsPage.title };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ call?: string; customer?: string }>;
}) {
  const sp = await searchParams;
  return (
    <CallsPage
      initialCallId={firstQuery(sp.call)}
      initialCustomerId={firstQuery(sp.customer)}
    />
  );
}
