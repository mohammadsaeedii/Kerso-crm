import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type {
  CompanySizeKey,
  CompanyStatus,
  CustomerStatus,
  DealStage,
  DealStatus,
  IndustryKey,
  Priority,
  Sentiment,
  TagKey,
} from "@/types";

export function customerStatusLabel(
  dict: Dictionary,
  status: CustomerStatus,
): string {
  return dict.common.status[status];
}

export function dealStageLabel(dict: Dictionary, stage: DealStage): string {
  return dict.common.stage[stage];
}

export function dealStatusLabel(dict: Dictionary, status: DealStatus): string {
  return dict.common.status[status];
}

export function companyStatusLabel(
  dict: Dictionary,
  status: CompanyStatus,
): string {
  return dict.common.status[status];
}

export function priorityLabel(dict: Dictionary, priority: Priority): string {
  return dict.common.priority[priority];
}

export function sentimentLabel(dict: Dictionary, sentiment: Sentiment): string {
  return dict.common.sentiment[sentiment];
}

export function industryLabel(dict: Dictionary, industry: IndustryKey): string {
  return dict.common.industry[industry];
}

export function companySizeLabel(
  dict: Dictionary,
  size: CompanySizeKey,
): string {
  return dict.common.companySize[size];
}

export function tagLabel(dict: Dictionary, tag: TagKey): string {
  return dict.common.tag[tag];
}

export function monthLabel(dict: Dictionary, index: number): string {
  const key = String(index) as keyof typeof dict.months;
  return dict.months[key] ?? String(index);
}

export function kpiLabel(
  dict: Dictionary,
  id: keyof typeof dict.dashboard.kpi | keyof typeof dict.analytics.kpi,
  scope: "dashboard" | "analytics" = "dashboard",
): string {
  if (scope === "analytics") {
    const map = dict.analytics.kpi as Record<string, string>;
    return map[id] ?? id;
  }
  const map = dict.dashboard.kpi as Record<string, string>;
  return map[id] ?? id;
}

export const DEAL_STAGES: readonly DealStage[] = [
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
] as const;

export const CUST_STATUSES: readonly CustomerStatus[] = [
  "active",
  "lead",
  "prospect",
  "churned",
] as const;

export const COMPANY_STATUSES: readonly CompanyStatus[] = [
  "customer",
  "prospect",
  "partner",
  "churned",
] as const;

export const INDUSTRIES: readonly IndustryKey[] = [
  "saas",
  "fintech",
  "healthcare",
  "ecommerce",
  "logistics",
  "media",
  "energy",
  "education",
  "realEstate",
  "manufacturing",
  "travel",
  "retail",
] as const;

export const COMPANY_SIZES: readonly CompanySizeKey[] = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500+",
] as const;

export const TAGS: readonly TagKey[] = [
  "enterprise",
  "smb",
  "hotLead",
  "vip",
  "renewal",
  "upsell",
  "churnRisk",
  "newsletter",
  "demoed",
  "referral",
  "inbound",
  "outbound",
] as const;
