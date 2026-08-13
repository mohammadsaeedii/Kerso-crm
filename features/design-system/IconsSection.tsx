"use client";

import { useMemo, useState } from "react";
import { Field } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon, iconNames } from "@/lib/icons";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { copyText } from "./copy";
import { DsSection } from "./DsSection";

const SIZES = [16, 20, 24, 28] as const;
const STROKES = [1.5, 1.7, 2] as const;

export function IconsSection() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [query, setQuery] = useState("");

  const names = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? iconNames.filter((n) => n.includes(q)) : iconNames;
  }, [query]);

  return (
    <DsSection id="icons" title={t("designSystem.sections.icons")} desc={t("designSystem.lucideNote")}>
      <div className="ds-group">
        <h3 className="ds-group__label">Size</h3>
        <div className="ds-size-row">
          {SIZES.map((size) => (
            <div key={size} className="ds-size">
              <Icon name="sparkles" size={size} />
              <span>{size}px</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">Stroke</h3>
        <div className="ds-size-row">
          {STROKES.map((stroke) => (
            <div key={stroke} className="ds-size">
              <Icon name="target" size={24} stroke={stroke} />
              <span>{stroke}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="ds-group">
        <Field
          icon="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("designSystem.searchIcons")}
          aria-label={t("designSystem.searchIcons")}
        />
        <p className="field__hint" style={{ marginTop: 8 }}>
          {t("designSystem.iconCount", { count: names.length })}
        </p>
      </div>
      {names.length === 0 ? (
        <EmptyState icon="search" title={t("designSystem.noIcons")} />
      ) : (
        <div className="ds-icons">
          {names.map((name) => (
            <button
              key={name}
              type="button"
              className="ds-icon"
              onClick={async () => {
                if (await copyText(name)) {
                  toast(t("designSystem.copied"), { type: "success", desc: name });
                }
              }}
              aria-label={`${t("designSystem.copyIcon")}: ${name}`}
            >
              <Icon name={name} size={22} />
              <span className="ds-icon__name">{name}</span>
            </button>
          ))}
        </div>
      )}
    </DsSection>
  );
}
