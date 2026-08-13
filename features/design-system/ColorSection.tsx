"use client";

import { useI18n } from "@/hooks/useI18n";
import { DsSection } from "./DsSection";
import { SwatchGroup } from "./Swatch";
import {
  BORDER_TOKENS,
  BRAND_TOKENS,
  HUE_TOKENS,
  SURFACE_TOKENS,
  TEXT_TOKENS,
} from "./tokens";

export function ColorSection() {
  const { t } = useI18n();
  return (
    <DsSection id="color" title={t("designSystem.sections.color")}>
      <SwatchGroup title={t("designSystem.color.surfaces")} items={SURFACE_TOKENS} />
      <SwatchGroup title={t("designSystem.color.text")} items={TEXT_TOKENS} />
      <SwatchGroup title={t("designSystem.color.borders")} items={BORDER_TOKENS} />
      <SwatchGroup title={t("designSystem.color.brand")} items={BRAND_TOKENS} />
      <SwatchGroup title={t("designSystem.color.hues")} items={HUE_TOKENS} />
    </DsSection>
  );
}
