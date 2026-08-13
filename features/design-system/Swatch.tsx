"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { copyText, rgbToHex } from "./copy";
import type { TokenSwatch } from "./tokens";

export function Swatch({ token, label }: TokenSwatch) {
  const chipRef = useRef<HTMLSpanElement>(null);
  const [hex, setHex] = useState("");
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    const el = chipRef.current;
    if (!el) return;
    const sync = () => setHex(rgbToHex(getComputedStyle(el).backgroundColor));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  return (
    <button
      type="button"
      className="ds-swatch"
      onClick={async () => {
        if (await copyText(token)) {
          toast(t("designSystem.copied"), { type: "success", desc: token });
        }
      }}
      aria-label={`${t("designSystem.copyToken")}: ${token}`}
    >
      <span
        ref={chipRef}
        className="ds-swatch__chip"
        style={{ background: `var(${token})` }}
      />
      <span className="ds-swatch__meta">
        <span className="ds-swatch__name">{label}</span>
        <span className="ds-swatch__val">
          {token}
          {hex ? ` · ${hex}` : ""}
        </span>
      </span>
    </button>
  );
}

export function SwatchGroup({
  title,
  items,
}: {
  title: string;
  items: readonly TokenSwatch[];
}) {
  return (
    <div className="ds-group">
      <h3 className="ds-group__label">{title}</h3>
      <div className="ds-swatches">
        {items.map((item) => (
          <Swatch key={item.token} {...item} />
        ))}
      </div>
    </div>
  );
}
