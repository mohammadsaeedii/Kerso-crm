"use client";

import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Icon, type IconName } from "@/lib/icons";
import { uid } from "@/lib/utils/id";
import { cn } from "@/lib/utils/cn";

export type FieldOption = string | { value: string; label: string };

type FieldBase = {
  label?: string;
  name?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  wide?: boolean;
  icon?: IconName;
  className?: string;
  id?: string;
};

export type FieldInputProps = FieldBase & {
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search" | "date";
  as?: "input";
  options?: never;
  rows?: never;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "name" | "id" | "required">;

export type FieldSelectProps = FieldBase & {
  as: "select";
  type?: never;
  options: FieldOption[];
  rows?: never;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "id" | "required">;

export type FieldTextareaProps = FieldBase & {
  as: "textarea";
  type?: never;
  options?: never;
  rows?: number;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "id" | "required">;

export type FieldProps = FieldInputProps | FieldSelectProps | FieldTextareaProps;

function optionValue(op: FieldOption): string {
  return typeof op === "string" ? op : op.value;
}

function optionLabel(op: FieldOption): string {
  return typeof op === "string" ? op : op.label;
}

export function Field(props: FieldProps) {
  const autoId = useId();
  const id = props.id || autoId || uid("f");
  const {
    label,
    name,
    required,
    hint,
    error,
    wide,
    icon,
    className,
  } = props;

  let control: ReactNode;
  if (props.as === "select") {
    const { as: _as, options, label: _l, name: _n, required: _r, hint: _h, error: _e, wide: _w, icon: _i, className: _c, id: _id, ...rest } = props;
    control = (
      <select
        className={cn("select", error && "is-invalid")}
        id={id}
        name={name}
        required={required}
        {...rest}
      >
        {options.map((op) => {
          const val = optionValue(op);
          return (
            <option key={val} value={val}>
              {optionLabel(op)}
            </option>
          );
        })}
      </select>
    );
  } else if (props.as === "textarea") {
    const { as: _as, label: _l, name: _n, required: _r, hint: _h, error: _e, wide: _w, icon: _i, className: _c, id: _id, rows = 3, ...rest } = props;
    control = (
      <textarea
        className={cn("textarea", error && "is-invalid")}
        id={id}
        name={name}
        required={required}
        rows={rows}
        {...rest}
      />
    );
  } else {
    const { as: _as, type = "text", label: _l, name: _n, required: _r, hint: _h, error: _e, wide: _w, icon: _i, className: _c, id: _id, ...rest } = props;
    control = (
      <input
        className={cn("input", error && "is-invalid")}
        id={id}
        name={name}
        type={type}
        required={required}
        {...rest}
      />
    );
  }

  return (
    <div className={cn("field", wide && "field--wide", className)}>
      {label ? (
        <label className="field__label" htmlFor={id}>
          {label} {required ? <span className="req">*</span> : null}
        </label>
      ) : null}
      <div className="field__control">
        {icon ? (
          <span className="field__icon">
            <Icon name={icon} size={18} />
          </span>
        ) : null}
        {control}
      </div>
      {hint ? <p className="field__hint">{hint}</p> : null}
      <p className="field__error" data-error-for={name || ""}>
        {error || ""}
      </p>
    </div>
  );
}
