"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiCard } from "@/components/ui/KpiCard";
import { Progress } from "@/components/ui/Progress";
import { Segmented } from "@/components/ui/Segmented";
import { Stars } from "@/components/ui/Stars";
import { Tabs } from "@/components/ui/Tabs";
import { TrendPill } from "@/components/ui/TrendPill";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/hooks/useI18n";
import { DsSection } from "./DsSection";

const ROWS = [
  { id: "1", name: "Jane Cooper", company: "Acme", status: "active" },
  { id: "2", name: "Devon Lane", company: "Orbit", status: "lead" },
  { id: "3", name: "Courtney Henry", company: "Nimbus", status: "customer" },
];

export function ComponentsSection() {
  const { t } = useI18n();
  const [tab, setTab] = useState("all");
  const [seg, setSeg] = useState("list");

  return (
    <DsSection id="components" title={t("designSystem.sections.components")}>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.components.badges")}</h3>
        <div className="ds-row">
          <Badge variant="success">{t("common.status.active")}</Badge>
          <Badge variant="info">{t("common.status.lead")}</Badge>
          <Badge variant="indigo">{t("common.status.prospect")}</Badge>
          <Badge variant="warning">{t("common.tag.churnRisk")}</Badge>
          <Badge variant="danger">{t("common.status.churned")}</Badge>
          <span className="tagchip tagchip--indigo">{t("common.tag.vip")}</span>
          <span className="tagchip tagchip--neutral">{t("common.tag.smb")}</span>
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.components.avatars")}</h3>
        <div className="ds-row">
          <Avatar name="Jane Cooper" color="indigo" size={40} online />
          <Avatar name="Devon Lane" color="violet" size={40} />
          <Avatar name="Acme Team" color="teal" size={32} ring />
          <div className="avatar-group">
            <Avatar name="A" color="rose" size={32} />
            <Avatar name="B" color="amber" size={32} />
            <Avatar name="C" color="blue" size={32} />
          </div>
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.components.stars")}</h3>
        <div className="ds-row">
          <Stars rating={4.5} />
          <TrendPill delta={12.4} />
          <TrendPill delta={-3.1} />
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.components.progress")}</h3>
        <div className="ds-stack" style={{ maxWidth: 420 }}>
          <Progress value={82} />
          <Progress value={54} />
          <Progress value={22} small />
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.components.tabs")}</h3>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "all", label: t("designSystem.components.all"), count: 24 },
            { value: "open", label: t("designSystem.components.open"), count: 8 },
            { value: "won", label: t("designSystem.components.won"), count: 5 },
          ]}
        />
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.components.segmented")}</h3>
        <Segmented
          value={seg}
          onChange={setSeg}
          options={[
            { value: "list", icon: "list", label: t("designSystem.components.segmented") },
            { value: "grid", icon: "grid" },
            { value: "kanban", icon: "kanban" },
          ]}
        />
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.components.empty")}</h3>
        <EmptyState
          icon="search"
          title={t("common.noResults")}
          desc={t("common.emptyDesc")}
          action={<Button variant="primary" size="sm">{t("common.clear")}</Button>}
        />
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.components.kpi")}</h3>
        <div style={{ maxWidth: 320 }}>
          <KpiCard
            menu={false}
            kpi={{
              id: "ds-kpi",
              label: t("dashboard.kpi.active-deals"),
              value: 128,
              display: "128",
              delta: 8.2,
              dir: "up",
              spark: [12, 18, 16, 22, 28, 24, 32],
            }}
          />
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.components.table")}</h3>
        <DataTable
          rows={ROWS}
          paginate={false}
          columns={[
            { key: "name", label: t("customers.customer") },
            { key: "company", label: t("customers.company") },
            {
              key: "status",
              label: t("customers.status"),
              render: (row) => (
                <Badge statusKey={row.status}>
                  {t(`common.status.${row.status}`)}
                </Badge>
              ),
            },
          ]}
        />
      </div>
    </DsSection>
  );
}
