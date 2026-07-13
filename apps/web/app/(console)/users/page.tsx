"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { FormField } from "@/components/forms/form-field";
import { Reveal } from "@/components/motion/reveal";
import {
  ConsolePage,
  ConsolePageHeader,
  ConsolePanel,
  ConsolePanelHeader,
} from "@/components/templates/console-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-provider";
import { useT } from "@/features/i18n/locale-provider";
import {
  canCreateUsers,
  canDeleteUser,
  PERMISSION_PRESETS,
} from "@/lib/permission";
import type { UserInfo } from "@/lib/types";
import {
  formatDateTime,
  validatePassword,
  validateUsername,
} from "@/lib/validation";

export default function UsersPage() {
  const t = useT();
  const { user, listUsers, createUser, deleteUser } = useAuth();
  const [users, setUsers] = useState<UserInfo[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [presetId, setPresetId] =
    useState<(typeof PERMISSION_PRESETS)[number]["id"]>("operator");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const allowCreate = canCreateUsers(user?.permissions);

  const fieldErrors = useMemo(() => {
    const next: Record<string, string> = {};
    const nameKey = validateUsername(username);
    if (!username.trim()) next.username = t("ui.form.invalid.require");
    else if (nameKey) next.username = t(nameKey);
    const pwdKey = validatePassword(password);
    if (!password.trim()) next.password = t("ui.form.invalid.require");
    else if (pwdKey) next.password = t(pwdKey);
    if (!confirm.trim()) next.confirm = t("ui.form.invalid.require");
    else if (password !== confirm) {
      next.confirm = t("web.auth.password-confirm.invalid");
    }
    return next;
  }, [username, password, confirm, t]);

  const refresh = useCallback(async () => {
    setLoadError(null);
    const data = await listUsers();
    if (data === null) {
      setUsers([]);
      setLoadError(t("web.users.load.error"));
      return;
    }
    setUsers(
      [...data].sort((a, b) => a.username.localeCompare(b.username, "zh-CN")),
    );
  }, [listUsers, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setTouched({ username: true, password: true, confirm: true });
    setFormError(null);
    setMessage(null);
    if (!allowCreate) {
      setFormError(t("web.api.error.permission-denied"));
      return;
    }
    if (Object.keys(fieldErrors).length) {
      setFormError(t("ui.form.invalid.require"));
      return;
    }
    const preset =
      PERMISSION_PRESETS.find((item) => item.id === presetId) ??
      PERMISSION_PRESETS[1];
    setSubmitting(true);
    const result = await createUser({
      username: username.trim(),
      password,
      permissions: [...preset.permissions],
    });
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.message ?? t("web.users.create.error"));
      return;
    }
    setUsername("");
    setPassword("");
    setConfirm("");
    setTouched({});
    setMessage(t("web.users.create.success", { username: username.trim() }));
    await refresh();
  }

  async function onDelete(target: UserInfo) {
    if (target.username === user?.username) {
      setMessage(t("web.users.delete.self"));
      return;
    }
    if (
      !window.confirm(
        t("web.users.delete.confirm", { username: target.username }),
      )
    ) {
      return;
    }
    const result = await deleteUser(target.username);
    if (!result.ok) {
      setMessage(result.message ?? t("web.users.delete.error"));
      return;
    }
    setMessage(t("web.users.delete.success", { username: target.username }));
    await refresh();
  }

  function permissionSummary(permissions: string[]) {
    if (permissions.includes("*") || permissions.includes("**")) {
      return t("web.users.preset.admin");
    }
    if (permissions.includes("mcsl.web.user.create")) {
      return t("web.users.preset.operator");
    }
    if (permissions.some((p) => p.includes("info.read") || p.includes("*"))) {
      return t("web.users.preset.viewer");
    }
    return permissions.join("、") || "—";
  }

  return (
    <ConsolePage>
      <Reveal>
        <ConsolePageHeader
          title={t("web.users.title")}
          subtitle={t("web.users.subtitle")}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
            >
              {t("web.users.refresh")}
            </Button>
          }
        />
      </Reveal>

      {message ? (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      <Reveal delay={0.04}>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <ConsolePanel padded={false}>
            <div className="border-b p-4 sm:p-5">
              <ConsolePanelHeader
                className="mb-0"
                title={t("web.users.list.title")}
                description={
                  users
                    ? t("web.users.list.count", { count: users.length })
                    : "…"
                }
              />
            </div>
            {!users ? (
              <p className="p-4 text-sm text-muted-foreground sm:p-5">…</p>
            ) : users.length === 0 ? (
              <div className="p-4 sm:p-5">
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>{t("web.users.list.empty.title")}</EmptyTitle>
                    <EmptyDescription>
                      {t("web.users.list.empty.desc")}
                    </EmptyDescription>
                  </EmptyHeader>
                  {!allowCreate ? (
                    <EmptyContent>
                      <p className="text-sm text-muted-foreground">
                        {t("web.users.create.denied")}
                      </p>
                    </EmptyContent>
                  ) : null}
                </Empty>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t("web.user-center.user-info.username")}
                      </TableHead>
                      <TableHead>
                        {t("web.users.permissions.summary")}
                      </TableHead>
                      <TableHead>
                        {t("web.user-center.user-info.created-at")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("ui.common.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((item) => {
                      const isSelf = item.username === user?.username;
                      const allowDelete =
                        !isSelf &&
                        canDeleteUser(user?.permissions, item.username);
                      return (
                        <TableRow key={item.username}>
                          <TableCell className="font-medium">
                            <div className="flex flex-wrap items-center gap-2">
                              <span>{item.username}</span>
                              {isSelf ? (
                                <Badge variant="secondary">
                                  {t("web.users.list.self")}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[14rem] truncate text-muted-foreground">
                            {permissionSummary(item.permissions)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {item.created_at
                              ? formatDateTime(item.created_at)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {allowDelete ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => void onDelete(item)}
                              >
                                {t("ui.common.delete")}
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </ConsolePanel>

          <ConsolePanel>
            <ConsolePanelHeader
              title={t("web.users.create.title")}
              description={t("web.users.create.desc")}
            />
            {!allowCreate ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>{t("web.users.create.denied")}</EmptyTitle>
                  <EmptyDescription>
                    {t("web.users.create.denied.desc")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <form className="space-y-3" onSubmit={onCreate} noValidate>
                <FormField
                  id="new-username"
                  label={t("web.auth.username.label")}
                  placeholder={t("web.auth.username.placeholder")}
                  value={username}
                  onChange={setUsername}
                  onBlur={() => setTouched((c) => ({ ...c, username: true }))}
                  touched={touched.username}
                  error={fieldErrors.username}
                  description={t("web.auth.username.format")}
                  autoComplete="off"
                  required
                />
                <FormField
                  id="new-password"
                  type="password"
                  label={t("web.auth.password.label")}
                  value={password}
                  onChange={setPassword}
                  onBlur={() => setTouched((c) => ({ ...c, password: true }))}
                  touched={touched.password}
                  error={fieldErrors.password}
                  description={t("web.auth.password.format")}
                  autoComplete="new-password"
                  required
                />
                <FormField
                  id="new-confirm"
                  type="password"
                  label={t("web.auth.password-confirm.label")}
                  placeholder={t("web.auth.password-confirm.placeholder")}
                  value={confirm}
                  onChange={setConfirm}
                  onBlur={() => setTouched((c) => ({ ...c, confirm: true }))}
                  touched={touched.confirm}
                  error={fieldErrors.confirm}
                  autoComplete="new-password"
                  required
                />
                <Field>
                  <FieldLabel htmlFor="preset">
                    {t("web.users.preset.label")}
                  </FieldLabel>
                  <Select
                    value={presetId}
                    onValueChange={(value) =>
                      setPresetId(
                        value as (typeof PERMISSION_PRESETS)[number]["id"],
                      )
                    }
                  >
                    <SelectTrigger id="preset" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERMISSION_PRESETS.map((preset) => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {t(preset.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {t("web.users.preset.desc")}
                  </FieldDescription>
                </Field>
                {formError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {formError}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  {submitting ? "…" : t("web.users.create.submit")}
                </Button>
              </form>
            )}
          </ConsolePanel>
        </div>
      </Reveal>
    </ConsolePage>
  );
}
