"use client";

import { useRef, useState } from "react";
import {
  Copy,
  Download,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PanelEmpty } from "@/features/console/components/command-panel";
import type {
  EventAction,
  EventRule,
  EventRuleset,
  EventTrigger,
} from "@/features/console/event-types";
import { cn } from "@/lib/utils";

function newId() {
  return crypto.randomUUID();
}

export function EventTriggerPanel({
  t,
  canOperate,
  busy,
  rules,
  multiSelectTip,
  onDismissTip,
  onAdd,
  onImport,
  onExport,
  onSave,
  onRefresh,
  onToggle,
  onCopy,
  onDelete,
  onUpdateRule,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  canOperate: boolean;
  busy: boolean;
  rules: EventRule[];
  multiSelectTip: boolean;
  onDismissTip: () => void;
  onAdd: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onSave: () => void;
  onRefresh: () => void;
  onToggle: (id: string, enabled: boolean) => void;
  onCopy: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateRule: (rule: EventRule) => void;
}) {
  const [editing, setEditing] = useState<EventRule | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!canOperate || busy}
          onClick={onAdd}
        >
          <Plus className="size-4" />
          {t("ui.common.add")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!canOperate || busy}
          onClick={() => importRef.current?.click()}
        >
          <Upload className="size-4" />
          {t("shared.instance.events.import")}
        </Button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImport(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={onExport}
        >
          <Download className="size-4" />
          {t("shared.instance.events.export")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!canOperate || busy}
          onClick={onSave}
        >
          <Save className="size-4" />
          {t("ui.common.save")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!canOperate || busy}
          onClick={onRefresh}
        >
          <RefreshCw className="size-4" />
          {t("ui.common.refresh")}
        </Button>
      </div>

      {multiSelectTip ? (
        <div className="rounded-xl border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {t("shared.instance.files.multi-select-tip")}
        </div>
      ) : null}

      {rules.length === 0 ? (
        <PanelEmpty
          symbol="🧾"
          title={t("shared.instance.events.empty-title")}
          description={t("shared.instance.events.empty-desc")}
          action={
            <Button type="button" size="sm" disabled={!canOperate} onClick={onAdd}>
              <Plus className="size-4" />
              {t("ui.common.add")}
            </Button>
          }
        />
      ) : (
        <div className="mcsl-scrollbar min-h-0 flex-1 space-y-2 overflow-auto">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3",
              )}
            >
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-base font-semibold">{rule.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {rule.description || "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rule.triggers.length}{" "}
                  {t("shared.instance.events.triggers")}
                  {" | "}
                  {rule.rulesets.length}{" "}
                  {t("shared.instance.events.rulesets")}
                  {" | "}
                  {rule.actions.length} {t("shared.instance.events.actions")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onCopy(rule.id)}
                  title={t("ui.common.copy")}
                >
                  <Copy className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditing(structuredClone(rule))}
                  title={t("ui.common.edit")}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onDelete(rule.id)}
                  title={t("ui.common.delete")}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {rule.isEnabled
                    ? t("shared.instance.events.on")
                    : t("shared.instance.events.off")}
                </span>
                <Switch
                  checked={rule.isEnabled}
                  onCheckedChange={(v) => onToggle(rule.id, v)}
                  disabled={!canOperate}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <EventRuleEditorDialog
        t={t}
        open={Boolean(editing)}
        rule={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSave={(next) => {
          onUpdateRule(next);
          setEditing(null);
        }}
      />
    </div>
  );
}

function EventRuleEditorDialog({
  t,
  open,
  rule,
  onOpenChange,
  onSave,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  open: boolean;
  rule: EventRule | null;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: EventRule) => void;
}) {
  if (!rule) return null;
  return (
    <EventRuleEditorInner
      key={rule.id + String(open)}
      t={t}
      open={open}
      initial={rule}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  );
}

function EventRuleEditorInner({
  t,
  open,
  initial,
  onOpenChange,
  onSave,
}: {
  t: (key: string, params?: Record<string, string | number>) => string;
  open: boolean;
  initial: EventRule;
  onOpenChange: (open: boolean) => void;
  onSave: (rule: EventRule) => void;
}) {
  const [draft, setDraft] = useState<EventRule>(() =>
    structuredClone(initial),
  );

  function updateTrigger(index: number, next: EventTrigger) {
    setDraft((prev) => {
      const triggers = [...prev.triggers];
      triggers[index] = next;
      return { ...prev, triggers };
    });
  }

  function updateAction(index: number, next: EventAction) {
    setDraft((prev) => {
      const actions = [...prev.actions];
      actions[index] = next;
      return { ...prev, actions };
    });
  }

  function updateRuleset(index: number, next: EventRuleset) {
    setDraft((prev) => {
      const rulesets = [...prev.rulesets];
      rulesets[index] = next;
      return { ...prev, rulesets };
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("shared.instance.events.edit-title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("shared.instance.events.field.name")}</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("shared.instance.events.field.description")}</Label>
            <Textarea
              value={draft.description}
              rows={3}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {t("shared.instance.events.triggers")}
              </p>
              <Select
                value={draft.triggerCondition}
                onValueChange={(v) =>
                  setDraft({
                    ...draft,
                    triggerCondition: v === "All" ? "All" : "Any",
                  })
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">
                      {t("shared.instance.events.condition.any")}
                    </SelectItem>
                    <SelectItem value="All">
                      {t("shared.instance.events.condition.all")}
                    </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {draft.triggers.map((trigger, index) => (
              <div key={trigger.id} className="space-y-2 rounded-lg border p-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={trigger.type}
                    onValueChange={(v) => {
                      if (v === "Schedule") {
                        updateTrigger(index, {
                          id: trigger.id,
                          type: "Schedule",
                          cronExpression: "",
                        });
                      } else if (v === "InstanceStatus") {
                        updateTrigger(index, {
                          id: trigger.id,
                          type: "InstanceStatus",
                          targetStatus: "Running",
                        });
                      } else {
                        updateTrigger(index, {
                          id: trigger.id,
                          type: "ConsoleOutput",
                          pattern: "",
                          isRegex: false,
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ConsoleOutput">
                        {t("shared.instance.events.trigger.console-output")}
                      </SelectItem>
                      <SelectItem value="Schedule">
                        {t("shared.instance.events.trigger.schedule")}
                      </SelectItem>
                      <SelectItem value="InstanceStatus">
                        {t("shared.instance.events.trigger.instance-status")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        triggers: draft.triggers.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {trigger.type === "ConsoleOutput" ? (
                  <>
                    <Input
                      value={trigger.pattern}
                      placeholder="pattern"
                      onChange={(e) =>
                        updateTrigger(index, {
                          ...trigger,
                          pattern: e.target.value,
                        })
                      }
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={trigger.isRegex}
                        onChange={(e) =>
                          updateTrigger(index, {
                            ...trigger,
                            isRegex: e.target.checked,
                          })
                        }
                      />
                      Regex
                    </label>
                  </>
                ) : null}
                {trigger.type === "Schedule" ? (
                  <Input
                    value={trigger.cronExpression}
                    placeholder="cron"
                    onChange={(e) =>
                      updateTrigger(index, {
                        ...trigger,
                        cronExpression: e.target.value,
                      })
                    }
                  />
                ) : null}
                {trigger.type === "InstanceStatus" ? (
                  <Select
                    value={trigger.targetStatus}
                    onValueChange={(v) =>
                      updateTrigger(index, {
                        ...trigger,
                        targetStatus: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Running">
                        {t("shared.instance.events.status.running")}
                      </SelectItem>
                      <SelectItem value="Stopped">
                        {t("shared.instance.events.status.stopped")}
                      </SelectItem>
                      <SelectItem value="Crashed">
                        {t("shared.instance.events.status.crashed")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setDraft({
                  ...draft,
                  triggers: [
                    ...draft.triggers,
                    {
                      id: newId(),
                      type: "ConsoleOutput",
                      pattern: "",
                      isRegex: false,
                    },
                  ],
                })
              }
            >
              <Plus className="size-4" />
              {t("shared.instance.events.add-trigger")}
            </Button>
          </div>

          <div className="space-y-2 rounded-xl border p-3">
            <p className="text-sm font-semibold">
              {t("shared.instance.events.rulesets")}
            </p>
            {draft.rulesets.map((ruleset, index) => (
              <div key={ruleset.id} className="space-y-2 rounded-lg border p-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={ruleset.type}
                    onValueChange={(v) => {
                      if (v === "AlwaysFalse") {
                        updateRuleset(index, {
                          id: ruleset.id,
                          type: "AlwaysFalse",
                        });
                      } else if (v === "InstanceStatus") {
                        updateRuleset(index, {
                          id: ruleset.id,
                          type: "InstanceStatus",
                          targetStatus:
                            ruleset.type === "InstanceStatus"
                              ? ruleset.targetStatus
                              : "Running",
                        });
                      } else {
                        updateRuleset(index, {
                          id: ruleset.id,
                          type: "AlwaysTrue",
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AlwaysTrue">
                        {t("shared.instance.events.ruleset.always-true")}
                      </SelectItem>
                      <SelectItem value="AlwaysFalse">
                        {t("shared.instance.events.ruleset.always-false")}
                      </SelectItem>
                      <SelectItem value="InstanceStatus">
                        {t("shared.instance.events.ruleset.instance-status")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    disabled={draft.rulesets.length <= 1}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        rulesets: draft.rulesets.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {ruleset.type === "InstanceStatus" ? (
                  <Select
                    value={ruleset.targetStatus}
                    onValueChange={(v) =>
                      updateRuleset(index, {
                        ...ruleset,
                        targetStatus: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Running">
                        {t("shared.instance.events.status.running")}
                      </SelectItem>
                      <SelectItem value="Stopped">
                        {t("shared.instance.events.status.stopped")}
                      </SelectItem>
                      <SelectItem value="Crashed">
                        {t("shared.instance.events.status.crashed")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setDraft({
                  ...draft,
                  rulesets: [
                    ...draft.rulesets,
                    { id: newId(), type: "AlwaysTrue" },
                  ],
                })
              }
            >
              <Plus className="size-4" />
              {t("shared.instance.events.add-ruleset")}
            </Button>
          </div>

          <div className="space-y-2 rounded-xl border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {t("shared.instance.events.actions")}
              </p>
              <Select
                value={draft.actionExecutionMode}
                onValueChange={(v) =>
                  setDraft({
                    ...draft,
                    actionExecutionMode:
                      v === "Parallel" ? "Parallel" : "Sequential",
                  })
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sequential">
                    {t("shared.instance.events.mode.sequential")}
                  </SelectItem>
                  <SelectItem value="Parallel">
                    {t("shared.instance.events.mode.parallel")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {draft.actions.map((action, index) => (
              <div key={action.id} className="space-y-2 rounded-lg border p-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={action.type}
                    onValueChange={(v) => {
                      if (v === "ChangeInstanceStatus") {
                        updateAction(index, {
                          id: action.id,
                          type: "ChangeInstanceStatus",
                          action: "Start",
                        });
                      } else if (v === "SendNotification") {
                        updateAction(index, {
                          id: action.id,
                          type: "SendNotification",
                          title: "",
                          message: "",
                          severity: "Info",
                        });
                      } else {
                        updateAction(index, {
                          id: action.id,
                          type: "SendCommand",
                          command: "",
                        });
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SendCommand">
                        {t("shared.instance.events.action.send-command")}
                      </SelectItem>
                      <SelectItem value="ChangeInstanceStatus">
                        {t("shared.instance.events.action.change-status")}
                      </SelectItem>
                      <SelectItem value="SendNotification">
                        {t("shared.instance.events.action.send-notification")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        actions: draft.actions.filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                {action.type === "SendCommand" ? (
                  <Input
                    value={action.command}
                    placeholder="command"
                    onChange={(e) =>
                      updateAction(index, {
                        ...action,
                        command: e.target.value,
                      })
                    }
                  />
                ) : null}
                {action.type === "ChangeInstanceStatus" ? (
                  <Select
                    value={action.action}
                    onValueChange={(v) =>
                      updateAction(index, { ...action, action: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Start">
                        {t("shared.instance.events.action.start")}
                      </SelectItem>
                      <SelectItem value="Stop">
                        {t("shared.instance.events.action.stop")}
                      </SelectItem>
                      <SelectItem value="Restart">
                        {t("shared.instance.events.action.restart")}
                      </SelectItem>
                      <SelectItem value="Kill">
                        {t("shared.instance.events.action.kill")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
                {action.type === "SendNotification" ? (
                  <>
                    <Input
                      value={action.title}
                      placeholder="title"
                      onChange={(e) =>
                        updateAction(index, {
                          ...action,
                          title: e.target.value,
                        })
                      }
                    />
                    <Textarea
                      value={action.message}
                      placeholder="message"
                      rows={2}
                      onChange={(e) =>
                        updateAction(index, {
                          ...action,
                          message: e.target.value,
                        })
                      }
                    />
                  </>
                ) : null}
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setDraft({
                  ...draft,
                  actions: [
                    ...draft.actions,
                    { id: newId(), type: "SendCommand", command: "" },
                  ],
                })
              }
            >
              <Plus className="size-4" />
              {t("shared.instance.events.add-action")}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {t("ui.common.cancel")}
          </Button>
          <Button type="button" onClick={() => onSave(draft)}>
            {t("ui.common.done")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
