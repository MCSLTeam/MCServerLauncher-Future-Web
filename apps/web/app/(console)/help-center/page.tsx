"use client";

import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import {
  ConsolePage,
  ConsolePageHeader,
  ConsolePanel,
  ConsolePanelHeader,
} from "@/components/templates/console-surface";
import { Button } from "@/components/ui/button";
import { useT } from "@/features/i18n/locale-provider";

const FAQ_KEYS = [
  "shared.help-center.faq.connect",
  "shared.help-center.faq.create",
  "shared.help-center.faq.console",
] as const;

export default function HelpCenterPage() {
  const t = useT();

  return (
    <ConsolePage>
      <Reveal>
        <ConsolePageHeader
          title={t("shared.help-center.title")}
          subtitle={t("shared.help-center.subtitle")}
        />
      </Reveal>

      <Reveal delay={0.04}>
        <div className="grid gap-4 lg:grid-cols-2">
          <ConsolePanel className="space-y-3">
            <ConsolePanelHeader
              title={t("shared.help-center.getting-started")}
            />
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li>{t("shared.nodes.subtitle")}</li>
              <li>{t("shared.create.subtitle")}</li>
              <li>{t("shared.instances.subtitle")}</li>
            </ol>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm">
                <Link href="/nodes/">{t("shared.nodes.title")}</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/create/">{t("shared.create.button")}</Link>
              </Button>
            </div>
          </ConsolePanel>

          <ConsolePanel className="space-y-3">
            <ConsolePanelHeader title={t("shared.help-center.faq.title")} />
            <ul className="space-y-3 text-sm text-muted-foreground">
              {FAQ_KEYS.map((key) => (
                <li key={key} className="rounded-xl border px-3 py-2 leading-6">
                  {t(key)}
                </li>
              ))}
            </ul>
          </ConsolePanel>
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <ConsolePanel>
          <ConsolePanelHeader title={t("shared.help-center.links.title")} />
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                href="https://github.com/MCSLTeam/MCServerLauncher-Future"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings/">{t("shared.settings.title")}</Link>
            </Button>
          </div>
        </ConsolePanel>
      </Reveal>
    </ConsolePage>
  );
}
