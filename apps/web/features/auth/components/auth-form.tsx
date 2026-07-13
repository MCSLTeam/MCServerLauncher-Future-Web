"use client";

import { ArrowRight, CheckCircle2, Lock, User } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/locale-provider";
import { cn } from "@/lib/utils";

export type AuthFieldConfig = {
  id: string;
  label: string;
  type: "text" | "password";
  autoComplete: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  /** 额外校验：返回错误文案或空串 */
  validate?: (value: string, values: Record<string, string>) => string;
  description?: string;
  icon?: "user" | "lock";
};

type AuthFormProps = {
  title: string;
  description?: string;
  actionLabel: string;
  fields: AuthFieldConfig[];
  footer?: {
    text: string;
    href: string;
    label: string;
  };
  extra?: ReactNode;
  loading?: boolean;
  formError?: string | null;
  /** 预填字段（如注册成功后跳登录） */
  initialValues?: Record<string, string>;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
};

function fieldIcon(kind?: "user" | "lock") {
  if (kind === "lock") return Lock;
  return User;
}

export function AuthForm({
  title,
  description,
  actionLabel,
  fields,
  footer,
  extra,
  loading,
  formError,
  initialValues,
  onSubmit,
}: AuthFormProps) {
  const t = useT();
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.id, initialValues?.[f.id] ?? ""])),
  );
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo(() => {
    return Object.fromEntries(
      fields.map((field) => {
        const value = values[field.id] ?? "";
        if (field.required && !value.trim()) {
          return [field.id, t("ui.form.invalid.require")];
        }
        if (
          field.minLength &&
          value.length > 0 &&
          value.length < field.minLength
        ) {
          return [
            field.id,
            field.description ?? t("web.auth.password.invalid"),
          ];
        }
        if (field.validate) {
          const custom = field.validate(value, values);
          if (custom) {
            const looksLikeKey =
              /^[\w.-]+$/.test(custom) && custom.includes(".");
            return [field.id, looksLikeKey ? t(custom) : custom];
          }
        }
        return [field.id, ""];
      }),
    ) as Record<string, string>;
  }, [fields, values, t]);

  const canSubmit = fields.every((field) => !errors[field.id]) && !loading;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(Object.fromEntries(fields.map((f) => [f.id, true])));
    if (!fields.every((field) => !errors[field.id])) return;
    await onSubmit(values);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle asChild>
          <h1>{title}</h1>
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <FieldGroup>
            {fields.map((field) => {
              const error = errors[field.id];
              const invalid = Boolean(touched[field.id] && error);
              const valid = Boolean(values[field.id] && !error);
              const messageId = `${field.id}-message`;
              const Icon = fieldIcon(
                field.icon ?? (field.type === "password" ? "lock" : "user"),
              );

              return (
                <Field key={field.id} data-invalid={invalid || undefined}>
                  <FieldLabel htmlFor={field.id}>{field.label}</FieldLabel>
                  <div className="relative">
                    <Icon
                      className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id={field.id}
                      name={field.id}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      placeholder={field.placeholder}
                      required={field.required}
                      minLength={field.minLength}
                      value={values[field.id] ?? ""}
                      aria-describedby={
                        invalid || valid ? messageId : undefined
                      }
                      aria-invalid={invalid || undefined}
                      aria-required={field.required}
                      className={cn("pl-9 pr-9")}
                      onBlur={() =>
                        setTouched((current) => ({
                          ...current,
                          [field.id]: true,
                        }))
                      }
                      onChange={(event) =>
                        setValues((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                    />
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
                    <FieldDescription id={messageId}>
                      {t("ui.form.ready")}
                    </FieldDescription>
                  ) : field.description ? (
                    <FieldDescription>{field.description}</FieldDescription>
                  ) : null}
                </Field>
              );
            })}
          </FieldGroup>

          {extra}

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 pt-1">
            <Button type="submit" size="lg" disabled={!canSubmit}>
              {loading ? "…" : actionLabel}
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </form>
      </CardContent>
      {footer ? (
        <CardFooter className="justify-center border-t">
          <p className="text-sm text-muted-foreground">
            {footer.text}{" "}
            <Link
              className="font-medium text-foreground underline"
              href={footer.href}
            >
              {footer.label}
            </Link>
          </p>
        </CardFooter>
      ) : null}
    </Card>
  );
}
