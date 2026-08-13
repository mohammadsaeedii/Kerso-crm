"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHead } from "@/components/ui/PageHead";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/ui/KpiCard";
import { Segmented } from "@/components/ui/Segmented";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { HBarChart } from "@/components/charts/HBarChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { ChartLegend } from "@/components/charts/ChartLegend";
import { CHART } from "@/components/charts/palette";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { localizedPath } from "@/lib/i18n/navigation";

export function AnalyticsPage() {
  const { locale, dict, t, fmt } = useI18n();
  const { data } = useData();
  const { toast } = useToast();
  const [range, setRange] = useState("30D");

  const A = data.analytics;

  return (
    <>
      <PageHead
        title={dict.analytics.title}
        sub={dict.analytics.sub}
        actions={
          <>
            <Segmented
              value={range}
              onChange={(v) => {
                setRange(v);
                toast(t("analytics.rangeSet", { range: v }), { type: "info" });
              }}
              options={[
                { value: "7D", label: dict.analytics.range7D },
                { value: "30D", label: dict.analytics.range30D },
                { value: "12M", label: dict.analytics.range12M },
              ]}
            />
            <Button
              icon="download"
              onClick={() =>
                toast(dict.analytics.reportExported, {
                  type: "success",
                  desc: "analytics-report.csv",
                })
              }
            >
              {t("common.export")}
            </Button>
          </>
        }
      />

      <section className="cards" aria-label={dict.analytics.metrics}>
        {A.kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </section>

      <div className="dash-grid">
        <div className="dash-col-8">
          <Panel title={dict.analytics.visitors} sub={dict.analytics.visitorsSub}>
            <AreaLineChart
              labels={A.visitors.map((v) => fmt.digits(v.label))}
              series={[
                {
                  name: t("charts.visitors"),
                  color: CHART.primary,
                  values: A.visitors.map((v) => v.value),
                },
              ]}
              height={280}
            />
          </Panel>
        </div>

        <div className="dash-col-4">
          <Panel title={dict.analytics.trafficSources}>
            <div className="donut-wrap">
              <DonutChart
                data={A.sources}
                size={188}
                center="100%"
                centerSub={t("charts.traffic")}
              />
            </div>
            <ChartLegend
              items={A.sources.map((s) => ({
                name: `${s.name} · ${fmt.digits(s.value)}%`,
                color: s.color || CHART.primary,
              }))}
            />
          </Panel>
        </div>

        <div className="dash-col-6">
          <Panel
            title={dict.analytics.conversionFunnel}
            sub={dict.analytics.funnelSub}
          >
            <FunnelChart data={A.funnel} />
          </Panel>
        </div>

        <div className="dash-col-6">
          <Panel
            title={dict.analytics.topReps}
            actions={
              <Link
                className="panel__link"
                href={localizedPath(locale, "/customers")}
              >
                {t("common.team")}
              </Link>
            }
          >
            <HBarChart
              data={A.reps.map((r) => ({ name: r.name, value: r.value }))}
              money
            />
          </Panel>
        </div>

        <div className="dash-col-4">
          <Panel title={dict.analytics.revenueByCategory}>
            <HBarChart data={A.categories} money />
          </Panel>
        </div>

        <div className="dash-col-4">
          <Panel title={dict.analytics.salesByRegion}>
            <HBarChart data={A.regions} pct />
          </Panel>
        </div>

        <div className="dash-col-4">
          <Panel title={dict.analytics.devices}>
            <div className="donut-wrap">
              <DonutChart
                data={A.devices}
                size={168}
                center={`${fmt.digits(A.devices[0]?.value ?? 0)}%`}
                centerSub={t("charts.desktop")}
              />
            </div>
            <ChartLegend
              items={A.devices.map((s) => ({
                name: `${s.name} · ${fmt.digits(s.value)}%`,
                color: s.color || CHART.primary,
              }))}
            />
          </Panel>
        </div>

        <div className="dash-col-12">
          <Panel
            title={dict.analytics.retentionCohorts}
            sub={dict.analytics.retentionSub}
          >
            <Heatmap rows={A.cohort} cols={6} />
          </Panel>
        </div>
      </div>
    </>
  );
}
