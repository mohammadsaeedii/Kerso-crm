"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHead } from "@/components/ui/PageHead";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Toggle } from "@/components/ui/Toggle";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { localizedPath } from "@/lib/i18n/navigation";
import { Icon } from "@/lib/icons";
import { Avatar } from "@/components/ui/Avatar";

export function AiAgentPage() {
  const { locale, dict, t, fmt } = useI18n();
  const { data, updateAiAgent } = useData();
  const { toast } = useToast();
  const agent = data.aiAgent;
  const [instructions, setInstructions] = useState(agent.instructions);

  const recent = useMemo(
    () =>
      data.conversations
        .filter((c) => c.aiHandled)
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, 6),
    [data.conversations],
  );

  return (
    <>
      <PageHead
        title={dict.aiPage.title}
        sub={dict.aiPage.subtitle}
        actions={
          <div className="ai-status">
            <Badge variant={agent.active ? "success" : "neutral"}>
              {agent.active ? dict.aiPage.active : dict.aiPage.inactive}
            </Badge>
            <Toggle
              checked={agent.active}
              onChange={(checked) => {
                updateAiAgent({ active: checked });
                toast(checked ? t("aiPage.toggledOn") : t("aiPage.toggledOff"), {
                  type: "info",
                });
              }}
              label={agent.active ? dict.aiPage.active : dict.aiPage.inactive}
            />
          </div>
        }
      />

      <section className="cards cards--mini" aria-label={dict.aiPage.overview}>
        <div className="card stat-mini">
          <p className="card__label">{dict.aiPage.resolutionRate}</p>
          <span className="stat-mini__value">{fmt.num(agent.resolutionRate)}%</span>
        </div>
        <div className="card stat-mini">
          <p className="card__label">{dict.aiPage.escalationRate}</p>
          <span className="stat-mini__value">{fmt.num(agent.escalationRate)}%</span>
        </div>
        <div className="card stat-mini">
          <p className="card__label">{dict.aiPage.handled}</p>
          <span className="stat-mini__value">{fmt.num(agent.conversationsHandled)}</span>
        </div>
        <div className="card stat-mini ai-hero-card">
          <p className="card__label">{agent.name}</p>
          <span className="ai-hero-card__icon">
            <Icon name="bot" size={28} />
          </span>
        </div>
      </section>

      <div className="dash-grid">
        <div className="dash-col-8">
          <Panel title={dict.aiPage.instructions} sub={dict.aiPage.instructionsHint}>
            <Field
              as="textarea"
              rows={8}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <div style={{ marginTop: 12 }}>
              <Button
                variant="primary"
                onClick={() => {
                  updateAiAgent({ instructions });
                  toast(t("aiPage.saved"), { type: "success" });
                }}
              >
                {dict.aiPage.save}
              </Button>
            </div>
          </Panel>
        </div>
        <div className="dash-col-4">
          <Panel title={dict.aiPage.knowledgeSources}>
            <ul className="ai-sources">
              {agent.knowledgeSources.map((src) => (
                <li key={src}>
                  <Icon name="book" size={16} />
                  <span>{src}</span>
                </li>
              ))}
            </ul>
            <Link
              href={localizedPath(locale, "/knowledge")}
              className="btn btn--secondary btn--sm"
              style={{ marginTop: 14 }}
            >
              {dict.nav.knowledge}
            </Link>
          </Panel>
        </div>
      </div>

      <Panel title={dict.aiPage.recent} className="ai-recent">
        <ul className="ai-recent-list">
          {recent.map((c) => {
            const cust = data.customers.find((x) => x.id === c.customerId);
            return (
              <li key={c.id}>
                <Link href={localizedPath(locale, "/inbox")} className="ai-recent-item">
                  <Avatar name={cust?.name ?? "?"} color={cust?.avatar ?? "slate"} size={36} />
                  <div>
                    <p className="ai-recent-item__title">{c.subject}</p>
                    <p className="ai-recent-item__meta">
                      {cust?.name} · {fmt.relTime(c.updatedAt)}
                      {c.escalated ? ` · ${dict.supportAnalytics.aiEscalation}` : ""}
                    </p>
                  </div>
                  <Badge variant={c.status === "closed" ? "success" : "info"}>
                    {dict.inbox.status[c.status]}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
