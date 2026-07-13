"use client";

import { Home, LogOut, UserRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/auth-provider";
import { useT } from "@/features/i18n/locale-provider";

export function UserMenu() {
  const t = useT();
  const { user, logout } = useAuth();
  const username = user?.username || "?";
  const initial = username.slice(0, 1).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("web.user-center.user-info.title")}
          className="rounded-full sm:h-8 sm:w-auto sm:gap-2 sm:px-3"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium ring-1 ring-border">
            {initial}
          </span>
          <span className="hidden max-w-28 truncate text-xs font-medium sm:inline">
            {username}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium ring-1 ring-border">
            {initial}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {username}
            </span>
            <span className="truncate text-xs font-normal text-muted-foreground">
              {t("web.user-center.user-info.title")}
            </span>
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account/">
              <UserRound aria-hidden="true" />
              {t("web.user-center.user-info.title")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/">
              <Home aria-hidden="true" />
              {t("shared.dashboard.title")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => void logout(false)}
          >
            <LogOut aria-hidden="true" />
            {t("web.auth.logout.button")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
