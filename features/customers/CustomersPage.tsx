"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
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
import { localizedPath } from "@/lib/i18n/navigation";
import { useRouter } from "next/navigation";
import {
  customerStatusLabel,
  dealStageLabel,
  dealStatusLabel,
  tagLabel,
} from "@/lib/data/labels";
import { getAppNow } from "@/lib/utils/time";
import type { Customer, CustomerStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

type Note = { body: string; time: Date };

const ACT_ICON = {
  deal: "briefcase",
  review: "star",
  customer: "user",
  task: "check",
  message: "message",
} as const;

export function CustomersPage() {
  const { locale, dict, t, fmt } = useI18n();
  const {
    data,
    addCustomer,
    updateCustomer,
    removeCustomer,
    removeCustomers,
  } = useData();
  const { toast } = useToast();
  const router = useRouter();

  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [drawerTab, setDrawerTab] = useState("ov");
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteText, setNoteText] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
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
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.email.toLowerCase().includes(needle) ||
          c.company.toLowerCase().includes(needle) ||
          c.city.toLowerCase().includes(needle),
      );
    }
    return list;
  }, [data.customers, status, q]);

  const openDrawer = (c: Customer) => {
    setCustomer(c);
    setDrawerTab("ov");
    setNotes([]);
    setNoteText("");
    setMenu(null);
  };

  const openForm = (existing: Customer | null) => {
    setEditing(existing);
    setForm(
      existing
        ? {
            name: existing.name,
            email: existing.email,
            phone: existing.phone,
            company: existing.company,
            status: existing.status,
            city: existing.city,
            country: existing.country,
          }
        : {
            name: "",
            email: "",
            phone: "",
            company: "",
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

    if (editing) {
      updateCustomer(editing.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim() || "—",
        status: form.status,
        city: form.city.trim() || "—",
        country: form.country.trim() || "—",
      });
      toast(dict.customers.customerUpdated, {
        type: "success",
        desc: form.name.trim(),
      });
      if (customer?.id === editing.id) {
        setCustomer({
          ...customer,
          ...form,
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim() || "—",
          city: form.city.trim() || "—",
          country: form.country.trim() || "—",
        });
      }
    } else {
      const row = addCustomer({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim() || "—",
        status: form.status,
        city: form.city.trim() || "—",
        country: form.country.trim() || "—",
        value: 0,
        deals: 0,
        health: 60,
        avatar: data.avatarColor(),
        owner: data.currentUser.name,
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

  const dealsFor = customer
    ? data.deals.filter((d) => d.company === customer.company)
    : [];

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
            { key: "company", label: dict.customers.company },
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
        onClose={() => setCustomer(null)}
        width={500}
        head={
          customer ? (
            <div className="drawer-id">
              <Avatar name={customer.name} color={customer.avatar} size={48} />
              <div className="drawer-id__main">
                <h2 className="drawer__title">{customer.name}</h2>
                <p className="drawer-id__sub">{customer.company}</p>
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
                  setCustomer(null);
                  openForm(customer);
                }}
              >
                {t("common.edit")}
              </Button>
              <Button
                variant="primary"
                icon="message"
                onClick={() =>
                  toast(t("customers.messageTo", { name: customer.name }), {
                    type: "info",
                  })
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
                onClick={() => router.push(localizedPath(locale, "/inbox"))}
              >
                <Icon name="inbox" size={18} />
                <span>{dict.nav.inbox}</span>
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
                  { value: "nt", label: dict.customers.notes },
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
                    <DetailRow label={dict.customers.owner}>
                      <span className="cell-user">
                        <Avatar name={customer.owner} color="indigo" size={22} />
                        {customer.owner}
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
                </div>
              ) : null}

              {drawerTab === "dl" ? (
                <div className="tabpane">
                  {dealsFor.length ? (
                    <ul className="mini-list">
                      {dealsFor.map((d) => (
                        <li key={d.id} className="mini-list__item">
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
                  <ul className="act-list">
                    {data.activities.slice(0, 5).map((a, i) => (
                      <li key={i} className="act">
                        <span className={`act__dot act__dot--${a.color}`}>
                          <Icon name={ACT_ICON[a.type] || "info"} size={13} />
                        </span>
                        <div className="act__body">
                          <p className="act__text">
                            <b>{a.who}</b> {a.text}
                          </p>
                          <span className="act__time">
                            {fmt.relTime(a.time)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {drawerTab === "nt" ? (
                <div className="tabpane">
                  <div className="notes">
                    {!notes.length ? (
                      <p className="notes__empty">{dict.customers.noNotes}</p>
                    ) : (
                      notes.map((n, i) => (
                        <div key={i} className="note">
                          <div className="note__head">
                            <Avatar
                              name={data.currentUser.name}
                              color="indigo"
                              size={26}
                            />
                            <b>{data.currentUser.name}</b>
                            <span className="note__time">
                              {fmt.relTime(n.time)}
                            </span>
                          </div>
                          <p className="note__body">{n.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <form
                    className="note-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = noteText.trim();
                      if (!v) return;
                      setNotes((prev) => [
                        { body: v, time: getAppNow() },
                        ...prev,
                      ]);
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
            label={dict.customers.company}
            name="company"
            placeholder={dict.customers.placeholderCompany}
            value={form.company}
            onChange={(e) =>
              setForm((f) => ({ ...f, company: e.target.value }))
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
          if (customer?.id === deleteTarget.id) setCustomer(null);
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
