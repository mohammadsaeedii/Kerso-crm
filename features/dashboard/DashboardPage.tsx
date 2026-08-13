"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHead } from "@/components/ui/PageHead";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/KpiCard";
import { Segmented } from "@/components/ui/Segmented";
import { Progress } from "@/components/ui/Progress";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Drawer } from "@/components/ui/Drawer";
import { Toggle } from "@/components/ui/Toggle";
import { Icon } from "@/lib/icons";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { localizedPath } from "@/lib/i18n/navigation";
import { dealStageLabel, dealStatusLabel } from "@/lib/data/labels";
import { store } from "@/lib/utils/store";
import { getAppNow } from "@/lib/utils/time";
import type { Deal, DealStage } from "@/types";
import { AreaLineChart } from "@/components/charts/AreaLineChart";
import { BarChart } from "@/components/charts/BarChart";
import { ChartLegend } from "@/components/charts/ChartLegend";
import { CHART } from "@/components/charts/palette";
import { DataTable } from "@/components/ui/DataTable";
import { DetailRow } from "@/components/ui/DetailRow";

type Widgets = {
  revenue: boolean;
  pipeline: boolean;
  deals: boolean;
  activity: boolean;
  tasks: boolean;
  created: boolean;
};

const DEFAULT_WIDGETS: Widgets = {
  revenue: true,
  pipeline: true,
  deals: true,
  activity: true,
  tasks: true,
  created: true,
};

const ACT_ICON = {
  deal: "briefcase",
  review: "star",
  customer: "user",
  task: "check",
  message: "message",
} as const;

export function DashboardPage() {
  const { locale, dict, t, fmt } = useI18n();
  const { data, toggleTask, addTask, updateDeal } = useData();
  const { toast } = useToast();

  const [range, setRange] = useState("12M");
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [widgets, setWidgets] = useState<Widgets>(
    () => store.get("dash:widgets", DEFAULT_WIDGETS) ?? DEFAULT_WIDGETS,
  );
  const [manageOpen, setManageOpen] = useState(false);
  const [draftWidgets, setDraftWidgets] = useState<Widgets>(widgets);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [taskTitle, setTaskTitle] = useState("");

  const thisYear = t("charts.thisYear");
  const lastYear = t("charts.lastYear");

  const revenue = useMemo(() => {
    const months = data.revenueSeries;
    let labels: string[];
    let cur: number[];
    let prev: number[];
    if (range === "6M") {
      const s = months.slice(-6);
      labels = s.map((m) => m.label);
      cur = s.map((m) => m.current);
      prev = s.map((m) => m.previous);
    } else if (range === "Quarterly") {
      labels = [t("charts.q1"), t("charts.q2"), t("charts.q3"), t("charts.q4")];
      cur = [0, 1, 2, 3].map((q) =>
        months.slice(q * 3, q * 3 + 3).reduce((a, m) => a + m.current, 0),
      );
      prev = [0, 1, 2, 3].map((q) =>
        months.slice(q * 3, q * 3 + 3).reduce((a, m) => a + m.previous, 0),
      );
    } else {
      labels = months.map((m) => m.label);
      cur = months.map((m) => m.current);
      prev = months.map((m) => m.previous);
    }
    const series = [];
    if (!hidden.has(thisYear)) {
      series.push({ name: thisYear, color: CHART.primary, values: cur });
    }
    if (!hidden.has(lastYear)) {
      series.push({
        name: lastYear,
        color: CHART.muted,
        values: prev,
        fill: false,
        dashed: true,
      });
    }
    return { labels, series };
  }, [data.revenueSeries, range, hidden, thisYear, lastYear, t]);

  const pipelineTotal = data.pipeline.reduce((a, s) => a + s.value, 0);
  const openTasks = data.tasks.filter((x) => !x.done).length;
  const recentDeals = [...data.deals]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const widgetLabels: Record<keyof Widgets, string> = {
    revenue: dict.dashboard.revenueOverview,
    pipeline: dict.dashboard.salesPipeline,
    deals: dict.dashboard.recentDeals,
    created: dict.dashboard.dealsCreated,
    activity: dict.dashboard.activityFeed,
    tasks: dict.dashboard.tasks,
  };

  const toggleLegend = (name: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <>
      <PageHead
        title={dict.dashboard.title}
        sub={dict.dashboard.sub}
        actions={
          <>
            <Segmented
              value={range}
              onChange={setRange}
              options={[
                { value: "6M", label: dict.dashboard.range6M },
                { value: "12M", label: dict.dashboard.range12M },
                { value: "Quarterly", label: dict.dashboard.rangeQuarterly },
              ]}
            />
            <Button
              icon="gear"
              onClick={() => {
                setDraftWidgets(widgets);
                setManageOpen(true);
              }}
            >
              {dict.dashboard.manage}
            </Button>
          </>
        }
      />

      <section className="cards" aria-label={dict.dashboard.keyMetrics}>
        {data.kpis.map((k) => (
          <KpiCard
            key={k.id}
            kpi={k}
            onMenu={() => toast(dict.dashboard.openedMetric, { type: "info" })}
          />
        ))}
      </section>

      <div className="dash-grid">
        {widgets.revenue ? (
          <div className="dash-col-8">
            <Panel
              title={dict.dashboard.revenueOverview}
              sub={dict.dashboard.revenueSub}
              actions={
                <ChartLegend
                  items={[
                    { name: thisYear, color: CHART.primary },
                    { name: lastYear, color: CHART.muted },
                  ]}
                  hidden={hidden}
                  onToggle={toggleLegend}
                />
              }
            >
              <AreaLineChart
                labels={revenue.labels}
                series={revenue.series}
                money
                height={280}
              />
            </Panel>
          </div>
        ) : null}

        {widgets.pipeline ? (
          <div className="dash-col-4">
            <Panel
              title={dict.dashboard.salesPipeline}
              actions={
                <Link className="panel__link" href={localizedPath(locale, "/explore")}>
                  {t("common.explore")}
                </Link>
              }
            >
              <ul className="pipe-list">
                {data.pipeline.map((s) => {
                  const pct = pipelineTotal ? (s.value / pipelineTotal) * 100 : 0;
                  return (
                    <li key={s.stage} className="pipe">
                      <div className="pipe__top">
                        <span className="pipe__name">
                          <span
                            className="pipe__dot"
                            style={{ background: s.color }}
                          />
                          {dealStageLabel(dict, s.stage)}
                        </span>
                        <span className="pipe__count">
                          {t("dashboard.dealsCount", {
                            count: fmt.digits(s.count),
                          })}
                        </span>
                      </div>
                      <div className="pipe__bar">
                        <div
                          className="pipe__fill"
                          style={{
                            width: `${pct.toFixed(1)}%`,
                            background: s.color,
                          }}
                        />
                      </div>
                      <div className="pipe__val">
                        {fmt.money(s.value)}{" "}
                        <span className="pipe__pct">{fmt.digits(Math.round(pct))}%</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="pipe-total">
                <span>{dict.dashboard.totalPipeline}</span>
                <b>{fmt.money(pipelineTotal)}</b>
              </div>
            </Panel>
          </div>
        ) : null}

        {widgets.deals ? (
          <div className="dash-col-8">
            <Panel
              title={dict.dashboard.recentDeals}
              flush
              actions={
                <Link
                  className="panel__link"
                  href={localizedPath(locale, "/customers")}
                >
                  {t("common.viewAll")}
                </Link>
              }
            >
              <DataTable
                paginate={false}
                rows={recentDeals}
                rowClick={(d) => setDeal(d)}
                columns={[
                  {
                    key: "title",
                    label: dict.dashboard.deal,
                    render: (d) => (
                      <>
                        <div className="cell-strong">{d.title}</div>
                        <div className="cell-sub">{d.id}</div>
                      </>
                    ),
                  },
                  { key: "company", label: dict.dashboard.company },
                  {
                    key: "owner",
                    label: dict.dashboard.owner,
                    render: (d) => (
                      <span className="cell-user">
                        <Avatar name={d.owner} color={d.ownerColor} size={26} />
                        <span>{d.owner}</span>
                      </span>
                    ),
                  },
                  {
                    key: "value",
                    label: dict.dashboard.value,
                    align: "right",
                    sortVal: (d) => d.value,
                    render: (d) => <b>{fmt.money(d.value)}</b>,
                  },
                  {
                    key: "stage",
                    label: dict.dashboard.stage,
                    render: (d) => (
                      <Badge statusKey={d.stage}>
                        {dealStageLabel(dict, d.stage)}
                      </Badge>
                    ),
                  },
                  {
                    key: "probability",
                    label: dict.dashboard.probability,
                    sortVal: (d) => d.probability,
                    render: (d) => (
                      <div className="cell-prob">
                        <Progress value={d.probability} small />
                        <span>{fmt.digits(d.probability)}%</span>
                      </div>
                    ),
                  },
                  {
                    key: "close",
                    label: dict.dashboard.closeDate,
                    nowrap: true,
                    sortVal: (d) => +d.close,
                    render: (d) => fmt.date(d.close),
                  },
                ]}
              />
            </Panel>
          </div>
        ) : null}

        {widgets.activity ? (
          <div className="dash-col-4">
            <Panel
              title={dict.dashboard.activity}
              actions={
                <button
                  type="button"
                  className="panel__link"
                  onClick={() =>
                    toast(dict.dashboard.showingAllActivity, { type: "info" })
                  }
                >
                  {t("common.viewAll")}
                </button>
              }
            >
              <ul className="act-list">
                {data.activities.map((a, i) => (
                  <li key={i} className="act">
                    <span className={`act__dot act__dot--${a.color}`}>
                      <Icon name={ACT_ICON[a.type] || "info"} size={14} />
                    </span>
                    <div className="act__body">
                      <p className="act__text">
                        <b>{a.who}</b> {a.text}
                      </p>
                      <span className="act__time">{fmt.relTime(a.time)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        ) : null}

        {widgets.created ? (
          <div className="dash-col-8">
            <Panel
              title={dict.dashboard.dealsCreated}
              legend={
                <ChartLegend
                  items={[
                    { name: t("charts.won"), color: CHART.primary },
                    { name: t("charts.lost"), color: CHART.track },
                  ]}
                />
              }
            >
              <BarChart
                labels={data.dealsCreated.map((d) => d.label)}
                series={[
                  {
                    name: t("charts.won"),
                    color: CHART.primary,
                    values: data.dealsCreated.map((d) => d.won),
                  },
                  {
                    name: t("charts.lost"),
                    color: CHART.track,
                    values: data.dealsCreated.map((d) => d.lost),
                  },
                ]}
                height={260}
              />
            </Panel>
          </div>
        ) : null}

        {widgets.tasks ? (
          <div className="dash-col-4">
            <Panel
              title={dict.dashboard.tasks}
              sub={t("dashboard.tasksOpen", { count: fmt.digits(openTasks) })}
            >
              <ul className="task-list">
                {data.tasks.map((task) => {
                  const overdue = !task.done && task.due < getAppNow();
                  return (
                    <li
                      key={task.id}
                      className={`task${task.done ? " is-done" : ""}`}
                    >
                      <label className="checkbox checkbox--round">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleTask(task.id)}
                        />
                        <span />
                      </label>
                      <div className="task__main">
                        <p className="task__title">{task.title}</p>
                        <div className="task__meta">
                          <span className={`task__pri task__pri--${task.priority}`}>
                            {dict.common.priority[task.priority]}
                          </span>
                          <span
                            className={`task__due${overdue ? " is-overdue" : ""}`}
                          >
                            <Icon name="clock" size={13} />
                            {overdue ? dict.dashboard.overdue : ""}
                            {fmt.relTime(task.due)}
                          </span>
                        </div>
                      </div>
                      <Avatar name={task.assignee} color="indigo" size={26} />
                    </li>
                  );
                })}
              </ul>
              <form
                className="task-add"
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = taskTitle.trim();
                  if (!v) return;
                  addTask({
                    title: v,
                    due: getAppNow(),
                    priority: "medium",
                    done: false,
                    assignee: data.currentUser.name,
                  });
                  setTaskTitle("");
                  toast(dict.dashboard.taskAdded, { type: "success" });
                }}
              >
                <input
                  className="input input--sm"
                  placeholder={dict.dashboard.addTask}
                  aria-label={dict.dashboard.newTask}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
                <Button type="submit" variant="primary" size="sm" icon="plus">
                  {dict.dashboard.addTaskBtn}
                </Button>
              </form>
            </Panel>
          </div>
        ) : null}
      </div>

      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title={dict.dashboard.manage}
        subtitle={dict.dashboard.manageSubtitle}
        size="sm"
        footer={
          <>
            <Button onClick={() => setManageOpen(false)}>{t("common.cancel")}</Button>
            <Button
              variant="primary"
              onClick={() => {
                setWidgets(draftWidgets);
                store.set("dash:widgets", draftWidgets);
                setManageOpen(false);
                toast(dict.dashboard.dashboardUpdated, { type: "success" });
              }}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <p className="modal__hint">{dict.dashboard.manageHint}</p>
        <div className="widget-toggles">
          {(Object.keys(widgetLabels) as (keyof Widgets)[]).map((k) => (
            <label key={k} className="widget-toggle">
              <span className="widget-toggle__icon">
                <Icon name="grid" size={18} />
              </span>
              <span className="widget-toggle__label">{widgetLabels[k]}</span>
              <Toggle
                name={k}
                checked={draftWidgets[k]}
                onChange={(checked) =>
                  setDraftWidgets((w) => ({ ...w, [k]: checked }))
                }
              />
            </label>
          ))}
        </div>
      </Modal>

      <Drawer
        open={!!deal}
        onClose={() => setDeal(null)}
        width={460}
        head={
          deal ? (
            <div className="drawer-id">
              <div className="drawer-id__main">
                <h2 className="drawer__title">{deal.title}</h2>
                <p className="drawer-id__sub">
                  {deal.company} · {deal.id}
                </p>
              </div>
              <Badge statusKey={deal.stage}>
                {dealStageLabel(dict, deal.stage)}
              </Badge>
            </div>
          ) : null
        }
        footer={
          deal ? (
            <>
              <Button
                icon="edit"
                onClick={() => toast(dict.dashboard.editDeal, { type: "info" })}
              >
                {t("common.edit")}
              </Button>
              <Button
                variant="primary"
                icon="check-circle"
                onClick={() => {
                  updateDeal(deal.id, { status: "won", stage: "won", probability: 100 });
                  setDeal(null);
                  toast(dict.dashboard.dealWonToast, {
                    type: "success",
                    desc: deal.title,
                  });
                }}
              >
                {dict.dashboard.markAsWon}
              </Button>
            </>
          ) : null
        }
      >
        {deal ? (
          <>
            <div className="deal-value">
              {fmt.money(deal.value)}
              <span>{dict.dashboard.dealValue}</span>
            </div>
            <div className="detail-grid">
              <DetailRow label={dict.dashboard.owner}>
                <span className="cell-user">
                  <Avatar name={deal.owner} color={deal.ownerColor} size={24} />
                  {deal.owner}
                </span>
              </DetailRow>
              <DetailRow label={dict.dashboard.stage}>
                <Badge statusKey={deal.stage}>
                  {dealStageLabel(dict, deal.stage)}
                </Badge>
              </DetailRow>
              <DetailRow label={dict.dashboard.probability}>
                <div className="cell-prob">
                  <Progress value={deal.probability} small />
                  <span>{fmt.digits(deal.probability)}%</span>
                </div>
              </DetailRow>
              <DetailRow label={dict.dashboard.closeDate}>{fmt.date(deal.close)}</DetailRow>
              <DetailRow label={dict.dashboard.status}>
                <Badge statusKey={deal.status}>
                  {dealStatusLabel(dict, deal.status)}
                </Badge>
              </DetailRow>
            </div>
            <h4 className="drawer-section">{dict.dashboard.stageProgress}</h4>
            <ol className="stage-track">
              {data.STAGES.map((s: DealStage, i) => {
                const reached = data.STAGES.indexOf(deal.stage) >= i;
                return (
                  <li
                    key={s}
                    className={`stage-track__step${reached ? " is-done" : ""}`}
                  >
                    <span className="stage-track__dot">
                      {reached ? (
                        <Icon name="check" size={12} stroke={2.4} />
                      ) : (
                        fmt.digits(i + 1)
                      )}
                    </span>
                    <span>{dealStageLabel(dict, s)}</span>
                  </li>
                );
              })}
            </ol>
            <h4 className="drawer-section">{dict.dashboard.recentActivity}</h4>
            <ul className="act-list act-list--compact">
              {data.activities.slice(0, 4).map((a, i) => (
                <li key={i} className="act">
                  <span className={`act__dot act__dot--${a.color}`}>
                    <Icon name={ACT_ICON[a.type] || "info"} size={13} />
                  </span>
                  <div className="act__body">
                    <p className="act__text">{a.text}</p>
                    <span className="act__time">{fmt.relTime(a.time)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Drawer>
    </>
  );
}
