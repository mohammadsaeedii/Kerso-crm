import type { Metadata } from "next";
import { InboxPage } from "@/features/inbox/InboxPage";
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
  return { title: dict.inbox.title };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ conversation?: string; customer?: string }>;
}) {
  const sp = await searchParams;
  return (
    <InboxPage
      initialConversation={firstQuery(sp.conversation)}
      initialCustomer={firstQuery(sp.customer)}
    />
  );
}
