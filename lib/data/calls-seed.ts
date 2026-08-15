/**
 * @file VoIP call seed data
 * @description Recorded customer calls with transcripts for the Calls page.
 */

import type { Locale } from "@/lib/i18n/config";
import { EN_CALLS, FA_CALLS, type CallDraft } from "@/lib/data/calls-copy";
import type { CallRecording, Customer } from "@/types";

function withIds(opts: {
  id: string;
  customerId: string;
  agentId: string;
  draft: CallDraft;
}): CallRecording {
  return {
    id: opts.id,
    customerId: opts.customerId,
    agentId: opts.agentId,
    ...opts.draft,
  };
}

/** Builds recorded calls linked to the first customers in the seed. */
export function createCallsSeed(
  locale: Locale,
  customers: Customer[],
  agentId: string,
): CallRecording[] {
  const drafts = locale === "fa" ? FA_CALLS : EN_CALLS;
  const fallback = customers[0]!.id;
  const ids = [
    customers[0]?.id,
    customers[0]?.id,
    customers[1]?.id,
    customers[2]?.id,
    customers[0]?.id,
    customers[3]?.id,
    customers[1]?.id,
    customers[4]?.id,
  ];
  return drafts.map((draft, i) =>
    withIds({
      id: `CL-${101 + i}`,
      customerId: ids[i] ?? fallback,
      agentId,
      draft,
    }),
  );
}
