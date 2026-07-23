"use client";

import {
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
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
import { GaugeChart } from "@/components/charts/GaugeChart";
import { Icon, type IconName } from "@/lib/icons";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import {
  customerStatusLabel,
  dealStageLabel,
  dealStatusLabel,
  tagLabel,
} from "@/lib/data/labels";
import { getAppNow } from "@/lib/utils/time";
import type { Customer, CustomerStatus } from "@/types";
import { cn } from "@/lib/utils/cn";

type SortKey =
  | "name"
  | "company"
  | "status"
  | "city"
  | "value"
  | "health"
  | "lastContact";

type SortDir = "asc" | "desc";

type Note = { body: string; time: Date };

const ACT_ICON = {
  deal: "briefcase",
  review: "star",
  customer: "user",
  task: "check",
  message: "message",
} as const;

function Detail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <span className="detail-row__val">{children}</span>
    </div>
  );
}

function SortTh({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
  align,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
  align?: "right";
}) {
  const active = sortKey === col;
  return (
    <th className={cn(align === "right" && "ta-right")}>
      <button
        type="button"
        className="th-sort"
        onClick={() => onSort(col)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          font: "inherit",
          color: "inherit",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {label}
        {active ? (
          <Icon
            name={sortDir === "asc" ? "chevron-up" : "chevron-down"}
            size={14}
          />
        ) : null}
      </button>
    </th>
  );
}

export function CustomersPage() {
  const { dict, t, fmt } = useI18n();
  const {
    data,
    addCustomer,
    updateCustomer,
    removeCustomer,
    removeCustomers,
  } = useData();
  const { toast } = useToast();

  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
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
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);

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
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "company") cmp = a.company.localeCompare(b.company);
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      else if (sortKey === "city") cmp = a.city.localeCompare(b.city);
      else if (sortKey === "value") cmp = a.value - b.value;
      else if (sortKey === "health") cmp = a.health - b.health;
      else cmp = +a.lastContact - +b.lastContact;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [data.customers, status, q, sortKey, sortDir]);

  const allSelected =
    filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "company" || key === "city" ? "asc" : "desc");
    }
  };

  const setStatusFilter = (s: string) => {
    setStatus(s);
    setSelected(new Set());
  };

  const openDrawer = (c: Customer) => {
    setCustomer(c);
    setDrawerTab("ov");
    setNotes([]);
    setNoteText("");
    setMenuId(null);
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
    setMenuId(null);
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
            onClick={() => setStatusFilter(c.key)}
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
            onChange={setStatusFilter}
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

      {selected.size > 0 ? (
        <div
          className="bulk-bar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 14,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600 }}>
            {t("common.table.selected", { count: fmt.digits(selected.size) })}
          </span>
          <Button
            size="sm"
            icon="mail"
            onClick={() =>
              toast(
                t("customers.emailDrafted", {
                  count: fmt.digits(selected.size),
                }),
                { type: "info" },
              )
            }
          >
            {dict.customers.email}
          </Button>
          <Button
            size="sm"
            icon="tag"
            onClick={() =>
              toast(
                t("customers.tagged", { count: fmt.digits(selected.size) }),
                { type: "success" },
              )
            }
          >
            {dict.customers.addTag}
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon="trash"
            onClick={() => setBulkDeleteOpen(true)}
          >
            {t("common.delete")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
          >
            {t("common.table.clear")}
          </Button>
        </div>
      ) : null}

      <div className="panel panel--table">
        {!filtered.length ? (
          <EmptyState
            icon="users"
            title={dict.customers.noCustomers}
            desc={dict.customers.noCustomersDesc}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => {
                          if (allSelected) setSelected(new Set());
                          else setSelected(new Set(filtered.map((c) => c.id)));
                        }}
                      />
                      <span />
                    </label>
                  </th>
                  <SortTh
                    label={dict.customers.customer}
                    col="name"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label={dict.customers.company}
                    col="company"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label={dict.customers.status}
                    col="status"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label={dict.customers.location}
                    col="city"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label={dict.customers.value}
                    col="value"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    align="right"
                  />
                  <SortTh
                    label={dict.customers.health}
                    col="health"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label={dict.customers.lastContact}
                    col="lastContact"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <th style={{ width: 44 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="is-clickable"
                    onClick={() => openDrawer(c)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              if (next.has(c.id)) next.delete(c.id);
                              else next.add(c.id);
                              return next;
                            });
                          }}
                        />
                        <span />
                      </label>
                    </td>
                    <td>
                      <span className="cell-user">
                        <Avatar name={c.name} color={c.avatar} size={36} />
                        <span>
                          <div className="cell-strong">{c.name}</div>
                          <div className="cell-sub">{c.email}</div>
                        </span>
                      </span>
                    </td>
                    <td>{c.company}</td>
                    <td>
                      <Badge statusKey={c.status}>
                        {customerStatusLabel(dict, c.status)}
                      </Badge>
                    </td>
                    <td>
                      <span className="cell-loc">
                        <Icon name="map-pin" size={14} />
                        {c.city}
                      </span>
                    </td>
                    <td className="ta-right">
                      <b>{fmt.money(c.value)}</b>
                    </td>
                    <td>
                      <div className="cell-prob">
                        <Progress value={c.health} small />
                        <span>{fmt.digits(c.health)}</span>
                      </div>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {fmt.relTime(c.lastContact)}
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      style={{ position: "relative" }}
                    >
                      <button
                        type="button"
                        className="icon-btn"
                        aria-label={t("common.rowActions")}
                        onClick={() =>
                          setMenuId((id) => (id === c.id ? null : c.id))
                        }
                      >
                        <Icon name="more-h" size={16} />
                      </button>
                      {menuId === c.id ? (
                        <div
                          className="menu"
                          style={{
                            position: "absolute",
                            insetInlineEnd: 0,
                            top: "100%",
                            zIndex: 20,
                            minWidth: 160,
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            boxShadow: "var(--shadow-hover)",
                            padding: 6,
                          }}
                        >
                          <button
                            type="button"
                            className="menu__item"
                            style={menuItemStyle}
                            onClick={() => openDrawer(c)}
                          >
                            <Icon name="eye" size={15} />
                            {dict.customers.viewProfile}
                          </button>
                          <button
                            type="button"
                            className="menu__item"
                            style={menuItemStyle}
                            onClick={() => openForm(c)}
                          >
                            <Icon name="edit" size={15} />
                            {t("common.edit")}
                          </button>
                          <button
                            type="button"
                            className="menu__item"
                            style={menuItemStyle}
                            onClick={() => {
                              setMenuId(null);
                              toast(
                                t("customers.emailTo", { name: c.name }),
                                { type: "info" },
                              );
                            }}
                          >
                            <Icon name="mail" size={15} />
                            {dict.customers.sendEmail}
                          </button>
                          <button
                            type="button"
                            className="menu__item"
                            style={{ ...menuItemStyle, color: "var(--c-red)" }}
                            onClick={() => {
                              setMenuId(null);
                              setDeleteTarget(c);
                            }}
                          >
                            <Icon name="trash" size={15} />
                            {t("common.delete")}
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                onClick={() =>
                  toast(`${dict.customers.deal} — ${customer.name}`, {
                    type: "info",
                  })
                }
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
                  { value: "nt", label: dict.customers.notes },
                ]}
              />

              {drawerTab === "ov" ? (
                <div className="tabpane">
                  <div className="detail-grid">
                    <Detail label={dict.customers.email}>
                      <a className="link" href={`mailto:${customer.email}`}>
                        {customer.email}
                      </a>
                    </Detail>
                    <Detail label={dict.customers.phone}>
                      {customer.phone}
                    </Detail>
                    <Detail label={dict.customers.location}>
                      {customer.city}, {customer.country}
                    </Detail>
                    <Detail label={dict.customers.owner}>
                      <span className="cell-user">
                        <Avatar name={customer.owner} color="indigo" size={22} />
                        {customer.owner}
                      </span>
                    </Detail>
                    <Detail label={dict.customers.lifetimeValue}>
                      <b>{fmt.money(customer.value)}</b>
                    </Detail>
                    <Detail label={dict.customers.customerSince}>
                      {fmt.date(customer.joined)}
                    </Detail>
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
          count: fmt.digits(selected.size),
        })}
        message={dict.customers.bulkDeleteMessage}
        confirmText={t("common.deleteAll")}
        onConfirm={() => {
          const ids = Array.from(selected);
          removeCustomers(ids);
          setSelected(new Set());
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

const menuItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 10px",
  border: "none",
  background: "transparent",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 500,
  color: "var(--text)",
  textAlign: "start",
};
