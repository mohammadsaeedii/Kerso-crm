"use client";

import { PageHead } from "@/components/ui/PageHead";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Toggle";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { Icon } from "@/lib/icons";

export function AutomationsPage() {
  const { dict, t, fmt } = useI18n();
  const { data, toggleAutomation } = useData();
  const { toast } = useToast();

  return (
    <>
      <PageHead title={dict.automationsPage.title} sub={dict.automationsPage.subtitle} />

      {data.automations.length === 0 ? (
        <div className="empty">
          <p className="empty__title">{dict.automationsPage.empty}</p>
        </div>
      ) : (
        <ul className="auto-list">
          {data.automations.map((rule) => (
            <li key={rule.id} className="auto-card">
              <div className="auto-card__icon">
                <Icon name="zap" size={20} />
              </div>
              <div className="auto-card__main">
                <div className="auto-card__top">
                  <h3 className="auto-card__title">{rule.name}</h3>
                  <Badge variant={rule.active ? "success" : "neutral"}>
                    {rule.active
                      ? dict.automationsPage.active
                      : dict.automationsPage.inactive}
                  </Badge>
                </div>
                <p className="auto-card__desc">{rule.description}</p>
                <div className="auto-card__meta">
                  <span>
                    <strong>{dict.automationsPage.trigger}:</strong> {rule.trigger}
                  </span>
                  <span>
                    <strong>{dict.automationsPage.action}:</strong> {rule.action}
                  </span>
                  <span>{t("automationsPage.runs", { count: fmt.num(rule.runs) })}</span>
                </div>
              </div>
              <Toggle
                checked={rule.active}
                onChange={() => {
                  toggleAutomation(rule.id);
                  toast(
                    rule.active
                      ? t("automationsPage.toggledOff")
                      : t("automationsPage.toggledOn"),
                    { type: "info" },
                  );
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
