"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { useI18n } from "@/hooks/useI18n";
import { DsSection } from "./DsSection";

export function FormsSection() {
  const { t } = useI18n();
  const [on, setOn] = useState(true);

  return (
    <DsSection id="forms" title={t("designSystem.sections.forms")}>
      <div className="form-grid">
        <Field
          label={t("customers.fullName")}
          icon="user"
          defaultValue={t("designSystem.sampleName")}
        />
        <Field
          label={t("customers.email")}
          type="email"
          icon="mail"
          defaultValue={t("designSystem.sampleEmail")}
        />
        <Field
          label={t("designSystem.forms.select")}
          as="select"
          options={[
            t("common.industry.saas"),
            t("common.industry.fintech"),
            t("common.industry.healthcare"),
          ]}
        />
        <Field
          label={t("designSystem.forms.invalid")}
          defaultValue="not-an-email"
          error={t("common.validation.invalidEmail")}
        />
        <Field
          label={t("designSystem.forms.area")}
          as="textarea"
          rows={3}
          wide
          placeholder={t("reviews.replyPlaceholder")}
        />
      </div>
      <div className="ds-group">
        <h3 className="ds-group__label">{t("designSystem.forms.toggles")}</h3>
        <Toggle
          checked={on}
          onChange={setOn}
          label={t("designSystem.forms.enabled")}
        />
      </div>
    </DsSection>
  );
}
