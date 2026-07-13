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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth/auth-provider";
import { useT } from "@/features/i18n/locale-provider";
import type { SessionInfo } from "@/lib/types";
import { formatDateTime, validatePassword } from "@/lib/validation";

export default function AccountPage() {
  const t = useT();
  const { user, logout, listSessions, deleteSession, changePassword } =
    useAuth();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdOk, setPwdOk] = useState<string | null>(null);
  const [sessionMsg, setSessionMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fieldErrors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!oldPassword.trim()) next.old = t("ui.form.invalid.require");
    else {
      const oldKey = validatePassword(oldPassword);
      if (oldKey) next.old = t(oldKey);
    }
    const newKey = validatePassword(password);
    if (!password.trim()) next.password = t("ui.form.invalid.require");
    else if (newKey) next.password = t(newKey);
    if (!confirm.trim()) next.confirm = t("ui.form.invalid.require");
    else if (password !== confirm) {
      next.confirm = t("web.auth.password-confirm.invalid");
    }
    if (password && password === oldPassword) {
      next.password = t(
        "web.user-center.password-reset.new-password.same-as-old",
      );
    }
    return next;
  }, [oldPassword, password, confirm, t]);

  const refreshSessions = useCallback(async () => {
    const data = await listSessions();
    setSessions(data);
  }, [listSessions]);

  useEffect(() => {
    void refreshSessions();
  }, [refreshSessions]);

  async function onChangePassword(event: FormEvent) {
    event.preventDefault();
    setTouched({ old: true, password: true, confirm: true });
    if (Object.keys(fieldErrors).length) {
      setPwdError(t("ui.form.invalid.require"));
      return;
    }
    setLoading(true);
    setPwdError(null);
    setPwdOk(null);
    const result = await changePassword(oldPassword, password);
    setLoading(false);
    if (!result.ok) {
      setPwdError(
        result.message ??
          t("web.user-center.password-reset.error", { reason: "" }),
      );
      return;
    }
    setOldPassword("");
    setPassword("");
    setConfirm("");
    setTouched({});
    setPwdOk(t("web.user-center.password-reset.success"));
  }

  async function onDeleteSession(id: string) {
    if (!window.confirm(t("web.user-center.sessions.delete.confirm"))) return;
    const result = await deleteSession(id);
    if (!result.ok) {
      setSessionMsg(
        result.message ??
          t("web.user-center.sessions.delete.error", { reason: "" }),
      );
      return;
    }
    setSessionMsg(t("web.user-center.sessions.delete.success"));
    await refreshSessions();
  }

  return (
    <ConsolePage>
      <Reveal>
        <ConsolePageHeader
          title={t("web.user-center.title")}
          subtitle={t("shared.account.subtitle")}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <div className="grid gap-4 lg:grid-cols-2">
          <ConsolePanel>
            <ConsolePanelHeader title={t("web.user-center.user-info.title")} />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">
                {t("web.user-center.user-info.username")}
              </dt>
              <dd className="font-medium">{user?.username}</dd>
              <dt className="text-muted-foreground">
                {t("web.user-center.user-info.created-at")}
              </dt>
              <dd>
                {user?.created_at ? formatDateTime(user.created_at) : "—"}
              </dd>
              <dt className="text-muted-foreground">
                {t("web.user-center.permissions.title")}
              </dt>
              <dd className="break-all">
                {user?.permissions?.length ? user.permissions.join("、") : "—"}
              </dd>
            </dl>
          </ConsolePanel>

          <ConsolePanel>
            <ConsolePanelHeader
              title={t("web.user-center.password-reset.title")}
              description={t("web.auth.password.format")}
            />
            <form className="space-y-3" onSubmit={onChangePassword} noValidate>
              <FormField
                id="old"
                type="password"
                label={t("web.user-center.password-reset.old-password.label")}
                placeholder={t(
                  "web.user-center.password-reset.old-password.placeholder",
                )}
                value={oldPassword}
                onChange={setOldPassword}
                onBlur={() => setTouched((c) => ({ ...c, old: true }))}
                touched={touched.old}
                error={fieldErrors.old}
                required
              />
              <FormField
                id="new"
                type="password"
                label={t("web.user-center.password-reset.new-password.label")}
                value={password}
                onChange={setPassword}
                onBlur={() => setTouched((c) => ({ ...c, password: true }))}
                touched={touched.password}
                error={fieldErrors.password}
                required
              />
              <FormField
                id="confirm"
                type="password"
                label={t("web.auth.password-confirm.label")}
                placeholder={t("web.auth.password-confirm.placeholder")}
                value={confirm}
                onChange={setConfirm}
                onBlur={() => setTouched((c) => ({ ...c, confirm: true }))}
                touched={touched.confirm}
                error={fieldErrors.confirm}
                required
              />
              {pwdError ? (
                <p className="text-sm text-destructive" role="alert">
                  {pwdError}
                </p>
              ) : null}
              {pwdOk ? (
                <p className="text-sm text-muted-foreground">{pwdOk}</p>
              ) : null}
              <Button type="submit" disabled={loading}>
                {loading ? "…" : t("web.user-center.password-reset.submit")}
              </Button>
            </form>
          </ConsolePanel>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <ConsolePanel>
          <ConsolePanelHeader
            title={t("web.user-center.sessions.title")}
            action={
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void refreshSessions()}
                >
                  {t("ui.common.actions")}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (
                      window.confirm(
                        t("web.user-center.sessions.clear.confirm"),
                      )
                    ) {
                      void logout(true);
                    }
                  }}
                >
                  {t("web.user-center.sessions.clear.button")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void logout(false)}
                >
                  {t("web.auth.logout.button")}
                </Button>
              </div>
            }
          />
          {sessionMsg ? (
            <p className="mb-3 text-sm text-muted-foreground">{sessionMsg}</p>
          ) : null}
          {!sessions ? (
            <p className="text-sm text-muted-foreground">…</p>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">—</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("web.user-center.sessions.info.type.label")}
                  </TableHead>
                  <TableHead>
                    {t("web.user-center.sessions.info.user-agent")}
                  </TableHead>
                  <TableHead>
                    {t("web.user-center.sessions.info.last-active-ip")}
                  </TableHead>
                  <TableHead>
                    {t("web.user-center.sessions.info.last-active-at")}
                  </TableHead>
                  <TableHead>{t("ui.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.token_id}>
                    <TableCell>
                      <Badge variant="secondary">
                        {session.remember
                          ? t("web.user-center.sessions.info.type.remember")
                          : t("web.user-center.sessions.info.type.temporary")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                      {session.user_agent || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {session.last_active_ip || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(session.last_active_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void onDeleteSession(session.token_id)}
                      >
                        {t("ui.common.delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ConsolePanel>
      </Reveal>
    </ConsolePage>
  );
}
