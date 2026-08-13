"use client";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useI18n } from "@/hooks/useI18n";
import { DsSection } from "./DsSection";

export function ButtonsSection() {
  const { t } = useI18n();

  return (
    <DsSection id="buttons" title={t("designSystem.sections.buttons")}>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.buttons.variants")}</h3>
        <div className="ds-row">
          <Button variant="primary">{t("designSystem.buttons.primary")}</Button>
          <Button variant="secondary">{t("designSystem.buttons.secondary")}</Button>
          <Button variant="ghost">{t("designSystem.buttons.ghost")}</Button>
          <Button variant="danger">{t("designSystem.buttons.danger")}</Button>
          <Button variant="danger" className="btn--primary">
            {t("designSystem.buttons.danger")}
          </Button>
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.buttons.sizes")}</h3>
        <div className="ds-row">
          <Button variant="primary" size="md">
            {t("designSystem.buttons.medium")}
          </Button>
          <Button variant="primary" size="sm">
            {t("designSystem.buttons.small")}
          </Button>
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.buttons.withIcons")}</h3>
        <div className="ds-row">
          <Button variant="primary" icon="plus">
            {t("common.add")}
          </Button>
          <Button variant="secondary" icon="download">
            {t("common.export")}
          </Button>
          <Button variant="ghost" icon="filter">
            {t("designSystem.buttons.ghost")}
          </Button>
          <Button variant="danger" icon="trash">
            {t("common.delete")}
          </Button>
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.buttons.states")}</h3>
        <div className="ds-row">
          <Button variant="primary" disabled>
            {t("designSystem.buttons.disabled")}
          </Button>
          <Button variant="secondary" disabled>
            {t("designSystem.buttons.disabled")}
          </Button>
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.buttons.iconButtons")}</h3>
        <div className="ds-row">
          <IconButton icon="search" tip={t("shell.searchAria")} />
          <IconButton icon="bell" badge tip={t("shell.notifications")} />
          <IconButton icon="gear" sm tip={t("nav.settings")} />
          <IconButton icon="more-h" tip={t("common.options")} />
        </div>
      </div>
    </DsSection>
  );
}
