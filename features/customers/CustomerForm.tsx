"use client";

import type { FormEvent, ReactNode } from "react";
import { Field } from "@/components/ui/Field";
import { customerStatusLabel } from "@/lib/data/labels";
import { useI18n } from "@/hooks/useI18n";
import type { CustomerFormErrors, CustomerFormValues } from "@/lib/customers/form";
import type { Company, CustomerStatus } from "@/types";

export type CustomerFormProps = {
  value: CustomerFormValues;
  errors: CustomerFormErrors;
  companies: Company[];
  statuses: readonly CustomerStatus[];
  onChange: (patch: Partial<CustomerFormValues>) => void;
  onSubmit: (e: FormEvent) => void;
  footer?: ReactNode;
};

export function CustomerForm({
  value,
  errors,
  companies,
  statuses,
  onChange,
  onSubmit,
  footer,
}: CustomerFormProps) {
  const { dict } = useI18n();

  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <Field
        label={dict.customers.fullName}
        name="name"
        required
        wide
        placeholder={dict.customers.placeholderName}
        value={value.name}
        error={errors.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />
      <Field
        label={dict.customers.email}
        name="email"
        type="email"
        required
        placeholder={dict.customers.placeholderEmail}
        value={value.email}
        error={errors.email}
        onChange={(e) => onChange({ email: e.target.value })}
      />
      <Field
        label={dict.customers.phone}
        name="phone"
        placeholder={dict.customers.placeholderPhone}
        value={value.phone}
        onChange={(e) => onChange({ phone: e.target.value })}
      />
      <Field
        as="select"
        label={dict.customers.company}
        name="company"
        options={[
          { value: "", label: dict.customers.noCompany },
          ...companies.map((c) => ({ value: c.id, label: c.name })),
        ]}
        value={value.companyId}
        onChange={(e) => onChange({ companyId: e.target.value })}
      />
      <Field
        as="select"
        label={dict.customers.status}
        name="status"
        options={statuses.map((s) => ({
          value: s,
          label: customerStatusLabel(dict, s),
        }))}
        value={value.status}
        onChange={(e) =>
          onChange({ status: e.target.value as CustomerStatus })
        }
      />
      <Field
        label={dict.customers.city}
        name="city"
        placeholder={dict.customers.placeholderCity}
        value={value.city}
        onChange={(e) => onChange({ city: e.target.value })}
      />
      <Field
        label={dict.customers.country}
        name="country"
        placeholder={dict.customers.placeholderCountry}
        value={value.country}
        onChange={(e) => onChange({ country: e.target.value })}
      />
      {footer ? <div className="form-page__actions">{footer}</div> : null}
    </form>
  );
}
