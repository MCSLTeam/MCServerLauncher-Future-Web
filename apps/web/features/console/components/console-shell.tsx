"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  FolderPlus,
  HardDrive,
  Home,
  Menu,
  Package,
  Puzzle,
  Settings,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PreferencesMenu } from "@/features/preferences/preferences-menu";
import { UserMenu } from "@/features/console/components/user-menu";
import { DownloadHistoryFlyout } from "@/features/downloads/download-history-flyout";
import { useT } from "@/features/i18n/locale-provider";
import { useIsTauriRuntime } from "@/lib/tauri-runtime";
import { cn } from "@/lib/utils";

type ConsoleShellProps = {
  children: ReactNode;
};

/** 对齐 WPF MainWindow MenuItems 顺序 */
type NavKey =
  | "home"
  | "create"
  | "instances"
  | "nodes"
  | "resourceCenter"
  | "extensionCenter"
  | "helpCenter"
  | "settings"
  | "account"
  | "users";

type NavItem = {
  key: NavKey;
  labelKey: string;
  icon: typeof Home;
  href: string;
};

type TooltipState = {
  label: string;
  top: number;
} | null;

/** 主菜单：与 WPF 一致（Home → Create → Instances → Daemon → ResDownload → Help） */
const MAIN_NAV: NavItem[] = [
  {
    key: "home",
    labelKey: "shared.dashboard.title",
    icon: Home,
    href: "/dashboard/",
  },
  {
    key: "create",
    labelKey: "shared.create.button",
    icon: FolderPlus,
    href: "/create/",
  },
  {
    key: "instances",
    labelKey: "shared.instances.title",
    icon: Package,
    href: "/instances/",
  },
  {
    key: "nodes",
    labelKey: "shared.nodes.title",
    icon: HardDrive,
    href: "/nodes/",
  },
  {
    key: "resourceCenter",
    labelKey: "shared.resource-center.wpf-title",
    icon: Download,
    href: "/resource-center/",
  },
  {
    key: "extensionCenter",
    labelKey: "shared.extension-center.title",
    icon: Puzzle,
    href: "/extensions/",
  },
  {
    key: "helpCenter",
    labelKey: "shared.help-center.title",
    icon: CircleHelp,
    href: "/help-center/",
  },
];

const HELP_CENTER_ENABLED = false;

/** Footer：Settings（WPF Footer）+ Web 面板账号/用户 */
const FOOTER_NAV: NavItem[] = [
  {
    key: "settings",
    labelKey: "shared.settings.title",
    icon: Settings,
    href: "/settings/",
  },
  {
    key: "account",
    labelKey: "web.user-center.user-info.title",
    icon: User,
    href: "/account/",
  },
  {
    key: "users",
    labelKey: "web.users.title",
    icon: Users,
    href: "/users/",
  },
];

function getActiveNavKey(pathname: string): NavKey | null {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  if (path.startsWith("/dashboard")) return "home";
  if (path.startsWith("/create")) return "create";
  if (path.startsWith("/instances") || path.startsWith("/instance/"))
    return "instances";
  if (path.startsWith("/nodes")) return "nodes";
  if (path.startsWith("/resource-center")) return "resourceCenter";
  if (path.startsWith("/extensions")) return "extensionCenter";
  if (path.startsWith("/help-center")) return "helpCenter";
  if (path.startsWith("/settings")) return "settings";
  if (path.startsWith("/account")) return "account";
  if (path.startsWith("/users")) return "users";
  return null;
}

export function ConsoleShell({ children }: ConsoleShellProps) {
  const pathname = usePathname();
  const t = useT();
  const isTauri = useIsTauriRuntime();
  const [windowMode, setWindowMode] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarTooltip, setSidebarTooltip] = useState<TooltipState>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setWindowMode(params.get("view") === "window");
    } catch {
      setWindowMode(false);
    }
  }, [pathname]);

  const activeKey = getActiveNavKey(pathname);
  const mainItems = useMemo(
    () => MAIN_NAV.map((item) => ({ ...item, label: t(item.labelKey) })),
    [t],
  );
  const footerItems = useMemo(
    () =>
      FOOTER_NAV.filter(
        (item) => !isTauri || (item.key !== "account" && item.key !== "users"),
      ).map((item) => ({ ...item, label: t(item.labelKey) })),
    [isTauri, t],
  );
  const visibleMainItems = useMemo(
    () =>
      mainItems.filter(
        (item) => HELP_CENTER_ENABLED || item.key !== "helpCenter",
      ),
    [mainItems],
  );
  const allItems = useMemo(
    () => [...mainItems, ...footerItems],
    [mainItems, footerItems],
  );
  const pageTitle = useMemo(() => {
    const hit = allItems.find((item) => item.key === activeKey);
    if (hit) return hit.label;
    // 实例控制台二级页
    if (pathname.includes("/instances/detail")) {
      return t("shared.instance.console.title");
    }
    return t("shared.dashboard.title");
  }, [allItems, activeKey, pathname, t]);

  // Tauri 实例控制台子窗口：对齐 WPF 独立窗，隐藏主壳导航
  if (windowMode) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <main
          id="main-content"
          className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 sm:p-5"
        >
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="h-dvh overflow-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-xl focus:bg-background focus:px-3 focus:py-1.5 focus:text-sm focus:font-medium focus:ring-3 focus:ring-ring/30"
      >
        Skip
      </a>

      <div
        className={cn(
          "h-dvh transition-[padding-left] duration-200 ease-out lg:pl-58",
          collapsed && "lg:pl-14",
        )}
      >
        <motion.aside
          animate={{ width: collapsed ? "3.5rem" : "14.5rem" }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed inset-y-0 left-0 z-40 hidden overflow-x-hidden overflow-y-hidden border-r bg-sidebar text-sidebar-foreground lg:flex lg:flex-col"
        >
          <div
            className={cn(
              "flex h-12 items-center border-b transition-[padding] duration-200 ease-out",
              collapsed ? "justify-center" : "justify-between",
            )}
            style={{ paddingInline: collapsed ? "0.5rem" : "1rem" }}
          >
            {collapsed ? null : (
              <BrandMark priority className="min-w-0 flex-1" />
            )}
            {collapsed ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Expand"
                onClick={() => setCollapsed(false)}
              >
                <ChevronRight aria-hidden="true" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Collapse"
                onClick={() => setCollapsed(true)}
              >
                <ChevronLeft aria-hidden="true" />
              </Button>
            )}
          </div>

          <nav
            className={cn(
              "mcsl-scrollbar flex flex-1 flex-col overflow-x-hidden overflow-y-auto py-3 transition-[padding,gap] duration-200 ease-out",
              collapsed ? "items-center gap-1 px-0" : "gap-3 pl-3 pr-1",
            )}
            aria-label="nav"
          >
            <div className="flex flex-col gap-1">
              {visibleMainItems.map((item) => (
                <NavItemLink
                  key={item.key}
                  item={item}
                  collapsed={collapsed}
                  active={activeKey === item.key}
                  onTooltipChange={setSidebarTooltip}
                />
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-1 border-t pt-3">
              {footerItems.map((item) => (
                <NavItemLink
                  key={item.key}
                  item={item}
                  collapsed={collapsed}
                  active={activeKey === item.key}
                  onTooltipChange={setSidebarTooltip}
                />
              ))}
            </div>
          </nav>
        </motion.aside>

        <AnimatePresence>
          {collapsed && sidebarTooltip ? (
            <motion.div
              key={sidebarTooltip.label}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              aria-hidden="true"
              className="pointer-events-none fixed left-16 z-50 whitespace-nowrap rounded-xl bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-lg ring-1 ring-foreground/10"
              style={{ top: sidebarTooltip.top }}
            >
              {sidebarTooltip.label}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex min-w-0 flex-col">
          <header
            className={cn(
              "fixed left-0 right-0 top-0 z-30 border-b bg-background/95 backdrop-blur transition-[left] duration-200 ease-out lg:left-58",
              collapsed && "lg:left-14",
            )}
          >
            <div className="flex h-12 items-center justify-between gap-3 px-4 sm:px-5 lg:px-6">
              <div className="flex min-w-0 items-center gap-2">
                <div className="lg:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="icon-sm">
                        <Menu aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="max-h-[70vh] w-64 overflow-y-auto"
                    >
                      {visibleMainItems.map((item) => (
                        <DropdownMenuItem key={item.key} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              activeKey === item.key && "bg-accent font-medium",
                            )}
                          >
                            <item.icon className="size-4" aria-hidden="true" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      {footerItems.map((item) => (
                        <DropdownMenuItem key={item.key} asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              activeKey === item.key && "bg-accent font-medium",
                            )}
                          >
                            <item.icon className="size-4" aria-hidden="true" />
                            {item.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <BrandMark className="lg:hidden" logoSize={24} iconOnly />
                <h1 className="truncate text-sm font-semibold tracking-normal sm:text-base">
                  {pageTitle}
                </h1>
              </div>

              <div className="flex min-w-0 shrink-0 items-center justify-end gap-2">
                <DownloadHistoryFlyout />
                <PreferencesMenu />
                {isTauri ? null : <UserMenu />}
              </div>
            </div>
          </header>

          <main
            id="main-content"
            className="flex h-dvh flex-col overflow-hidden px-4 pb-4 pt-18 sm:px-5 lg:px-6"
          >
            <section
              aria-label="content"
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              {children}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

type ResolvedItem = NavItem & { label: string };

function NavItemLink({
  item,
  collapsed,
  active,
  onTooltipChange,
}: {
  item: ResolvedItem;
  collapsed: boolean;
  active: boolean;
  onTooltipChange: (state: TooltipState) => void;
}) {
  const Icon = item.icon;

  const showTooltip = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    onTooltipChange({
      label: item.label,
      top: rect.top + rect.height / 2 - 14,
    });
  };
  const onLeave = () => onTooltipChange(null);

  if (collapsed) {
    return (
      <Link
        href={item.href}
        aria-label={item.label}
        title={item.label}
        aria-current={active ? "page" : undefined}
        className={cn(
          buttonVariants({
            variant: active ? "secondary" : "ghost",
            size: "icon",
          }),
          "mx-auto size-8 shrink-0 rounded-xl text-sidebar-foreground focus-visible:ring-sidebar-ring/30 [&_svg:not([class*='size-'])]:size-3.5",
          active && "bg-sidebar-primary text-sidebar-primary-foreground",
        )}
        onPointerEnter={(event) => showTooltip(event.currentTarget)}
        onPointerLeave={onLeave}
        onFocus={(event) => showTooltip(event.currentTarget)}
        onBlur={onLeave}
      >
        <Icon aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex min-h-9 items-center gap-2 rounded-2xl px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-sidebar-ring/30 [&_svg]:size-4",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
