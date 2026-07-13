"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
import { useT } from "@/features/i18n/locale-provider";
import { listNodes, nodeAddress } from "@/lib/nodes-store";
import type { CreateMethod, SavedNode } from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = "method" | "node" | "type" | "settings";

const METHOD_IDS: CreateMethod[] = ["core", "pack", "script"];

const CORE_TYPE_KEYS = [
  { id: "mcje", labelKey: "shared.create.type.mcje" },
  { id: "forge", labelKey: "shared.create.type.forge" },
  { id: "neoforge", labelKey: "shared.create.type.neoforge" },
  { id: "fabric", labelKey: "shared.create.type.fabric" },
  { id: "quilt", labelKey: "shared.create.type.quilt" },
  { id: "mcbe", labelKey: "shared.create.type.mcbe" },
  { id: "terraria", labelKey: "shared.create.type.terraria" },
  { id: "universal", labelKey: "shared.create.type.universal" },
] as const;

export default function CreatePage() {
  const t = useT();
  const [nodes, setNodes] = useState<SavedNode[]>([]);
  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<CreateMethod | null>(null);
  const [nodeId, setNodeId] = useState<string | null>(null);
  const [coreType, setCoreType] = useState("mcje");
  const [name, setName] = useState("");
  const [startCommand, setStartCommand] = useState(
    "java -jar server.jar nogui",
  );
  const [javaPath, setJavaPath] = useState("");
  const [jvmArgs, setJvmArgs] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setNodes(listNodes()));
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === nodeId) ?? null,
    [nodes, nodeId],
  );

  const nameError = !name.trim() ? t("ui.form.invalid.require") : "";

  function goMethod(next: CreateMethod) {
    setMethod(next);
    setStep("node");
    setMessage(null);
    setError(null);
  }

  function submit() {
    setTouched({ name: true });
    if (nameError) {
      setError(nameError);
      return;
    }
    if (!selectedNode) {
      setError(t("shared.create.need-node.title"));
      return;
    }
    setError(null);
    setMessage(t("shared.create.submit.blocked"));
  }

  if (nodes.length === 0) {
    return (
      <ConsolePage>
        <Reveal>
          <ConsolePageHeader
            title={t("shared.create.title")}
            subtitle={t("shared.create.subtitle")}
          />
        </Reveal>
        <Reveal delay={0.04}>
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t("shared.create.need-node.title")}</EmptyTitle>
              <EmptyDescription>
                {t("shared.create.need-node.desc")}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/nodes/">{t("shared.nodes.title")}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </Reveal>
      </ConsolePage>
    );
  }

  const steps: { key: Step; label: string }[] = [
    { key: "method", label: t("shared.create.method.title") },
    { key: "node", label: t("shared.create.daemon.title") },
    { key: "type", label: t("shared.create.type.title") },
    { key: "settings", label: t("shared.create.settings.title") },
  ];

  return (
    <ConsolePage>
      <Reveal>
        <ConsolePageHeader
          title={t("shared.create.title")}
          subtitle={t("shared.create.subtitle")}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <div className="mb-2 flex flex-wrap gap-2 text-sm">
          {steps.map((item, index) => (
            <Badge
              key={item.key}
              variant={step === item.key ? "default" : "secondary"}
            >
              {index + 1}. {item.label}
            </Badge>
          ))}
        </div>
      </Reveal>

      {step === "method" ? (
        <Reveal delay={0.06}>
          <div className="grid gap-4 md:grid-cols-3">
            {METHOD_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => goMethod(id)}
                className="rounded-xl border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"
              >
                <h3 className="font-semibold">
                  {t(`shared.create.method.${id}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`shared.create.method.${id}.desc`)}
                </p>
              </button>
            ))}
          </div>
        </Reveal>
      ) : null}

      {step === "node" ? (
        <Reveal delay={0.06}>
          <ConsolePanel>
            <ConsolePanelHeader
              title={t("shared.create.daemon.title")}
              description={t("shared.create.daemon.subtitle")}
            />
            <ul className="flex flex-col gap-2">
              {nodes.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setNodeId(node.id);
                      setStep(method === "core" ? "type" : "settings");
                    }}
                    className={cn(
                      "flex w-full flex-col rounded-xl border px-4 py-3 text-left transition-colors hover:border-primary/40",
                      nodeId === node.id && "border-primary bg-muted/30",
                    )}
                  >
                    <span className="font-medium">{node.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {nodeAddress(node)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => setStep("method")}
            >
              {t("ui.common.prev-step")}
            </Button>
          </ConsolePanel>
        </Reveal>
      ) : null}

      {step === "type" ? (
        <Reveal delay={0.06}>
          <ConsolePanel>
            <ConsolePanelHeader title={t("shared.create.type.title")} />
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CORE_TYPE_KEYS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCoreType(item.id);
                    setStep("settings");
                  }}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm font-medium hover:border-primary/40",
                    coreType === item.id && "border-primary bg-muted/30",
                  )}
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => setStep("node")}
            >
              {t("ui.common.prev-step")}
            </Button>
          </ConsolePanel>
        </Reveal>
      ) : null}

      {step === "settings" ? (
        <Reveal delay={0.06}>
          <ConsolePanel>
            <ConsolePanelHeader
              title={t("shared.create.settings.title")}
              description={
                selectedNode
                  ? `${selectedNode.name} · ${nodeAddress(selectedNode)}`
                  : undefined
              }
            />
            <div className="flex flex-col gap-4">
              <FormField
                id="instance-name"
                label={t("shared.instance.settings.name.label")}
                placeholder={t("shared.instance.settings.name.placeholder")}
                description={t("shared.instance.settings.name.desc")}
                value={name}
                onChange={setName}
                onBlur={() => setTouched((c) => ({ ...c, name: true }))}
                touched={touched.name}
                error={nameError}
                required
              />
              {method === "script" ? (
                <FormField
                  id="start-script"
                  multiline
                  label={t("shared.create.run-command.label")}
                  description={t("shared.create.run-command.desc")}
                  value={startCommand}
                  onChange={setStartCommand}
                />
              ) : (
                <>
                  <FormField
                    id="java-path"
                    label={t("shared.instance.settings.java-path.label")}
                    placeholder={t(
                      "shared.instance.settings.java-path.placeholder",
                    )}
                    description={t("shared.instance.settings.java-path.desc")}
                    value={javaPath}
                    onChange={setJavaPath}
                  />
                  <FormField
                    id="jvm-args"
                    multiline
                    label={t("shared.instance.settings.jvm-args.label")}
                    placeholder={t(
                      "shared.instance.settings.jvm-args.placeholder",
                    )}
                    description={t("shared.instance.settings.jvm-args.desc")}
                    value={jvmArgs}
                    onChange={setJvmArgs}
                  />
                </>
              )}
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p className="text-sm text-muted-foreground">{message}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={submit}>
                  {t("ui.common.continue")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(method === "core" ? "type" : "node")}
                >
                  {t("ui.common.prev-step")}
                </Button>
              </div>
            </div>
          </ConsolePanel>
        </Reveal>
      ) : null}
    </ConsolePage>
  );
}
