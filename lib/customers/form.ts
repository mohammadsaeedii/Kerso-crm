/**
 * @file Customer form values and validation
 * @description Shared shape and checks for add/edit customer forms.
 */

import { getAppNow } from "@/lib/utils/time";
import type { AvatarColor, Customer, CustomerStatus, TagKey } from "@/types";

export type CustomerFormValues = {
  name: string;
  email: string;
  phone: string;
  companyId: string;
  status: CustomerStatus;
  city: string;
  country: string;
};

export type CustomerFormErrors = {
  name?: string;
  email?: string;
};

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  companyId: "",
  status: "lead",
  city: "",
  country: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates required name and email format. */
export function validateCustomerForm(
  form: CustomerFormValues,
  messages: { required: string; invalidEmail: string },
): CustomerFormErrors {
  const errors: CustomerFormErrors = {};
  if (!form.name.trim()) errors.name = messages.required;
  if (!form.email.trim()) errors.email = messages.required;
  else if (!EMAIL_RE.test(form.email)) errors.email = messages.invalidEmail;
  return errors;
}
