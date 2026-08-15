"use client";

import { Avatar } from "@/components/ui/Avatar";
import { DetailRow } from "@/components/ui/DetailRow";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { Icon } from "@/lib/icons";
import { CustomerActivityPanel } from "./CustomerActivityPanel";
import { CustomerEntityList } from "./CustomerEntityList";
import { dealStageLabel, tagLabel } from "@/lib/data/labels";
import { teamMemberAvatar } from "@/lib/data/relations";
import { useI18n } from "@/hooks/useI18n";
import { localizedPath } from "@/lib/i18n/navigation";
import { useRouter } from "next/navigation";
import type { AppData, Conversation, Customer, Deal, Task, TimelineEvent } from "@/types";
import type { TeamMember } from "@/types";

export type CustomerOverviewProps = {
  customer: Customer;
  data: AppData;
  companyLabel: string;
  owner: TeamMember | undefined;
  deals: Deal[];
  tasks: Task[];
  conversations: Conversation[];
  timeline: TimelineEvent[];
  onTimeline: (event: TimelineEvent) => void;
};

export function CustomerOverview({
  customer,
  data,
  companyLabel,
  owner,
  deals,
  tasks,
  conversations,
  timeline,
  onTimeline,
}: CustomerOverviewProps) {
  const { locale, dict, fmt } = useI18n();
  const router = useRouter();
  const go = (path: string) => router.push(localizedPath(locale, path));

  return (
    <div className="tabpane">
      <div className="detail-grid">
        <DetailRow label={dict.customers.email}>
          <a className="link" href={`mailto:${customer.email}`}>
            {customer.email}
          </a>
        </DetailRow>
        <DetailRow label={dict.customers.phone}>{customer.phone}</DetailRow>
        <DetailRow label={dict.customers.location}>
          {customer.city}, {customer.country}
        </DetailRow>
        <DetailRow label={dict.customers.company}>{companyLabel}</DetailRow>
        <DetailRow label={dict.customers.owner}>
          <span className="cell-user">
            <Avatar
              name={owner?.name ?? "—"}
              color={teamMemberAvatar(data.teamMembers, customer.ownerId)}
              size={22}
            />
            {owner?.name ?? "—"}
          </span>
        </DetailRow>
        <DetailRow label={dict.customers.lifetimeValue}>
          <b>{fmt.money(customer.value)}</b>
        </DetailRow>
        <DetailRow label={dict.customers.customerSince}>
          {fmt.date(customer.joined)}
        </DetailRow>
      </div>
      <h4 className="drawer-section">{dict.customers.accountHealth}</h4>
      <div className="health-row">
        <GaugeChart
          value={customer.health}
          label={`${fmt.digits(customer.health)}%`}
          sub={dict.customers.healthLabel}
          size={132}
        />
        <div className="health-tags">
          <span className="health-tags__label">{dict.customers.tags}</span>
          <div className="chips">
            {customer.tags.map((tag) => (
              <span key={tag} className="tagchip tagchip--indigo">
                {tagLabel(dict, tag)}
              </span>
            ))}
          </div>
        </div>
      </div>
      {deals.length ? (
        <>
          <h4 className="drawer-section">{dict.customers.deals}</h4>
          <CustomerEntityList
            emptyIcon="briefcase"
            emptyTitle=""
            emptyDesc=""
            onOpen={(id) => go(`/dashboard?deal=${id}`)}
            items={deals.slice(0, 3).map((d) => ({
              id: d.id,
              title: d.title,
              sub: `${fmt.money(d.value)} · ${dealStageLabel(dict, d.stage)}`,
              icon: "briefcase" as const,
            }))}
          />
        </>
      ) : null}
      {tasks.length ? (
        <>
          <h4 className="drawer-section">{dict.customers.openTasks}</h4>
          <ul className="mini-list">
            {tasks.slice(0, 3).map((tk) => (
              <li key={tk.id} className="mini-list__item">
                <span className="mini-list__icon">
                  <Icon name="check" size={16} />
                </span>
                <div className="mini-list__main">
                  <div className="cell-strong">{tk.title}</div>
                  <div className="cell-sub">{fmt.relTime(tk.due)}</div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {conversations.length ? (
        <>
          <h4 className="drawer-section">{dict.customers.recentConversations}</h4>
          <CustomerEntityList
            emptyIcon="message"
            emptyTitle=""
            emptyDesc=""
            onOpen={(id) => go(`/inbox?conversation=${id}`)}
            items={conversations.slice(0, 3).map((c) => ({
              id: c.id,
              title: c.subject,
              sub: fmt.relTime(c.updatedAt),
              icon: "message" as const,
            }))}
          />
        </>
      ) : null}
      {timeline.length ? (
        <>
          <h4 className="drawer-section">{dict.customers.activity}</h4>
          <CustomerActivityPanel
            events={timeline.slice(0, 4)}
            data={data}
            compact
            onSelect={onTimeline}
          />
        </>
      ) : null}
    </div>
  );
}
