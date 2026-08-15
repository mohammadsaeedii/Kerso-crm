/**
 * @file Customer timeline labels
 * @description Maps timeline events to icons and localized copy.
 */

import type { Dictionary } from "@/lib/i18n/get-dictionary";
import type { AppData, TimelineEvent } from "@/types";
import type { IconName } from "@/lib/icons";
import { dealStageLabel } from "@/lib/data/labels";

export const TIMELINE_ICON: Record<TimelineEvent["type"], IconName> = {
  conversation_created: "message",
  message_received: "message",
  ticket_created: "flag",
  deal_created: "briefcase",
  deal_stage_changed: "briefcase",
  task_created: "check",
  note_added: "edit",
  customer_created: "user",
  customer_updated: "user",
};

type Translate = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

/** Localized one-line description for a customer timeline event. */
export function timelineLabel(
  event: TimelineEvent,
  data: AppData,
  dict: Dictionary,
  t: Translate,
): string {
  switch (event.type) {
    case "conversation_created":
    case "message_received": {
      const conv = data.conversations.find((c) => c.id === event.conversationId);
      return t(`customers.timeline.${event.type}`, {
        title: conv?.subject ?? event.conversationId,
      });
    }
    case "ticket_created": {
      const ticket = data.tickets.find((tk) => tk.id === event.ticketId);
      return t("customers.timeline.ticket_created", {
        title: ticket?.title ?? event.ticketId,
      });
    }
    case "deal_created": {
      const deal = data.deals.find((d) => d.id === event.dealId);
      return t("customers.timeline.deal_created", {
        title: deal?.title ?? event.dealId,
      });
    }
    case "deal_stage_changed": {
      const deal = data.deals.find((d) => d.id === event.dealId);
      return t("customers.timeline.deal_stage_changed", {
        title: deal?.title ?? event.dealId,
        stage: dealStageLabel(dict, event.toStage),
      });
    }
    case "task_created": {
      const task = data.tasks.find((tk) => tk.id === event.taskId);
      return t("customers.timeline.task_created", {
        title: task?.title ?? event.taskId,
      });
    }
    case "note_added":
      return dict.customers.timeline.note_added;
    case "customer_created":
      return dict.customers.timeline.customer_created;
    case "customer_updated":
      return dict.customers.timeline.customer_updated;
  }
}

/** Destination path for a timeline event, or null when it stays on this page. */
export function timelineHref(event: TimelineEvent): string | null {
  switch (event.type) {
    case "conversation_created":
    case "message_received":
      return `/inbox?conversation=${event.conversationId}`;
    case "ticket_created":
      return `/tickets?ticket=${event.ticketId}`;
    case "deal_created":
    case "deal_stage_changed":
      return `/dashboard?deal=${event.dealId}`;
    default:
      return null;
  }
}
