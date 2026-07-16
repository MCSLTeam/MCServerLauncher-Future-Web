"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/features/i18n/locale-provider";

const BASIC_TEMPLATE = ["-XX:+AggressiveOpts"];
const ADVANCED_TEMPLATE = [
  "-XX:+UseG1GC",
  "-XX:+ParallelRefProcEnabled",
  "-XX:MaxGCPauseMillis=200",
  "-XX:+UnlockExperimentalVMOptions",
  "-XX:+DisableExplicitGC",
  "-XX:+AlwaysPreTouch",
  "-XX:G1NewSizePercent=30",
  "-XX:G1MaxNewSizePercent=40",
  "-XX:G1HeapRegionSize=8M",
  "-XX:G1ReservePercent=20",
  "-XX:G1HeapWastePercent=5",
  "-XX:G1MixedGCCountTarget=4",
  "-XX:InitiatingHeapOccupancyPercent=15",
  "-XX:G1MixedGCLiveThresholdPercent=90",
  "-XX:G1RSetUpdatingPauseTimePercent=5",
  "-XX:SurvivorRatio=32",
  "-XX:+PerfDisableSharedMem",
  "-XX:MaxTenuringThreshold=1",
];

type TemplateKey = "none" | "basic" | "advanced";

/** 对齐 WPF ConstructJvmArgHelperDialog + JvmArgHelper */
export function JvmArgHelperDialog({
  open,
  onOpenChange,
  onInsert,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (args: string[]) => void;
}) {
  const t = useT();
  const [minMem, setMinMem] = useState("1024");
  const [maxMem, setMaxMem] = useState("1024");
  const [memUnit, setMemUnit] = useState<"M" | "G">("M");
  const [encoding, setEncoding] = useState("");
  const [template, setTemplate] = useState<TemplateKey>("none");

  function buildArgs(): string[] {
    const parts: string[] = [];
    if (minMem.trim()) parts.push(`-Xms${minMem.trim()}${memUnit}`);
    if (maxMem.trim()) parts.push(`-Xmx${maxMem.trim()}${memUnit}`);
    if (encoding.trim()) parts.push(`-Dfile.encoding=${encoding.trim()}`);
    if (template === "basic") parts.push(...BASIC_TEMPLATE);
    if (template === "advanced") parts.push(...ADVANCED_TEMPLATE);
    return parts;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(36rem,90vh)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("shared.create.jvm-helper.title")}</DialogTitle>
          <DialogDescription>
            {t("shared.create.jvm-helper.dialog.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border p-4">
            <p className="mb-1 text-sm font-medium">
              {t("shared.create.jvm-helper.mem.title")}
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("shared.create.jvm-helper.mem.desc")}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field>
                <FieldLabel>{t("shared.create.jvm-helper.min")}</FieldLabel>
                <Input value={minMem} onChange={(e) => setMinMem(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>{t("shared.create.jvm-helper.max")}</FieldLabel>
                <Input value={maxMem} onChange={(e) => setMaxMem(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>{t("shared.create.jvm-helper.unit")}</FieldLabel>
                <Select
                  value={memUnit}
                  onValueChange={(v) => setMemUnit(v as "M" | "G")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </section>

          <section className="rounded-xl border p-4">
            <p className="mb-1 text-sm font-medium">
              {t("shared.create.jvm-helper.encoding.label")}
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("shared.create.jvm-helper.encoding.desc")}
            </p>
            <Input
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              placeholder="UTF-8"
            />
          </section>

          <section className="rounded-xl border p-4">
            <p className="mb-1 text-sm font-medium">
              {t("shared.create.jvm-helper.template.label")}
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              {t("shared.create.jvm-helper.template.desc")}
            </p>
            <Select
              value={template}
              onValueChange={(v) => setTemplate(v as TemplateKey)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("shared.create.jvm-helper.template.none")}
                </SelectItem>
                <SelectItem value="basic">
                  {t("shared.create.jvm-helper.template.basic")}
                </SelectItem>
                <SelectItem value="advanced">
                  {t("shared.create.jvm-helper.template.advanced")}
                </SelectItem>
              </SelectContent>
            </Select>
          </section>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("shared.create.jvm-helper.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => {
              onInsert(buildArgs());
              onOpenChange(false);
            }}
          >
            {t("shared.create.jvm-helper.insert")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
