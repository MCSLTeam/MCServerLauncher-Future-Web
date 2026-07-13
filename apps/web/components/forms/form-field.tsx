"use client";

import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/features/i18n/locale-provider";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  touched?: boolean;
  error?: string;
  description?: string;
  type?: "text" | "password" | "number";
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  className?: string;
  inputClassName?: string;
  leading?: ReactNode;
};

/** ME Frp 登录同款：blur 后显示错误，通过时勾选 + ready 文案 */
export function FormField({
  id,
  label,
  value,
  onChange,
  onBlur,
  touched = false,
  error = "",
  description,
  type = "text",
  placeholder,
  autoComplete,
  required,
  disabled,
  multiline,
  rows = 4,
  className,
  inputClassName,
  leading,
}: FormFieldProps) {
  const t = useT();
  const invalid = Boolean(touched && error);
  const valid = Boolean(value && !error);
  const messageId = `${id}-message`;

  return (
    <Field className={className} data-invalid={invalid || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        {leading ? (
          <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-muted-foreground [&_svg]:size-3.5">
            {leading}
          </span>
        ) : null}
        {multiline ? (
          <Textarea
            id={id}
            name={id}
            value={value}
            rows={rows}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid || valid ? messageId : undefined}
            className={cn(leading && "pl-9", valid && "pr-9", inputClassName)}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
          />
        ) : (
          <Input
            id={id}
            name={id}
            type={type}
            value={value}
            autoComplete={autoComplete}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid || valid ? messageId : undefined}
            className={cn(leading && "pl-9", valid && "pr-9", inputClassName)}
            onBlur={onBlur}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
        {valid ? (
          <CheckCircle2
            className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-primary"
            aria-hidden="true"
          />
        ) : null}
      </div>
      {invalid ? (
        <FieldError id={messageId}>{error}</FieldError>
      ) : valid ? (
        <FieldDescription id={messageId}>{t("ui.form.ready")}</FieldDescription>
      ) : description ? (
        <FieldDescription>{description}</FieldDescription>
      ) : null}
    </Field>
  );
}
