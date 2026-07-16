"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** 对齐 WPF StyledBorder step card */
export function StepCard({
  title,
  description,
  finished,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  finished?: boolean;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0", className)}>
      <CardHeader className="border-b py-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{title}</CardTitle>
              {finished != null ? (
                <Badge variant={finished ? "default" : "secondary"}>
                  {finished ? "✓" : "…"}
                </Badge>
              ) : null}
            </div>
            {description ? (
              <CardDescription className="mt-1">{description}</CardDescription>
            ) : null}
          </div>
          {action ? <CardAction>{action}</CardAction> : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 py-4">{children}</CardContent>
    </Card>
  );
}
