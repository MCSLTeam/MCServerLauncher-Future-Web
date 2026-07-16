import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ConsolePage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full flex-col gap-6", className)}>
      {children}
    </div>
  );
}

/**
 * 页面顶栏内容区。
 * 全局导航标题由 ConsoleShell topbar 负责；此处默认不重复渲染 title，
 * 仅在传入 title 且与顶栏语义不同（如实例名）时使用。
 */
export function ConsolePageHeader({
  title,
  subtitle,
  action,
  className,
  showTitle = false,
}: {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  /** 与 topbar 重复的章节名请保持 false；仅二级上下文标题用 true */
  showTitle?: boolean;
}) {
  const hasText = Boolean((showTitle && title) || subtitle);
  if (!hasText && !action) return null;
  return (
    <header
      className={cn(
        "flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      {hasText ? (
        <div className="flex min-w-0 flex-col gap-2">
          {showTitle && title ? (
            <h2 className="text-2xl font-semibold tracking-normal">{title}</h2>
          ) : null}
          {subtitle ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      {action ? (
        <div className="flex shrink-0 flex-wrap gap-2">{action}</div>
      ) : null}
    </header>
  );
}

export function ConsolePanel({
  children,
  className,
  hover = false,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card",
        padded && "p-4 sm:p-5",
        hover && "transition-colors hover:border-primary/40 hover:bg-muted/20",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ConsolePanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function ConsoleMetric({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value?: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 text-2xl font-semibold tracking-tight">
        {value ?? <Skeleton className="h-8 w-20" />}
      </div>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
