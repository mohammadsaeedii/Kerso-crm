"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { PageHead } from "@/components/ui/PageHead";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { Field } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DataTable } from "@/components/ui/DataTable";
import { DetailRow } from "@/components/ui/DetailRow";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { GaugeChart } from "@/components/charts/GaugeChart";
import { Icon, type IconName } from "@/lib/icons";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { useRecordQuery } from "@/hooks/useRecordQuery";
import { localizedPath } from "@/lib/i18n/navigation";
import {
  customerStatusLabel,
  dealStageLabel,
  dealStatusLabel,
  tagLabel,
} from "@/lib/data/labels";
import {
  companyName,
  dealsForCustomer,
  notesForCustomer,
  tasksForCustomer,
  teamMemberAvatar,
  teamMemberById,
  timelineForCustomer,
} from "@/lib/data/relations";
import { getAppNow } from "@/lib/utils/time";
import type { AppData, Customer, CustomerStatus, TimelineEvent } from "@/types";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { cn } from "@/lib/utils/cn";

const TIMELINE_ICON: Record<TimelineEvent["type"], IconName> = {
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

function timelineLabel(
  event: TimelineEvent,
  data: AppData,
  dict: Dictionary,
  t: (key: string, vars?: Record<string, string | number>) => string,
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

export function CustomersPage({
  initialCustomerId = null,
}: {
  initialCustomerId?: string | null;
}) {
  const { locale, dict, t, fmt } = useI18n();
  const {
    data,
    addCustomer,
    updateCustomer,
    removeCustomer,
    removeCustomers,
    addDeal,
    addNote,
  } = useData();
  const { toast } = useToast();
  const router = useRouter();
  const [customerId, setCustomerId] = useRecordQuery("customer", initialCustomerId);

  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [drawerTab, setDrawerTab] = useState("ov");
  const [noteText, setNoteText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyId: "",
    status: "lead" as CustomerStatus,
    city: "",
    country: "",
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
  }>({});
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [bulkIds, setBulkIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [menu, setMenu] = useState<{
    row: Customer;
    anchor: HTMLElement;
  } | null>(null);

  const customer =
    data.customers.find((c) => c.id === customerId) ?? null;

  const counts = useMemo(() => {
    const by = (s: CustomerStatus) =>
      data.customers.filter((c) => c.status === s).length;
    return [
      {
        label: dict.customers.allCustomers,
        value: data.customers.length,
        key: "all",
        icon: "users" as IconName,
      },
      {
        label: dict.common.status.active,
        value: by("active"),
        key: "active",
        icon: "check-circle" as IconName,
      },
      {
        label: dict.customers.leads,
        value: by("lead"),
        key: "lead",
        icon: "target" as IconName,
      },
      {
        label: dict.common.status.churned,
        value: by("churned"),
        key: "churned",
        icon: "trending-down" as IconName,
      },
    ];
  }, [data.customers, dict]);

  const filtered = useMemo(() => {
    let list = data.customers.slice();
    if (status !== "all") {
      list = list.filter((c) => c.status === status);
    }
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter((c) => {
        const company = companyName(data.companies, c.companyId, "");
        return (
          c.name.toLowerCase().includes(needle) ||
          c.email.toLowerCase().includes(needle) ||
          company.toLowerCase().includes(needle) ||
          c.city.toLowerCase().includes(needle)
        );
      });
    }
    return list;
  }, [data.customers, data.companies, status, q]);

  const openDrawer = (c: Customer) => {
    setCustomerId(c.id);
    setDrawerTab("ov");
    setNoteText("");
    setMenu(null);
  };

  const closeDrawer = () => setCustomerId(null);

  const openForm = (existing: Customer | null) => {
    setEditing(existing);
    setForm(
      existing
        ? {
            name: existing.name,
            email: existing.email,
            phone: existing.phone,
            companyId: existing.companyId ?? "",
            status: existing.status,
            city: existing.city,
            country: existing.country,
          }
        : {
            name: "",
            email: "",
            phone: "",
            companyId: "",
            status: "lead",
            city: "",
            country: "",
          },
    );
    setFormErrors({});
    setFormOpen(true);
    setMenu(null);
  };

  const submitForm = (e?: FormEvent) => {
    e?.preventDefault();
    const errors: { name?: string; email?: string } = {};
    if (!form.name.trim()) errors.name = dict.common.validation.required;
    if (!form.email.trim()) errors.email = dict.common.validation.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = dict.common.validation.invalidEmail;
    }
    setFormErrors(errors);
    if (Object.keys(errors).length) return;

    const companyId = form.companyId || undefined;

    if (editing) {
      updateCustomer(editing.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        companyId,
        status: form.status,
        city: form.city.trim() || "—",
        country: form.country.trim() || "—",
      });
      toast(dict.customers.customerUpdated, {
        type: "success",
        desc: form.name.trim(),
      });
    } else {
      const row = addCustomer({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        companyId,
        status: form.status,
        city: form.city.trim() || "—",
        country: form.country.trim() || "—",
        value: 0,
        deals: 0,
        health: 60,
        avatar: data.avatarColor(),
        ownerId: data.currentUser.id,
        tags: ["inbound"],
        joined: getAppNow(),
        lastContact: getAppNow(),
        rating: 5,
      });
      toast(dict.customers.customerAdded, {
        type: "success",
        desc: row.name,
      });
    }
    setFormOpen(false);
  };

  const dealsFor = customer ? dealsForCustomer(data.deals, customer.id) : [];
  const notes = customer ? notesForCustomer(data.notes, customer.id) : [];
  const openTasks = customer
    ? tasksForCustomer(data.tasks, customer.id).filter((tk) => !tk.done)
    : [];
  const customerConversations = customer
    ? data.conversations
        .filter((c) => c.customerId === customer.id)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    : [];
  const customerTickets = customer
    ? data.tickets.filter((tk) => tk.customerId === customer.id)
    : [];
  const customerTimeline = customer
    ? timelineForCustomer(data.timeline, customer.id)
    : [];
  const companyLabel = customer
    ? companyName(data.companies, customer.companyId)
    : "—";
  const owner = customer
    ? teamMemberById(data.teamMembers, customer.ownerId)
    : undefined;

  const createLinkedDeal = () => {
    if (!customer) return;
    const row = addDeal({
      title: t("customers.newDealTitle", { name: customer.name }),
      customerId: customer.id,
      companyId: customer.companyId,
      ownerId: data.currentUser.id,
      value: 10000,
      stage: "lead",
      probability: 20,
      close: getAppNow(),
      status: "open",
    });
    setDrawerTab("dl");
    toast(dict.customers.dealCreated, { type: "success", desc: row.title });
  };

  const onTimelineClick = (event: TimelineEvent) => {
    switch (event.type) {
      case "conversation_created":
      case "message_received":
        router.push(
          localizedPath(locale, `/inbox?conversation=${event.conversationId}`),
        );
        break;
      case "ticket_created":
        router.push(localizedPath(locale, `/tickets?ticket=${event.ticketId}`));
        break;
      case "deal_created":
      case "deal_stage_changed":
        router.push(localizedPath(locale, `/dashboard?deal=${event.dealId}`));
        break;
      case "note_added":
        setDrawerTab("nt");
        break;
      default:
        break;
    }
  };

  return (
    <>
      <PageHead
        title={dict.customers.title}
        sub={t("customers.sub", {
          count: fmt.digits(data.customers.length),
        })}
        actions={
          <>
            <Button
              icon="download"
              onClick={() =>
                toast(dict.customers.exported, {
                  type: "success",
                  desc: "customers.csv",
                })
              }
            >
              {t("common.export")}
            </Button>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => openForm(null)}
            >
              {dict.customers.addCustomer}
            </Button>
          </>
        }
      />

      <section className="cards cards--mini">
        {counts.map((c) => (
          <button
            key={c.key}
            type="button"
            className={cn(
              "card stat-mini stat-mini--btn",
              status === c.key && "is-active",
            )}
            onClick={() => setStatus(c.key)}
          >
            <span className="stat-mini__icon">
              <Icon name={c.icon} size={18} />
            </span>
            <span className="stat-mini__body">
              <span className="stat-mini__value">{fmt.num(c.value)}</span>
              <span className="card__label">{c.label}</span>
            </span>
          </button>
        ))}
      </section>

      <div className="filterbar">
        <div className="filterbar__search">
          <Icon name="search" size={18} className="filterbar__searchicon" />
          <input
            className="input"
            placeholder={dict.customers.search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="filterbar__controls">
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: dict.common.all },
              { value: "active", label: dict.common.status.active },
              { value: "lead", label: dict.common.status.lead },
              { value: "prospect", label: dict.common.status.prospect },
              { value: "churned", label: dict.common.status.churned },
            ]}
          />
        </div>
      </div>

      <div className="panel panel--table">
        <DataTable
          rows={filtered}
          selectable
          sortKey="value"
          sortDir="desc"
          emptyIcon="users"
          emptyTitle={dict.customers.noCustomers}
          emptyDesc={dict.customers.noCustomersDesc}
          rowClick={(c) => openDrawer(c)}
          rowActions={(c, anchor) => setMenu({ row: c, anchor })}
          bulkActions={[
            {
              label: dict.customers.email,
              icon: "mail",
              onClick: (rows) =>
                toast(
                  t("customers.emailDrafted", {
                    count: fmt.digits(rows.length),
                  }),
                  { type: "info" },
                ),
            },
            {
              label: dict.customers.addTag,
              icon: "tag",
              onClick: (rows) =>
                toast(
                  t("customers.tagged", { count: fmt.digits(rows.length) }),
                  { type: "success" },
                ),
            },
            {
              label: t("common.delete"),
              icon: "trash",
              variant: "danger",
              onClick: (rows) => {
                setBulkIds(rows.map((r) => r.id));
                setBulkDeleteOpen(true);
              },
            },
          ]}
          columns={[
            {
              key: "name",
              label: dict.customers.customer,
              render: (c) => (
                <span className="cell-user">
                  <Avatar name={c.name} color={c.avatar} size={36} />
                  <span>
                    <div className="cell-strong">{c.name}</div>
                    <div className="cell-sub">{c.email}</div>
                  </span>
                </span>
              ),
            },
            {
              key: "company",
              label: dict.customers.company,
              sortVal: (c) => companyName(data.companies, c.companyId),
              render: (c) => companyName(data.companies, c.companyId),
            },
            {
              key: "status",
              label: dict.customers.status,
              render: (c) => (
                <Badge statusKey={c.status}>
                  {customerStatusLabel(dict, c.status)}
                </Badge>
              ),
            },
            {
              key: "city",
              label: dict.customers.location,
              render: (c) => (
                <span className="cell-loc">
                  <Icon name="map-pin" size={14} />
                  {c.city}
                </span>
              ),
            },
            {
              key: "value",
              label: dict.customers.value,
              align: "right",
              sortVal: (c) => c.value,
              render: (c) => <b>{fmt.money(c.value)}</b>,
            },
            {
              key: "health",
              label: dict.customers.health,
              sortVal: (c) => c.health,
              render: (c) => (
                <div className="cell-prob">
                  <Progress value={c.health} small />
                  <span>{fmt.digits(c.health)}</span>
                </div>
              ),
            },
            {
              key: "lastContact",
              label: dict.customers.lastContact,
              nowrap: true,
              sortVal: (c) => +c.lastContact,
              render: (c) => fmt.relTime(c.lastContact),
            },
          ]}
        />
      </div>

      <Menu
        open={!!menu}
        anchor={menu?.anchor ?? null}
        onClose={() => setMenu(null)}
      >
        {menu ? (
          <>
            <MenuItem
              icon="eye"
              onClick={() => {
                openDrawer(menu.row);
                setMenu(null);
              }}
            >
              {dict.customers.viewProfile}
            </MenuItem>
            <MenuItem
              icon="edit"
              onClick={() => {
                openForm(menu.row);
                setMenu(null);
              }}
            >
              {t("common.edit")}
            </MenuItem>
            <MenuItem
              icon="mail"
              onClick={() => {
                toast(t("customers.emailTo", { name: menu.row.name }), {
                  type: "info",
                });
                setMenu(null);
              }}
            >
              {dict.customers.sendEmail}
            </MenuItem>
            <MenuItem
              icon="trash"
              danger
              onClick={() => {
                setDeleteTarget(menu.row);
                setMenu(null);
              }}
            >
              {t("common.delete")}
            </MenuItem>
          </>
        ) : null}
      </Menu>

      <Drawer
        open={!!customer}
        onClose={closeDrawer}
        width={500}
        head={
          customer ? (
            <div className="drawer-id">
              <Avatar name={customer.name} color={customer.avatar} size={48} />
              <div className="drawer-id__main">
                <h2 className="drawer__title">{customer.name}</h2>
                <p className="drawer-id__sub">{companyLabel}</p>
              </div>
              <Badge statusKey={customer.status}>
                {customerStatusLabel(dict, customer.status)}
              </Badge>
            </div>
          ) : null
        }
        footer={
          customer ? (
            <>
              <Button
                icon="edit"
                onClick={() => {
                  closeDrawer();
                  openForm(customer);
                }}
              >
                {t("common.edit")}
              </Button>
              <Button
                variant="primary"
                icon="message"
                onClick={() =>
                  router.push(
                    localizedPath(locale, `/inbox?customer=${customer.id}`),
                  )
                }
              >
                {dict.customers.message}
              </Button>
            </>
          ) : null
        }
      >
        {customer ? (
          <>
            <div className="drawer-quick">
              <a className="drawer-quick__btn" href={`mailto:${customer.email}`}>
                <Icon name="mail" size={18} />
                <span>{dict.customers.email}</span>
              </a>
              <button
                type="button"
                className="drawer-quick__btn"
                onClick={() =>
                  toast(`${dict.customers.call} — ${customer.name}`, {
                    type: "info",
                  })
                }
              >
                <Icon name="phone" size={18} />
                <span>{dict.customers.call}</span>
              </button>
              <button
                type="button"
                className="drawer-quick__btn"
                onClick={() => setDrawerTab("nt")}
              >
                <Icon name="edit" size={18} />
                <span>{dict.customers.note}</span>
              </button>
              <button
                type="button"
                className="drawer-quick__btn"
                onClick={createLinkedDeal}
              >
                <Icon name="briefcase" size={18} />
                <span>{dict.customers.deal}</span>
              </button>
            </div>

            <div className="tabbed">
              <Tabs
                value={drawerTab}
                onChange={setDrawerTab}
                items={[
                  { value: "ov", label: dict.customers.overview },
                  {
                    value: "dl",
                    label: dict.customers.deals,
                    count: dealsFor.length,
                  },
                  { value: "ac", label: dict.customers.activity },
                  { value: "nt", label: dict.customers.notes, count: notes.length },
                  {
                    value: "cv",
                    label: dict.customers.conversations,
                    count: customerConversations.length,
                  },
                  {
                    value: "tk",
                    label: dict.customers.tickets,
                    count: customerTickets.length,
                  },
                ]}
              />

              {drawerTab === "ov" ? (
                <div className="tabpane">
                  <div className="detail-grid">
                    <DetailRow label={dict.customers.email}>
                      <a className="link" href={`mailto:${customer.email}`}>
                        {customer.email}
                      </a>
                    </DetailRow>
                    <DetailRow label={dict.customers.phone}>
                      {customer.phone}
                    </DetailRow>
                    <DetailRow label={dict.customers.location}>
                      {customer.city}, {customer.country}
                    </DetailRow>
                    <DetailRow label={dict.customers.company}>
                      {companyLabel}
                    </DetailRow>
                    <DetailRow label={dict.customers.owner}>
                      <span className="cell-user">
                        <Avatar
                          name={owner?.name ?? "—"}
                          color={teamMemberAvatar(
                            data.teamMembers,
                            customer.ownerId,
                          )}
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
                  <h4 className="drawer-section">
                    {dict.customers.accountHealth}
                  </h4>
                  <div className="health-row">
                    <GaugeChart
                      value={customer.health}
                      label={`${fmt.digits(customer.health)}%`}
                      sub={dict.customers.healthLabel}
                      size={132}
                    />
                    <div className="health-tags">
                      <span className="health-tags__label">
                        {dict.customers.tags}
                      </span>
                      <div className="chips">
                        {customer.tags.map((tag) => (
                          <span
                            key={tag}
                            className="tagchip tagchip--indigo"
                          >
                            {tagLabel(dict, tag)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {dealsFor.length ? (
                    <>
                      <h4 className="drawer-section">{dict.customers.deals}</h4>
                      <ul className="mini-list">
                        {dealsFor.slice(0, 3).map((d) => (
                          <li key={d.id}>
                            <button
                              type="button"
                              className="mini-list__item"
                              onClick={() =>
                                router.push(
                                  localizedPath(
                                    locale,
                                    `/dashboard?deal=${d.id}`,
                                  ),
                                )
                              }
                            >
                              <span className="mini-list__icon">
                                <Icon name="briefcase" size={16} />
                              </span>
                              <div className="mini-list__main">
                                <div className="cell-strong">{d.title}</div>
                                <div className="cell-sub">
                                  {fmt.money(d.value)} ·{" "}
                                  {dealStageLabel(dict, d.stage)}
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {openTasks.length ? (
                    <>
                      <h4 className="drawer-section">
                        {dict.customers.openTasks}
                      </h4>
                      <ul className="mini-list">
                        {openTasks.slice(0, 3).map((tk) => (
                          <li key={tk.id} className="mini-list__item">
                            <span className="mini-list__icon">
                              <Icon name="check" size={16} />
                            </span>
                            <div className="mini-list__main">
                              <div className="cell-strong">{tk.title}</div>
                              <div className="cell-sub">
                                {fmt.relTime(tk.due)}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {customerConversations.length ? (
                    <>
                      <h4 className="drawer-section">
                        {dict.customers.recentConversations}
                      </h4>
                      <ul className="mini-list">
                        {customerConversations.slice(0, 3).map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              className="mini-list__item"
                              onClick={() =>
                                router.push(
                                  localizedPath(
                                    locale,
                                    `/inbox?conversation=${c.id}`,
                                  ),
                                )
                              }
                            >
                              <span className="mini-list__icon">
                                <Icon name="message" size={16} />
                              </span>
                              <div className="mini-list__main">
                                <div className="cell-strong">{c.subject}</div>
                                <div className="cell-sub">
                                  {fmt.relTime(c.updatedAt)}
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {customerTimeline.length ? (
                    <>
                      <h4 className="drawer-section">
                        {dict.customers.activity}
                      </h4>
                      <ul className="act-list act-list--compact">
                        {customerTimeline.slice(0, 4).map((event) => (
                          <li key={event.id}>
                            <button
                              type="button"
                              className="act"
                              onClick={() => onTimelineClick(event)}
                            >
                              <span className="act__dot act__dot--indigo">
                                <Icon
                                  name={TIMELINE_ICON[event.type]}
                                  size={13}
                                />
                              </span>
                              <div className="act__body">
                                <p className="act__text">
                                  {timelineLabel(event, data, dict, t)}
                                </p>
                                <span className="act__time">
                                  {fmt.relTime(event.createdAt)}
                                </span>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ) : null}

              {drawerTab === "dl" ? (
                <div className="tabpane">
                  {dealsFor.length ? (
                    <ul className="mini-list">
                      {dealsFor.map((d) => (
                        <li key={d.id}>
                          <button
                            type="button"
                            className="mini-list__item"
                            onClick={() =>
                              router.push(
                                localizedPath(locale, `/dashboard?deal=${d.id}`),
                              )
                            }
                          >
                            <span className="mini-list__icon">
                              <Icon name="briefcase" size={16} />
                            </span>
                            <div className="mini-list__main">
                              <div className="cell-strong">{d.title}</div>
                              <div className="cell-sub">
                                {fmt.money(d.value)} ·{" "}
                                {dealStageLabel(dict, d.stage)}
                              </div>
                            </div>
                            <Badge statusKey={d.status}>
                              {dealStatusLabel(dict, d.status)}
                            </Badge>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon="briefcase"
                      title={dict.customers.noDealsYet}
                      desc={dict.customers.noDealsDesc}
                    />
                  )}
                </div>
              ) : null}

              {drawerTab === "ac" ? (
                <div className="tabpane">
                  {customerTimeline.length ? (
                    <ul className="act-list">
                      {customerTimeline.map((event) => (
                        <li key={event.id}>
                          <button
                            type="button"
                            className="act"
                            onClick={() => onTimelineClick(event)}
                          >
                            <span className="act__dot act__dot--indigo">
                              <Icon
                                name={TIMELINE_ICON[event.type]}
                                size={13}
                              />
                            </span>
                            <div className="act__body">
                              <p className="act__text">
                                {timelineLabel(event, data, dict, t)}
                              </p>
                              <span className="act__time">
                                {fmt.relTime(event.createdAt)}
                              </span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon="clock"
                      title={dict.customers.noActivity}
                      desc={dict.customers.noActivityDesc}
                    />
                  )}
                </div>
              ) : null}

              {drawerTab === "nt" ? (
                <div className="tabpane">
                  <div className="notes">
                    {!notes.length ? (
                      <p className="notes__empty">{dict.customers.noNotes}</p>
                    ) : (
                      notes.map((n) => {
                        const author = teamMemberById(
                          data.teamMembers,
                          n.authorId,
                        );
                        return (
                          <div key={n.id} className="note">
                            <div className="note__head">
                              <Avatar
                                name={author?.name ?? data.currentUser.name}
                                color={teamMemberAvatar(
                                  data.teamMembers,
                                  n.authorId,
                                )}
                                size={26}
                              />
                              <b>{author?.name ?? data.currentUser.name}</b>
                              <span className="note__time">
                                {fmt.relTime(n.createdAt)}
                              </span>
                            </div>
                            <p className="note__body">{n.body}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <form
                    className="note-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = noteText.trim();
                      if (!v) return;
                      addNote({
                        body: v,
                        customerId: customer.id,
                        companyId: customer.companyId,
                        authorId: data.currentUser.id,
                      });
                      setNoteText("");
                      toast(dict.customers.noteAdded, { type: "success" });
                    }}
                  >
                    <textarea
                      className="textarea"
                      rows={3}
                      placeholder={t("customers.addNotePlaceholder", {
                        name: customer.name,
                      })}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                    />
                    <Button type="submit" variant="primary" size="sm">
                      {dict.customers.addNote}
                    </Button>
                  </form>
                </div>
              ) : null}

              {drawerTab === "cv" ? (
                <div className="tabpane">
                  {customerConversations.length ? (
                    <ul className="mini-list">
                      {customerConversations.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            className="mini-list__item"
                            onClick={() =>
                              router.push(
                                localizedPath(
                                  locale,
                                  `/inbox?conversation=${c.id}`,
                                ),
                              )
                            }
                          >
                            <span className="mini-list__icon">
                              <Icon name="message" size={16} />
                            </span>
                            <div className="mini-list__main">
                              <div className="cell-strong">{c.subject}</div>
                              <div className="cell-sub">
                                {dict.inbox.status[c.status]} ·{" "}
                                {fmt.relTime(c.updatedAt)}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon="message"
                      title={dict.customers.noConversations}
                      desc={dict.customers.noConversationsDesc}
                    />
                  )}
                </div>
              ) : null}

              {drawerTab === "tk" ? (
                <div className="tabpane">
                  {customerTickets.length ? (
                    <ul className="mini-list">
                      {customerTickets.map((tk) => (
                        <li key={tk.id}>
                          <button
                            type="button"
                            className="mini-list__item"
                            onClick={() =>
                              router.push(
                                localizedPath(locale, `/tickets?ticket=${tk.id}`),
                              )
                            }
                          >
                            <span className="mini-list__icon">
                              <Icon name="flag" size={16} />
                            </span>
                            <div className="mini-list__main">
                              <div className="cell-strong">{tk.title}</div>
                              <div className="cell-sub">
                                {dict.ticketsPage.status[tk.status]} ·{" "}
                                {fmt.relTime(tk.updatedAt)}
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon="flag"
                      title={dict.customers.noTickets}
                      desc={dict.customers.noTicketsDesc}
                    />
                  )}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </Drawer>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={
          editing ? dict.customers.editCustomer : dict.customers.addCustomer
        }
        subtitle={editing ? editing.name : dict.customers.createSubtitle}
        footer={
          <>
            <Button onClick={() => setFormOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={() => submitForm()}>
              {editing ? t("common.save") : dict.customers.addCustomer}
            </Button>
          </>
        }
      >
        <form className="form-grid" onSubmit={submitForm}>
          <Field
            label={dict.customers.fullName}
            name="name"
            required
            wide
            placeholder={dict.customers.placeholderName}
            value={form.name}
            error={formErrors.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Field
            label={dict.customers.email}
            name="email"
            type="email"
            required
            placeholder={dict.customers.placeholderEmail}
            value={form.email}
            error={formErrors.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Field
            label={dict.customers.phone}
            name="phone"
            placeholder={dict.customers.placeholderPhone}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Field
            as="select"
            label={dict.customers.company}
            name="company"
            options={[
              { value: "", label: dict.customers.noCompany },
              ...data.companies.map((c) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
            value={form.companyId}
            onChange={(e) =>
              setForm((f) => ({ ...f, companyId: e.target.value }))
            }
          />
          <Field
            as="select"
            label={dict.customers.status}
            name="status"
            options={data.CUST_STATUS.map((s) => ({
              value: s,
              label: customerStatusLabel(dict, s),
            }))}
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as CustomerStatus,
              }))
            }
          />
          <Field
            label={dict.customers.city}
            name="city"
            placeholder={dict.customers.placeholderCity}
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <Field
            label={dict.customers.country}
            name="country"
            placeholder={dict.customers.placeholderCountry}
            value={form.country}
            onChange={(e) =>
              setForm((f) => ({ ...f, country: e.target.value }))
            }
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        danger
        title={dict.customers.deleteTitle}
        message={
          deleteTarget
            ? t("customers.deleteMessage", { name: deleteTarget.name })
            : undefined
        }
        confirmText={t("common.delete")}
        onConfirm={() => {
          if (!deleteTarget) return;
          removeCustomer(deleteTarget.id);
          if (customer?.id === deleteTarget.id) closeDrawer();
          toast(dict.customers.customerDeleted, {
            type: "success",
            desc: deleteTarget.name,
          });
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        danger
        title={t("customers.bulkDeleteTitle", {
          count: fmt.digits(bulkIds.length),
        })}
        message={dict.customers.bulkDeleteMessage}
        confirmText={t("common.deleteAll")}
        onConfirm={() => {
          const ids = bulkIds;
          removeCustomers(ids);
          setBulkIds([]);
          toast(
            t("customers.customersDeleted", {
              count: fmt.digits(ids.length),
            }),
            { type: "success" },
          );
        }}
      />
    </>
  );
}
