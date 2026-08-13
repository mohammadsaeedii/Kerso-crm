"use client";

import { useI18n } from "@/hooks/useI18n";
import { DsSection } from "./DsSection";
import { RADII, SHADOWS, SPACING, TYPE_ROWS } from "./tokens";

export function TypeSection() {
  const { t } = useI18n();
  const sample = t("designSystem.type.sample");

  return (
    <DsSection id="typography" title={t("designSystem.sections.typography")}>
      {TYPE_ROWS.map((row) => (
        <div key={row.key} className="ds-type__row">
          <span className="ds-type__meta">{row.meta}</span>
          <span className={row.className}>{t(`designSystem.type.${row.key}`)}</span>
        </div>
      ))}
      <p className="page-sub" style={{ marginTop: 16 }}>
        {sample}
      </p>
    </DsSection>
  );
}

export function TokensSection() {
  const { t } = useI18n();

  return (
    <DsSection id="tokens" title={t("designSystem.sections.tokens")}>
      <div className="ds-group">
        <h3 className="ds-group__label">8px</h3>
        {SPACING.map((n) => (
          <div key={n} className="ds-space__row">
            <span className="ds-space__label">{n}px</span>
            <span className="ds-space__bar" style={{ width: n * 4 }} />
          </div>
        ))}
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">Radius</h3>
        <div className="ds-radius">
          {RADII.map((r) => (
            <div
              key={r.token}
              className="ds-radius__item"
              style={{ borderRadius: `var(${r.token})` }}
            >
              {r.label}
            </div>
          ))}
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">Elevation</h3>
        <div className="ds-elev">
          {SHADOWS.map((s) => (
            <div
              key={s.token}
              className="ds-elev__item"
              style={{ boxShadow: `var(${s.token})` }}
            >
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </DsSection>
  );
}
