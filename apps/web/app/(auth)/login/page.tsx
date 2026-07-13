"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Reveal } from "@/components/motion/reveal";
import { AuthForm } from "@/features/auth/components/auth-form";
import { fetchShouldRegister, useAuth } from "@/features/auth/auth-provider";
import { useT } from "@/features/i18n/locale-provider";
import { isFirstLoad } from "@/lib/first-load";
import { validatePassword, validateUsername } from "@/lib/validation";

function LoginPageInner() {
  const t = useT();
  const router = useRouter();
  const search = useSearchParams();
  const { ready, token, login } = useAuth();
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gate, setGate] = useState(true);
  const prefillUsername = search.get("username")?.trim() ?? "";

  useEffect(() => {
    if (!ready) return;
    if (token) {
      router.replace("/dashboard/");
      return;
    }
    if (isFirstLoad()) {
      router.replace("/welcome/setup/");
      return;
    }
    void fetchShouldRegister().then((should) => {
      // 空库时只能先创建管理员，不允许登录页入口
      if (should) {
        router.replace("/register/");
        return;
      }
      setGate(false);
    });
  }, [ready, token, router]);

  if (gate) return null;

  return (
    <Reveal className="w-full max-w-md">
      <AuthForm
        title={t("web.auth.login.title")}
        description={t("shared.dashboard.welcome")}
        actionLabel={t("web.auth.login.submit")}
        loading={loading}
        formError={error}
        initialValues={
          prefillUsername ? { username: prefillUsername } : undefined
        }
        fields={[
          {
            id: "username",
            label: t("web.auth.username.label"),
            type: "text",
            autoComplete: "username",
            placeholder: t("web.auth.username.placeholder"),
            required: true,
            icon: "user",
            validate: (v) => {
              const k = validateUsername(v);
              return k ? t(k) : "";
            },
          },
          {
            id: "password",
            label: t("web.auth.password.label"),
            type: "password",
            autoComplete: "current-password",
            placeholder: t("web.auth.password.placeholder"),
            required: true,
            minLength: 8,
            icon: "lock",
            validate: (v) => {
              const k = validatePassword(v);
              return k ? t(k) : "";
            },
          },
        ]}
        extra={
          <Field orientation="horizontal" className="items-center">
            <Checkbox
              id="remember"
              checked={remember}
              onCheckedChange={(v) => setRemember(v === true)}
            />
            <FieldLabel htmlFor="remember" className="font-normal">
              {t("web.auth.remember")}
            </FieldLabel>
          </Field>
        }
        onSubmit={async (values) => {
          setLoading(true);
          setError(null);
          const result = await login(
            values.username.trim(),
            values.password,
            remember,
          );
          setLoading(false);
          if (!result.ok) {
            setError(result.message ?? t("web.api.error.login-failed"));
            return;
          }
          router.push("/dashboard/");
        }}
      />
    </Reveal>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
