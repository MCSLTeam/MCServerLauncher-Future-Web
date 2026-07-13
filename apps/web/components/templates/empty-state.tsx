import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-xl border border-dashed bg-muted/20 px-5 py-8",
        className,
      )}
    >
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <p className="max-w-xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? (
        <div className="flex flex-wrap gap-2 pt-1">{action}</div>
      ) : null}
    </div>
  );
}
