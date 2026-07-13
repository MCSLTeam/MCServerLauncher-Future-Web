"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import {
  ConsoleMetric,
  ConsolePage,
  ConsolePageHeader,
  ConsolePanel,
  ConsolePanelHeader,
} from "@/components/templates/console-surface";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { useAuth } from "@/features/auth/auth-provider";
import { useT } from "@/features/i18n/locale-provider";
import { useDaemon } from "@/features/nodes/daemon-provider";
import { listNodes } from "@/lib/nodes-store";
import { formatDateTime } from "@/lib/validation";

export default function DashboardPage() {
  const t = useT();
  const { user, listSessions } = useAuth();
  const { instances, getStatus } = useDaemon();
  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [nodeCount, setNodeCount] = useState(0);

  useEffect(() => {
    queueMicrotask(() => setNodeCount(listNodes().length));
    void listSessions().then((sessions) => {
      setSessionCount(sessions?.length ?? 0);
    });
  }, [listSessions]);

  const onlineNodes = listNodes().filter(
    (n) => getStatus(n.id) === "online",
  ).length;

  return (
    <ConsolePage>
      {/* 对齐 WPF HomePage：主标题 + Tip */}
      <Reveal>
        <ConsolePageHeader
          title={t("shared.dashboard.title")}
          subtitle={t("shared.dashboard.subtitle")}
          action={
            <Button asChild>
              <Link href={nodeCount > 0 ? "/create/" : "/nodes/"}>
                {nodeCount > 0
                  ? t("shared.create.button")
                  : t("shared.nodes.form.add")}
              </Link>
            </Button>
          }
        />
      </Reveal>

      {/* 公告区：对齐 HomePage NoticeBorder */}
      <Reveal delay={0.03}>
        <ConsolePanel>
          <ConsolePanelHeader title={t("shared.home.announcement.title")} />
          <p className="text-sm leading-6 text-muted-foreground">
            {t("shared.home.announcement.body")}
          </p>
          {user?.username ? (
            <p className="mt-3 text-sm">
              {t("shared.welcome.welcome")} {user.username}
            </p>
          ) : null}
        </ConsolePanel>
      </Reveal>

      <Reveal delay={0.05}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ConsoleMetric
            label={t("web.user-center.user-info.username")}
            value={user?.username ?? "—"}
            hint={
              user?.created_at ? formatDateTime(user.created_at) : undefined
            }
          />
          <ConsoleMetric
            label={t("web.user-center.sessions.title")}
            value={sessionCount === null ? undefined : sessionCount}
          />
          <ConsoleMetric label={t("shared.nodes.title")} value={nodeCount} />
          <ConsoleMetric
            label={t("shared.instances.title")}
            value={instances.length}
            hint={
              nodeCount === 0
                ? t("shared.instances.empty.no-nodes.desc")
                : t("shared.instances.summary", {
                    instances: instances.length,
                    online: onlineNodes,
                    total: nodeCount,
                  })
            }
          />
        </div>
      </Reveal>

      <Reveal delay={0.07}>
        <div className="grid gap-4 lg:grid-cols-2">
          <ConsolePanel>
            <ConsolePanelHeader
              title={t("shared.dashboard.title")}
              description={t("shared.dashboard.subtitle")}
            />
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li>{t("shared.nodes.subtitle")}</li>
              <li>{t("shared.create.subtitle")}</li>
              <li>{t("shared.instances.subtitle")}</li>
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/nodes/">{t("shared.nodes.title")}</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/instances/">{t("shared.instances.title")}</Link>
              </Button>
            </div>
          </ConsolePanel>

          <ConsolePanel>
            <ConsolePanelHeader title={t("shared.instances.title")} />
            {nodeCount === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {t("shared.instances.empty.no-nodes.title")}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t("shared.instances.empty.no-nodes.desc")}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild size="sm">
                    <Link href="/nodes/">{t("shared.nodes.form.add")}</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : instances.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>
                    {t("shared.instances.empty.no-data.title")}
                  </EmptyTitle>
                  <EmptyDescription>
                    {t("shared.instances.empty.no-data.desc")}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button asChild size="sm">
                    <Link href="/create/">{t("shared.create.button")}</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <ul className="space-y-2 text-sm">
                {instances.slice(0, 6).map((item) => (
                  <li
                    key={`${item.nodeId}:${item.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
                  >
                    <span className="truncate font-medium">{item.name}</span>
                    <Button asChild size="sm" variant="ghost">
                      <Link
                        href={`/instances/detail/?id=${encodeURIComponent(item.id)}&node=${encodeURIComponent(item.nodeId)}`}
                      >
                        {t("shared.instances.open")}
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </ConsolePanel>
        </div>
      </Reveal>
    </ConsolePage>
  );
}
