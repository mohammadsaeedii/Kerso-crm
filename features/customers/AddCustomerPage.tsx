"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageHead } from "@/components/ui/PageHead";
import { Panel } from "@/components/ui/Panel";
import { Button } from "@/components/ui/Button";
import { CustomerForm } from "./CustomerForm";
import { useData } from "@/hooks/useData";
import { useI18n } from "@/hooks/useI18n";
import { useToast } from "@/hooks/useToast";
import { localizedPath } from "@/lib/i18n/navigation";
import { getAppNow } from "@/lib/utils/time";
import {
  EMPTY_CUSTOMER_FORM,
  validateCustomerForm,
  type CustomerFormErrors,
  type CustomerFormValues,
} from "@/lib/customers/form";

export function AddCustomerPage() {
  const { locale, dict, t } = useI18n();
  const { data, addCustomer } = useData();
  const { toast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState<CustomerFormValues>(EMPTY_CUSTOMER_FORM);
  const [errors, setErrors] = useState<CustomerFormErrors>({});

  const goToList = (customerId?: string) => {
    const path = customerId
      ? `/customers?customer=${customerId}`
      : "/customers";
    router.push(localizedPath(locale, path));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validateCustomerForm(form, dict.common.validation);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const row = addCustomer({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      companyId: form.companyId || undefined,
      status: form.status,
      city: form.city.trim() || "—",
      country: form.country.trim() || "—",
      value: 0,
      deals: 0,
      health: 60,
      avatar: data.avatarColor(),
      ownerId: data.currentUser.id,
      tags: ["inbound"],
      joined: getAppNow(),
      lastContact: getAppNow(),
      rating: 5,
    });
    toast(dict.customers.customerAdded, {
      type: "success",
      desc: row.name,
    });
    goToList(row.id);
  };

  return (
    <>
      <PageHead
        title={dict.customers.addCustomer}
        sub={dict.customers.createSubtitle}
        actions={
          <Button icon="chevron-left" onClick={() => goToList()}>
            {dict.customers.backToList}
          </Button>
        }
      />
      <Panel className="form-page">
        <CustomerForm
          value={form}
          errors={errors}
          companies={data.companies}
          statuses={data.CUST_STATUS}
          onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onSubmit={submit}
          footer={
            <>
              <Button type="button" onClick={() => goToList()}>
                {t("common.cancel")}
              </Button>
              <Button variant="primary" type="submit">
                {dict.customers.addCustomer}
              </Button>
            </>
          }
        />
      </Panel>
    </>
  );
}
