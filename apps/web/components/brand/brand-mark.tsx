"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { tKey } from "@/lib/i18n/translate";
import { isTauriRuntime } from "@/lib/tauri-runtime";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  className?: string;
  /** 仅图标，用于极窄区域 */
  iconOnly?: boolean;
  /** logo 尺寸 */
  logoSize?: number;
  priority?: boolean;
};

function detectPlatformSubtitle() {
  return isTauriRuntime()
    ? tKey("shared.brand.platform.tauri")
    : tKey("shared.brand.platform.web");
}

const emptySubscribe = () => () => {};

/** 对齐 WPF 标题栏：MCServerLauncher Future + 平台副标题 */
export function BrandMark({
  href = "/dashboard/",
  className,
  iconOnly = false,
  logoSize = 28,
  priority = false,
}: BrandMarkProps) {
  const subtitle = useSyncExternalStore(
    emptySubscribe,
    detectPlatformSubtitle,
    () => tKey("shared.brand.platform.web"),
  );

  const content = (
    <>
      <BrandLogo
        alt="MCServerLauncher Future"
        priority={priority}
        size={logoSize}
      />
      {iconOnly ? null : (
        <span className="min-w-0 leading-tight">
          <span className="flex flex-wrap items-baseline gap-x-1 text-[13px] font-medium tracking-tight">
            <span className="text-sidebar-foreground">MCSL</span>
            <span className="font-semibold text-primary">Future</span>
          </span>
          <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground opacity-80">
            {subtitle}
          </span>
        </span>
      )}
    </>
  );

  return (
    <Link
      href={href}
      aria-label={`MCServerLauncher Future · ${subtitle}`}
      className={cn(
        "inline-flex min-w-0 items-center gap-2 outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/30",
        className,
      )}
    >
      {content}
    </Link>
  );
}

export function brandWindowTitle() {
  return "MCServerLauncher Future";
}
