"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { AuthForm } from "@/features/auth/components/auth-form";
import { fetchShouldRegister, useAuth } from "@/features/auth/auth-provider";
import { useT } from "@/features/i18n/locale-provider";
import { formatApiError } from "@/lib/api-errors";
import { isFirstLoad } from "@/lib/first-load";
import { validatePassword, validateUsername } from "@/lib/validation";

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const { ready, token, register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (token) {
      router.replace("/dashboard/");
      return;
    }
    // 首次引导未完成时，先走 welcome（主题/语言 → 协议）
    if (isFirstLoad()) {
      router.replace("/welcome/setup/");
      return;
    }
    void fetchShouldRegister().then((should) => {
      setAllowed(should);
      // 公开注册仅允许空库时的首个管理员
      if (!should) router.replace("/login/");
    });
  }, [ready, token, router]);

  if (allowed === false || allowed === null) {
    return null;
  }

  return (
    <Reveal className="w-full max-w-md">
      <AuthForm
        title={t("web.auth.register.title")}
        description={t("web.auth.password.format")}
        actionLabel={t("web.auth.register.submit")}
        loading={loading}
        formError={error}
        fields={[
          {
            id: "username",
            label: t("web.auth.username.label"),
            type: "text",
            autoComplete: "username",
            placeholder: t("web.auth.username.format"),
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
            autoComplete: "new-password",
            placeholder: t("web.auth.password.format"),
            required: true,
            minLength: 8,
            icon: "lock",
            validate: (v) => {
              const k = validatePassword(v);
              return k ? t(k) : "";
            },
          },
          {
            id: "passwordConfirm",
            label: t("web.auth.password-confirm.label"),
            type: "password",
            autoComplete: "new-password",
            placeholder: t("web.auth.password-confirm.placeholder"),
            required: true,
            minLength: 8,
            icon: "lock",
            validate: (v, all) =>
              v !== all.password ? t("web.auth.password-confirm.invalid") : "",
          },
        ]}
        onSubmit={async (values) => {
          setLoading(true);
          setError(null);
          const result = await register(
            values.username.trim(),
            values.password,
          );
          setLoading(false);
          if (!result.ok) {
            setError(
              result.message ??
                t("web.auth.register.error", {
                  reason: formatApiError("admin-exists"),
                }),
            );
            return;
          }
          // 与 Vue 一致：注册成功后去登录，不自动登录
          const params = new URLSearchParams({
            username: values.username.trim(),
          });
          router.replace(`/login/?${params.toString()}`);
        }}
      />
    </Reveal>
  );
}
