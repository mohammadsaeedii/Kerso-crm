import type { Metadata } from "next";
import { CustomersPage } from "@/features/customers/CustomersPage";
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
  return { title: dict.customers.title };
}

export default function Page() {
  return <CustomersPage />;
}
