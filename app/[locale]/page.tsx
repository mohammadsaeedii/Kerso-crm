import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";

export default async function LocaleIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) redirect("/fa/inbox");
  redirect(`/${locale}/inbox`);
}
