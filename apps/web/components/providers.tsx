"use client";

import type { ReactNode } from "react";

import { AuthProvider } from "@/features/auth/auth-provider";
import { LocaleProvider } from "@/features/i18n/locale-provider";
import { DaemonProvider } from "@/features/nodes/daemon-provider";
import { ThemeProvider } from "@/features/theme/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <ThemeProvider>
        <AuthProvider>
          <DaemonProvider>{children}</DaemonProvider>
        </AuthProvider>
      </ThemeProvider>
    </LocaleProvider>
  );
}
