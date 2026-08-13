"use client";

import { PageHead } from "@/components/ui/PageHead";
import { Icon, type IconName } from "@/lib/icons";
import { useI18n } from "@/hooks/useI18n";
import { ButtonsSection } from "./ButtonsSection";
import { ColorSection } from "./ColorSection";
import { ComponentsSection } from "./ComponentsSection";
import { FormsSection } from "./FormsSection";
import { IconsSection } from "./IconsSection";
import { OverlaysSection } from "./OverlaysSection";
import { TokensSection, TypeSection } from "./TypeSection";

const TOC = [
  { id: "color", key: "designSystem.sections.color" },
  { id: "typography", key: "designSystem.sections.typography" },
  { id: "tokens", key: "designSystem.sections.tokens" },
  { id: "buttons", key: "designSystem.sections.buttons" },
  { id: "icons", key: "designSystem.sections.icons" },
  { id: "forms", key: "designSystem.sections.forms" },
  { id: "components", key: "designSystem.sections.components" },
  { id: "overlays", key: "designSystem.sections.overlays" },
] as const;

const PRINCIPLES: { icon: IconName; title: string; desc: string }[] = [
  { icon: "palette", title: "colorTitle", desc: "colorDesc" },
  { icon: "sparkles", title: "typeTitle", desc: "typeDesc" },
  { icon: "grid", title: "spaceTitle", desc: "spaceDesc" },
  { icon: "target", title: "iconTitle", desc: "iconDesc" },
];

export function DesignSystemPage() {
  const { t } = useI18n();

  return (
    <>
      <PageHead title={t("designSystem.title")} sub={t("designSystem.sub")} />
      <div className="ds-principles">
        {PRINCIPLES.map((p) => (
          <article key={p.title} className="ds-principle">
            <span className="ds-principle__icon">
              <Icon name={p.icon} size={18} />
            </span>
            <h3>{t(`designSystem.principles.${p.title}`)}</h3>
            <p>{t(`designSystem.principles.${p.desc}`)}</p>
          </article>
        ))}
      </div>
      <div className="ds-layout">
        <div className="ds-main">
          <ColorSection />
          <TypeSection />
          <TokensSection />
          <ButtonsSection />
          <IconsSection />
          <FormsSection />
          <ComponentsSection />
          <OverlaysSection />
        </div>
        <nav className="ds-toc" aria-label={t("designSystem.toc")}>
          <div className="ds-toc__title">{t("designSystem.toc")}</div>
          {TOC.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {t(item.key)}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
