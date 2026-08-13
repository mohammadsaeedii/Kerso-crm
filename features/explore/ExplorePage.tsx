"use client";

import { useMemo, useState, type FormEvent } from "react";
import { PageHead } from "@/components/ui/PageHead";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { Field } from "@/components/ui/Field";
import { Tabs } from "@/components/ui/Tabs";
import { Stars } from "@/components/ui/Stars";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { DataTable } from "@/components/ui/DataTable";
import { DetailRow } from "@/components/ui/DetailRow";
import { Icon } from "@/lib/icons";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import {
  COMPANY_STATUSES,
  companySizeLabel,
  companyStatusLabel,
  dealStageLabel,
  dealStatusLabel,
  industryLabel,
} from "@/lib/data/labels";
import type {
  AvatarColor,
  Company,
  CompanyStatus,
  IndustryKey,
} from "@/types";
import { cn } from "@/lib/utils/cn";

type SortKey = "revenue" | "growth" | "deals" | "name";
type ViewMode = "grid" | "list";

function CompanyLogo({
  name,
  color,
  size = 38,
}: {
  name: string;
  color: AvatarColor | string;
  size?: number;
}) {
  return (
    <span
      className={cn("clogo", `clogo--${color}`)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.4),
      }}
    >
      {name.charAt(0)}
    </span>
  );
}

export function ExplorePage() {
  const { dict, t, fmt } = useI18n();
  const { data, addCompany, addDeal } = useData();
  const { toast } = useToast();

  const [view, setView] = useState<ViewMode>("grid");
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<SortKey>("revenue");
  const [company, setCompany] = useState<Company | null>(null);
  const [drawerTab, setDrawerTab] = useState("ov");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: data.INDUSTRIES[0] as IndustryKey,
    status: "customer" as CompanyStatus,
    city: "",
    country: "",
    website: "",
  });
  const [errors, setErrors] = useState<{ name?: string }>({});

  const filtered = useMemo(() => {
    let list = data.companies.slice();
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          industryLabel(dict, c.industry).toLowerCase().includes(needle) ||
          c.city.toLowerCase().includes(needle),
      );
    }
    if (industry !== "all") {
      list = list.filter((c) => c.industry === industry);
    }
    if (status !== "all") {
      list = list.filter((c) => c.status === status);
    }
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "growth") return b.growth - a.growth;
      if (sort === "deals") return b.deals - a.deals;
      return b.revenue - a.revenue;
    });
    return list;
  }, [data.companies, q, industry, status, sort, dict]);

  const related = company
    ? data.customers.filter((x) => x.company === company.name)
    : [];
  const dealsFor = company
    ? data.deals.filter((x) => x.company === company.name)
    : [];

  const openCompany = (c: Company) => {
    setCompany(c);
    setDrawerTab("ov");
  };

  const submitAdd = (e?: FormEvent) => {
    e?.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: dict.common.validation.required });
      return;
    }
    const website =
      form.website.trim() ||
      form.name.toLowerCase().replace(/[^a-z0-9]+/gi, "") + ".com";
    const row = addCompany({
      name: form.name.trim(),
      industry: form.industry,
      status: form.status,
      city: form.city.trim() || "—",
      country: form.country.trim() || "—",
      revenue: 0,
      growth: 0,
      contacts: 0,
      deals: 0,
      website,
      logo: data.avatarColor(),
      founded: 2024,
      rating: "5.0",
      size: "1-10",
      description: "Newly added company.",
    });
    setAddOpen(false);
    setForm({
      name: "",
      industry: data.INDUSTRIES[0] as IndustryKey,
      status: "customer",
      city: "",
      country: "",
      website: "",
    });
    setErrors({});
    toast(dict.explore.companyAdded, { type: "success", desc: row.name });
  };

  const companyCard = (c: Company) => (
    <article
      key={c.id}
      className="biz-card"
      tabIndex={0}
      role="button"
      onClick={() => openCompany(c)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCompany(c);
        }
      }}
    >
      <div className="biz-card__head">
        <CompanyLogo name={c.name} color={c.logo} size={46} />
        <div className="biz-card__menu">
          <Badge statusKey={c.status}>{companyStatusLabel(dict, c.status)}</Badge>
        </div>
      </div>
      <h3 className="biz-card__name">{c.name}</h3>
      <p className="biz-card__meta">
        {industryLabel(dict, c.industry)} · {c.city}, {c.country}
      </p>
      <div className="biz-card__stats">
        <div>
          <span className="biz-stat__num">{fmt.moneyCompact(c.revenue)}</span>
          <span className="biz-stat__lbl">{dict.explore.revenue}</span>
        </div>
        <div>
          <span className={`biz-stat__num ${c.growth >= 0 ? "pos" : "neg"}`}>
            {fmt.pct(c.growth)}
          </span>
          <span className="biz-stat__lbl">{dict.explore.growth}</span>
        </div>
        <div>
          <span className="biz-stat__num">{fmt.digits(c.contacts)}</span>
          <span className="biz-stat__lbl">{dict.explore.contacts}</span>
        </div>
      </div>
      <div className="biz-card__foot">
        <span className="biz-card__rating">
          <Icon name="star" size={14} />
          {fmt.digits(c.rating)}
        </span>
        <span className="biz-card__deals">
          {t("explore.openDeals", { count: fmt.digits(c.deals) })}
        </span>
      </div>
    </article>
  );

  return (
    <>
      <PageHead
        title={dict.explore.title}
        sub={dict.explore.sub}
        actions={
          <>
            <Segmented
              value={view}
              onChange={(v) => setView(v as ViewMode)}
              options={[
                { value: "grid", icon: "grid" },
                { value: "list", icon: "list" },
              ]}
            />
            <Button
              variant="primary"
              icon="plus"
              onClick={() => {
                setErrors({});
                setAddOpen(true);
              }}
            >
              {dict.explore.addCompany}
            </Button>
          </>
        }
      />

      <section className="cards cards--mini">
        {data.exploreStats.map((s) => (
          <article key={s.label} className="card stat-mini">
            <p className="card__label">{s.label}</p>
            <p className="stat-mini__value">
              {s.money ? fmt.moneyCompact(s.value) : fmt.num(s.value)}
              {s.suffix || ""}
            </p>
            <p className="stat-mini__sub">{s.sub}</p>
          </article>
        ))}
      </section>

      <div className="filterbar">
        <div className="filterbar__search">
          <Icon name="search" size={18} className="filterbar__searchicon" />
          <input
            className="input"
            placeholder={dict.explore.searchCompanies}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="filterbar__controls">
          <label className="select-wrap">
            <select
              className="select"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="all">{dict.common.all}</option>
              {data.INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {industryLabel(dict, i)}
                </option>
              ))}
            </select>
          </label>
          <label className="select-wrap">
            <select
              className="select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">{dict.common.all}</option>
              {COMPANY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {companyStatusLabel(dict, s)}
                </option>
              ))}
            </select>
          </label>
          <label className="select-wrap">
            <select
              className="select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="revenue">{dict.explore.sortRevenue}</option>
              <option value="growth">{dict.explore.sortGrowth}</option>
              <option value="deals">{dict.explore.sortDeals}</option>
              <option value="name">{dict.explore.sortName}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="result-count">
        {filtered.length === 1
          ? t("explore.resultCountOne", { count: fmt.digits(1) })
          : t("explore.resultCount", { count: fmt.digits(filtered.length) })}
      </div>

      {!filtered.length ? (
        <EmptyState
          icon="building"
          title={dict.explore.noCompanies}
          desc={dict.explore.noCompaniesDesc}
        />
      ) : view === "grid" ? (
        <div className="biz-grid">{filtered.map(companyCard)}</div>
      ) : (
        <div className="panel panel--table">
          <DataTable
            paginate={false}
            rows={filtered}
            rowClick={(c) => openCompany(c)}
            columns={[
              {
                key: "name",
                label: dict.explore.company,
                render: (c) => (
                  <span className="cell-user">
                    <CompanyLogo name={c.name} color={c.logo} size={30} />
                    <span>
                      <div className="cell-strong">{c.name}</div>
                      <div className="cell-sub">{c.website}</div>
                    </span>
                  </span>
                ),
              },
              {
                key: "industry",
                label: dict.explore.industry,
                render: (c) => industryLabel(dict, c.industry),
              },
              {
                key: "location",
                label: dict.explore.location,
                sortable: false,
                render: (c) => `${c.city}, ${c.country}`,
              },
              {
                key: "status",
                label: dict.explore.status,
                render: (c) => (
                  <Badge statusKey={c.status}>
                    {companyStatusLabel(dict, c.status)}
                  </Badge>
                ),
              },
              {
                key: "revenue",
                label: dict.explore.revenue,
                align: "right",
                sortVal: (c) => c.revenue,
                render: (c) => fmt.moneyCompact(c.revenue),
              },
              {
                key: "growth",
                label: dict.explore.growth,
                align: "right",
                sortVal: (c) => c.growth,
                render: (c) => (
                  <span className={c.growth >= 0 ? "pos" : "neg"}>
                    {fmt.pct(c.growth)}
                  </span>
                ),
              },
              {
                key: "deals",
                label: dict.explore.deals,
                align: "right",
                sortVal: (c) => c.deals,
                render: (c) => fmt.digits(c.deals),
              },
            ]}
          />
        </div>
      )}

      <Drawer
        open={!!company}
        onClose={() => setCompany(null)}
        width={480}
        head={
          company ? (
            <div className="drawer-id">
              <CompanyLogo name={company.name} color={company.logo} size={46} />
              <div className="drawer-id__main">
                <h2 className="drawer__title">{company.name}</h2>
                <p className="drawer-id__sub">
                  {industryLabel(dict, company.industry)} · {company.city},{" "}
                  {company.country}
                </p>
              </div>
              <Badge statusKey={company.status}>
                {companyStatusLabel(dict, company.status)}
              </Badge>
            </div>
          ) : null
        }
        footer={
          company ? (
            <>
              <Button
                icon="message"
                onClick={() =>
                  toast(dict.explore.openingConversation, { type: "info" })
                }
              >
                {dict.explore.message}
              </Button>
              <Button
                variant="primary"
                icon="plus"
                onClick={() => {
                  addDeal({
                    title: `${company.name} deal`,
                    company: company.name,
                    owner: data.currentUser.name,
                    ownerColor: "indigo",
                    value: 10000,
                    stage: "lead",
                    probability: 20,
                    close: new Date(),
                    status: "open",
                  });
                  setCompany(null);
                  toast(dict.explore.newDealStarted, {
                    type: "success",
                    desc: company.name,
                  });
                }}
              >
                {dict.explore.newDeal}
              </Button>
            </>
          ) : null
        }
      >
        {company ? (
          <div className="tabbed">
            <Tabs
              value={drawerTab}
              onChange={setDrawerTab}
              items={[
                { value: "ov", label: dict.explore.overview },
                {
                  value: "ct",
                  label: dict.explore.contacts,
                  count: related.length,
                },
                {
                  value: "dl",
                  label: dict.explore.deals,
                  count: dealsFor.length,
                },
              ]}
            />
            {drawerTab === "ov" ? (
              <div className="tabpane">
                <p className="drawer-desc">{company.description}</p>
                <div className="detail-grid">
                  <DetailRow label={dict.explore.annualRevenue}>
                    <b>{fmt.money(company.revenue)}</b>
                  </DetailRow>
                  <DetailRow label={dict.explore.growth}>
                    <span className={company.growth >= 0 ? "pos" : "neg"}>
                      {fmt.pct(company.growth)}
                    </span>
                  </DetailRow>
                  <DetailRow label={dict.explore.companySize}>
                    {companySizeLabel(dict, company.size)}{" "}
                    {dict.common.employees}
                  </DetailRow>
                  <DetailRow label={dict.explore.founded}>
                    {fmt.digits(company.founded)}
                  </DetailRow>
                  <DetailRow label={dict.explore.rating}>
                    <span className="cell-rating">
                      <Stars rating={Number(company.rating)} />
                      <span>{fmt.digits(company.rating)}</span>
                    </span>
                  </DetailRow>
                  <DetailRow label={dict.explore.website}>
                    <a
                      className="link"
                      href={`https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {company.website}{" "}
                      <Icon name="external-link" size={14} />
                    </a>
                  </DetailRow>
                </div>
              </div>
            ) : null}
            {drawerTab === "ct" ? (
              <div className="tabpane">
                {related.length ? (
                  <ul className="mini-list">
                    {related.map((p) => (
                      <li key={p.id} className="mini-list__item">
                        <Avatar name={p.name} color={p.avatar} size={34} />
                        <div className="mini-list__main">
                          <div className="cell-strong">{p.name}</div>
                          <div className="cell-sub">{p.email}</div>
                        </div>
                        <Badge statusKey={p.status}>
                          {dict.common.status[p.status]}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon="users" title={dict.explore.noContacts} />
                )}
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
                            {fmt.money(d.value)} · {dealStageLabel(dict, d.stage)}
                          </div>
                        </div>
                        <Badge statusKey={d.status}>
                          {dealStatusLabel(dict, d.status)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState icon="briefcase" title={dict.explore.noOpenDeals} />
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={dict.explore.addCompany}
        subtitle={dict.explore.addCompanySubtitle}
        footer={
          <>
            <Button onClick={() => setAddOpen(false)}>{t("common.cancel")}</Button>
            <Button variant="primary" onClick={submitAdd}>
              {dict.explore.addCompany}
            </Button>
          </>
        }
      >
        <form className="form-grid" onSubmit={submitAdd}>
          <Field
            label={dict.explore.companyName}
            name="name"
            required
            wide
            placeholder={dict.explore.placeholderName}
            value={form.name}
            error={errors.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Field
            as="select"
            label={dict.explore.industry}
            name="industry"
            options={data.INDUSTRIES.map((i) => ({
              value: i,
              label: industryLabel(dict, i),
            }))}
            value={form.industry}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                industry: e.target.value as IndustryKey,
              }))
            }
          />
          <Field
            as="select"
            label={dict.explore.status}
            name="status"
            options={(["customer", "prospect", "partner"] as const).map(
              (s) => ({
                value: s,
                label: companyStatusLabel(dict, s),
              }),
            )}
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as CompanyStatus,
              }))
            }
          />
          <Field
            label={dict.explore.city}
            name="city"
            placeholder={dict.explore.placeholderCity}
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <Field
            label={dict.explore.country}
            name="country"
            placeholder={dict.explore.placeholderCountry}
            value={form.country}
            onChange={(e) =>
              setForm((f) => ({ ...f, country: e.target.value }))
            }
          />
          <Field
            label={dict.explore.website}
            name="website"
            wide
            placeholder={dict.explore.placeholderWebsite}
            value={form.website}
            onChange={(e) =>
              setForm((f) => ({ ...f, website: e.target.value }))
            }
          />
        </form>
      </Modal>
    </>
  );
}
